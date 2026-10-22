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
  // Reduced motion means: show final states, run nothing on its own.
  const still = () => preference.matches;
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
    if (still() || document.hidden) return;
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

  if (still() || !("IntersectionObserver" in window)) revealAll();
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
    el.dataset.loop = !document.hidden && !still() && visibleLoops.has(el) ? "running" : "paused";
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

  // Touch screens never hover, so each hero entry shows its hover preview once,
  // in sequence, when the entries first come into view. Desktop hover replays it.
  const entries = [...document.querySelectorAll<HTMLElement>(".project-entry")];
  const previewTimers: number[] = [];
  let previewed = false;
  const stopPreview = () => {
    previewTimers.splice(0).forEach((timer) => clearTimeout(timer));
    entries.forEach((entry) => entry.classList.remove("is-preview"));
  };
  const preview = () => {
    if (previewed || disposed || still() || document.hidden) return;
    previewed = true;
    entries.forEach((entry, index) => {
      const start = 700 + index * 260;
      previewTimers.push(window.setTimeout(() => entry.classList.add("is-preview"), start));
      previewTimers.push(window.setTimeout(() => entry.classList.remove("is-preview"), start + 1400));
    });
  };
  const map = document.querySelector<HTMLElement>(".project-map");
  let mapVisible = false;
  if (map && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      mapVisible = entry.isIntersecting;
      if (mapVisible) preview();
      if (previewed) observer.disconnect();
    }, { threshold: 0.6 });
    observer.observe(map);
    cleanups.push(() => observer.disconnect());
  }

  // DSH screenshots rotate only while visible and moving is allowed. Hover and focus hold
  // the timer; choosing a tab or pressing pause stops rotation until the visitor resumes it.
  const shots = document.querySelector<HTMLElement>("[data-shots]");
  const shotButtons = [...(shots?.querySelectorAll<HTMLButtonElement>("button[data-shot]") ?? [])];
  const slides = [...(shots?.querySelectorAll<HTMLElement>("[data-slide]") ?? [])];
  const rotateButton = shots?.querySelector<HTMLButtonElement>("[data-shot-rotate]");
  let rotationStopped = false;
  const showShot = (key: string) => {
    shotButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.shot === key)));
    slides.forEach((slide) => {
      if (slide.dataset.slide === key) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
  };
  const syncRotation = () => {
    if (!shots) return;
    const rotating = !rotationStopped && !still();
    shots.classList.toggle("is-rotating", rotating);
    if (rotateButton) {
      rotateButton.hidden = still();
      rotateButton.setAttribute("aria-pressed", String(rotationStopped));
      const label = rotationStopped ? "继续截图轮换" : "暂停截图轮换";
      rotateButton.title = label;
      rotateButton.querySelector(".visually-hidden")!.textContent = label;
    }
  };
  if (shots && shotButtons.length > 1) {
    // The active tab's underline animation is the timer; [data-loop] pauses it offscreen.
    shots.addEventListener("animationend", (event) => {
      if (event.animationName !== "shotTimer" || !shots.classList.contains("is-rotating")) return;
      const index = shotButtons.findIndex((button) => button.getAttribute("aria-pressed") === "true");
      showShot(shotButtons[(index + 1) % shotButtons.length].dataset.shot!);
    }, listen);
    shotButtons.forEach((button) => button.addEventListener("click", () => {
      rotationStopped = true;
      showShot(button.dataset.shot!);
      syncRotation();
    }, listen));
    rotateButton?.addEventListener("click", () => {
      rotationStopped = !rotationStopped;
      syncRotation();
    }, listen);
    syncRotation();
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
  // Phones show the first nine tiles of the current filter; one button reveals the rest.
  // Without scripts, or once expanded, every tile stays in the list.
  const phone = window.matchMedia("(max-width: 760px)");
  const more = document.querySelector<HTMLButtonElement>("[data-hw-more]");
  let expanded = false;
  const fold = () => {
    const limit = phone.matches && !expanded ? 9 : Infinity;
    const shown = items.filter((item) => !item.hidden);
    shown.forEach((item, index) => item.classList.toggle("is-folded", index >= limit));
    items.filter((item) => item.hidden).forEach((item) => item.classList.remove("is-folded"));
    const rest = Math.max(0, shown.length - limit);
    if (more) {
      more.hidden = rest === 0;
      more.textContent = `展开其余 ${rest} 个项目`;
    }
  };
  more?.addEventListener("click", () => {
    const first = items.find((item) => item.classList.contains("is-folded"));
    expanded = true;
    fold();
    items.forEach((item) => { if (!item.hidden) item.classList.add("is-in"); });
    // The button disappears, so keyboard focus moves to the first revealed project.
    first?.querySelector<HTMLAnchorElement>("h3 a")?.focus();
  }, listen);
  phone.addEventListener("change", fold, listen);
  fold();
  // Folding happens after first paint; keep a deep link below the list on target.
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (target && grid && grid.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) target.scrollIntoView({ behavior: "instant" });
  bar?.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button[data-filter]");
    if (!button || !bar.contains(button) || button.getAttribute("aria-pressed") === "true") return;
    // Capture visual positions before cancelling any in-flight transitions.
    const before = new Map(items.filter((item) => !item.hidden && !item.classList.contains("is-folded")).map((item) => [item, { rect: item.getBoundingClientRect(), opacity: getComputedStyle(item).opacity }]));
    cancelTiles();
    const filter = button.dataset.filter;
    const shown = items.filter((item) => filter === "all" || item.dataset.family === filter);
    bar.querySelectorAll("button[data-filter]").forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
    grid?.setAttribute("data-filtered", "");
    items.forEach((item) => { item.hidden = !shown.includes(item); });
    fold();
    shown.forEach((item) => item.classList.add("is-in"));
    const status = bar.querySelector<HTMLElement>("[data-hw-status]");
    if (status) status.textContent = `显示 ${shown.length} / ${items.length} 个项目`;
    if (still() || document.hidden || !("animate" in Element.prototype)) return;
    const visible = shown.filter((item) => !item.classList.contains("is-folded"));
    const after = new Map(visible.map((item) => [item, item.getBoundingClientRect()]));
    visible.forEach((item, index) => {
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
    if (document.hidden) { finishCounters(); cancelTiles(); stopPreview(); }
    else if (mapVisible) preview();
  }, listen);
  preference.addEventListener("change", () => {
    if (still()) {
      revealAll();
      cancelTiles();
      stopPreview();
    }
    syncLoops();
    syncRotation();
  }, listen);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    events.abort();
    cleanups.forEach((cleanup) => cleanup());
    revealAll();
    cancelTiles();
    stopPreview();
    loops.forEach((el) => { el.dataset.loop = "paused"; });
    shots?.classList.remove("is-rotating");
  };
  window.addEventListener("pagehide", (event) => { if (!event.persisted) dispose(); }, listen);
  root.classList.add("motion-ready");
  return dispose;
}
