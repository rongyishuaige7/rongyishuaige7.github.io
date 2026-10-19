import { mkdir, writeFile } from "node:fs/promises";
import { chipFamily, firstProseLine, isOwnedPublicHref, summarizeNpmDoc } from "./studio-semantics.mjs";

const owner = "rongyishuaige7";
const requestTimeoutMs = 12_000;
const retryDelaysMs = [500, 1_500];

const npmPackages = ["@rongyi7/dsh-stats", "@rongyi7/dsh-spec"];
// Only these public repositories may contribute release entries to the update feed.
const releaseRepos = ["problem-solution-recorder-oss", "ningque", "dsh-stats", "dsh-spec", "memory-monitor", "tech-mentor", "devflow-recorder", "pet-desktop-tauri", "hardware-lab"];
const releaseLanes = { "hardware-lab": "touch" };

const token = process.env.GITHUB_TOKEN;
const githubHeaders = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "rongyishuaige7-homepage-studio",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorInfo(error) {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/^(\d{3})\s/);
  return { code: match ? Number(match[1]) : null, message: message.slice(0, 200) };
}

async function fetchJson(url, headers = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(requestTimeoutMs) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retryDelaysMs.length) await sleep(retryDelaysMs[attempt]);
    }
  }
  throw lastError;
}

const github = (path) => fetchJson(`https://api.github.com${path}`, githubHeaders);
const generatedAt = new Date().toISOString();
const sources = {};
const updates = [];

// `/users/{owner}/repos` lists public repositories only, whatever the token can see.
let publicRepos = null;
try {
  const repos = await github(`/users/${owner}/repos?per_page=100&type=owner`);
  publicRepos = new Set(repos.filter((repo) => repo.private === false).map((repo) => repo.name));
  sources.publicRepos = { status: "ok", count: publicRepos.size };
} catch (error) {
  sources.publicRepos = { status: "unknown", error: errorInfo(error) };
}

const npm = {};
const npmFailures = [];
for (const name of npmPackages) {
  const encoded = name.replace("/", "%2F");
  try {
    const [doc, downloads] = await Promise.all([
      fetchJson(`https://registry.npmjs.org/${encoded}`),
      fetchJson(`https://api.npmjs.org/downloads/point/last-month/${name}`).catch(() => null)
    ]);
    const summary = summarizeNpmDoc(doc);
    if (!summary) throw new Error(`no dated latest version for ${name}`);
    const url = `https://www.npmjs.com/package/${name}`;
    npm[name] = {
      ...summary,
      downloadsLastMonth: Number.isFinite(downloads?.downloads) ? downloads.downloads : null,
      downloadsWindow: downloads?.start && downloads?.end ? { start: downloads.start, end: downloads.end } : null,
      url
    };
    const recent = summary.versionsLast30Days > 0 ? `，近 30 天发布 ${summary.versionsLast30Days} 个版本` : "";
    updates.push({
      date: summary.publishedAt,
      lane: "see",
      type: "NPM",
      title: `${name} ${summary.latest}`,
      text: `npm 上共 ${summary.versionCount} 个版本${recent}。`,
      href: url
    });
  } catch (error) {
    npmFailures.push(name);
    npm[name] = { status: "unknown", error: errorInfo(error) };
  }
}
sources.npm = { status: npmFailures.length === 0 ? "ok" : npmFailures.length === npmPackages.length ? "unknown" : "partial", failed: npmFailures };

let hardware = { status: "unknown", indexUrl: `https://github.com/${owner}/hardware-lab`, projects: [] };
if (publicRepos) {
  try {
    const file = await github(`/repos/${owner}/hardware-lab/contents/projects.yml`);
    const index = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    const projects = (index.projects ?? [])
      .map((project) => {
        const slug = String(project.repo ?? "").split("/").pop();
        return {
          slug,
          name: project.name,
          repo: project.repo,
          platform: project.platform,
          ...chipFamily(project.platform),
          summary: project.summary,
          mediaScope: project.media_scope ?? null
        };
      })
      .filter((project) => publicRepos.has(project.slug) && isOwnedPublicHref(project.repo, owner));
    hardware = { status: "ok", indexUrl: hardware.indexUrl, statusDate: index.status_date ?? null, listed: index.projects?.length ?? 0, projects };
    if (index.status_date) {
      updates.push({
        date: `${index.status_date}T00:00:00.000Z`,
        lane: "touch",
        type: "INDEX",
        title: `Hardware Lab 收录 ${projects.length} 个公开项目`,
        text: "ESP32、STM32、树莓派与 Arduino 原型统一核对默认分支、提交与固定 Actions 链接。",
        href: hardware.indexUrl
      });
    }
  } catch (error) {
    hardware.error = errorInfo(error);
  }
}
sources.hardware = { status: hardware.status, count: hardware.projects.length };

const releaseFailures = [];
if (publicRepos) {
  for (const repo of releaseRepos.filter((name) => publicRepos.has(name))) {
    try {
      const releases = await github(`/repos/${owner}/${repo}/releases?per_page=5`);
      // One entry per repository: the latest published release, so a busy repo cannot crowd the feed.
      const release = releases.find((item) => !item.draft && !item.prerelease);
      if (release && isOwnedPublicHref(release.html_url, owner)) {
        updates.push({
          date: release.published_at,
          lane: releaseLanes[repo] ?? "see",
          type: "RELEASE",
          title: release.name || `${repo} ${release.tag_name}`,
          text: firstProseLine(release.body) ?? `${repo} 发布 ${release.tag_name}。`,
          href: release.html_url
        });
      }
    } catch (error) {
      releaseFailures.push(repo);
    }
  }
}
sources.releases = publicRepos
  ? { status: releaseFailures.length === 0 ? "ok" : "partial", failed: releaseFailures }
  : { status: "unknown", failed: releaseRepos };

const payload = {
  generatedAt,
  source: "GitHub REST API + npm registry",
  sources,
  npm,
  hardware,
  updates: updates.filter((item) => Number.isFinite(Date.parse(item.date))).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
};

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/studio.json", import.meta.url), JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote studio data: ${hardware.projects.length} hardware projects, ${payload.updates.length} feed entries at ${generatedAt}.`);
