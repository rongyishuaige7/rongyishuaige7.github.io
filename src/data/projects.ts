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
    eyebrow: "NOW BUILDING · 装在 U 盘里的随身 AI 工作台",
    summary: "长期资料、任务记录和主要产出保存在盘内；需要智能处理时主要调用云端模型。",
    status: "受控内测 · 正在完成上市前验证",
    statusTone: "active",
    tags: ["AI Agents", "Local-first", "Knowledge Governance", "Portable"],
    href: "https://github.com/rongyishuaige7/yipan-showcase",
    featured: true,
    caveat: "Linux 测试最完整；Windows 与 macOS 仍在真机测试。"
  },
  {
    slug: "problem-solution-recorder-oss",
    index: "02",
    name: "Problem Solution Recorder",
    eyebrow: "AGENT SKILL · MARKDOWN MEMORY",
    summary: "把排障过程保存成可检索的 Markdown：记录症状、命令、原因和修复方法，同时生成人读索引和 AI 索引。",
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
    summary: "在 Linux/Wayland 上记录窗口焦点变化，并整理成便于回看的工作时间线；数据保存在本机。",
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
    summary: "一个 Linux 桌面宠物原型。React 负责设置界面，Rust + GTK 负责透明置顶窗口和本地动画。",
    status: "Linux prototype",
    statusTone: "verified",
    tags: ["Tauri", "React", "Rust", "GTK", "Local-first"],
    href: "https://github.com/rongyishuaige7/pet-desktop-tauri",
    caveat: "当前原生宠物窗口只支持 Linux。"
  }
];
