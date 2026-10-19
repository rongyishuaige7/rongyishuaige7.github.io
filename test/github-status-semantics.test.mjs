import assert from "node:assert/strict";
import test from "node:test";

import { artifactStatusForCi, ciRunAgeHours, ciStatusForHead, isArtifactAvailable } from "../scripts/github-status-semantics.mjs";

const now = Date.parse("2026-07-15T12:00:00.000Z");
const head = "a".repeat(40);
const older = "b".repeat(40);

test("a passing run for an unchanged HEAD stays valid regardless of age", () => {
  const runs = [{ head_sha: head, status: "completed", conclusion: "success" }];
  const result = ciStatusForHead(runs, head);
  assert.equal(result.status, "completed");
  assert.equal(result.run.conclusion, "success");
  assert.equal(ciRunAgeHours("2026-04-15T12:00:00.000Z", now), 2184);
});

test("a HEAD that moved past its last run is unverified", () => {
  const runs = [{ head_sha: older, status: "completed", conclusion: "success" }];
  assert.deepEqual(ciStatusForHead(runs, head), { status: "unverified", run: null });
  assert.deepEqual(ciStatusForHead([], head), { status: "unverified", run: null });
  assert.deepEqual(ciStatusForHead(undefined, head), { status: "unverified", run: null });
});

test("an in-flight run for the current HEAD reports its live status", () => {
  const runs = [{ head_sha: head, status: "in_progress", conclusion: null }];
  assert.equal(ciStatusForHead(runs, head).status, "in_progress");
});

test("invalid CI timestamps have no age", () => {
  assert.equal(ciRunAgeHours("not-a-date", now), null);
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
