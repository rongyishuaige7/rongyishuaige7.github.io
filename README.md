# Rongyi Studio

Rongyi 的个人主页，按三条线展示公开项目：随身（Yi盘）、可见（Agent 工具）、可触（硬件原型），以及对应的 GitHub 与 npm 记录。

- 线上地址：<https://rongyishuaige7.github.io>
- 技术栈：Astro 静态站、原生 CSS、构建时 GitHub API
- 动态信号：每次部署从公开 GitHub API 生成 `src/data/github-status.json`，并从 GitHub 与 npm registry 生成 `src/data/studio.json`（npm 版本与下载量、Hardware Lab 索引、自动更新流）；只采用 `/users/rongyishuaige7/repos` 列出的公开仓库
- 状态口径：只对指定工作流、当前默认分支 HEAD 和未过期 Artifact 显示绿色证据

## 本地开发

需要 Node.js 22.22.0 或更高版本。

```bash
npm ci
npm run status
npm run status:check
npm run check
npm run build:refresh
npm run dev
```

粒子浏览器回归使用已运行的本地开发或预览服务：`npm run test:particles`。默认地址为 `http://127.0.0.1:4321/`，可用 `SITE_URL` 指定；macOS 默认使用已安装的 Google Chrome，其他环境可设置 `CHROMIUM_PATH` 或运行 `npx playwright-core install chromium`。截图与结果写入新建的临时目录。

## 内容范围

- Yi盘当前处于受控内测，正在完成上市前验证；CI 不代表三个系统都已完成真机测试。
- Yi盘真实截图将在获得真实产品素材后补充；当前页面使用明确标注的功能示意图。首屏工作室图同样是示意图，不代表真实数据。Yi盘章节的结构示意按 `yipan-showcase` README 与个人主页流程图绘制：盘内资料与任务、工作台、产出与任务记录在盘内闭环，云端模型只按需推理。
- 主题：默认跟随系统，页头开关在深色与浅色之间切换，选择记在 `localStorage` 的 `rongyi-theme`。切换时新配色从开关位置以圆形揭开（View Transitions），不支持或开启减少动态效果时直接切换。浅色沿用 README 卡片的浅色板，正文对比度不低于 4.5:1。
- 粒子：单个 Canvas 2D 随章节在首屏三组粒子、橙色数据通道、蓝色观测轨道、绿色点阵走线、分层检查路径和稀疏时间轴之间连续变形。780ms 过渡支持中途重新定向，标题、正文、截图和既有 PCB 动画有保护区域。固定种子、随浏览器刷新绘制、轨迹循环淡出、DPR 上限 1.5、后台暂停与历史返回恢复；减少动态效果时静态显示当前章节，主题/章节改变时重绘。实现与验收见 [`docs/particle-scenes.md`](./docs/particle-scenes.md)。
- 动效：首屏入口进入视口时各播放一次悬停预览；DSH 截图每 6 秒轮换，悬停截图或键盘聚焦标签时暂停，手动选择后停止。离屏、后台标签页和减少动态效果时不运行循环。
- DSH Usage 截图取自 dsh-stats 仓库的真实运行界面（深色主题、showcase 夹具数据，项目名为占位），存放在 `src/assets/dsh/`。`*-dark.png` 由 dsh-stats `85608a0` 的浏览器夹具以 1440px、2x 截取，只去掉面板外框并裁到相同高度。
- 工具缩略图取自各仓库自己公开的画面，存放在 `src/assets/tools/<slug>.png`：DevFlow Recorder 为 `docs/screenshots/timeline-preview.png`（`fbca29b`，浏览器预览模式，条目标为示例数据），原图未裁剪；Desktop Pet 为 `docs/screenshots/studio.png`（`d57081d`，浏览器模式加载的模拟帧包），只裁出动作舞台；宁缺为 `assets/ningque-001-og.png`（`8388390`，第 001 号判词分享图），原图未裁剪；Problem Solution Recorder 为 `docs/media/dashboard.png`（`336fa40`，虚构演示数据，7 条记录），原图未裁剪；Memory Monitor（macOS）为 `docs/images/overview.png`（v1.4.2 主窗口、隔离 fixture 演示数据，未含真实进程），只缩放到 800px 宽。没有公开截图的工具（dsh-spec、Tech Mentor）保持纯文字行。
- 硬件磁贴来自 Hardware Lab 的 `projects.yml`，只保留公开仓库；构建证据以索引记录的提交为准。
- 硬件照片取自各项目公开仓库 `assets/photos/` 中的历史原型照片，日期以 Hardware Lab `media_scope` 为准，未注明的标“未注明日期”。`src/assets/hardware/<slug>.jpg` 只做了缩放（长边 1200px）、JPEG 重压和去 EXIF，不改画面；构建时再生成 WebP。没有公开实物照片的项目（`ESP32_RPS_Game`、`esp32-s3-smart-safety-monitor`、`esp32-smart-light-controller`）显示“未公开实物照片”占位。`raspberry-pi-weather-station` 的历史界面截图标题栏仍可见局域网地址和用户名，暂不使用，需先在源仓库处理。
- 只展示公开仓库。私有项目不出现在页面上。
- GitHub 状态带构建时间。CI 证据绑定当前默认分支 HEAD：HEAD 未变且其运行通过时持续有效并显示运行日期，HEAD 前进而未验证时降级为“最新提交尚未验证”。API 失败、运行失败或 Artifact 过期时发布明确的非绿色状态；只有状态结构本身不可信时才阻断部署，不静默回退到静态 `CI passing`。
- 定时部署会在构建产物中刷新状态，但不会回写 `main`；因此仓库中跟踪的 JSON 可能旧于线上页面显示的构建时间。

## License

网站源代码采用 MIT License。Yi盘名称、品牌标识、产品文案和产品素材不在 MIT 授权范围内，详见 [`NOTICE.md`](./NOTICE.md)。
