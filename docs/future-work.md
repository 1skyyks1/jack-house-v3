# Future Work

本文件是迁移 MVP 之后的新功能与优化入口。它只记录后续要做什么、在哪个仓库做、先后顺序如何判断。

## 仓库边界

- 前端：`/Users/bytedance/jackhouse/jack-house-v3`
- 后端：`/Users/bytedance/jackhouse/jack-house-web/backend`
- 旧前端：`/Users/bytedance/jackhouse/jack-house-web/frontend` 只作为业务和视觉参考，不再继续开发。

后续如果涉及接口、权限、上传、数据库模型或旧 controller，直接在 `jack-house-web/backend` 修改；不要在 `jack-house-v3` 里伪造后端逻辑。

## 开发原则

- 页面和功能以旧前端已经真实出现过的业务为参考，再结合新需求重新设计。
- 用户侧页面要保留 ToC 社区站体验，不做成后台管理式的表格堆叠。
- 后台页保持高密度工具风格，撑满页面，优先用 breadcrumb、toolbar、filter、table 组织信息。
- UI primitive 优先使用 shadcn/ui；需要新组件时用 `pnpm dlx shadcn@latest add <component>`。
- 复杂业务先做领域文档和接口边界，再动代码。
- 涉及用户上传、鉴权、权限、富文本安全时，必须同时考虑前端体验和后端校验。

## 专项文档

- [tournament-system.md](./tournament-system.md)：赛事系统产品规则和领域设计背景。
- [tournament-bracket-flow.md](./tournament-bracket-flow.md)：JHC 正赛 match 编号和 source graph。
- [github-storage-strategy.md](./github-storage-strategy.md)：GitHub 图床和投稿文件存储调研。
- [optimization-backlog.md](./optimization-backlog.md)：非大功能类优化池。

## 建议优先级

1. 赛事系统联调验收：首期前后端已接入，后续重点是真实内容、真实权限、真实比赛流程和边界数据验收。
2. 上传与存储策略：先确认哪些文件可以公开、大小和流量预期、是否需要删除/替换/审计，再决定 GitHub、MinIO 或 S3/R2。
3. 富文本媒体能力：图片上传和表格编辑已接入；后续附件链接、真实内容验收和长期 JSON/HTML 存储策略仍要结合上传策略推进。
4. 认证专项：V3 已切到 httpOnly cookie + CSRF，不再使用 `localStorage.token`、Bearer 或 URL token；部署时仍需填写正式域名下 SameSite/Secure/CORS 配置。邮箱注册接口当前只预留，不作为 V3 UI 功能。
5. 体验优化：移动端导航、列表密度、loading/empty/error、代码分包、图片资源治理。

## 每个新功能开始前

- 确认它属于用户侧、后台侧还是后端能力。
- 对照旧前端，判断是迁移已有业务、修正旧业务，还是全新需求。
- 写清楚 URL、接口、权限、空态、错误态和移动端表现。
- 如果会新增数据字段，先检查旧 Sequelize model 和真实数据库迁移方式。
- 做完后更新相关专项文档，不把临时过程塞回 handoff。
