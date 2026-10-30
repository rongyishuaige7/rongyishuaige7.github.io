import type { Lane } from "./build-log";

export type Project = {
  slug: string;
  name: string;
  summary: string;
  status?: string;
  tags: string[];
  href: string;
  caveat?: string;
};

export type ToolGroup = {
  label: string;
  tools: Project[];
};

export const laneMeta: Record<Lane, { index: string; short: string; word: string; label: string; href: string }> = {
  carry: { index: "01", short: "Yi盘", word: "随身", label: "CARRY", href: "#carry" },
  see: { index: "02", short: "工具", word: "可见", label: "SEE", href: "#see" },
  touch: { index: "03", short: "硬件", word: "可触", label: "TOUCH", href: "#touch" }
};

export const yipan: Project = {
  slug: "yipan-showcase",
  name: "Yi盘",
  summary: "资料、任务记录和产出保存在盘内，智能处理主要调用云端模型。",
  status: "受控内测",
  tags: ["U 盘存储", "云端模型"],
  href: "https://github.com/rongyishuaige7/yipan-showcase",
  caveat: "Linux 测试最完整；Windows 与 macOS 仍在真机测试。"
};

export const dshUsage: Project = {
  slug: "dsh-stats",
  name: "DSH Usage",
  summary: "按项目统计 DSH 会话的 Token、时长、费用和余额。未知价格会标出，密钥仅在本机使用。",
  tags: ["DSH Plugin", "CSV / JSON"],
  href: "https://github.com/rongyishuaige7/dsh-stats",
  caveat: "费用按公开 API 计价规则推算，最终以 Provider 账单为准。"
};

export const toolGroups: ToolGroup[] = [
  {
    label: "AGENT 工作流",
    tools: [
      {
        slug: "dsh-spec",
        name: "dsh-spec",
        summary: "DSH 插件：编写需求与设计、按规格实现、验收。",
        tags: ["DSH Plugin", "Spec", "npm"],
        href: "https://github.com/rongyishuaige7/dsh-spec"
      },
      {
        slug: "tech-mentor-studio",
        name: "Tech Mentor Studio",
        summary: "本地工作台：读仓库、提交和未提交改动，按架构意图、流转图、源码解剖和暗坑四个阶段带读。",
        tags: ["Node.js", "Express", "Local-first"],
        href: "https://github.com/rongyishuaige7/tech-mentor-studio",
        caveat: "只在本机运行，需要自备模型代理。"
      },
      {
        slug: "problem-solution-recorder-oss",
        name: "Problem Solution Recorder",
        summary: "将排障过程保存为 Markdown，供人和 Agent 检索。",
        tags: ["Agent Skill", "Markdown", "Shell"],
        href: "https://github.com/rongyishuaige7/problem-solution-recorder-oss"
      },
      {
        slug: "ningque",
        name: "宁缺",
        summary: "由 Codex 构思、设计与开发的审美公报；我负责审查、授权和发布。",
        tags: ["Codex", "GitHub Pages", "Editorial"],
        href: "https://github.com/rongyishuaige7/ningque"
      }
    ]
  },
  {
    label: "桌面工具",
    tools: [
      {
        slug: "devflow-recorder",
        name: "DevFlow Recorder",
        summary: "记录窗口焦点，生成本地工作时间线。",
        tags: ["Rust", "Tauri", "SQLite"],
        href: "https://github.com/rongyishuaige7/devflow-recorder",
        caveat: "GNOME Wayland 是当前主路径。"
      },
      {
        slug: "macos-memory-monitor",
        name: "Memory Monitor",
        summary: "菜单栏常驻的内存状态解释器：把进程折叠成可解释的工作组，记录 24 小时历史，并以审计方式执行受保护的进程操作。",
        tags: ["Swift", "SwiftUI", "macOS"],
        href: "https://github.com/rongyishuaige7/macos-memory-monitor"
      },
      {
        slug: "pet-desktop-tauri",
        name: "Desktop Pet",
        summary: "Linux / macOS 桌面宠物：Tauri + Rust 原生窗口，内置奶蛙六动作帧包。",
        tags: ["Tauri", "Rust", "AppKit", "GTK"],
        href: "https://github.com/rongyishuaige7/pet-desktop-tauri",
        caveat: "Windows 暂无原生宠物窗口；macOS 构建尚未公证。"
      }
    ]
  }
];

// Tool thumbnails are copies of each repository's own public screenshot or share image (see README).
// Tools missing here have no public screenshot and keep a text-only row.
export const toolShots: Record<string, { alt: string; label: string; fit?: "contain"; position?: string }> = {
  ningque: { alt: "宁缺第 001 号判词分享图：正文的骨头，正式承认 Source Han Sans SC 2.005R", label: "001 号判词分享图", fit: "contain" },
  "devflow-recorder": { alt: "DevFlow Recorder 浏览器预览界面：今天的开发轨迹与活动时间线，条目标注为示例数据", label: "浏览器预览 · 示例数据", position: "0 0" },
  "pet-desktop-tauri": { alt: "Desktop Pet 陪伴页：三维小奶蛙站在动作预览区，页面标注为网页演示模式", label: "浏览器预览 · 内置奶蛙帧包" },
  "problem-solution-recorder-oss": { alt: "Problem Solution Recorder 看板：左侧筛选、中间记录列表、右侧记录详情，展示 7 条虚构示例记录", label: "看板 · 示例数据" },
  "macos-memory-monitor": { alt: "Memory Monitor 主窗口内存状态页：75% 使用率仪表、最近一小时趋势，以及可用内存、系统保留、已压缩、磁盘交换四项读数", label: "主窗口 · 演示数据" },
  "tech-mentor-studio": { alt: "Tech Mentor Studio 工作台：左栏项目文件树，中栏带行号的 Python 源码，右栏全景带读回答与分层架构图", label: "真实运行界面" }
};

// Hardware tiles come from the Hardware Lab index at build time; these only shorten titles
// and choose the wide tiles. Repositories missing here fall back to the index name.
// Wide tiles need a public prototype photo, so ESP32_RPS_Game (schematic only) stays a normal tile.
export const hardwareFeatured = ["esp32-s3-multimodal-smart-pot", "adaptive-traffic-signal-system", "esp32-s3-health-voice-terminal"];

// Prototype photos copied from each repository's public assets/photos, resized to 1200px with
// metadata removed. Dates follow the Hardware Lab media_scope; null means the index gives none.
// Missing slugs have no public prototype photo and render an explicit placeholder.
export const hardwarePhotos: Record<string, { date: string | null; position?: string }> = {
  "esp32-s3-multimodal-smart-pot": { date: null },
  "stm32-multisensor-data-acquisition": { date: "2026-05-02" },
  "lora-warehouse-tracking-system": { date: "2026-04-08" },
  "adaptive-traffic-signal-system": { date: "2026-05-14" },
  "esp32-s3-health-voice-terminal": { date: "2026-04-26" },
  "raspberry-pi-rfid-room-card-system": { date: "2026-04-08" },
  "stm32-touch-gesture-control-system": { date: "2026-04-02" },
  "esp32-smart-alarm-clock": { date: "2026-04-06" },
  "esp32-smart-pillbox": { date: "2026-04-08" },
  "esp32-weather-clock": { date: "2026-03-28", position: "50% 60%" },
  "esp32-baby-monitor": { date: "2026-04-08" },
  "esp32-beehive-monitor": { date: null },
  "esp32-smart-makeup-cabinet": { date: "2026-04-08" },
  "esp32-c3-smart-band": { date: "2026-04-29" },
  "arduino-multisensor-audio-demo": { date: null },
  "esp32-s3-smart-agriculture-monitoring-system": { date: "2026-03-24", position: "50% 55%" },
  "stm32f103-wardrobe-environment-monitoring-ventilation-system": { date: "2026-05-25" },
  "raspberry-pi-home-environment-activity-monitoring-demo": { date: "2026-03-17" }
};

// Three photos with different boards and colors for the hero entry card.
export const hardwareHeroDeck = ["esp32-weather-clock", "adaptive-traffic-signal-system", "esp32-c3-smart-band"];

export const hardwareShortNames: Record<string, string> = {
  ESP32_RPS_Game: "视觉猜拳游戏",
  "esp32-s3-multimodal-smart-pot": "多模态智能花盆",
  "stm32-multisensor-data-acquisition": "多传感器数据采集",
  "lora-warehouse-tracking-system": "LoRa 仓库物品追踪",
  "adaptive-traffic-signal-system": "车流自适应交通信号",
  "esp32-s3-health-voice-terminal": "健康科普语音终端",
  "raspberry-pi-rfid-room-card-system": "RFID 房卡管理",
  "stm32-touch-gesture-control-system": "触摸与隔空手势控制",
  "esp32-smart-alarm-clock": "智能闹钟",
  "esp32-smart-pillbox": "智能药盒",
  "esp32-weather-clock": "天气时钟",
  "esp32-s3-smart-safety-monitor": "多传感器安全监测",
  "raspberry-pi-weather-station": "小型气象站",
  "esp32-baby-monitor": "婴儿状态监测",
  "esp32-beehive-monitor": "蜂箱数据采集",
  "esp32-smart-light-controller": "多路智能照明",
  "esp32-smart-makeup-cabinet": "智能化妆品收纳",
  "esp32-c3-smart-band": "多传感器手环",
  "arduino-multisensor-audio-demo": "多传感器音频联动",
  "esp32-s3-smart-agriculture-monitoring-system": "智能农业环境监测",
  "stm32f103-wardrobe-environment-monitoring-ventilation-system": "衣柜环境监测与通风",
  "raspberry-pi-home-environment-activity-monitoring-demo": "居家环境与活动监测"
};

export const hardwareFamilies = [
  { key: "esp32", label: "ESP32" },
  { key: "stm32", label: "STM32" },
  { key: "rpi", label: "树莓派" },
  { key: "arduino", label: "Arduino" }
] as const;
