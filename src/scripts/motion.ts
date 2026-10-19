// Page motion. Content stays readable without this module: `.js` hides reveal targets
// only after the inline head script runs, and that script removes `.js` again if this
// module never reports `motion-ready`.
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initMotion() {
  const root = document.documentElement;
  revealOnScroll();
  pauseOffscreenLoops();
  trackHeader();
  trackActiveLane();
  initHardwareFilters();
  root.classList.add("motion-ready");
}

function revealOnScroll() {
  const targets = document.querySelectorAll<HTMLElement>(".reveal, [data-reveal]");
  if (reducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => el.classList.add("is-counted"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add("is-in");
        el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
        observer.unobserve(el);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  targets.forEach((el) => observer.observe(el));
}

function pauseOffscreenLoops() {
  const loops = document.querySelectorAll<HTMLElement>("[data-loop]");
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) (entry.target as HTMLElement).dataset.loop = entry.isIntersecting ? "running" : "paused";
  });
  loops.forEach((el) => observer.observe(el));
}

const numberFormat = new Intl.NumberFormat("zh-CN");

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target) || el.classList.contains("is-counted")) return;
  el.classList.add("is-counted");
  const start = performance.now();
  const duration = 1100;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = numberFormat.format(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function trackHeader() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const progress = document.querySelector<HTMLElement>("[data-progress]");
  let queued = false;
  const update = () => {
    queued = false;
    const y = window.scrollY;
    header?.classList.toggle("is-scrolled", y > 40);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
    }
  };
  update();
  window.addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
}

function trackActiveLane() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-lane-nav] a[href^='#']")];
  const ids = [...new Set(links.map((link) => link.hash.slice(1)))];
  const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
  if (sections.length === 0) return;
  let queued = false;
  // One lane at a time: whichever section crosses the 45% line owns the
  // highlight, so overlapping sections can never light two links at once.
  const update = () => {
    queued = false;
    const line = window.innerHeight * 0.45;
    const current =
      sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= line && rect.bottom > line;
      })?.id ?? "";
    for (const link of links) {
      const active = link.hash === `#${current}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

function initHardwareFilters() {
  const bar = document.querySelector<HTMLElement>("[data-hw-filters]");
  if (!bar) return;
  const buttons = [...bar.querySelectorAll<HTMLButtonElement>("button[data-filter]")];
  const items = [...document.querySelectorAll<HTMLElement>("[data-family]")];
  const status = bar.querySelector<HTMLElement>("[data-hw-status]");
  const animate = !reducedMotion();

  bar.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-filter]");
    if (!button || button.getAttribute("aria-pressed") === "true") return;
    const filter = button.dataset.filter ?? "all";
    buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));

    const shown = items.filter((item) => filter === "all" || item.dataset.family === filter);
    items.forEach((item) => {
      item.hidden = !shown.includes(item);
      item.classList.remove("is-flash");
    });
    if (animate) {
      void bar.offsetWidth; // restart the entrance animation for every visible tile at once
      shown.forEach((item, index) => {
        item.style.setProperty("--fd", `${Math.min(index, 10) * 0.035}s`);
        item.classList.add("is-flash");
      });
    }
    if (status) status.textContent = `显示 ${shown.length} / ${items.length} 个项目`;
  });
}
