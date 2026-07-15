import { readFile } from "node:fs/promises";

const status = JSON.parse(await readFile(new URL("../src/data/github-status.json", import.meta.url), "utf8"));
const failures = [];
const now = Date.now();

if (!Number.isFinite(Date.parse(status.generatedAt))) failures.push("generatedAt is not a valid ISO timestamp");
if (Math.abs(now - Date.parse(status.generatedAt)) > 10 * 60_000) failures.push("generatedAt is not from this build");

for (const [repo, signal] of Object.entries(status.repositories ?? {})) {
  if (!signal.defaultBranch || !/^[0-9a-f]{40}$/.test(signal.headSha ?? "")) failures.push(`${repo}: missing default-branch HEAD`);
  if (["unknown", "unverified"].includes(signal.ci?.status)) failures.push(`${repo}: CI ${signal.ci.status}`);
  if (signal.ci?.headSha && signal.ci.headSha !== signal.headSha) failures.push(`${repo}: CI does not verify current HEAD`);
  if (signal.release?.status === "unknown") failures.push(`${repo}: release status unknown`);
  if (signal.artifact?.status === "unknown") failures.push(`${repo}: artifact status unknown`);
  if (signal.artifact?.status === "available" && !signal.artifact.artifacts?.some((artifact) => !artifact.expired)) {
    failures.push(`${repo}: artifact is marked available without a live artifact`);
  }
}

if (failures.length > 0) {
  console.error(`Public status verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Verified public status for ${Object.keys(status.repositories).length} repositories.`);
