# Rongyi / Yi盘

Rongyi 的个人主页，展示 Yi盘、开发工具、硬件项目和对应的 GitHub 记录。

- 线上地址：<https://rongyishuaige7.github.io>
- 技术栈：Astro 静态站、原生 CSS、构建时 GitHub API
- 动态信号：每次部署从公开 GitHub API 生成 `src/data/github-status.json`
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
- Yi盘真实截图将在获得真实产品素材后补充；当前页面使用明确标注的功能示意图。
- GitHub 状态带构建时间。API 失败、当前 HEAD 未验证或证据过期时发布明确的非绿色状态；只有状态结构本身不可信时才阻断部署，不静默回退到静态 `CI passing`。
- 定时部署会在构建产物中刷新状态，但不会回写 `main`；因此仓库中跟踪的 JSON 可能旧于线上页面显示的构建时间。

## License

网站源代码采用 MIT License。Yi盘名称、品牌标识、产品文案和产品素材不在 MIT 授权范围内，详见 [`NOTICE.md`](./NOTICE.md)。
