import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const base = process.env.SITE_URL ?? "http://127.0.0.1:4321/";
const output = await mkdtemp(join(tmpdir(), "rongyi-particle-check-"));
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync(chrome) ? chrome : chromium.executablePath());
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [], results = [];
const ids = ["top", "carry", "see", "touch", "proof", "log"];
console.log(`Artifacts: ${output}`);

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, colorScheme: "dark" });
  await context.addInitScript(() => {
    window.__particleCheck = { frames: 0, costs: [], persisted: false };
    addEventListener("pageshow", event => { window.__particleCheck.persisted = event.persisted; });
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const composite = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "globalCompositeOperation");
    let started = 0;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.hasAttribute("data-particle-field")) { window.__particleCheck.frames++; started = performance.now(); }
      return clear.apply(this, args);
    };
    Object.defineProperty(CanvasRenderingContext2D.prototype, "globalCompositeOperation", {
      ...composite,
      set(value) {
        composite.set.call(this, value);
        if (value === "source-over" && this.canvas.hasAttribute("data-particle-field")) {
          window.__particleCheck.costs.push(performance.now() - started);
        }
      }
    });
  });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  const frames = () => page.evaluate(() => window.__particleCheck.frames);
  const scene = async (id, wait = 900) => {
    await page.evaluate(id => {
      const el = document.getElementById(id);
      if (id === "top") scrollTo({ top: 0, behavior: "instant" });
      else el.scrollIntoView({ block: "start", behavior: "instant" });
    }, id);
    await page.waitForFunction(id => document.querySelector("[data-particle-field]").dataset.scene === id, id);
    if (wait) await page.waitForTimeout(wait);
    const state = await page.locator("[data-particle-field]").evaluate(canvas => ({
      scene: canvas.dataset.scene, section: document.documentElement.dataset.section,
      particles: Number(canvas.dataset.particles), state: canvas.dataset.state,
      width: canvas.width, overflow: document.documentElement.scrollWidth > innerWidth,
      current: [...document.querySelectorAll('[data-lane-nav] a[aria-current="location"]')].map(a => a.hash)
    }));
    assert.equal(state.scene, id); assert.equal(state.section, id); assert.equal(state.overflow, false);
    assert.deepEqual(state.current, ["carry", "see", "touch", "log"].includes(id) ? [`#${id}`, `#${id}`] : []);
    return state;
  };
  const protectedPixels = () => page.evaluate(() => {
    const canvas = document.querySelector("[data-particle-field]"), ctx = canvas.getContext("2d");
    const ratio = canvas.width / innerWidth;
    const targets = [...document.querySelectorAll("main h2, main img, main .pcb-strip, main .signal-panel")];
    let tested = 0, ink = 0;
    const violations = [];
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.ceil((r.left + 4) * ratio)), y = Math.max(0, Math.ceil((r.top + 4) * ratio));
      const right = Math.min(canvas.width, Math.floor((r.right - 4) * ratio));
      const bottom = Math.min(canvas.height, Math.floor((r.bottom - 4) * ratio));
      if (right <= x || bottom <= y) continue;
      const pixels = ctx.getImageData(x, y, right - x, bottom - y).data;
      let local = 0;
      for (let i = 3; i < pixels.length; i += 4) local += pixels[i];
      ink += local;
      if (local) violations.push({ tag: el.tagName, className: el.className, ink: local });
      tested++;
    }
    return { tested, ink, violations };
  });

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const theme of ["dark", "light"]) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; document.dispatchEvent(new CustomEvent("rongyi:themechange")); }, theme);
      for (const id of ids) {
        const state = await scene(id);
        assert.equal(state.particles, width === 1440 ? 300 : 156);
        assert.equal(state.width, Math.round(width * 1.5));
        const protectedArea = await protectedPixels();
        assert.ok(protectedArea.tested > 0); assert.equal(protectedArea.ink, 0, `${width}/${theme}/${id}: media and headings must stay clear: ${JSON.stringify(protectedArea.violations)}`);
        await page.screenshot({ path: join(output, `${width}-${theme}-${id}.png`) });
        results.push({ width, theme, id, protectedArea });
      }
      for (const id of [...ids].reverse()) await scene(id, 0);
      console.log(`Passed ${width}px / ${theme}: forward, reverse, navigation, protected media`);
    }
  }

  await page.setViewportSize({ width: 320, height: 780 });
  await scene("touch");
  await page.locator('[data-hw-filters] button[data-filter="stm32"]').click();
  await page.waitForTimeout(700);
  assert.equal(await page.locator('[data-hw-filters] button[aria-pressed="true"]').getAttribute("data-filter"), "stm32");
  await scene("proof"); await scene("log");
  await page.goto(new URL("#see", base).href, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("[data-particle-field]").dataset.scene === "see");
  // Wait for the native smooth anchor scroll to finish before changing media preferences.
  await page.waitForFunction(() => {
    const el = document.getElementById("see");
    return Math.abs(el.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(el).scrollMarginTop)) < 2;
  });
  console.log("Passed 320px filtering, downstream layout changes and deep links");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await scene("see");
  assert.equal(await page.locator("[data-particle-field]").getAttribute("data-particles"), "64");
  await page.waitForTimeout(400); const still = await frames(); await page.waitForTimeout(350); assert.equal(await frames(), still);
  const beforeTheme = await page.locator("canvas").evaluate(c => c.toDataURL());
  await page.locator("[data-theme-toggle]").click();
  await page.waitForTimeout(150);
  assert.notEqual(await page.locator("canvas").evaluate(c => c.toDataURL()), beforeTheme);
  await scene("carry");
  await page.waitForTimeout(400); const chapterStill = await frames(); await page.waitForTimeout(350); assert.equal(await frames(), chapterStill);
  await page.setViewportSize({ width: 1440, height: 1000 }); await scene("touch");
  assert.equal(await page.locator("canvas").getAttribute("data-particles"), "96");
  await page.emulateMedia({ reducedMotion: "no-preference" }); await page.waitForTimeout(200);
  const running = await frames(); await page.waitForTimeout(250); assert.ok(await frames() > running);
  console.log("Passed live reduced-motion changes, responsive budgets, static repaint and theme switching");

  // Exercise lifecycle handlers explicitly, then perform a real history traversal below.
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  const hidden = await frames(); await page.waitForTimeout(250); assert.equal(await frames(), hidden);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  await page.waitForTimeout(200); assert.ok(await frames() > hidden);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
    const paused = await frames(); await page.waitForTimeout(200); assert.equal(await frames(), paused);
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await page.waitForTimeout(200); assert.ok(await frames() > paused);
  }
  const performance = await page.evaluate(() => {
    const costs = window.__particleCheck.costs.slice(10).sort((a, b) => a - b);
    return { draws: window.__particleCheck.frames, medianMs: costs[Math.floor(costs.length * 0.5)], p95Ms: costs[Math.floor(costs.length * 0.95)], maxMs: costs.at(-1) };
  });
  await page.goto(new URL("404.html", base).href, { waitUntil: "networkidle" });
  await page.goBack({ waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("[data-particle-field]")?.dataset.state === "running");
  const historyStart = await frames(); await page.waitForTimeout(250); assert.ok(await frames() > historyStart);
  const restoredFromCache = await page.evaluate(() => window.__particleCheck.persisted);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  const disposed = await frames();
  await page.evaluate(() => { dispatchEvent(new Event("resize")); document.dispatchEvent(new CustomEvent("rongyi:themechange")); });
  await page.waitForTimeout(250); assert.equal(await frames(), disposed);
  assert.equal(await page.locator("canvas").getAttribute("data-state"), "disposed");
  console.log(`Passed lifecycle pause/resume/disposal and real history navigation (BFCache: ${restoredFromCache})`);

  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, colorScheme: "light" });
  const fallback = await noJS.newPage(); await fallback.goto(base, { waitUntil: "networkidle" });
  assert.equal(await fallback.locator("#hero-title").textContent(), "Rongyi");
  assert.equal(await fallback.locator("main > section").count(), 6);
  assert.equal(await fallback.locator("[data-theme-toggle]").isVisible(), false);
  assert.equal(await fallback.locator("canvas").evaluate(c => [...c.getContext("2d").getImageData(0, 0, c.width, c.height).data].some(Boolean)), false);
  await noJS.close();
  assert.deepEqual(errors, []);
  await writeFile(join(output, "results.json"), JSON.stringify({ base, results, performance, restoredFromCache, errors }, null, 2));
  await context.close();
  console.log(JSON.stringify({ passed: true, performance, output }));
} finally { await browser.close(); }
