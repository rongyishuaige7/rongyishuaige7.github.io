/**
 * Pure evidence rules shared by GitHub status collection and validation.
 * Every helper accepts `nowMs` so tests and future callers remain deterministic.
 *
 * CI evidence is tied to the current default-branch HEAD, not to a time window:
 * a passing run for an unchanged HEAD stays valid, and a HEAD that moved past
 * its last verified run is reported as unverified by the collector.
 */
export function ciRunAgeHours(runAt, nowMs = Date.now()) {
  const runAtMs = Date.parse(runAt);
  if (!Number.isFinite(runAtMs) || !Number.isFinite(nowMs)) return null;
  return (nowMs - runAtMs) / 3_600_000;
}

export function ciStatusForHead(runs, headSha) {
  const matchingHead = (runs ?? []).find((run) => run.head_sha === headSha);
  if (!matchingHead) return { status: "unverified", run: null };
  return { status: matchingHead.status, run: matchingHead };
}

export function isArtifactAvailable(artifact, nowMs = Date.now()) {
  if (artifact?.expired !== false || !Number.isFinite(nowMs)) return false;

  const expiresAtMs = Date.parse(artifact.expiresAt);
  return Number.isFinite(expiresAtMs) && expiresAtMs > nowMs;
}

export function artifactStatusForCi(ciStatus, hasVerifiedRunUrl) {
  if (ciStatus === "unknown") return "unknown";
  return hasVerifiedRunUrl ? "check_run" : "unavailable";
}
