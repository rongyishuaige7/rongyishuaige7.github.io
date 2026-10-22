import { SCENES, ParticleMorph, along, clamp, edgeFade, structureFor, wrap, type Scene, type Vec } from "./particle-scenes";
import { SECTION_EVENT } from "./section-state";

type RGB = [number, number, number];
type StickyBounds = { start: number; end: number; top: number };
type ProtectedRect = { x: number; y: number; width: number; height: number; sticky?: StickyBounds; offset?: number };
const PROTECT = [
  "h1", "h2", "h3", "p", "dl", ".tags", ".project-links", ".entry-copy", ".entry-caption", ".entry-visual",
  "img", "figure", "figcaption", ".pcb-strip", ".hw-filters", ".hw-evidence", ".hw-stack", ".hw-top", ".signal-panel", "time", ".tl-tags", ".tl-arrow", ".hw-more", "summary", ".button", ".text-link", ".status", ".signal-chip"
].map(selector => `main ${selector}`).join(",");

export function initParticleField() {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-particle-field]");
  if (!canvas) return;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const phone = matchMedia("(max-width: 760px)");
  const events = new AbortController();
  const listen = { signal: events.signal };
  const layout = () => ({ mobile: phone.matches, count: reduce.matches ? (phone.matches ? 64 : 96) : phone.matches ? 156 : 300 });
  const currentScene = (): Scene => SCENES.includes(root.dataset.section as Scene) ? root.dataset.section as Scene : "top";
  const morph = new ParticleMorph(currentScene(), layout());
  let width = 1, height = 1, ratio = 1, scroll = window.scrollY;
  let frame = 0, measureFrame = 0, previous = 0, elapsed = 0;
  let active = true, disposed = false;
  let pointer: Vec | null = null;
  let protectedRects: ProtectedRect[] = [];
  let palette: RGB[] = [];

  const readPalette = () => {
    const css = getComputedStyle(root);
    palette = ["--mote", "--mote-1", "--mote-2", "--mote-3"].map(token => css.getPropertyValue(token).trim().split(",").map(Number) as RGB);
  };
  const colors = () => [0, 1, 2, 3].map(lane => {
    const rgb: RGB = [0, 0, 0];
    for (const scene of SCENES) {
      const accent = scene === "carry" || scene === "proof" ? 1 : scene === "see" ? 2 : scene === "touch" ? 3 : lane;
      const color = palette[lane === 0 || scene === "log" ? 0 : accent];
      for (let channel = 0; channel < 3; channel++) rgb[channel] += color[channel] * morph.weights[scene];
    }
    return `rgb(${rgb.map(Math.round).join(",")})`;
  });

  const draw = () => {
    if (disposed || !active || document.hidden) return;
    morph.setScene(currentScene(), layout(), elapsed);
    morph.advance(elapsed, reduce.matches);
    const ink = colors();
    context.clearRect(0, 0, width, height);
    const point = (p: Vec): Vec => [p[0] * width, p[1] * height];
    for (const scene of SCENES) {
      const weight = morph.weights[scene];
      if (weight < 0.005) continue;
      const structure = structureFor(scene, phone.matches);
      const accent = scene === "see" ? 2 : scene === "touch" ? 3 : 1;
      context.strokeStyle = `rgb(${palette[scene === "log" ? 0 : accent].join(",")})`;
      context.fillStyle = context.strokeStyle;
      context.lineWidth = 0.8;
      context.globalAlpha = weight * (scene === "log" ? 0.1 : 0.17);
      for (const path of structure.tracks) {
        context.beginPath();
        path.points.forEach((p, i) => { const [x, y] = point(p); if (i === 0) context.moveTo(x, y); else context.lineTo(x, y); });
        context.stroke();
      }
      for (const p of structure.anchors) {
        const [x, y] = point(p);
        context.globalAlpha = weight * 0.35;
        context.beginPath(); context.arc(x, y, 3.2, 0, Math.PI * 2); context.stroke();
        context.globalAlpha = weight * 0.55;
        context.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      }
      if (!reduce.matches && structure.tracks.length) {
        for (let i = 0; i < structure.tracks.length; i += 2) {
          const progress = wrap(elapsed * (scene === "carry" ? 0.06 : 0.035) + i * 0.19);
          context.globalAlpha = weight * 0.72 * edgeFade(progress);
          const [x, y] = point(along(structure.tracks[i], progress));
          context.beginPath(); context.arc(x, y, 1.8, 0, Math.PI * 2); context.fill();
        }
      }
    }
    for (let lane = 0; lane < 4; lane++) {
      context.fillStyle = ink[lane];
      for (let i = 0; i < morph.layout.count; i++) {
        const seed = morph.seeds[i];
        if ((seed.accent && !seed.dust ? 1 + seed.group % 3 : 0) !== lane) continue;
        const pose = morph.poses[i];
        let x = pose.x * width, y = pose.y * height;
        let alpha = pose.alpha;
        if (pointer && !reduce.matches) {
          const dx = x - pointer[0], dy = y - pointer[1], distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 125) {
            const influence = (1 - distance / 125) ** 2;
            const push = influence * 15 * seed.depth;
            x += dx / distance * push; y += dy / distance * push;
            alpha *= 1 + influence * 0.25;
          }
        }
        context.globalAlpha = clamp(alpha);
        context.beginPath(); context.arc(x, y, pose.size, 0, Math.PI * 2); context.fill();
      }
    }
    // Cached document coordinates: no layout reads in the drawing loop.
    context.globalAlpha = 1;
    context.globalCompositeOperation = "destination-out";
    context.fillRect(0, 0, width, phone.matches ? 136 : 80);
    for (const rect of protectedRects) {
      const y = rect.sticky
        ? Math.min(Math.max(rect.sticky.start - scroll, rect.sticky.top), rect.sticky.end - scroll) + (rect.offset ?? 0)
        : rect.y - scroll;
      if (y + rect.height < 0 || y > height) continue;
      context.fillRect(rect.x, y, rect.width, rect.height);
    }
    context.globalCompositeOperation = "source-over";
    if (canvas.dataset.scene !== morph.scene) canvas.dataset.scene = morph.scene;
    const count = String(morph.layout.count);
    if (canvas.dataset.particles !== count) canvas.dataset.particles = count;
  };

  const measure = () => {
    scroll = window.scrollY;
    const stickyElement = document.querySelector<HTMLElement>(".proof-copy");
    let sticky: StickyBounds | undefined;
    let stickyY = 0;
    if (stickyElement && getComputedStyle(stickyElement).position === "sticky") {
      const parent = stickyElement.parentElement!;
      const parentRect = parent.getBoundingClientRect(), parentStyle = getComputedStyle(parent);
      const stickyRect = stickyElement.getBoundingClientRect();
      stickyY = stickyRect.top;
      sticky = {
        start: parentRect.top + scroll + Number.parseFloat(parentStyle.paddingTop),
        end: parentRect.bottom + scroll - Number.parseFloat(parentStyle.paddingBottom) - stickyRect.height,
        top: Number.parseFloat(getComputedStyle(stickyElement).top)
      };
    }
    protectedRects = [...document.querySelectorAll<HTMLElement>(PROTECT)].flatMap(el => {
      if (el.hidden || !el.getClientRects().length) return [];
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return [];
      return [{
        x: rect.left - 5, y: rect.top + scroll - 4, width: rect.width + 10, height: rect.height + 8,
        ...(sticky && stickyElement?.contains(el) ? { sticky, offset: rect.top - stickyY - 4 } : {})
      }];
    });
  };
  const scheduleMeasure = () => {
    if (measureFrame || !active || disposed || document.hidden) return;
    measureFrame = requestAnimationFrame(() => { measureFrame = 0; measure(); if (reduce.matches) draw(); });
  };
  const resize = () => {
    width = Math.max(1, innerWidth); height = Math.max(1, innerHeight);
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(width * ratio), h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    scheduleMeasure();
    if (reduce.matches) draw();
  };
  const tick = (timestamp: number) => {
    frame = 0;
    if (!active || disposed || document.hidden || reduce.matches) return;
    const delta = previous ? Math.min(0.1, (timestamp - previous) / 1000) : 0;
    previous = timestamp; elapsed += delta;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
  const sync = () => {
    stop();
    if (!active || disposed || document.hidden) { canvas.dataset.state = "suspended"; return; }
    draw();
    canvas.dataset.state = reduce.matches ? "still" : "running";
    if (!reduce.matches) frame = requestAnimationFrame(tick);
  };
  const resizeObserver = new ResizeObserver(scheduleMeasure);
  document.querySelectorAll("main > section").forEach(el => resizeObserver.observe(el));
  const dispose = () => {
    if (disposed) return;
    stop(); disposed = true; active = false;
    cancelAnimationFrame(measureFrame);
    events.abort(); resizeObserver.disconnect();
    canvas.dataset.state = "disposed";
  };
  window.addEventListener("scroll", () => { scroll = window.scrollY; if (reduce.matches) draw(); }, { ...listen, passive: true });
  window.addEventListener("resize", resize, { ...listen, passive: true });
  window.addEventListener("pointermove", event => { if (event.pointerType === "mouse") pointer = [event.clientX, event.clientY]; }, { ...listen, passive: true });
  window.addEventListener("pointerout", event => { if (!event.relatedTarget) pointer = null; }, listen);
  window.addEventListener("pointercancel", () => { pointer = null; }, listen);
  document.addEventListener(SECTION_EVENT, () => { morph.setScene(currentScene(), layout(), elapsed); if (reduce.matches) draw(); }, listen);
  document.addEventListener("rongyi:themechange", () => { readPalette(); if (reduce.matches) draw(); }, listen);
  document.addEventListener("visibilitychange", () => { pointer = null; if (!document.hidden) scheduleMeasure(); sync(); }, listen);
  reduce.addEventListener("change", sync, listen);
  phone.addEventListener("change", () => { resize(); sync(); }, listen);
  document.addEventListener("load", scheduleMeasure, { ...listen, capture: true });
  document.addEventListener("transitionend", event => { if (event.propertyName === "transform" || event.propertyName === "height") scheduleMeasure(); }, listen);
  document.addEventListener("animationend", scheduleMeasure, listen);
  window.addEventListener("pagehide", event => {
    active = false; pointer = null; stop();
    cancelAnimationFrame(measureFrame); measureFrame = 0;
    canvas.dataset.state = "suspended";
    if (!event.persisted) dispose();
  }, listen);
  window.addEventListener("pageshow", () => { active = true; readPalette(); resize(); measure(); sync(); }, listen);
  document.fonts.ready.then(() => { if (!disposed) scheduleMeasure(); });
  readPalette(); resize(); measure(); sync();
  return dispose;
}
