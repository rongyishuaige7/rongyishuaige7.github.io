import assert from "node:assert/strict";
import test from "node:test";

import { chipFamily, firstProseLine, hasCJK, isOwnedPublicHref, releaseFeedText, summarizeNpmDoc } from "../scripts/studio-semantics.mjs";

const now = Date.parse("2026-10-19T12:00:00.000Z");

test("chip families group board variants by their first platform token", () => {
  assert.deepEqual(chipFamily("ESP32-CAM × 4 · ESP32 · YOLOv8"), { family: "esp32", chip: "ESP32-CAM × 4" });
  assert.deepEqual(chipFamily("ESP32-C3 · Arduino · NimBLE"), { family: "esp32", chip: "ESP32-C3" });
  assert.deepEqual(chipFamily("STM32F103 · C · PlatformIO"), { family: "stm32", chip: "STM32F103" });
  assert.deepEqual(chipFamily("Raspberry Pi · Python · Flask"), { family: "rpi", chip: "Raspberry Pi" });
  assert.deepEqual(chipFamily("Arduino Uno · PlatformIO"), { family: "arduino", chip: "Arduino Uno" });
  assert.deepEqual(chipFamily(""), { family: "other", chip: "Board" });
});

test("npm summary counts versions published inside the last 30 days", () => {
  const doc = {
    "dist-tags": { latest: "0.4.3" },
    versions: { "0.1.0": {}, "0.4.2": {}, "0.4.3": {} },
    time: {
      created: "2026-07-01T00:00:00.000Z",
      "0.1.0": "2026-07-01T00:00:00.000Z",
      "0.4.2": "2026-10-01T00:00:00.000Z",
      "0.4.3": "2026-10-15T10:01:10.869Z"
    }
  };
  assert.deepEqual(summarizeNpmDoc(doc, now), {
    latest: "0.4.3",
    publishedAt: "2026-10-15T10:01:10.869Z",
    versionCount: 3,
    versionsLast30Days: 2
  });
});

test("npm summary fails closed without a dated latest version", () => {
  assert.equal(summarizeNpmDoc({ "dist-tags": { latest: "1.0.0" }, versions: {}, time: {} }, now), null);
  assert.equal(summarizeNpmDoc(null, now), null);
});

test("release text skips headings, tables and markup", () => {
  assert.equal(firstProseLine("# Title\n\n| a | b |\n- **索引保护**与 [转义](https://x)"), "索引保护与 转义");
  assert.equal(firstProseLine("## Only a heading"), null);
  assert.equal(firstProseLine("x".repeat(100), 10), `${"x".repeat(9)}…`);
});

test("release feed copy never ships truncated English", () => {
  const summaries = { "problem-solution-recorder-oss@v0.2.0": "加固 Markdown 原生排障档案。" };
  assert.equal(
    releaseFeedText({ repo: "some-repo", tag: "v1.0.0", body: "This release hardens the archive for safer use.", summaries }),
    "some-repo 发布 v1.0.0。"
  );
  assert.equal(
    releaseFeedText({ repo: "problem-solution-recorder-oss", tag: "v0.2.0", body: "This release hardens things.", summaries }),
    "加固 Markdown 原生排障档案。"
  );
  assert.equal(
    releaseFeedText({ repo: "some-repo", tag: "v2.0.0", body: "# 标题\n\n这次把索引写回，并补上验收。", summaries }),
    "这次把索引写回，并补上验收。"
  );
  assert.equal(releaseFeedText({ repo: "some-repo", tag: "v3.0.0", body: "", summaries }), "some-repo 发布 v3.0.0。");
});

test("hasCJK separates Chinese copy from English release bodies", () => {
  assert.equal(hasCJK("索引保护"), true);
  assert.equal(hasCJK("This release hardens"), false);
  assert.equal(hasCJK(undefined), false);
});

test("feed links must stay inside the owner's public GitHub or npm scope", () => {
  assert.equal(isOwnedPublicHref("https://github.com/rongyishuaige7/ningque/releases/tag/v1.0.0", "rongyishuaige7"), true);
  assert.equal(isOwnedPublicHref("https://www.npmjs.com/package/@rongyi7/dsh-stats", "rongyishuaige7"), true);
  assert.equal(isOwnedPublicHref("https://github.com/someone-else/repo", "rongyishuaige7"), false);
  assert.equal(isOwnedPublicHref(undefined, "rongyishuaige7"), false);
});
