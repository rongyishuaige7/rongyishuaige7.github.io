// CI evidence is tied to the current default-branch HEAD at build time, so it does not
// expire in the browser. Artifact downloads do expire, so their labels are re-checked here.
export function refreshTimeSensitiveSignals(root: ParentNode = document, now = Date.now()) {
  root.querySelectorAll<HTMLElement>("[data-artifact-status='available']").forEach((signal) => {
    const expiresAt = Date.parse(signal.dataset.artifactExpiresAt ?? "");
    if (Number.isFinite(expiresAt) && expiresAt > now) return;
    markStale(signal, "固件构建产物已过期");
  });
}

function markStale(signal: HTMLElement, labelText: string) {
  signal.classList.remove("pass");
  signal.classList.add("stale");
  const label = signal.querySelector<HTMLElement>("[data-signal-label]");
  if (label) label.textContent = labelText;
}
