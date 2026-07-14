import { mkdir, writeFile } from "node:fs/promises";

const owner = "rongyishuaige7";
const repos = [
  "yipan-showcase",
  "problem-solution-recorder-oss",
  "devflow-recorder",
  "ESP32_RPS_Game",
  "pet-desktop-tauri"
];
const token = process.env.GITHUB_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};

async function api(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${path}`);
  return response.json();
}

async function optional(path) {
  try { return await api(path); } catch { return null; }
}

const results = {};
for (const repo of repos) {
  const [details, runs, release] = await Promise.all([
    api(`/repos/${owner}/${repo}`),
    optional(`/repos/${owner}/${repo}/actions/runs?branch=main&per_page=1`),
    optional(`/repos/${owner}/${repo}/releases/latest`)
  ]);
  const run = runs?.workflow_runs?.[0];
  results[repo] = {
    repo,
    url: details.html_url,
    description: details.description,
    license: details.license?.spdx_id ?? null,
    language: details.language,
    pushedAt: details.pushed_at,
    ci: run ? { conclusion: run.conclusion, status: run.status, url: run.html_url, headSha: run.head_sha } : null,
    release: release ? { tag: release.tag_name, publishedAt: release.published_at, url: release.html_url } : null
  };
}

const payload = { generatedAt: new Date().toISOString(), source: "GitHub REST API", repositories: results };
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/github-status.json", import.meta.url), JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote GitHub status for ${repos.length} repositories.`);
