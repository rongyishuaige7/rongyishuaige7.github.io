// Motion enhances the static document. Filtering semantics and final values are
// committed first; observers and animations never own the underlying content.
export function initMotion() {
  const root = document.documentElement;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  const cleanups: Array<() => void> = [];
  const counters = new Map<HTMLElement, number>();
  const tiles = new Map<HTMLElement, Animation>();
  let disposed = false;
  const reduced = () => preference.matches;
  const listen = { signal: events.signal };
  const format = new Intl.NumberFormat("zh-CN");
  const revealTargets = [...document.querySelectorAll<HTMLElement>(".reveal, [data-reveal]")];

  const finishCounters = () => {
    counters.forEach((frame, el) => {
      cancelAnimationFrame(frame);
      el.textContent = format.format(Number(el.dataset.count));
    });
    counters.clear();
  };
  const cancelTiles = () => {
    tiles.forEach((animation) => animation.cancel());
    tiles.clear();
  };
  const countUp = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target) || el.classList.contains("is-counted")) return;
    el.classList.add("is-counted");
    if (reduced() || document.hidden) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 720);
      el.textContent = format.format(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) counters.set(el, requestAnimationFrame(step));
      else counters.delete(el);
    };
    counters.set(el, requestAnimationFrame(step));
  };
  const revealAll = () => {
    revealTargets.forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      el.classList.add("is-counted");
      el.textContent = format.format(Number(el.dataset.count));
    });
    finishCounters();
  };

  if (reduced() || !("IntersectionObserver" in window)) revealAll();
  else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add("is-in");
        el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
        observer.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -4% 0px" });
    revealTargets.forEach((el) => observer.observe(el));
    cleanups.push(() => observer.disconnect());
  }

  const loops = [...document.querySelectorAll<HTMLElement>("[data-loop]")];
  const visibleLoops = new Set<HTMLElement>();
  const syncLoops = () => loops.forEach((el) => {
    el.dataset.loop = !document.hidden && !reduced() && visibleLoops.has(el) ? "running" : "paused";
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) visibleLoops.add(el);
        else visibleLoops.delete(el);
      });
      syncLoops();
    });
    loops.forEach((el) => observer.observe(el));
    cleanups.push(() => observer.disconnect());
  }
  syncLoops();

  // The product image is never hidden behind a scan. Decode it before a single,
  // decorative pass; returning to the section does not replay that pass.
  const shot = document.querySelector<HTMLElement>(".app-shot");
  const image = shot?.querySelector<HTMLImageElement>("img");
  let shotVisible = false;
  let shotDecoded = false;
  let shotFinished = reduced();
  const scan = () => {
    if (disposed || shotFinished || !shotVisible || !shotDecoded || reduced() || document.hidden) return;
    shotFinished = true;
    shot?.classList.add("is-scanning");
  };
  if (shot && image) {
    const decode = () => image.decode().then(() => {
      shotDecoded = image.naturalWidth > 0;
      scan();
    }).catch(() => { /* A failed image never triggers a scan. */ });
    if (image.complete) void decode();
    else image.addEventListener("load", decode, { once: true, ...listen });
    shot.addEventListener("animationend", () => shot.classList.remove("is-scanning"), listen);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(([entry]) => { shotVisible = entry.isIntersecting; scan(); }, { threshold: 0.3 });
      observer.observe(shot);
      cleanups.push(() => observer.disconnect());
    } else { shotVisible = true; scan(); }
  }

  // A one-pixel observer band replaces per-scroll-frame geometry calculations.
  const header = document.querySelector<HTMLElement>("[data-header]");
  const sentinel = document.createElement("span");
  sentinel.className = "header-sentinel";
  sentinel.setAttribute("aria-hidden", "true");
  document.body.prepend(sentinel);
  const updateHeader = () => header?.classList.toggle("is-scrolled", sentinel.getBoundingClientRect().top < 0);
  updateHeader();
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(updateHeader);
    observer.observe(sentinel);
    cleanups.push(() => observer.disconnect());
  } else header?.classList.add("is-scrolled");
  cleanups.push(() => sentinel.remove());

  const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-lane-nav] a[href^='#']")];
  const sections = [...new Set(links.map((link) => document.getElementById(link.hash.slice(1))))].filter((el): el is HTMLElement => el !== null);
  let laneObserver: IntersectionObserver | undefined;
  const highlight = (id: string) => links.forEach((link) => {
    const active = link.hash === `#${id}`;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  const observeLanes = () => {
    laneObserver?.disconnect();
    const line = Math.floor(window.innerHeight * 0.45);
    highlight(sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= line && rect.bottom > line;
    })?.id ?? "");
    if (!("IntersectionObserver" in window)) return;
    const active = new Set<Element>();
    laneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) active.add(entry.target);
        else active.delete(entry.target);
      });
      highlight(sections.find((section) => active.has(section))?.id ?? "");
    }, { rootMargin: `-${line}px 0px -${Math.max(0, window.innerHeight - line - 1)}px 0px` });
    sections.forEach((section) => laneObserver?.observe(section));
  };
  observeLanes();
  cleanups.push(() => laneObserver?.disconnect());
  window.addEventListener("resize", () => { cancelTiles(); observeLanes(); }, listen);

  const bar = document.querySelector<HTMLElement>("[data-hw-filters]");
  const grid = document.querySelector<HTMLElement>(".hw-grid");
  const items = [...document.querySelectorAll<HTMLElement>(".hw-item[data-family]")];
  bar?.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button[data-filter]");
    if (!button || !bar.contains(button) || button.getAttribute("aria-pressed") === "true") return;
    // Capture visual positions before cancelling any in-flight transitions.
    const before = new Map(items.filter((item) => !item.hidden).map((item) => [item, { rect: item.getBoundingClientRect(), opacity: getComputedStyle(item).opacity }]));
    cancelTiles();
    const filter = button.dataset.filter;
    const shown = items.filter((item) => filter === "all" || item.dataset.family === filter);
    bar.querySelectorAll("button[data-filter]").forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
    grid?.setAttribute("data-filtered", "");
    items.forEach((item) => { item.hidden = !shown.includes(item); });
    shown.forEach((item) => item.classList.add("is-in"));
    const status = bar.querySelector<HTMLElement>("[data-hw-status]");
    if (status) status.textContent = `显示 ${shown.length} / ${items.length} 个项目`;
    if (reduced() || document.hidden || !("animate" in Element.prototype)) return;
    const after = new Map(shown.map((item) => [item, item.getBoundingClientRect()]));
    shown.forEach((item, index) => {
      const old = before.get(item);
      const rect = after.get(item)!;
      const from = old ? `translate(${old.rect.left - rect.left}px,${old.rect.top - rect.top}px)` : "translateY(10px)";
      const animation = item.animate([
        { transform: from, opacity: old?.opacity ?? 0 },
        { transform: "none", opacity: 1 },
      ], { duration: old ? 340 : 280, easing: "cubic-bezier(.2,.8,.2,1)", delay: old ? 0 : Math.min(index, 6) * 20, fill: "backwards" });
      tiles.set(item, animation);
      animation.onfinish = () => { if (tiles.get(item) === animation) tiles.delete(item); };
    });
  }, listen);

  document.addEventListener("visibilitychange", () => {
    syncLoops();
    if (document.hidden) { finishCounters(); cancelTiles(); }
    else scan();
  }, listen);
  preference.addEventListener("change", () => {
    if (reduced()) {
      revealAll();
      cancelTiles();
      shotFinished = true;
      shot?.classList.remove("is-scanning");
    }
    syncLoops();
  }, listen);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    events.abort();
    cleanups.forEach((cleanup) => cleanup());
    revealAll();
    cancelTiles();
    loops.forEach((el) => { el.dataset.loop = "paused"; });
    shot?.classList.remove("is-scanning");
  };
  window.addEventListener("pagehide", (event) => { if (!event.persisted) dispose(); }, listen);
  root.classList.add("motion-ready");
  return dispose;
}
