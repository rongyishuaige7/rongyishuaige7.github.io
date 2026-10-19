/**
 * Curated Chinese one-liners for releases whose GitHub body is not Chinese.
 * The feed is a Chinese page, so a raw English body would either read out of
 * place or get cut mid-word by `firstProseLine`. Keys are `<repo>@<tag>`; a
 * release without an entry falls back to `releaseFeedText`'s template line.
 */
export const releaseSummaries = {
  "problem-solution-recorder-oss@v0.2.0":
    "加固 Markdown 原生排障档案：保留手写笔记、转义表格单元格，并加入知识库泄露密钥扫描。"
};
