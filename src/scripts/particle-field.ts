// Ambient motes behind the page. Deterministic, theme-aware and still under reduced motion:
// the field is atmosphere, never a layer the reader has to look through.
type Mote = {
  x: number;
  y: number;
  depth: number;
  size: number;
  speed: number;
  phase: number;
  lane: number;
  alpha: number;
  glow: boolean;
};

const SEED = 0x5f3a91;
const POINTER_RADIUS = 150;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wrap = (value: number) => ((value % 1) + 1) % 1;
const edgeFade = (unit: number) => Math.min(1, Math.min(unit, 1 - unit) / 0.08);

export function initParticleField() {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-particle-field]");
  if (!canvas) return;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const phone = window.matchMedia("(max-width: 760px)");
  const rng = mulberry32(SEED);

  let motes: Mote[] = [];
  let buckets: Array<{ color: string; motes: Mote[] }> = [];
  let width = 1;
  let height = 1;
  let ratio = 1;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let pending = 0;
  let scrollY = window.scrollY || 0;
  let scrollRange = 1;
  let pointerX = -1e4;
  let pointerY = -1e4;
  let pointerOn = false;
  let palette = { mote: "154,163,177", lanes: ["255,107,74", "110,168,255", "70,216,156"] };

  const readPalette = () => {
    const styles = getComputedStyle(root);
    const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    palette = {
      mote: token("--mote", "154,163,177"),
      lanes: [token("--mote-1", "255,107,74"), token("--mote-2", "110,168,255"), token("--mote-3", "70,216,156")]
    };
  };

  const build = () => {
    const count = reduceMotion.matches ? (phone.matches ? 40 : 60) : phone.matches ? 84 : 150;
    motes = Array.from({ length: count }, () => {
      const laneRoll = rng();
      return {
        x: rng(),
        y: rng(),
        depth: 0.3 + rng() * 0.7,
        size: 0.6 + rng() * 1.5,
        speed: 0.003 + rng() * 0.011,
        phase: rng() * Math.PI * 2,
        lane: laneRoll > 0.86 ? 1 + Math.floor(rng() * 3) : 0,
        alpha: 0.2 + rng() * 0.42,
        glow: rng() > 0.94
      };
    });
    regroup();
  };

  // One fill style per lane: alpha rides on globalAlpha, so the loop builds no strings.
  const regroup = () => {
    buckets = [palette.mote, palette.lanes[0], palette.lanes[1], palette.lanes[2]].map((color, lane) => ({
      color: `rgb(${color})`,
      motes: motes.filter((mote) => mote.lane === lane)
    }));
  };

  const resize = () => {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    scrollRange = Math.max(1, document.documentElement.scrollHeight - height);
  };

  const draw = (time: number) => {
    context.clearRect(0, 0, width, height);
    const depthScroll = scrollY / scrollRange;

    for (const bucket of buckets) {
      context.fillStyle = bucket.color;
      for (const mote of bucket.motes) {
        const wobble = Math.sin(time * 0.12 + mote.phase) * 0.012;
        const drift = (time * mote.speed) % 1;
        const nx = wrap(mote.x + wobble);
        const ny = wrap(mote.y - drift - depthScroll * 0.06 * mote.depth);
        let px = nx * width;
        let py = ny * height;
        let alpha = mote.alpha * edgeFade(ny) * (0.85 + 0.15 * Math.sin(time * 0.8 + mote.phase * 3));
        let size = mote.size * (0.75 + mote.depth * 0.5);

        if (pointerOn) {
          const dx = px - pointerX;
          const dy = py - pointerY;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < POINTER_RADIUS * POINTER_RADIUS && distanceSq > 0.5) {
            const distance = Math.sqrt(distanceSq);
            const pull = 1 - distance / POINTER_RADIUS;
            const push = pull * pull * 26 * (0.5 + mote.depth * 0.5);
            px += (dx / distance) * push;
            py += (dy / distance) * push;
            alpha = Math.min(0.9, alpha * (1 + pull * 0.55));
            size *= 1 + pull * 0.2;
          }
        }

        if (mote.glow) {
          context.globalAlpha = alpha * 0.13;
          context.beginPath();
          context.arc(px, py, size * 3.2, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = alpha;
        // Sub-pixel motes read the same as squares and skip a path per point.
        if (size < 1.4) context.fillRect(px - size, py - size, size * 2, size * 2);
        else {
          context.beginPath();
          context.arc(px, py, size, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    context.globalAlpha = 1;
  };

  const loop = (timestamp: number) => {
    if (!last) last = timestamp;
    const delta = Math.min(0.064, (timestamp - last) / 1000);
    last = timestamp;
    elapsed += delta;
    // Dust drifts slowly; half the refresh rate keeps the field cheap without reading as stepped.
    pending += delta;
    if (pending >= 1 / 30) {
      pending = 0;
      draw(elapsed);
    }
    if (!reduceMotion.matches && !document.hidden) frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (frame || reduceMotion.matches || document.hidden) return;
    last = 0;
    frame = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const settle = () => {
    stop();
    if (reduceMotion.matches) draw(0);
  };

  const onResize = () => {
    resize();
    build();
    if (reduceMotion.matches) draw(0);
  };
  const onScroll = () => {
    scrollY = window.scrollY || 0;
    scrollRange = Math.max(1, document.documentElement.scrollHeight - height);
    if (reduceMotion.matches) draw(0);
  };
  const onPointerMove = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerOn = true;
  };
  const onPointerLeave = () => {
    pointerOn = false;
    pointerX = -1e4;
    pointerY = -1e4;
  };
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  const onMotionChange = () => {
    settle();
    start();
  };
  const onThemeChange = () => {
    readPalette();
    regroup();
    if (reduceMotion.matches) draw(0);
  };
  const onPhoneChange = () => {
    build();
    if (reduceMotion.matches) draw(0);
  };

  readPalette();
  resize();
  build();
  if (reduceMotion.matches) draw(0);
  else start();

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("pointercancel", onPointerLeave, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("rongyi:themechange", onThemeChange);
  reduceMotion.addEventListener("change", onMotionChange);
  phone.addEventListener("change", onPhoneChange);

  window.addEventListener(
    "pagehide",
    () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointercancel", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("rongyi:themechange", onThemeChange);
      reduceMotion.removeEventListener("change", onMotionChange);
      phone.removeEventListener("change", onPhoneChange);
    },
    { once: true }
  );
}
