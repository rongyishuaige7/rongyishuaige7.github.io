import { mkdir, writeFile } from "node:fs/promises";
import { artifactStatusForCi, isArtifactAvailable } from "./github-status-semantics.mjs";
import { workflowSignal } from "./github-evidence.mjs";

const owner = "rongyishuaige7";
const requestTimeoutMs = 12_000;
const retryDelaysMs = [500, 1_500];

const repositories = [
  { repo: "yipan-showcase" },
  { repo: "dsh-stats", workflow: "ci.yml", scope: "插件检查" },
  { repo: "dsh-spec" },
  { repo: "tech-mentor" },
  { repo: "problem-solution-recorder-oss", workflow: "validate.yml", scope: "Skill 检查" },
  { repo: "ningque" },
  { repo: "devflow-recorder", workflow: "ci.yml", scope: "Web 测试与构建" },
  { repo: "memory-monitor", workflow: "ci.yml", scope: "扩展检查" },
  { repo: "pet-desktop-tauri", workflow: "ci.yml", scope: "Web 测试与构建" },
  { repo: "hardware-lab", workflow: "validate.yml", scope: "索引检查" },
  { repo: "ESP32_RPS_Game", workflow: "ci.yml", scope: "固件构建", artifacts: true }
];

const token = process.env.GITHUB_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "rongyishuaige7-homepage-status",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorInfo(error) {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/^(\d{3})\s/);
  return { code: match ? Number(match[1]) : null, message };
}

async function api(path) {
  let lastError;
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      const response = await fetch(`https://api.github.com${path}`, {
        headers,
        signal: AbortSignal.timeout(requestTimeoutMs)
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${path}${body ? ` (${body.slice(0, 160)})` : ""}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retryDelaysMs.length) await sleep(retryDelaysMs[attempt]);
    }
  }
  throw lastError;
}

async function latestRelease(repo) {
  try {
    const release = await api(`/repos/${owner}/${repo}/releases/latest`);
    return {
      status: "available",
      tag: release.tag_name,
      publishedAt: release.published_at,
      url: release.html_url
    };
  } catch (error) {
    const info = errorInfo(error);
    if (info.code === 404) return { status: "none" };
    return { status: "unknown", error: info };
  }
}

async function artifactSignal(repo, ci, enabled) {
  if (!enabled) return { status: "not_configured" };
  const preflight = artifactStatusForCi(ci.status, Boolean(ci.url));
  if (preflight === "unknown") return { status: "unknown", reason: "The workflow status could not be confirmed." };
  if (preflight === "unavailable") return { status: "unavailable", reason: "No verified workflow run for the current default-branch HEAD." };

  const runId = ci.url.split("/").at(-1);
  try {
    const response = await api(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts?per_page=100`);
    const artifacts = (response.artifacts ?? []).map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      sizeInBytes: artifact.size_in_bytes,
      expired: artifact.expired,
      createdAt: artifact.created_at,
      expiresAt: artifact.expires_at,
      url: `${ci.url}#artifacts`
    }));
    const now = Date.now();
    const available = artifacts.filter((artifact) => isArtifactAvailable(artifact, now));
    return {
      status: available.length > 0 ? "available" : artifacts.length > 0 ? "expired" : "none",
      artifacts
    };
  } catch (error) {
    return { status: "unknown", error: errorInfo(error) };
  }
}

const generatedAt = new Date().toISOString();
const results = {};

for (const config of repositories) {
  try {
    const details = await api(`/repos/${owner}/${config.repo}`);
    // A token with broader access must never turn a private repository into public evidence.
    if (details.private !== false) throw new Error(`refusing non-public repository: ${config.repo}`);
    const branch = await api(`/repos/${owner}/${config.repo}/branches/${encodeURIComponent(details.default_branch)}`);
    const headSha = branch.commit.sha;
    const [release, ci] = await Promise.all([
      latestRelease(config.repo),
      workflowSignal({ owner, repo: config.repo, workflow: config.workflow, branch: details.default_branch, headSha, scope: config.scope }, api)
    ]);
    const artifact = await artifactSignal(config.repo, ci, config.artifacts);

    results[config.repo] = {
      repo: config.repo,
      url: details.html_url,
      description: details.description,
      license: details.license?.spdx_id ?? null,
      language: details.language,
      defaultBranch: details.default_branch,
      headSha,
      headCommittedAt: branch.commit.commit?.committer?.date ?? null,
      pushedAt: details.pushed_at,
      ci,
      release,
      artifact
    };
  } catch (error) {
    const info = errorInfo(error);
    results[config.repo] = {
      repo: config.repo,
      url: `https://github.com/${owner}/${config.repo}`,
      description: null,
      license: null,
      language: null,
      defaultBranch: null,
      headSha: null,
      headCommittedAt: null,
      pushedAt: null,
      ci: config.workflow ? { status: "unknown", workflow: config.workflow, scope: config.scope, error: info } : { status: "not_configured" },
      release: { status: "unknown", error: info },
      artifact: config.artifacts ? { status: "unknown", error: info } : { status: "not_configured" }
    };
  }
}

const payload = {
  generatedAt,
  evidencePolicy: "current-default-branch-head",
  source: "GitHub REST API",
  repositories: results
};

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/github-status.json", import.meta.url), JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote auditable GitHub status for ${repositories.length} repositories at ${generatedAt}.`);
