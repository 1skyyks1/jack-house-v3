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

- [tournament-technical-plan.md](./tournament-technical-plan.md)：赛事系统完整技术方案和实施入口。
- [tournament-system.md](./tournament-system.md)：赛事系统产品规则和领域设计背景。
- [github-storage-strategy.md](./github-storage-strategy.md)：GitHub 图床和投稿文件存储调研。
- [optimization-backlog.md](./optimization-backlog.md)：非大功能类优化池。

## 建议优先级

1. 赛事系统联调验收：首期前后端已接入，后续重点是真实内容、真实权限、真实比赛流程和边界数据验收。
2. 上传与存储策略：先确认哪些文件可以公开、大小和流量预期、是否需要删除/替换/审计，再决定 GitHub、MinIO 或 S3/R2。
3. 富文本媒体能力：图片上传和表格编辑已接入；后续附件链接、真实内容验收和长期 JSON/HTML 存储策略仍要结合上传策略推进。
4. 认证专项：V3 已切到 httpOnly cookie + CSRF，不再使用 `localStorage.token`、Bearer 或 URL token；部署时仍需填写正式域名下 SameSite/Secure/CORS 配置。邮箱注册接口当前只预留，不作为 V3 UI 功能。
5. 体验优化：移动端导航、列表密度、loading/empty/error、代码分包、图片资源治理。

## 已完成的后端安全收口

- `jack-house-web/backend` 已为 `POST /user` 增加 `ADMIN` 鉴权，普通用户不能通过该接口创建账号。
- `PUT /user/:user_id` 已按字段白名单拆分：管理员可维护用户管理字段；本人只能更新 `password`、`qq`、`discord`。
- `GET /user/:user_id` 已拆分公开/私有字段：公开个人页不返回 `email` 等管理字段；本人或 `ADMIN` 带有效登录态访问时才返回完整非密码字段。
- 完整 `GET /user` 列表已限制为 `ORG/ADMIN`，并限制最大 `pageSize=50`；赛事 staff 选人用登录后轻量 `/user/search`，最大 `pageSize=20`。
- 旧 controller 中直接 `require("../../config/roles")` 的位置已统一改为解构 `ROLES`，避免 `ROLES.ADMIN` 判定失效。
- `homeImgController`、`postFileController` 和富文本上传已改为调用 `services/storage`，默认兼容当前 MinIO；GitHub repo provider 可接入 `1skyyks1/jack-house-img`，默认返回 jsDelivr URL。
- `post_file`、`home_img`、`badge` 和 `event_stage` 已补存储元数据字段；投稿上传已增加默认 20MB 限制、扩展名白名单、可选 MIME 白名单和 SHA-256 checksum 持久化；投稿文件不压缩、不转格式，上传对象名为短 hash 前缀 + 原扩展名。当前 `.env` 指向的数据库已执行 `npm run migrate:storage-metadata`。
- 投稿上传已增加默认 100MB 单用户单征稿总大小限制；活动 stage 背景图已拆成专用上传器，默认 1MB。
- 后端公开展示图片已接入 `sharp` 优化并默认转 WebP，覆盖富文本图片、活动 stage 背景图、徽章和旧 homeImg；V3 首页写死 GitHub raw URL，不经过后端，需要离线压缩源文件。
- 活动 stage 更新接口已按字段白名单收口，并统一使用 `stage.*` 响应文案。
- httpOnly cookie 认证已接入：后端登录、注册和 osu OAuth callback 写 cookie，cookie 写请求已有双提交 CSRF 校验，V3 请求已开启 `withCredentials`，并且不再读取/写入 `localStorage.token`、不发送 Bearer 头；后端不再接受 Bearer，不再在登录响应或 osu redirect 中返回 JWT token；生产环境已要求显式配置 `CORS_ORIGIN`/`FRONTEND_URL`，且 `AUTH_COOKIE_SAME_SITE=none` 时强制要求 `AUTH_COOKIE_SECURE=true`。
- 富文本图片上传已接入：后端 `/upload/rich-text/image` 默认使用 `RICHTEXT` storage scope，V3 编辑器可通过工具栏、粘贴图片和拖拽图片上传并插入图片；配置 `RICHTEXT_STORAGE_PROVIDER=github` 和 `RICHTEXT_STORAGE_BUCKET` 后可经后端写入 GitHub 仓库。后端已新增 `rich_text_asset` / `rich_text_asset_reference`，上传记录资产，帖子正文、活动说明和赛事章节保存时同步引用；`npm run cleanup:rich-text-assets` 可清理超过保留期的未引用资产，`npm run backfill:rich-text-assets` 可 dry-run/回填历史内容。后续还需要在生产环境接入定时调度，并按 dry-run 结果决定是否 apply 历史回填。
- 富文本表格编辑已接入：V3 编辑器可插入表格、追加行/列和删除表格，后端 sanitizer 已允许基础 table 标签。
- 旧帖子/公告、活动描述和赛事内容保存时已接入后端富文本 sanitizer。

## 每个新功能开始前

- 确认它属于用户侧、后台侧还是后端能力。
- 对照旧前端，判断是迁移已有业务、修正旧业务，还是全新需求。
- 写清楚 URL、接口、权限、空态、错误态和移动端表现。
- 如果会新增数据字段，先检查旧 Sequelize model 和真实数据库迁移方式。
- 做完后更新相关专项文档，不把临时过程塞回 handoff。
