# Jack House V3

`jack-house-v3` 是对旧项目 `jack-house-web` 的前端重构版本。

当前项目以 React + TypeScript + Vite 为基础，优先重构用户侧主站与后台工具台，同时继续兼容旧 Express API、旧 URL 语义、旧上传协议和现有数据库模型。V3 使用 httpOnly cookie + CSRF 认证，不再兼容旧前端 Bearer token。赛事 `tournament` 子系统已按独立产品线接入 V3 前端，后端继续复用 `jack-house-web/backend`。

## 当前范围

- 只重构前端，不重写旧后端。
- 兼容旧 API 协议和上传方式；认证已切到 cookie + CSRF。
- 首页不再使用旧后台配置首页图，而是使用静态视觉素材。
- `tournament` 赛事系统首期前端已接入，包含公开页、报名组队、资格赛、正赛、裁判工作台和后台管理入口。
- 全站逐步收口到统一 `react-i18next` 资源结构。

## 当前路由

- `/`：三屏全屏海报式首页，入口为 `JACK HOUSE / JACKMAPS / TOURNEY`
- `/about`：社区索引页
- `/forum`：论坛列表、搜索、类型筛选
- `/forum/editor/:id?`：普通帖 / 征稿帖 / 活动帖编辑器
- `/post/:postId`：帖子详情、目录、评论、征稿投稿
- `/user/:userId`：用户资料、徽章、帖子、投稿记录
- `/user/edit`：密码、QQ、Discord 编辑
- `/pack`：图包搜索、标签筛选、分页
- `/pack/:packId`：图包详情、下载链接、评论、管理员维护入口
- `/newPack`：图包创建，支持 osu! 导入和手动外链创建
- `/event/:eventId`：活动详情、阶段、排行榜、成绩同步
- `/t`、`/t/:tid`：赛事列表与赛事首页
- `/t/:tid/teams`：组队大厅
- `/t/:tid/qualifier`：资格赛榜单
- `/t/:tid/bracket`、`/t/:tid/match/:matchId`：正赛对阵与比赛详情
- `/t/:tid/referee/:matchId`：裁判工作台
- `/oauth/complete`：osu OAuth 登录回调
- `/admin/*`：后台仪表盘、用户、帖子、公告、投稿文件、徽章、活动、活动阶段和赛事管理

完整路由定义见 [src/app/router.tsx](file:///Users/bytedance/jackhouse/jack-house-v3/src/app/router.tsx)。

## 技术栈

- React 19
- TypeScript
- Vite 8
- React Router 7
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Tailwind CSS v4
- shadcn/ui + Radix UI
- i18next + react-i18next
- next-themes
- Tiptap

## 开发命令

```bash
pnpm dev --host 127.0.0.1
pnpm lint
pnpm build
```

## 文档入口

- [docs/00-ai-handoff.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/00-ai-handoff.md)：当前接手入口与工作规则
- [docs/coding-standards.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/coding-standards.md)：编码与注释规范
- [docs/decision-log.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/decision-log.md)：仍生效的关键决策
- [docs/api-contract.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/api-contract.md)：V3 兼容的旧 API 合同
- [docs/domain-model.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/domain-model.md)：核心领域对象
- [docs/rich-text-system.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/rich-text-system.md)：富文本约束
- [docs/deployment-checklist.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/deployment-checklist.md)：当前 V3 前端与后端部署检查清单
- [docs/tournament-architecture.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/tournament-architecture.md)：赛事系统架构图
- [docs/open-questions.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/open-questions.md)：尚未关闭的问题
