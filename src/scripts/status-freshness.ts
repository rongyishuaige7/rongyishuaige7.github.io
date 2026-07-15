const staleAfterHours = 48;

export function refreshTimeSensitiveSignals(root: ParentNode = document, now = Date.now()) {
  root.querySelectorAll<HTMLElement>("[data-ci-status='completed'][data-ci-run-at]").forEach((signal) => {
    const runAt = Date.parse(signal.dataset.ciRunAt ?? "");
    if (Number.isFinite(runAt) && now - runAt <= staleAfterHours * 3_600_000) return;
    markStale(signal, "CI evidence is stale");
  });

  root.querySelectorAll<HTMLElement>("[data-artifact-status='available']").forEach((signal) => {
    const expiresAt = Date.parse(signal.dataset.artifactExpiresAt ?? "");
    if (Number.isFinite(expiresAt) && expiresAt > now) return;
    markStale(signal, "Firmware Artifact expired");
  });
}

function markStale(signal: HTMLElement, labelText: string) {
  signal.classList.remove("pass");
  signal.classList.add("stale");
  const label = signal.querySelector<HTMLElement>("[data-signal-label]");
  if (label) label.textContent = labelText;
}
