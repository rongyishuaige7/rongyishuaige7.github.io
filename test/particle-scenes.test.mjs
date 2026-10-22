import assert from "node:assert/strict";
import test from "node:test";
import { SCENES, MORPH_SECONDS, ParticleMorph, createSeeds, sampleScene } from "../src/scripts/particle-scenes.ts";

const desktop = { mobile: false, count: 300 };
const copy = poses => poses.map(p => ({ ...p }));
const difference = (a, b) => Math.sqrt(a.reduce((sum, p, i) => sum + (p.x - b[i].x) ** 2 + (p.y - b[i].y) ** 2, 0) / a.length);

test("responsive particle budgets retain deterministic identities", () => {
  assert.deepEqual(createSeeds(156), createSeeds(300).slice(0, 156));
  const field = new ParticleMorph("touch", desktop);
  field.advance(2);
  const positions = copy(field.poses), identities = field.seeds;
  field.setScene("touch", { mobile: true, count: 156 }, 2);
  field.advance(2);
  assert.deepEqual(field.poses, positions);
  assert.equal(field.seeds, identities);
  field.advance(3);
  assert.ok(field.poses.every(p => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1));
});

test("all six chapter silhouettes are measurably different", () => {
  const seeds = createSeeds();
  const scenes = SCENES.map(scene => seeds.flatMap((seed, i) => seed.dust ? [] : [sampleScene(scene, seed, i, 4, desktop)]));
  for (let i = 0; i < scenes.length; i++) for (let j = i + 1; j < scenes.length; j++) {
    assert.ok(difference(scenes[i], scenes[j]) > 0.16, `${SCENES[i]} and ${SCENES[j]} must have distinct distributions`);
  }
});

test("rapid reversal begins at the last rendered pose and preserves topology opacity", () => {
  const field = new ParticleMorph("top", desktop);
  field.setScene("carry", desktop, 0);
  field.advance(0.24);
  const positions = copy(field.poses), weights = { ...field.weights };
  field.setScene("touch", desktop, 0.24);
  field.advance(0.24);
  assert.deepEqual(field.poses, positions);
  assert.deepEqual(field.weights, weights);
  field.advance(0.4);
  const midway = copy(field.poses);
  field.setScene("top", desktop, 0.4);
  field.advance(0.4);
  assert.deepEqual(field.poses, midway);
  assert.ok(Math.abs(Object.values(field.weights).reduce((a, b) => a + b, 0) - 1) < 1e-12);
  field.advance(0.4 + MORPH_SECONDS);
  assert.equal(field.progress, 1);
  assert.equal(field.weights.top, 1);
});

test("the morph clock is independent of drawing frequency", () => {
  const a = new ParticleMorph("carry", desktop), b = new ParticleMorph("carry", desktop);
  a.setScene("see", desktop, 0); b.setScene("see", desktop, 0);
  for (let frame = 1; frame <= 30; frame++) a.advance(frame / 60);
  for (let frame = 1; frame <= 15; frame++) b.advance(frame / 30);
  assert.deepEqual(a.poses, b.poses);
  assert.deepEqual(a.weights, b.weights);
});

test("reduced motion directly selects a time-invariant scene", () => {
  const field = new ParticleMorph("carry", desktop);
  const stillLayout = { mobile: false, count: 96 };
  field.setScene("see", stillLayout, 0);
  field.advance(0, true);
  const positions = copy(field.poses);
  field.advance(100, true);
  assert.deepEqual(field.poses, positions);
  assert.equal(field.weights.see, 1);
  assert.equal(field.progress, 1);
  field.setScene("proof", stillLayout, 100);
  field.advance(100, true);
  assert.equal(field.weights.proof, 1);
  assert.ok(difference(positions, field.poses) > 0.16);
});
