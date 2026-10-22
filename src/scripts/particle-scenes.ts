// Pure, deterministic geometry. Scrolling chooses a scene; the clock moves its particles.
export const SCENES = ["top", "carry", "see", "touch", "proof", "log"] as const;
export type Scene = (typeof SCENES)[number];
export type Vec = [number, number];
export type Layout = { mobile: boolean; count: number };
export type Seed = { u: number; v: number; phase: number; depth: number; size: number; speed: number; group: number; accent: boolean; dust: boolean };
export type Pose = { x: number; y: number; alpha: number; size: number };
export type Track = { points: Vec[]; lengths: number[]; length: number };
export type Structure = { tracks: Track[]; anchors: Vec[] };
export const MORPH_SECONDS = 0.78;
export const wrap = (value: number) => ((value % 1) + 1) % 1;
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function createSeeds(count = 300): Seed[] {
  let state = 0x5f3a91;
  const random = () => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, (_, index) => ({
    u: random(), v: random(), phase: random() * Math.PI * 2,
    depth: 0.35 + random() * 0.65, size: 0.6 + random() * 1.25,
    speed: 0.012 + random() * 0.018, group: Math.floor(random() * 12),
    accent: random() > 0.8, dust: index % 7 === 0
  }));
}

function track(points: Vec[]): Track {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return { points, lengths, length: lengths[lengths.length - 1] };
}

export function along(path: Track, progress: number): Vec {
  const distance = clamp(progress) * path.length;
  for (let i = 1; i < path.points.length; i++) {
    if (distance > path.lengths[i]) continue;
    const t = (distance - path.lengths[i - 1]) / Math.max(0.0001, path.lengths[i] - path.lengths[i - 1]);
    const a = path.points[i - 1], b = path.points[i];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  return path.points[path.points.length - 1];
}

const structures = new Map<string, Structure>();
export function structureFor(scene: Scene, mobile: boolean): Structure {
  const key = `${scene}:${mobile}`;
  const cached = structures.get(key);
  if (cached) return cached;
  let points: Vec[][] = [];
  let anchors: Vec[] = [];
  if (scene === "carry") {
    points = Array.from({ length: 5 }, (_, i) => {
      const offset = (i - 2) * 0.072;
      return [[0.025, 0.82 + offset], [0.975, 0.18 + offset]];
    });
  } else if (scene === "see") {
    points = Array.from({ length: 6 }, (_, i) => {
      const y = 0.19 + i * 0.125;
      return [[0.025, y], [0.27, y], [0.31, y - 0.026], [0.69, y - 0.026], [0.73, y], [0.975, y]];
    });
    anchors = points.map(path => path[3]);
  } else if (scene === "touch") {
    // Open traces surround the existing PCB strip; there is no second illustrated board.
    points = [
      [[0.02, 0.19], [0.2, 0.19], [0.3, 0.29], [0.3, 0.4], [0.42, 0.4]],
      [[0.02, 0.36], [0.16, 0.36], [0.24, 0.44], [0.24, 0.62]],
      [[0.02, 0.82], [0.23, 0.82], [0.34, 0.71], [0.34, 0.62], [0.45, 0.62]],
      [[0.98, 0.2], [0.8, 0.2], [0.7, 0.3], [0.7, 0.4], [0.58, 0.4]],
      [[0.98, 0.48], [0.84, 0.48], [0.77, 0.55], [0.77, 0.7]],
      [[0.98, 0.84], [0.8, 0.84], [0.66, 0.7], [0.66, 0.62], [0.55, 0.62]],
      [[0.44, 0.12], [0.44, 0.24], [0.52, 0.32]],
      [[0.5, 0.88], [0.5, 0.77], [0.56, 0.71]]
    ];
    anchors = points.map(path => path[path.length - 1]);
  } else if (scene === "proof") {
    points = Array.from({ length: 3 }, (_, i) => {
      const y = 0.18 + i * 0.22;
      return [[0.08, y], [0.32, y], [0.4, y + 0.08], [0.64, y + 0.08], [0.72, y + 0.16], [0.92, y + 0.16]];
    });
    anchors = points.flatMap(path => [path[1], path[3], path[5]]);
  } else if (scene === "log") {
    const x = mobile ? 0.12 : 0.17;
    points = [[[x, 0.12], [x, 0.9]], ...[0.28, 0.5, 0.72].map((y): Vec[] => [[x, y], [x + 0.12, y], [x + 0.2, y + 0.06], [0.82, y + 0.06]])];
    anchors = [0.28, 0.5, 0.72].map(y => [x, y]);
  }
  const result = { tracks: points.map(track), anchors };
  structures.set(key, result);
  return result;
}

export function sampleScene(scene: Scene, seed: Seed, index: number, time: number, layout: Layout): Pose {
  const { u, v, depth, phase, speed, group } = seed;
  let x = u, y = v;
  let alpha = 0.26 + depth * 0.44;
  const size = seed.size * (0.72 + depth * 0.34);
  if (seed.dust) {
    return { x: wrap(u + Math.sin(time * 0.13 + phase) * 0.01), y: wrap(v - time * speed * 0.13), alpha: 0.09 + depth * 0.15, size: size * 0.72 };
  }
  if (scene === "top") {
    const center = layout.mobile ? [0.25, 0.68, 0.43][group % 3] : 0.18 + (group % 3) * 0.32;
    x = center + Math.cos(phase + time * 0.035) * (0.035 + u * (layout.mobile ? 0.2 : 0.11));
    y = (layout.mobile ? 0.24 + (group % 3) * 0.25 : 0.46) + Math.sin(phase + time * 0.035) * (0.045 + v * 0.25);
    alpha *= 0.82;
  } else if (scene === "touch" && index % 3 !== 0) {
    const columns = layout.mobile ? 9 : 17;
    const rows = Math.ceil(layout.count / columns);
    const slot = index % layout.count;
    x = 0.045 + (slot % columns) / (columns - 1) * 0.91;
    y = 0.14 + Math.floor(slot / columns) / Math.max(1, rows - 1) * 0.73;
    const breath = Math.sin(time * 0.25 + phase) * 0.0014;
    x += breath; y -= breath;
    alpha *= 0.62;
  } else {
    const paths = structureFor(scene, layout.mobile).tracks;
    const path = paths[group % paths.length];
    const pace = scene === "carry" ? 0.7 : scene === "see" ? 0.65 : 0.23;
    [x, y] = along(path, wrap(u + time * speed * pace));
    const jitter = scene === "touch" ? 0.005 : 0.022;
    x += (v - 0.5) * jitter * 0.3;
    y += (v - 0.5) * jitter + Math.sin(time * 0.2 + phase) * jitter * 0.18;
    if (scene === "proof") alpha *= 0.72;
    if (scene === "log") alpha *= 0.52;
  }
  return { x: clamp(x), y: clamp(y), alpha, size };
}

export class ParticleMorph {
  readonly seeds: Seed[];
  poses: Pose[];
  scene: Scene;
  layout: Layout;
  progress = 1;
  weights: Record<Scene, number>;
  private from: Pose[];
  private fromWeights: Record<Scene, number>;
  private started = -Infinity;

  constructor(scene: Scene, layout: Layout, seeds = createSeeds()) {
    this.seeds = seeds;
    this.scene = scene;
    this.layout = { ...layout };
    this.poses = seeds.map((seed, index) => sampleScene(scene, seed, index, 0, layout));
    this.from = this.poses.map(pose => ({ ...pose }));
    this.weights = Object.fromEntries(SCENES.map(id => [id, Number(id === scene)])) as Record<Scene, number>;
    this.fromWeights = { ...this.weights };
  }

  setScene(scene: Scene, layout: Layout, time: number) {
    if (scene === this.scene && layout.mobile === this.layout.mobile && layout.count === this.layout.count) return;
    this.from = this.poses.map(pose => ({ ...pose }));
    this.fromWeights = { ...this.weights };
    this.scene = scene;
    this.layout = { ...layout };
    this.started = time;
    this.progress = 0;
  }

  advance(time: number, still = false) {
    this.progress = still ? 1 : smooth((time - this.started) / MORPH_SECONDS);
    for (const id of SCENES) this.weights[id] = this.fromWeights[id] + (Number(id === this.scene) - this.fromWeights[id]) * this.progress;
    for (let i = 0; i < this.seeds.length; i++) {
      const target = sampleScene(this.scene, this.seeds[i], i, still ? 0 : time, this.layout);
      const from = this.from[i], pose = this.poses[i];
      pose.x = from.x + (target.x - from.x) * this.progress;
      pose.y = from.y + (target.y - from.y) * this.progress;
      pose.alpha = from.alpha + (target.alpha - from.alpha) * this.progress;
      pose.size = from.size + (target.size - from.size) * this.progress;
    }
  }
}
