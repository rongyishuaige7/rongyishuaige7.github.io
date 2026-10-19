/**
 * Pure rules for the studio data collected at build time (npm, Hardware Lab, update feed).
 * Every helper accepts `nowMs` where time matters so tests stay deterministic.
 */
export function chipFamily(platform) {
  const chip = String(platform ?? "").split(" · ")[0].trim();
  if (/^ESP32/i.test(chip)) return { family: "esp32", chip };
  if (/^STM32/i.test(chip)) return { family: "stm32", chip };
  if (/raspberry pi/i.test(chip)) return { family: "rpi", chip };
  if (/arduino/i.test(chip)) return { family: "arduino", chip };
  return { family: "other", chip: chip || "Board" };
}

export function summarizeNpmDoc(doc, nowMs = Date.now()) {
  const latest = doc?.["dist-tags"]?.latest;
  const time = doc?.time ?? {};
  if (!latest || !Number.isFinite(Date.parse(time[latest])) || !Number.isFinite(nowMs)) return null;

  const versions = Object.keys(doc.versions ?? {});
  const cutoff = nowMs - 30 * 86_400_000;
  return {
    latest,
    publishedAt: time[latest],
    versionCount: versions.length,
    versionsLast30Days: versions.filter((version) => Date.parse(time[version]) > cutoff).length
  };
}

export function firstProseLine(markdown, max = 72) {
  for (const raw of String(markdown ?? "").split(/\r?\n/)) {
    if (/^\s*(#|\||<|```)/.test(raw)) continue;
    const line = raw
      .replace(/^[\s>*-]+/, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[`*_]/g, "")
      .trim();
    if (line.length < 4) continue;
    return line.length > max ? `${line.slice(0, max - 1)}…` : line;
  }
  return null;
}

export function isOwnedPublicHref(href, owner) {
  return (
    typeof href === "string" &&
    (href.startsWith(`https://github.com/${owner}/`) || href.startsWith(`https://www.npmjs.com/package/@rongyi7/`))
  );
}
