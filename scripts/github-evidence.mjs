import { ciRunAgeHours, ciStatusForHead } from "./github-status-semantics.mjs";

const workflowPath = (name) => name.startsWith(".github/workflows/") ? name : `.github/workflows/${name}`;

/** API is injected so failure and cross-repository drift are tested without network access. */
export async function workflowSignal({ owner, repo, workflow, branch, headSha, scope }, api) {
  if (!workflow) return { status: "not_configured" };
  try {
    const path = workflowPath(workflow);
    const params = new URLSearchParams({ branch, head_sha: headSha, per_page: "100" });
    const response = await api(`/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(path.split("/").at(-1))}/runs?${params}`);
    const { run } = ciStatusForHead(response.workflow_runs, headSha, { branch, workflow: path });
    if (!run) return { status: "unverified", workflow: path, scope, headSha };
    const runAt = run.run_started_at ?? run.created_at;
    const ageHours = ciRunAgeHours(runAt);
    return {
      status: run.status, conclusion: run.conclusion, workflow: path, scope,
      event: run.event, url: run.html_url, headSha: run.head_sha, runAt,
      ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
    };
  } catch {
    return { status: "unknown", workflow: workflowPath(workflow), scope };
  }
}

export async function hardwareEvidence(project, { owner, api }) {
  const slug = project.repo?.split("/").at(-1);
  const indexedSha = project.head_sha;
  const base = { status: "unknown", indexedSha: indexedSha ?? null, headSha: null };
  if (!new RegExp(`^https://github\\.com/${owner}/[A-Za-z0-9_.-]+$`).test(project.repo ?? "")) return base;
  try {
    const metadata = await api(`/repos/${owner}/${slug}`);
    if (metadata.private !== false || !metadata.default_branch) return base;
    const branch = metadata.default_branch;
    const headSha = (await api(`/repos/${owner}/${slug}/branches/${encodeURIComponent(branch)}`)).commit?.sha;
    const details = { ...base, headSha: headSha ?? null, defaultBranch: branch };
    if (!/^[0-9a-f]{40}$/.test(headSha ?? "")) return details;
    if (indexedSha !== headSha || project.default_branch !== branch || project.build?.head_sha !== headSha) {
      return { ...details, status: "unverified" };
    }
    const workflow = project.build?.workflow;
    const runMatch = project.build?.run_url?.match(new RegExp(`^https://github\\.com/${owner}/${slug}/actions/runs/(\\d+)$`));
    if (!/^\.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml$/.test(workflow ?? "") || !runMatch) return details;
    const fixedRun = await api(`/repos/${owner}/${slug}/actions/runs/${runMatch[1]}`);
    const fixed = ciStatusForHead([fixedRun], headSha, { branch, workflow }).run;
    if (!fixed || fixed.status !== "completed" || fixed.conclusion !== "success") return { ...details, status: "unverified" };
    const ci = await workflowSignal({ owner, repo: slug, workflow, branch, headSha }, api);
    const status = ci.status === "completed"
      ? ci.conclusion === "success" ? "verified" : "failure"
      : ["queued", "in_progress", "requested", "waiting", "pending"].includes(ci.status) ? "running" : ci.status;
    return { ...details, status, workflow, runUrl: ci.url ?? null, runAt: ci.runAt ?? null };
  } catch {
    return base;
  }
}
