import assert from "node:assert/strict";
import test from "node:test";
import { hardwareEvidence, workflowSignal } from "../scripts/github-evidence.mjs";

const owner = "rongyishuaige7";
const head = "a".repeat(40);
const run = { id: 1, head_sha: head, head_branch: "main", path: ".github/workflows/ci.yml", event: "push", status: "completed", conclusion: "success", run_started_at: "2026-10-20T01:00:00Z", html_url: `https://github.com/${owner}/board/actions/runs/1` };
const project = { repo: `https://github.com/${owner}/board`, default_branch: "main", head_sha: head, build: { workflow: run.path, head_sha: head, run_url: run.html_url } };
const config = { owner, repo: "board", branch: "main", workflow: "ci.yml", headSha: head, scope: "固件构建" };
function api({ privateRepo = false, currentHead = head, fixed = run, runs = [run] } = {}) {
  return async (path) => {
    if (path.endsWith("/board")) return { private: privateRepo, default_branch: "main" };
    if (path.includes("/branches/")) return { commit: { sha: currentHead } };
    if (path.endsWith("/runs/1")) return fixed;
    if (path.includes("/workflows/")) return { workflow_runs: runs };
    throw new Error(`Unexpected API path: ${path}`);
  };
}

test("later manual failure wins over older push success, regardless of API ordering", async () => {
  const failure = { ...run, id: 2, event: "workflow_dispatch", conclusion: "failure", run_started_at: "2026-10-20T02:00:00Z" };
  const result = await workflowSignal(config, api({ runs: [run, failure] }));
  assert.equal(result.conclusion, "failure");
  assert.equal(result.scope, "固件构建");
  assert.equal((await hardwareEvidence(project, { owner, api: api({ runs: [run, failure] }) })).status, "failure");
});

test("other branch, head, workflow and PR events never verify HEAD", async () => {
  for (const invalid of [{ head_branch: "feature" }, { head_sha: "b".repeat(40) }, { path: ".github/workflows/other.yml" }, { event: "pull_request" }]) {
    assert.equal((await workflowSignal(config, api({ runs: [{ ...run, ...invalid }] }))).status, "unverified");
  }
});

test("a newer rerun is selected by start time rather than creation or API order", async () => {
  const rerun = { ...run, run_attempt: 2, run_started_at: "2026-10-20T03:00:00Z", conclusion: "failure" };
  assert.equal((await workflowSignal(config, api({ runs: [run, rerun] }))).conclusion, "failure");
});

test("hardware needs a public repository, matching index HEAD and fixed workflow evidence", async () => {
  assert.equal((await hardwareEvidence(project, { owner, api: api() })).status, "verified");
  assert.equal((await hardwareEvidence(project, { owner, api: api({ privateRepo: true }) })).status, "unknown");
  assert.equal((await hardwareEvidence(project, { owner, api: api({ currentHead: "b".repeat(40) }) })).status, "unverified");
  assert.equal((await hardwareEvidence(project, { owner, api: api({ fixed: { ...run, path: ".github/workflows/other.yml" } }) })).status, "unverified");
  assert.equal((await hardwareEvidence({ ...project, build: { ...project.build, run_url: "https://example.com/run/1" } }, { owner, api: api() })).status, "unknown");
});

test("latest running or unknown state never falls back to fixed successful run", async () => {
  const pending = { ...run, id: 2, status: "in_progress", conclusion: null, run_started_at: "2026-10-20T04:00:00Z" };
  assert.equal((await hardwareEvidence(project, { owner, api: api({ runs: [run, pending] }) })).status, "running");
  const failedApi = async (path) => { if (path.includes("/workflows/")) throw new Error("503"); return api()(path); };
  const result = await hardwareEvidence(project, { owner, api: failedApi });
  assert.equal(result.status, "unknown");
  assert.equal(result.runUrl, null);
  assert.equal((await hardwareEvidence(project, { owner, api: async () => { throw new Error("rate limit"); } })).status, "unknown");
});
