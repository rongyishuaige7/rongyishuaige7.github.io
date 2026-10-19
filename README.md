# Rongyi Studio

Rongyi 的个人主页，按三条线展示公开项目：随身（Yi盘）、可见（Agent 工具）、可触（硬件原型），以及对应的 GitHub 与 npm 记录。

- 线上地址：<https://rongyishuaige7.github.io>
- 技术栈：Astro 静态站、原生 CSS、构建时 GitHub API
- 动态信号：每次部署从公开 GitHub API 生成 `src/data/github-status.json`，并从 GitHub 与 npm registry 生成 `src/data/studio.json`（npm 版本与下载量、Hardware Lab 索引、自动更新流）；只采用 `/users/rongyishuaige7/repos` 列出的公开仓库
- 状态口径：只对指定工作流、当前默认分支 HEAD 和未过期 Artifact 显示绿色证据

## 本地开发

```bash
npm ci
npm run status
npm run status:check
npm run check
npm run build:refresh
npm run dev
```

## 内容范围

- Yi盘当前处于受控内测，正在完成上市前验证；CI 不代表三个系统都已完成真机测试。
- Yi盘真实截图将在获得真实产品素材后补充；当前页面使用明确标注的功能示意图。首屏工作室图同样是示意图，不代表真实数据。
- DSH Usage 截图取自 dsh-stats 仓库的真实运行界面（夹具数据，项目名为占位），存放在 `src/assets/dsh/`。
- 硬件磁贴来自 Hardware Lab 的 `projects.yml`，只保留公开仓库；构建证据以索引记录的提交为准。
- 只展示公开仓库。私有项目不出现在页面上。
- GitHub 状态带构建时间。CI 证据绑定当前默认分支 HEAD：HEAD 未变且其运行通过时持续有效并显示运行日期，HEAD 前进而未验证时降级为“最新提交尚未验证”。API 失败、运行失败或 Artifact 过期时发布明确的非绿色状态；只有状态结构本身不可信时才阻断部署，不静默回退到静态 `CI passing`。
- 定时部署会在构建产物中刷新状态，但不会回写 `main`；因此仓库中跟踪的 JSON 可能旧于线上页面显示的构建时间。

## License

网站源代码采用 MIT License。Yi盘名称、品牌标识、产品文案和产品素材不在 MIT 授权范围内，详见 [`NOTICE.md`](./NOTICE.md)。
