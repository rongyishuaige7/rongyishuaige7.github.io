export type Project = {
  slug: string;
  index: string;
  name: string;
  eyebrow: string;
  summary: string;
  status: string;
  statusTone: "active" | "released" | "verified";
  tags: string[];
  href: string;
  featured?: boolean;
  caveat?: string;
};

export const projects: Project[] = [
  {
    slug: "yipan",
    index: "01",
    name: "Yi盘",
    eyebrow: "NOW BUILDING · PORTABLE AI AGENT WORKSPACE",
    summary: "把长期资料、任务和主要产出放在盘内，让多个受管 AI Agent 围绕同一份长期知识继续工作。",
    status: "受控内测 · 发布门禁收口",
    statusTone: "active",
    tags: ["AI Agents", "Local-first", "Knowledge Governance", "Portable"],
    href: "https://github.com/rongyishuaige7/yipan-showcase",
    featured: true,
    caveat: "Linux 证据最完整；Windows 与 macOS 仍在继续真机验证。"
  },
  {
    slug: "problem-solution-recorder-oss",
    index: "02",
    name: "Problem Solution Recorder",
    eyebrow: "AGENT SKILL · MARKDOWN MEMORY",
    summary: "面向 AI 工具的 Markdown 问题解决记忆：保留排障证据、维护人类与 AI 双索引，并沉淀可复用模式。",
    status: "MIT · 可查看 Release 与 CI",
    statusTone: "released",
    tags: ["Agent Skill", "Markdown", "Shell", "Knowledge Base"],
    href: "https://github.com/rongyishuaige7/problem-solution-recorder-oss"
  },
  {
    slug: "devflow-recorder",
    index: "03",
    name: "DevFlow Recorder",
    eyebrow: "LOCAL ACTIVITY · LINUX DESKTOP",
    summary: "面向 Linux 开发者的本地优先活动记录器，把 Wayland 窗口焦点变化整理成可回顾时间线并保存在本地。",
    status: "MVP · GNOME Wayland",
    statusTone: "verified",
    tags: ["Rust", "Tauri", "React", "SQLite", "Wayland"],
    href: "https://github.com/rongyishuaige7/devflow-recorder",
    caveat: "GNOME Wayland 是当前主路径；其他桌面环境仍是有限支持。"
  },
  {
    slug: "ESP32_RPS_Game",
    index: "04",
    name: "ESP32 RPS Game",
    eyebrow: "EMBEDDED · COMPUTER VISION",
    summary: "基于 ESP32-S3 的视觉猜拳游戏：摄像头启发式手势识别，配合 OLED、音频、RGB 反馈与可选 MJPEG 推流。",
    status: "Firmware CI · Artifact 状态可查",
    statusTone: "verified",
    tags: ["C++", "PlatformIO", "ESP32-S3", "OV3660"],
    href: "https://github.com/rongyishuaige7/ESP32_RPS_Game",
    caveat: "CI 证明配置的固件可以构建，不代表所有板型与环境均已真机验收。"
  },
  {
    slug: "pet-desktop-tauri",
    index: "05",
    name: "Desktop Pet",
    eyebrow: "PLAYFUL EXPERIMENT · NATIVE WINDOW",
    summary: "Linux 桌面宠物原型：React 管理界面配合 Rust + GTK 原生透明置顶窗口，播放本地六组动作帧。",
    status: "Linux prototype",
    statusTone: "verified",
    tags: ["Tauri", "React", "Rust", "GTK", "Local-first"],
    href: "https://github.com/rongyishuaige7/pet-desktop-tauri",
    caveat: "当前原生宠物窗口只支持 Linux。"
  }
];
