// Unchanged-HEAD CI stays valid. Downloads expire; old snapshots get a separate warning.
const snapshotMaxAge = 12 * 3_600_000;

export function refreshTimeSensitiveSignals(root: ParentNode = document, now = Date.now()) {
  root.querySelectorAll<HTMLElement>("[data-artifact-status='available']").forEach((signal) => {
    const expiresAt = Date.parse(signal.dataset.artifactExpiresAt ?? "");
    if (Number.isFinite(expiresAt) && expiresAt > now) return;
    signal.dataset.artifactStatus = "expired";
    signal.classList.remove("pass");
    signal.classList.add("stale");
    signal.querySelector("i")?.classList.remove("ok");
    const label = signal.querySelector<HTMLElement>("[data-signal-label]");
    if (label) label.textContent = "固件构建产物已过期";
  });
  root.querySelectorAll<HTMLElement>("[data-snapshot-at]").forEach((warning) => {
    const capturedAt = Date.parse(warning.dataset.snapshotAt ?? "");
    warning.hidden = Number.isFinite(capturedAt) && now - capturedAt < snapshotMaxAge;
  });
}

export function initStatusFreshness() {
  let timer: ReturnType<typeof setTimeout>;
  const update = () => {
    clearTimeout(timer);
    refreshTimeSensitiveSignals();
    if (document.hidden) return;
    const now = Date.now();
    const deadlines = [
      ...[...document.querySelectorAll<HTMLElement>("[data-artifact-status='available']")].map((el) => Date.parse(el.dataset.artifactExpiresAt ?? "")),
      ...[...document.querySelectorAll<HTMLElement>("[data-snapshot-at]")].map((el) => Date.parse(el.dataset.snapshotAt ?? "") + snapshotMaxAge),
    ].filter((deadline) => Number.isFinite(deadline) && deadline > now);
    if (deadlines.length) timer = setTimeout(update, Math.min(3_600_000, Math.max(1, Math.min(...deadlines) - now)));
  };
  document.addEventListener("visibilitychange", update);
  window.addEventListener("pageshow", update);
  update();
  const dispose = () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", update);
    window.removeEventListener("pageshow", update);
    window.removeEventListener("pagehide", onPageHide);
  };
  const onPageHide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
  window.addEventListener("pagehide", onPageHide);
  return dispose;
}
