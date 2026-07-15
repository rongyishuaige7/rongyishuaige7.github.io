import { readFile } from "node:fs/promises";
import { isArtifactAvailable } from "./github-status-semantics.mjs";

const status = JSON.parse(await readFile(new URL("../src/data/github-status.json", import.meta.url), "utf8"));
const failures = [];
const nonGreenSignals = [];
const now = Date.now();
const requiredRepositories = [
  "yipan-showcase",
  "problem-solution-recorder-oss",
  "devflow-recorder",
  "ESP32_RPS_Game",
  "pet-desktop-tauri"
];

if (!Number.isFinite(Date.parse(status.generatedAt))) failures.push("generatedAt is not a valid ISO timestamp");
if (Math.abs(now - Date.parse(status.generatedAt)) > 10 * 60_000) failures.push("generatedAt is not from this build");
for (const repo of requiredRepositories) {
  if (!status.repositories?.[repo]) failures.push(`${repo}: required repository status is missing`);
}

for (const [repo, signal] of Object.entries(status.repositories ?? {})) {
  if (!signal.url || !signal.ci?.status || !signal.release?.status || !signal.artifact?.status) {
    failures.push(`${repo}: incomplete status schema`);
    continue;
  }

  if (["unknown", "unverified", "stale"].includes(signal.ci.status)) nonGreenSignals.push(`${repo}: CI ${signal.ci.status}`);
  if (signal.release.status === "unknown") nonGreenSignals.push(`${repo}: release unknown`);
  if (signal.artifact.status === "unknown") nonGreenSignals.push(`${repo}: artifact unknown`);

  if (["completed", "stale"].includes(signal.ci.status)) {
    if (!signal.defaultBranch || !/^[0-9a-f]{40}$/.test(signal.headSha ?? "")) failures.push(`${repo}: verified CI is missing default-branch HEAD`);
    if (!/^[0-9a-f]{40}$/.test(signal.ci.headSha ?? "")) failures.push(`${repo}: verified CI is missing run HEAD`);
    if (signal.ci.headSha !== signal.headSha) failures.push(`${repo}: CI does not verify current HEAD`);
    if (!signal.ci.url || !signal.ci.runAt) failures.push(`${repo}: verified CI is missing evidence URL or time`);
  }

  if (signal.release.status === "available" && (!signal.release.tag || !signal.release.url)) {
    failures.push(`${repo}: available release is missing tag or URL`);
  }
  if (
    signal.artifact.status === "available" &&
    !signal.artifact.artifacts?.some((artifact) => isArtifactAvailable(artifact, now))
  ) {
    failures.push(`${repo}: artifact is marked available without a live artifact`);
  }
  for (const artifact of signal.artifact.artifacts ?? []) {
    if (!artifact.url || !Number.isFinite(Date.parse(artifact.expiresAt))) {
      failures.push(`${repo}: artifact evidence is missing a valid URL or expiry time`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Public status verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Verified public status semantics for ${Object.keys(status.repositories).length} repositories.`);
if (nonGreenSignals.length > 0) {
  console.warn(`Publishing explicit non-green status:\n- ${nonGreenSignals.join("\n- ")}`);
}
