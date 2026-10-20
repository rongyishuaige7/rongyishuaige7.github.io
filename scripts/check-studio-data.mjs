import { readFile } from "node:fs/promises";
import { isOwnedPublicHref } from "./studio-semantics.mjs";

const owner = "rongyishuaige7";
const data = JSON.parse(await readFile(new URL("../src/data/studio.json", import.meta.url), "utf8"));
const failures = [];
const degraded = [];
const lanes = new Set(["carry", "see", "touch"]);

if (!Number.isFinite(Date.parse(data.generatedAt))) failures.push("generatedAt is not a valid ISO timestamp");
if (Math.abs(Date.now() - Date.parse(data.generatedAt)) > 10 * 60_000) failures.push("generatedAt is not from this build");

for (const [name, source] of Object.entries(data.sources ?? {})) {
  if (!source?.status) failures.push(`source ${name} has no status`);
  else if (source.status !== "ok") degraded.push(`${name}: ${source.status}`);
}

const hardware = data.hardware ?? {};
if (hardware.status === "ok") {
  if (!Array.isArray(hardware.projects) || hardware.projects.length === 0) failures.push("hardware index is ok but empty");
  for (const project of hardware.projects ?? []) {
    if (!project.slug || !project.name || !project.platform || !project.family) failures.push(`hardware ${project.slug ?? "?"}: incomplete entry`);
    if (!isOwnedPublicHref(project.repo, owner)) failures.push(`hardware ${project.slug}: repo link leaves the public owner scope`);
    const evidence = project.evidence;
    if (!["verified", "failure", "running", "unverified", "unknown"].includes(evidence?.status)) failures.push(`hardware ${project.slug}: missing evidence status`);
    if (evidence?.status === "verified" && (
      !/^[0-9a-f]{40}$/.test(evidence.headSha ?? "") || evidence.headSha !== evidence.indexedSha
      || !evidence.defaultBranch || !evidence.workflow?.startsWith(".github/workflows/")
      || !evidence.runUrl?.startsWith(`${project.repo}/actions/runs/`) || !Number.isFinite(Date.parse(evidence.runAt))
    )) failures.push(`hardware ${project.slug}: verified without current HEAD evidence`);
  }
} else if (hardware.projects?.length) {
  failures.push("hardware projects published without a verified index");
}

for (const [name, pkg] of Object.entries(data.npm ?? {})) {
  if (pkg.status === "unknown") continue;
  if (!pkg.latest || !Number.isFinite(Date.parse(pkg.publishedAt)) || !isOwnedPublicHref(pkg.url, owner)) failures.push(`npm ${name}: incomplete summary`);
  if (pkg.downloadsStatus === "ok" && !Number.isFinite(pkg.downloadsLastMonth)) failures.push(`npm ${name}: downloads marked ok without a count`);
  if (pkg.downloadsStatus === "unknown" && data.sources.npm?.status === "ok") failures.push(`npm ${name}: failed downloads concealed by ok source`);
}

for (const item of data.updates ?? []) {
  if (!lanes.has(item.lane) || !item.title || !item.text || !Number.isFinite(Date.parse(item.date))) failures.push(`update "${item.title ?? "?"}": incomplete entry`);
  if (!isOwnedPublicHref(item.href, owner)) failures.push(`update "${item.title}": link leaves the public owner scope`);
}

if (failures.length > 0) {
  console.error(`Studio data verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Verified studio data: ${hardware.projects?.length ?? 0} hardware projects, ${data.updates?.length ?? 0} feed entries.`);
if (degraded.length > 0) console.warn(`Publishing explicit degraded sources:\n- ${degraded.join("\n- ")}`);
