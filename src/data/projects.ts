import type { Lane } from "./build-log";

export type Project = {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  status?: string;
  tags: string[];
  href: string;
  caveat?: string;
};

export type ToolGroup = {
  label: string;
  note: string;
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
  eyebrow: "NOW BUILDING · 装在 U 盘里的随身 AI 工作台",
  summary: "长期资料、任务记录和主要产出保存在盘内；需要智能处理时主要调用云端模型。",
  status: "受控内测 · 正在完成上市前验证",
  tags: ["AI Agents", "Local-first", "Knowledge Governance", "Portable"],
  href: "https://github.com/rongyishuaige7/yipan-showcase",
  caveat: "Linux 测试最完整；Windows 与 macOS 仍在真机测试。"
};

export const dshUsage: Project = {
  slug: "dsh-stats",
  name: "DSH Usage",
  eyebrow: "DEEPSEEK HARNESS 插件 · NPM",
  summary: "按项目整理 DSH 会话：Token、开发时长、模型费用和账户余额一屏看清。无法确认价格时明确标记，不硬猜；密钥只在本机使用。",
  tags: ["TypeScript", "DSH Plugin", "Local-first", "CSV / JSON"],
  href: "https://github.com/rongyishuaige7/dsh-stats",
  caveat: "费用按公开 API 计价规则推算，最终以 Provider 账单为准。"
};

export const toolGroups: ToolGroup[] = [
  {
    label: "AGENT 工作流",
    note: "让 Agent 的工作有规格、有解释、有记录",
    tools: [
      {
        slug: "dsh-spec",
        name: "dsh-spec",
        eyebrow: "DSH PLUGIN · THREE SKILLS",
        summary: "规格驱动开发的 DSH 插件，含写规格、实现、验收三个技能：先写需求、设计和任务，再按规格实现与验收。",
        tags: ["DSH Plugin", "Spec", "npm"],
        href: "https://github.com/rongyishuaige7/dsh-spec"
      },
      {
        slug: "tech-mentor",
        name: "Tech Mentor",
        eyebrow: "AGENT SKILL · CODE WALKTHROUGH",
        summary: "把 AI 写好的代码讲透：架构意图、流转图、源码解剖和暗坑考查四阶带读。",
        tags: ["Agent Skill", "Antigravity", "Shell"],
        href: "https://github.com/rongyishuaige7/tech-mentor"
      },
      {
        slug: "problem-solution-recorder-oss",
        name: "Problem Solution Recorder",
        eyebrow: "AGENT SKILL · MARKDOWN MEMORY",
        summary: "把排障过程保存成可检索的 Markdown，同时生成人读索引和 AI 索引。",
        tags: ["Agent Skill", "Markdown", "Shell"],
        href: "https://github.com/rongyishuaige7/problem-solution-recorder-oss"
      },
      {
        slug: "ningque",
        name: "宁缺",
        eyebrow: "AI-LED EXPERIMENT · 审美公报",
        summary: "一份持续发布品味裁决的独立审美公报。产品由 Codex 独立构思、设计与开发；我负责审查、授权和发布渠道。",
        tags: ["Codex", "GitHub Pages", "Editorial"],
        href: "https://github.com/rongyishuaige7/ningque"
      }
    ]
  },
  {
    label: "桌面工具",
    note: "把机器上看不见的状态摆出来",
    tools: [
      {
        slug: "devflow-recorder",
        name: "DevFlow Recorder",
        eyebrow: "LOCAL ACTIVITY · GNOME WAYLAND",
        summary: "记录窗口焦点变化，整理成可回看的工作时间线；数据保存在本机。",
        tags: ["Rust", "Tauri", "SQLite"],
        href: "https://github.com/rongyishuaige7/devflow-recorder",
        caveat: "GNOME Wayland 是当前主路径。"
      },
      {
        slug: "memory-monitor",
        name: "Memory Monitor",
        eyebrow: "GNOME SHELL · PSI",
        summary: "状态栏颜色跟随 PSI 卡顿时间而不是占用率：机器真的变慢时才提醒，并列出 Swap 大户。",
        tags: ["GNOME Shell", "JavaScript", "Linux"],
        href: "https://github.com/rongyishuaige7/memory-monitor"
      },
      {
        slug: "pet-desktop-tauri",
        name: "Desktop Pet",
        eyebrow: "PLAYFUL EXPERIMENT · NATIVE WINDOW",
        summary: "Linux 桌面宠物原型：React 负责设置界面，Rust + GTK 负责透明置顶窗口。",
        tags: ["Tauri", "Rust", "GTK"],
        href: "https://github.com/rongyishuaige7/pet-desktop-tauri",
        caveat: "原生宠物窗口只支持 Linux。"
      }
    ]
  }
];

// Hardware tiles come from the Hardware Lab index at build time; these only shorten titles
// and choose the wide tiles. Repositories missing here fall back to the index name.
export const hardwareFeatured = ["ESP32_RPS_Game", "esp32-s3-multimodal-smart-pot", "adaptive-traffic-signal-system"];

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
