// Hand-written entries only. Releases, npm versions and the Hardware Lab index are
// collected at build time into `studio.json` and merged with these on the page.
export type Lane = "carry" | "see" | "touch";

export type ManualUpdate = {
  date: string;
  lane: Lane;
  type: string;
  title: string;
  text: string;
  href: string;
};

export const manualUpdates: ManualUpdate[] = [
  {
    date: "2026-07-14",
    lane: "carry",
    type: "RETRO",
    title: "从功能集合到可交付产品",
    text: "Yi盘开发复盘：如何从功能集合走到可测试、可发布的产品。",
    href: "https://github.com/rongyishuaige7/yipan-showcase/blob/main/docs/%E5%BC%80%E5%8F%91%E5%A4%8D%E7%9B%98-%E4%BB%8E%E5%8A%9F%E8%83%BD%E9%9B%86%E5%90%88%E5%88%B0%E5%8F%AF%E4%BA%A4%E4%BB%98%E4%BA%A7%E5%93%81.md"
  }
];
