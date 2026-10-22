import { SCENES, type Scene } from "./particle-scenes";

export const SECTION_EVENT = "rongyi:sectionchange";

export function initSectionState() {
  const sections = [...document.querySelectorAll<HTMLElement>("main > section[id]")].filter(section => SCENES.includes(section.id as Scene));
  if (!sections.length) return;
  const events = new AbortController();
  const listen = { signal: events.signal };
  let observer: IntersectionObserver | undefined;
  let pending = 0;
  let active = true;
  let disposed = false;
  let dirty = true;
  let positions: Array<{ id: string; top: number }> = [];
  const update = () => {
    if (!active || disposed) return;
    if (dirty) {
      positions = sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top + window.scrollY }));
      dirty = false;
    }
    const line = window.scrollY + Math.floor(window.innerHeight * 0.45);
    let id = sections[0].id;
    for (const section of positions) {
      if (section.top > line) break;
      id = section.id;
    }
    if (document.documentElement.dataset.section === id) return;
    document.documentElement.dataset.section = id;
    document.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: { id } }));
  };
  const schedule = () => {
    if (pending || !active || disposed) return;
    pending = requestAnimationFrame(() => { pending = 0; update(); });
  };
  const observe = () => {
    dirty = true;
    observer?.disconnect();
    if ("IntersectionObserver" in window) {
      const line = Math.floor(window.innerHeight * 0.45);
      observer = new IntersectionObserver(update, { rootMargin: `-${line}px 0px -${Math.max(0, window.innerHeight - line - 1)}px 0px` });
      sections.forEach(section => observer!.observe(section));
    }
    update();
  };
  const resize = new ResizeObserver(() => { dirty = true; schedule(); });
  sections.forEach(section => resize.observe(section));
  // A scheduled scroll check also handles jumping completely over the observer band.
  window.addEventListener("scroll", schedule, { ...listen, passive: true });
  window.addEventListener("resize", observe, { ...listen, passive: true });
  window.addEventListener("pageshow", () => { active = true; observe(); }, listen);
  const dispose = () => {
    if (disposed) return;
    disposed = true; active = false;
    events.abort(); observer?.disconnect(); resize.disconnect();
    cancelAnimationFrame(pending);
  };
  window.addEventListener("pagehide", event => {
    active = false; cancelAnimationFrame(pending); pending = 0;
    if (!event.persisted) dispose();
  }, listen);
  observe();
  return dispose;
}
