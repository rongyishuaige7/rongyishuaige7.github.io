# Rongyi / Founder Lab

Rongyi 的个人主页，展示 Yi盘与经过公开验证的产品、开发工具和工程记录。

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

## 内容边界

- Yi盘当前是受控内测、发布门禁收口阶段，不能把 CI 或抽象视觉当作三平台真机证明。
- Yi盘真实截图将在获得真实产品素材后补充；当前页面只使用明确标注的抽象能力图。
- GitHub 状态带构建时间。API 失败、当前 HEAD 未验证或证据过期时发布明确的非绿色状态；只有状态结构本身不可信时才阻断部署，不静默回退到静态 `CI passing`。
- 定时部署会在构建产物中刷新状态，但不会回写 `main`；因此仓库中跟踪的 JSON 可能旧于线上页面显示的构建时间。

## License

网站源代码采用 MIT License。Yi盘名称、品牌标识、产品文案和产品素材不在 MIT 授权范围内，详见 [`NOTICE.md`](./NOTICE.md)。
