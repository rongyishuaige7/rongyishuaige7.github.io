import assert from "node:assert/strict";
import test from "node:test";

import { artifactStatusForCi, getCiTiming, isArtifactAvailable } from "../scripts/github-status-semantics.mjs";

const now = Date.parse("2026-07-15T12:00:00.000Z");

test("CI evidence becomes stale only after the 48-hour boundary", () => {
  const atBoundary = getCiTiming("2026-07-13T12:00:00.000Z", 48, now);
  assert.equal(atBoundary.ageHours, 48);
  assert.equal(atBoundary.stale, false);

  const pastBoundary = getCiTiming("2026-07-13T11:59:59.999Z", 48, now);
  assert.equal(pastBoundary.stale, true);
});

test("invalid CI timestamps fail closed as stale", () => {
  assert.deepEqual(getCiTiming("not-a-date", 48, now), { ageHours: null, stale: true });
});

test("Artifact with expiresAt equal to or before now is unavailable", () => {
  const artifact = { expired: false, expiresAt: "2026-07-15T12:00:00.000Z" };

  assert.equal(isArtifactAvailable(artifact, now - 1), true);
  assert.equal(isArtifactAvailable(artifact, now), false);
  assert.equal(isArtifactAvailable(artifact, now + 1), false);
});

test("Artifact availability fails closed for API expiry or invalid expiresAt", () => {
  assert.equal(isArtifactAvailable({ expired: true, expiresAt: "2026-07-16T12:00:00.000Z" }, now), false);
  assert.equal(isArtifactAvailable({ expired: false, expiresAt: "not-a-date" }, now), false);
});

test("Artifact remains unknown when its prerequisite CI API is unknown", () => {
  assert.equal(artifactStatusForCi("unknown", false), "unknown");
  assert.equal(artifactStatusForCi("unverified", false), "unavailable");
  assert.equal(artifactStatusForCi("completed", true), "check_run");
});
