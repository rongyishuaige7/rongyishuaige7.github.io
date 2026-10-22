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
  const fields = [30, 60, 120, 144].map(fps => {
    const field = new ParticleMorph("carry", desktop);
    field.setScene("see", desktop, 0);
    for (let frame = 1; frame <= fps * 1.5; frame++) field.advance(frame / fps);
    return field;
  });
  for (const field of fields.slice(1)) {
    assert.deepEqual(field.poses, fields[0].poses);
    assert.deepEqual(field.weights, fields[0].weights);
  }
});

test("open-track loops and ambient dust wrap only while invisible", () => {
  const seeds = createSeeds();
  for (const scene of SCENES.filter(scene => scene !== "top")) {
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      if (seed.dust || scene === "touch" && i % 3 !== 0) continue;
      const pace = scene === "carry" ? 0.7 : scene === "see" ? 0.65 : 0.23;
      const boundary = (1 - seed.u) / (seed.speed * pace);
      for (const offset of [-1 / 120, 0, 1 / 120]) {
        const pose = sampleScene(scene, seed, i, boundary + offset, desktop);
        assert.ok(pose.alpha < 0.0001, `${scene}/${i}: a particle must fade before crossing the open track`);
      }
    }
  }
  for (const [i, seed] of seeds.entries()) {
    if (!seed.dust) continue;
    const boundary = seed.v / (seed.speed * 0.13);
    for (const offset of [-1 / 120, 0, 1 / 120]) {
      assert.ok(sampleScene("top", seed, i, boundary + offset, desktop).alpha < 0.0001);
    }
  }
  const atHorizontalEdge = { ...seeds[0], u: 0.99, phase: Math.PI / 2 };
  assert.equal(sampleScene("top", atHorizontalEdge, 0, 0, desktop).alpha, 0);
});

test("a destination crossing its loop cannot teleport particles during a morph", () => {
  const field = new ParticleMorph("top", desktop);
  const seed = field.seeds[1];
  const crossing = (1 - seed.u) / (seed.speed * 0.7);
  const start = crossing - 0.5;
  field.advance(start);
  field.setScene("carry", desktop, start);
  let previous = copy(field.poses);
  for (let frame = 0; frame <= 120; frame++) {
    field.advance(start + frame / 120);
    for (let i = 0; i < field.poses.length; i++) {
      const pose = field.poses[i], from = previous[i];
      assert.ok(Math.hypot(pose.x - from.x, pose.y - from.y) < 0.03, `frame ${frame}, particle ${i}: continuous assembly`);
    }
    if (frame / 120 <= MORPH_SECONDS) assert.equal(field.flowTime, start);
    previous = copy(field.poses);
  }
  assert.ok(field.flowTime > start, "orbital flow resumes after assembly");
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
