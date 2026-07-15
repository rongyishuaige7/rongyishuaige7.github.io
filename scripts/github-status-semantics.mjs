/**
 * Pure time-boundary rules shared by GitHub status collection and validation.
 * Every helper accepts `nowMs` so tests and future callers remain deterministic.
 */
export function getCiTiming(runAt, staleAfterHours, nowMs = Date.now()) {
  const runAtMs = Date.parse(runAt);
  if (
    !Number.isFinite(runAtMs) ||
    !Number.isFinite(staleAfterHours) ||
    staleAfterHours < 0 ||
    !Number.isFinite(nowMs)
  ) {
    return { ageHours: null, stale: true };
  }

  const ageHours = (nowMs - runAtMs) / 3_600_000;
  return {
    ageHours,
    // Exactly 48 hours is still inside a 48-hour validity window.
    stale: ageHours > staleAfterHours
  };
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
