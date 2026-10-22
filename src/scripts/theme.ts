// The theme is a visitor choice first and a system preference second. The inline head
// script settles it before paint; this module owns the switch, its memory and the reveal.
const STORAGE_KEY = "rongyi-theme";
const LIGHT = "light";
const DARK = "dark";
type Theme = typeof LIGHT | typeof DARK;

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

const root = document.documentElement;
const systemLight = window.matchMedia("(prefers-color-scheme: light)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === LIGHT || value === DARK ? value : null;
  } catch {
    return null;
  }
}

function current(): Theme {
  return root.dataset.theme === LIGHT ? LIGHT : DARK;
}

export function initTheme() {
  const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!button) return;

  const sync = () => {
    const label = current() === LIGHT ? "切换到深色模式" : "切换到浅色模式";
    button.title = label;
    button.querySelector(".visually-hidden")!.textContent = label;
  };

  const commit = (theme: Theme) => {
    root.dataset.theme = theme;
    if (meta) meta.content = theme === LIGHT ? "#f4f6f9" : "#07090d";
    sync();
    document.dispatchEvent(new CustomEvent("rongyi:themechange", { detail: { theme } }));
  };
  // A blocked-storage start leaves no attribute behind; follow the system rather than pin dark.
  if (!root.dataset.theme) commit(systemLight.matches ? LIGHT : DARK);

  const switchTo = (theme: Theme, animate: boolean) => {
    const viewTransition = (document as ViewTransitionDocument).startViewTransition;
    if (!animate || reduceMotion.matches || !viewTransition) {
      commit(theme);
      return;
    }
    // The reveal opens at the switch, so the new palette reads as coming from the control.
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-r", `${Math.ceil(radius)}px`);
    viewTransition.call(document, () => commit(theme));
  };

  button.addEventListener("click", () => {
    const next = current() === LIGHT ? DARK : LIGHT;
    switchTo(next, true);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* The choice still applies to this page view. */ }
  });

  // Only an explicit choice is persisted; until then the page keeps following the system.
  systemLight.addEventListener("change", () => {
    if (stored()) return;
    commit(systemLight.matches ? LIGHT : DARK);
  });

  sync();
}
