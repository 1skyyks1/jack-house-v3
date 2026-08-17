# API Contract

V3 第一阶段兼容旧 Express API。页面组件不直接消费原始 axios response，API 层负责 unwrap、类型化和错误归一。

## 基础约定

- API base：开发环境 `VITE_API_BASE_URL=http://127.0.0.1:3000`。
- 认证：V3 使用后端 httpOnly cookie，axios 开启 `withCredentials`，不再从 `localStorage.token` 读取 JWT，也不再发送 `Authorization: Bearer`。后端不再兼容旧前端 Bearer token。
- CSRF：cookie 认证的写请求需要 `X-CSRF-Token`，V3 会从 `jh_csrf` cookie 自动带上。
- 生产 CORS/cookie：后端在 `NODE_ENV=production` 时要求显式配置 `CORS_ORIGIN` 或 `FRONTEND_URL`；如果 `AUTH_COOKIE_SAME_SITE=none`，必须同时配置 `AUTH_COOKIE_SECURE=true`。
- 本地 V3 直连线上后端：V3 `.env` 配 `VITE_API_BASE_URL=https://线上后端域名`；线上后端 `CORS_ORIGIN` 必须包含实际浏览器 origin，例如 `https://线上前端域名,http://localhost:5173,http://127.0.0.1:5173`。因为 `localhost -> api.jackhouse.xyz` 是跨站请求，线上后端必须显式配置 `AUTH_COOKIE_SAME_SITE=none` 和 `AUTH_COOKIE_SECURE=true`，并依赖 CORS 白名单与双提交 CSRF 保护写请求。origin 不要带路径或尾部 `/`。
- 语言：`Accept-Language: zh | en`。
- 401：清理前端会话并打开登录流。
- 后端响应 envelope 不完全一致，API 函数需要按接口确认并归一。

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/csrf`
- `GET /auth/osu`
- `GET /auth/osu/callback`

V3 注意：

- 登录成功后端会写入 httpOnly cookie；响应不返回 JWT token。
- osu OAuth callback 会写入 httpOnly cookie；URL 不附带 JWT token。
- `/auth/logout` 会清理 cookie；`/oauth/complete` 只根据 `userId`、toast 反馈和登录后跳转完成前端状态同步。
- `/auth/csrf` 返回当前会话的 CSRF token，用于本地 V3 调线上后端时补 `X-CSRF-Token`；同站部署时 V3 仍可直接从 `jh_csrf` cookie 读取。
- `POST /auth/register` 作为旧接口和预留能力记录保留；V3 UI 暂不开放 email/password 注册，Register tab 只引导 osu OAuth。

## User / Permissions

- `GET /user`
- `POST /user`
- `GET /user/info`
- `GET /user/:user_id`
- `PUT /user/:user_id`
- `DELETE /user/:user_id`
- `GET /permissions`

V3 注意：

- `/user/edit` 只提交 `qq`、`discord`、可选 `password`。
- `/admin/users` 可创建/编辑 `user_name`、`avatar`、`password`、`role`、`status`、`email`、`osu_uid`、`qq`、`discord`。
- React admin permission key 必须和后端 `ADMIN_PERMISSIONS` 对齐。
- 已收口：`POST /user` 需要 `ADMIN`；`PUT /user/:user_id` 允许管理员维护用户管理字段，本人只能更新 `password`、`qq`、`discord`。
- 已收口：`GET /user/:user_id` 支持匿名访问个人页，但匿名或普通他人访问只返回 `user_id/user_name/avatar/role/status/osu_uid/qq/discord/created_time/updated_time/badges`；本人或 `ADMIN` 带有效登录态访问时才返回完整非密码字段（包含 `email`）。
- 已收口：完整 `GET /user` 列表仅 `ORG/ADMIN` 可用，默认 `pageSize=20`、最大 `pageSize=50`；轻量 `GET /user/search` 需要登录、最短搜索词 2 个字符、最大 `pageSize=20`。
- 已收口：`DELETE /user/:user_id` 仅 `ADMIN` 可用。
- 已修正：旧后端 controller 对 `config/roles.js` 的导入方式已统一解构 `ROLES`，避免 `ROLES.ADMIN` 判定失效。

## Post / Forum / Announcement

- `GET /post`
- `GET /post/type/:type`
- `GET /post/typeWithContent/:type`
- `GET /post/user/:user_id`
- `GET /post/search`
- `GET /post/forum`
- `GET /post/requestPost`
- `GET /post/:post_id`
- `POST /post`
- `PUT /post/:post_id`
- `DELETE /post/:post_id`

Post type：

- `0` normal
- `1` request
- `2` event post
- `3` announcement

V3 注意：

- `/forum` 搜索建议已接旧 `GET /post/search`，参数沿用 `keyword`、`locale`、`page`、`pageSize`。
- `/post/search` 返回的是旧自动补全结构 `{ value, post_id, time }`，不是普通 `PostListItem`；不要用 `title_zh/title_en/type/created_time` 渲染。
- `/forum/editor/:id?` 只处理 type 0/1/2。
- type 3 公告走 `/admin/announcement`。
- 富文本字段仍提交 HTML；展示必须走 `RichTextRenderer`。
- 写入时后端会对翻译 `content` 做 HTML sanitizer。

## Post Comment / Post File

- `GET /comment/post/:post_id`
- `GET /comment`
- `GET /comment/user/:user_id`
- `POST /comment`
- `PUT /comment/:comment_id`
- `DELETE /comment/:comment_id`
- `GET /postFile`
- `GET /postFile/post/:post_id`
- `GET /postFile/user/:user_id`
- `POST /postFile/upload/:post_id`
- `POST /postFile`
- `PUT /postFile/:file_id`
- `PUT /postFile/review/:file_id`
- `GET /postFile/download/:file_id`
- `DELETE /postFile/:file_id`

V3 注意：

- `GET /postFile/user/:user_id` 是个人页展示型列表接口，只返回 `file_id/post_id/user_id/file_name/uploaded_time/status/size`，不返回下载 URL、对象 key、checksum、note 或审批意见；公开列表 `pageSize` 上限为 20。
- 用户侧投稿文件上传和 note 编辑已迁移。
- 后台投稿审核、下载临时 URL、删除和 `.xlsx` 导出在 `/admin/postFiles`。
- 普通用户投稿必须走 `POST /postFile/upload/:post_id`；`POST /postFile` 仅作为 `ORG/ADMIN` 后台兼容登记入口，用于登记已有 GitHub/external 文件记录，并同样遵守征稿数量上限、单文件大小上限和总大小上限。
- 投稿详情响应包含派生字段 `locked_at` 与 `is_locked`。普通用户可在上传后的 24 小时内通过 `DELETE /postFile/:file_id` 删除自己的投稿并重传；到期后由后端强制锁定。`ORG/ADMIN` 的审核删除权限不受该窗口限制。
- 投稿上传默认单文件 20MB、单用户单征稿总大小 100MB；可通过 `POSTFILE_MAX_SIZE_MB`、`POSTFILE_MAX_TOTAL_SIZE_MB` 调整。
- 投稿扩展名默认白名单由后端控制，可通过 `POSTFILE_ALLOWED_EXTENSIONS`、`POSTFILE_ALLOWED_MIME_TYPES` 收紧。
- 投稿文件保持原始内容和 MIME，不做压缩、不转格式；后端按原文件内容计算完整 SHA-256 checksum 入库，并用短 hash 前缀加原扩展名作为对象文件名以降低重名风险和路径长度。
- 旧投稿记录如果没有 `storage_provider`，后端下载/删除时按 MinIO 兼容；当前 `.env` 指向的数据库已执行 `npm run migrate:storage-metadata` 回填元数据。

## Upload

- `POST /upload/rich-text/image`

V3 注意：

- 富文本图片上传需要登录，前端使用 `multipart/form-data` 字段 `file`。
- V3 编辑器支持工具栏选择文件、粘贴图片文件和拖拽图片文件，三者都复用该接口；普通文字/HTML 粘贴不走上传。
- 默认允许 `jpeg/jpg/png/gif/webp`，默认最大 5MB，可通过后端 `RICHTEXT_IMAGE_MAX_SIZE_MB` 调整。
- 后端会在存储前优化并默认转 WebP：限制最大边长、降低质量；GIF/SVG/多帧 WebP 不重编码。可通过 `IMAGE_OPTIMIZE_*` 环境变量调整或关闭，其中 `IMAGE_OPTIMIZE_CONVERT_WEBP=false` 可关闭转 WebP。
- storage scope 为 `RICHTEXT`，只允许 GitHub provider；对象分组由 `RICHTEXT_STORAGE_BUCKET` 配置，默认返回 jsDelivr CDN URL。
- GitHub provider 的 owner/repo 默认指向 `1skyyks1/jack-house-img`，但服务端仍必须配置 `GITHUB_STORAGE_TOKEN`；生产环境建议显式写出 `GITHUB_STORAGE_OWNER` 和 `GITHUB_STORAGE_REPO`。
- 上传成功后端会记录 `rich_text_asset`。编辑器删除图片不会立即删除 GitHub 对象，只会在内容保存后移除引用并将无引用资产标记为 `orphaned`。
- 后端 `npm run cleanup:rich-text-assets` 可清理超过保留期的 `uploaded/orphaned` 富文本图片资产；默认 dry-run，生产删除需要传 `--delete` 或设置 `RICHTEXT_ASSET_CLEANUP_DRY_RUN=false`。
- 后端 `npm run backfill:rich-text-assets` 可对历史帖子正文、活动说明和赛事章节做一次性回填；默认 dry-run，只识别本站托管图片 URL，生产写入需要传 `--apply`。
- 新环境需要先执行后端 `npm run migrate:rich-text-assets` 创建富文本图片资产表。

## AI Image Tool

- `GET /tool/aimg/config`
- `POST /tool/aimg/jobs`
- `GET /tool/aimg/jobs`
- `GET /tool/aimg/jobs/:jobId`
- `GET /tool/aimg/admin/jobs`（仅 `ADMIN`）

V3 注意：

- 所有接口都要求登录；前端工具页路径是 `/tool/aimg`，管理员记录页是 `/admin/aimg`。
- 管理员记录页提供分页、任务状态和用户 ID 筛选；主表展示用户、提示词、模式、尺寸、输入图数量、状态与费用，详情弹窗展示完整提示词、IP、User-Agent、文件元数据/SHA-256、错误和上下游任务 ID。
- 后端代码集中在独立的 `backend/modules/aiImage` 模块；业务模型、临时上传、上游客户端、配额和同步器不注册到全局模型或共享上传组件中。全局层只挂载模块路由并调用一次 `start()`。
- `POST /tool/aimg/jobs` 使用 `multipart/form-data`。通用字段为 `idempotencyKey`、`requestType`、`prompt`、`size`；编辑模式使用最多 10 个 `images` 文件和可选单个 `mask` 文件。
- 后端只使用服务器环境变量里的 65535 API Key，并统一用 `X-Async-Mode: true` 提交；上游 API Key、全局任务列表都不会返回前端。
- 每个账号最多有一个 `submitting/pending/running` 任务，管理员也不例外；全站上游活跃任务默认最多 4 个，达到上限返回 `429 global_concurrency_limit`。
- 普通用户每日 10 次、组织者每日 30 次、管理员无每日上限；额度按 `Asia/Shanghai` 自然日统计。任务被上游接受后占用一次；内容/安全拒绝不退款，明确的上游技术故障可退款。
- Jack House 不保存生成图、参考图或遮罩图。上传文件仅用于本次转发，完成或失败后删除；数据库只记录用户映射、提示词、请求参数、文件名/大小/SHA-256、IP、User-Agent、上游状态、费用和错误。
- `GET /tool/aimg/jobs` 先按本地 `user_id` 隔离任务，再用保存的 `upstream_job_id` 查询 65535；返回中的 `resultUrls` 不入库，约 24 小时后失效。
- 新环境必须先在 `jack-house-web/backend` 执行 `npm run migrate:ai-image-jobs`。

## Pack / Tag / Pack Comment

- `GET /pack`
- `GET /pack/:pack_id`
- `POST /pack`
- `GET /pack/osu/:bid`
- `POST /pack/osu/:bid`
- `PUT /pack/osu/:bid`
- `GET /tag`
- `GET /tag/admin`（ADMIN，含停用标签和使用数量）
- `POST /tag/admin`（ADMIN）
- `PATCH /tag/admin/:tag_id`（ADMIN）
- `DELETE /tag/admin/:tag_id`（ADMIN，仅未关联图包的标签）
- `PUT /tag/:pack_id`
- `POST /tag/:pack_id`
- `GET /packCom/:pack_id`
- `POST /packCom`
- `DELETE /packCom/:comment_id`

V3 注意：

- `/pack` 和 `/pack/:packId` 已迁移。
- `/newPack` 支持 osu 导入和手动外链创建。
- Tag 分类已改为后端主数据字段 `category`，可选值为 `pattern | bpm | difficulty`；前端列表筛选、新建和详情维护共用同一套分类逻辑，不再按标签 ID/数组位置切片。
- Tag 同时返回 `tag_key/name_zh/name_en/sort_order/enabled`；`tag_key` 创建后不可修改，停用标签不会出现在新筛选和新关联中，但历史 Pack 关联保留。
- 部署本版本前必须在 `jack-house-web/backend` 执行 `npm run migrate:pack-tag-taxonomy`。迁移保留全部 `tag_id`，并逐条比对执行前后的 `(pack_id, tag_id)` 关系，确保 `pack_tags` 完全不变；回滚 SQL 同样不会修改 `pack_tags`。
- 图包标题、创建者、外链、type 编辑缺后端更新协议，暂未迁移。

## Event

- `GET /event`
- `GET /event/:event_id`
- `POST /event`
- `PUT /event/:event_id`
- `DELETE /event/:event_id`
- `GET /event/:event_id/stage`
- `POST /event/stage`
- `PUT /event/stage/:stage_id`
- `DELETE /event/stage/:stage_id`
- `GET /event/rank/event/:event_id`
- `GET /event/rank/stage/:stage_id`
- `GET /event/userRecord/:event_id`
- `POST /event/:event_id/score`

V3 注意：

- 当前迁移的是旧活动 `event` 链路，不是赛事系统。
- 创建 stage 时旧后端要求 multipart `POST /event/stage`，`event_id` 在 form body 中，不在路径中。
- 旧后端 `eventStageController.updateStage` 已按 `map_id`、`artist`、`title`、`mapper` 字段白名单收口。
- 活动 `desc` 写入时后端会做 HTML sanitizer。
- Stage 背景图使用专用上传器，默认 1MB，可通过 `EVENT_STAGE_BG_MAX_SIZE_MB` 调整；允许 `jpeg/jpg/png/gif/webp`，存储前同样走后端图片优化。

## Badge / Dashboard

- `GET /badge`
- `POST /badge`
- `POST /badge/:id`
- `DELETE /badge/:id`
- `GET /dashboard/home`

V3 注意：

- `/admin/badges` 和 `/admin/dashboard` 已迁移。
- 首页图管理协议已移除；V3 首页视觉图直接在 `HomePage.tsx` 中配置。
- 徽章图片和活动 stage 背景图已接 storage provider；旧记录没有 `storage_provider` 时按 MinIO 兼容，新上传可通过 `BADGES_STORAGE_PROVIDER=github`、`EVENT_STAGE_BG_STORAGE_PROVIDER=github` 写入 `1skyyks1/jack-house-img`。

## Tournament

赛事系统已接入 V3。后端赛事 API 根路径为 `/t`，前端公开页面路由也使用 `/t`，后台页面使用 `/admin/tournaments/*`。

Public：

- `GET /t`
- `GET /t/:tid`
- `GET /t/:tid/sections`
- `GET /t/:tid/teams`
- `GET /t/:tid/staff`
- `GET /t/:tid/qualifier/mappool`
- `GET /t/:tid/qualifier/scores`
- `GET /t/:tid/qualifier/ranking`
- `GET /t/:tid/rounds`
- `GET /t/:tid/bracket`
- `GET /t/:tid/mappool-stats`
- `GET /t/:tid/round/:roundId/mappool`
- `GET /t/:tid/match/:matchId`

Team：

- `POST /t/:tid/team`
- `POST /t/:tid/team/join`
- `DELETE /t/:tid/team/leave`
- `PUT /t/:tid/team/:teamId/info`
- `POST /t/:tid/team/:teamId/transfer-captain`
- `POST /t/:tid/team/:teamId/reset-invite`
- `POST /t/:tid/team/:teamId/submit`
- `DELETE /t/:tid/team/:teamId/player/:playerId`

Admin / content：

- `POST /t`
- `PUT /t/:tid`
- `DELETE /t/:tid`
- `PUT /t/:tid/team/:teamId`
- `POST /t/:tid/team/approve-all`
- `PUT /t/:tid/player/:playerId`
- `POST /t/:tid/staff`
- `DELETE /t/:tid/staff/:staffId`
- `GET /t/:tid/sections/manage`
- `POST /t/:tid/sections/preview`
- `POST /t/:tid/sections`
- `PUT /t/:tid/sections/:sectionId`
- `DELETE /t/:tid/sections/:sectionId`
- `GET /t/:tid/audit-logs`
- `POST /t/:tid/import/teams`

Qualifier：

- `POST /t/:tid/qualifier/mappool`
- `PUT /t/:tid/qualifier/mappool/:mapId`
- `DELETE /t/:tid/qualifier/mappool/:mapId`
- `GET /t/:tid/qualifier/imports`
- `POST /t/:tid/qualifier/fetch-scores`
- `POST /t/:tid/qualifier/calculate-ranking`
- `PUT /t/:tid/qualifier/scores/:scoreId`
- `POST /t/:tid/qualifier/lock`

Bracket / match / referee：

- `GET /t/:tid/mappool-stats/manage`
- `POST /t/:tid/mappool-stats/:stage/calculate`
- `POST /t/:tid/round`
- `PUT /t/:tid/round/:roundId`
- `DELETE /t/:tid/round/:roundId`
- `POST /t/:tid/round/:roundId/mappool`
- `DELETE /t/:tid/round/mappool/:mapId`
- `POST /t/:tid/bracket/generate`
- `POST /t/:tid/match`
- `PUT /t/:tid/match/:matchId`
- `POST /t/:tid/match/:matchId/fetch-scores`
- `GET /t/:tid/referee/:matchId`
- `POST /t/:tid/referee/:matchId/roll`
- `POST /t/:tid/referee/:matchId/action`
- `PUT /t/:tid/referee/:matchId/action/:actionId`
- `POST /t/:tid/referee/:matchId/timeout`
- `PUT /t/:tid/referee/:matchId/game/:gameId`
- `DELETE /t/:tid/referee/:matchId/undo`

注意：

- 不要新增 `/tournament` API 调用；目录名、模型名、entity 名仍保留 `tournament`。
- 赛事接口权限必须以后端为准；前端隐藏按钮只作为体验优化。
- 赛事联调时继续确认错误响应、空态、无权限态和真实数据边界。
- 图池 BP 统计使用后台手动计算的阶段快照；只有全部有效比赛完成的阶段允许计算，未激活的 GFR 不阻塞 GF，公开接口不实时扫描比赛数据。
- `event` 活动系统和 `tournament` 赛事系统是两个领域，不要混用数据模型。
