# AI Handoff

本文件是后续接手 `jack-house-v3` 时的第一入口。它只保留当前仍有效的工作边界、项目状态和阅读顺序，不再记录过期方案和阶段性计划。

## 先读什么

1. 本文件：了解当前边界和工作规则
2. [decision-log.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/decision-log.md)：确认仍生效的产品/技术决策
3. [api-contract.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/api-contract.md)：确认旧 API 兼容面
4. [domain-model.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/domain-model.md)：确认核心对象
5. [rich-text-system.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/rich-text-system.md)：涉及帖子、公告、活动、图包描述时必读
6. [coding-standards.md](./coding-standards.md)：编码与注释规范
7. [deployment-checklist.md](./deployment-checklist.md)：部署后端或联调旧前端/V3 时必读
8. [future-work.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/future-work.md)：迁移 MVP 后的新功能与优化入口
9. [tournament-implementation-spec.md](./tournament-implementation-spec.md)：涉及赛事系统开发或验收时再读
10. [tournament-architecture.md](./tournament-architecture.md)：需要理解赛事系统结构时再读
11. [open-questions.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/open-questions.md)：只有在要碰未决边界时再读

## 项目定位

- `jack-house-v3` 是 `jack-house-web` 的前端重构版。
- 前端后续开发继续在 `jack-house-v3`。
- 后端后续开发继续在 `jack-house-web/backend`，不另起新后端仓库。
- 已迁移页面保持旧 URL、API 语义、上传协议和数据库模型兼容；认证已切到 httpOnly cookie + CSRF，后端不再接受旧前端 Bearer token。
- 不做 Vue 到 React 的逐行翻译。
- 用户侧优先保证社区入口体验，后台侧优先保证工具效率。
- 旧活动 `event` 链路已迁移；`tournament` 赛事系统已作为独立产品线接入 V3，后端继续复用 `jack-house-web/backend`。

## 硬性规则

- 新 UI primitive 优先使用 shadcn/ui；缺组件时使用 `pnpm dlx shadcn@latest add <component>`。
- 图标统一使用 `@phosphor-icons/react`。
- 数据请求使用 TanStack Query，复杂表格使用 TanStack Table，表单使用 React Hook Form + Zod。
- 页面范围以 `jack-house-web/frontend` 的真实页面为准，不因为旧后端存在预留接口就扩功能。
- 品牌和第三方来源图标优先复用旧前端静态资源，不随意换成通用 icon。
- 富文本展示必须走 `RichTextRenderer`，不要直接 `dangerouslySetInnerHTML`。
- 短生命周期反馈用 Sonner `toast`；页内持久提示用 `AppAlert` / `MutationErrorAlert`。
- 错误文案统一用 `getErrorMessage`，不要在页面内复制局部错误解析函数。
- Admin 页面不套用户侧主容器，不保留大段“页面名 + 用途说明”式文案。
- 注释保持简洁，优先使用 `// xxxx` 单行格式；只解释业务约束、兼容原因或规避原因。
- 不迁移旧 `/admin/homeImgs`；上传存储作为独立专项推进。
- 后端安全相关改动必须在 `jack-house-web/backend` 处理；用户管理接口权限收口和 `roles` 导入方式修正已完成，后续新增接口仍必须以后端鉴权为边界。

## 当前实现快照

基础设施已稳定：

- React + Vite + TypeScript、shadcn/ui、i18n、router、TanStack Query provider 已建立。
- 路由走 `React.lazy`，定义见 [src/app/router.tsx](file:///Users/bytedance/jackhouse/jack-house-v3/src/app/router.tsx)。
- V3 当前使用 httpOnly cookie，不再读取/写入 `localStorage.token`，也不再发送 Bearer 头；请求统一设置 `Accept-Language` 和 cookie CSRF header。
- `next-themes` 已接入，主题由 `src/index.css` 的 token 驱动。
- 登录态、语言切换、主题切换、全局壳层都已建立。
- 顶部导航桌面端为横向导航，移动端使用 shadcn `Sheet` 抽屉折叠导航。
- 富文本编辑和渲染已统一到 Tiptap + `RichTextRenderer` / `RichTextToc`。
- 全站 i18n 已切到 `src/shared/i18n/resources/*` 的分领域拆分结构。
- `/user/:userId` 无徽章时不展示占位文案；用户帖子/投稿分页已使用 shadcn `PaginationLink` + `PaginationEllipsis`。
- `/event/:eventId` overview 的“我的成绩”和阶段列表使用紧凑卡片；总榜和 stage tab 直接展示排行榜内容，不再用 Card 二次包裹；前三名使用轻量高亮排行卡，后续排名列表从第 4 名开始，每页 10 条。

用户侧主链路已可用：

- `/`：三屏全屏海报式首页，入口为 `JACK HOUSE / JACKMAPS / TOURNEY`
- `/about`
- `/forum`
- `/forum/editor/:id?`
- `/post/:postId`
- `/user/:userId`
- `/user/edit`
- `/pack`
- `/pack/:packId`
- `/newPack`
- `/event/:eventId`
- `/t`
- `/t/:tid`
- `/t/:tid/teams`
- `/t/:tid/qualifier`
- `/t/:tid/bracket`
- `/t/:tid/match/:matchId`
- `/t/:tid/referee/:matchId`
- `/oauth/complete`

后台主链路已可用：

- `/admin/dashboard`
- `/admin/users`
- `/admin/announcement`
- `/admin/posts`
- `/admin/postFiles`
- `/admin/badges`
- `/admin/events`
- `/admin/events/:eventId/stage`
- `/admin/tournaments`
- `/admin/tournaments/new`
- `/admin/tournaments/:tid/settings`
- `/admin/tournaments/:tid/content`
- `/admin/tournaments/:tid/teams`
- `/admin/tournaments/:tid/qualifier`
- `/admin/tournaments/:tid/bracket`
- `/admin/tournaments/:tid/staff`
- `/admin/tournaments/:tid/import`
- `/admin/tournaments/:tid/audit`

## 当前文档分工

- `README.md`：项目对外总览、范围、技术栈、路由摘要
- `00-ai-handoff.md`：接手入口，只保留工作边界和当前状态
- `decision-log.md`：仍有效的关键决策，不写阶段性状态
- `coding-standards.md`：编码与注释规范
- `api-contract.md`：V3 兼容的旧 API 合同
- `domain-model.md`：领域对象和枚举
- `rich-text-system.md`：富文本编辑/展示/目录规则
- `deployment-checklist.md`：当前后端部署、旧前端兼容和 V3 本地联调检查清单
- `future-work.md`：迁移 MVP 之后的新功能与优化入口
- `tournament-implementation-spec.md`：赛事系统首期开发规格、验收清单和剩余风险
- `tournament-system.md`：赛事系统产品规则和领域设计背景
- `tournament-technical-plan.md`：赛事系统历史技术方案，只有需要背景时再读
- `tournament-architecture.md`：赛事系统架构图、领域关系、核心流程和实施依赖
- `github-storage-strategy.md`：GitHub 图床和投稿文件存储调研
- `optimization-backlog.md`：后续优化池
- `open-questions.md`：未关闭问题

如果某条信息已经成为长期规则，就放 `decision-log.md`；如果只是当前实现状态，就放本文件；不要两边重复写。

## 下一步关注点

1. 继续做真实环境验收和联调，重点看赛事流程、上传存储、认证 cookie/CSRF 和生产域名配置。
2. 赛事系统首期代码侧已收口；后续主要验证真实内容、真实权限、真实 osu MP 数据、bracket 移动端表现和 sanitizer 白名单。
3. 上传存储、富文本图片追踪、投稿文件校验、后端安全收口和 httpOnly cookie 认证已完成基础改造；生产启用前仍需按 [deployment-checklist.md](./deployment-checklist.md) 做配置与回归。
4. 新需求或优化统一从 [future-work.md](./future-work.md) 和 [optimization-backlog.md](./optimization-backlog.md) 进入，不再把阶段性过程堆回 handoff。

## 每次改动后检查

- URL/API 语义是否保持兼容
- loading / empty / error 是否完整
- 未登录、无权限、401 是否处理正确
- 移动端是否可用
- 富文本是否走统一 renderer
- 是否优先复用了已有 shadcn/ui 与共享能力
- 文档是否只保留当前事实，不再追加过期计划
