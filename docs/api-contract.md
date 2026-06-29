# API Contract

V3 第一阶段兼容旧 Express API。页面组件不直接消费原始 axios response，API 层负责 unwrap、类型化和错误归一。

## 基础约定

- API base：开发环境 `VITE_API_BASE_URL=http://127.0.0.1:3000`。
- 认证：V3 使用后端 httpOnly cookie，axios 开启 `withCredentials`，不再从 `localStorage.token` 读取 JWT，也不再发送 `Authorization: Bearer`。后端不再兼容旧前端 Bearer token。
- CSRF：cookie 认证的写请求需要 `X-CSRF-Token`，V3 会从 `jh_csrf` cookie 自动带上。
- 生产 CORS/cookie：后端在 `NODE_ENV=production` 时要求显式配置 `CORS_ORIGIN` 或 `FRONTEND_URL`；如果 `AUTH_COOKIE_SAME_SITE=none`，必须同时配置 `AUTH_COOKIE_SECURE=true`。
- 本地 V3 调线上后端：V3 `.env` 配 `VITE_API_BASE_URL=https://线上后端域名`；线上后端 `CORS_ORIGIN` 必须包含实际浏览器 origin，例如 `https://线上前端域名,http://localhost:5173,http://127.0.0.1:5173`。如果要跨站 cookie 登录，线上后端还需要 `AUTH_COOKIE_SAME_SITE=none` 和 `AUTH_COOKIE_SECURE=true`。origin 不要带路径或尾部 `/`。
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
- 普通用户投稿必须走 `POST /postFile/upload/:post_id`；`POST /postFile` 仅作为 `ORG/ADMIN` 后台兼容登记入口，用于登记已有 MinIO/GitHub/external 文件记录，并同样遵守征稿数量上限、单文件大小上限和总大小上限。
- 投稿上传默认单文件 20MB、单用户单征稿总大小 100MB；可通过 `POSTFILE_MAX_SIZE_MB`、`POSTFILE_MAX_TOTAL_SIZE_MB` 调整。
- 投稿扩展名默认白名单由后端控制，可通过 `POSTFILE_ALLOWED_EXTENSIONS`、`POSTFILE_ALLOWED_MIME_TYPES` 收紧。
- 投稿文件保持原始内容和 MIME，不做压缩、不转格式；后端按原文件内容计算完整 SHA-256 checksum 入库，并用短 hash 前缀加原扩展名作为对象文件名以降低重名风险和路径长度。
- 旧投稿记录如果没有 `storage_provider`，后端下载/删除时按 MinIO 兼容；当前 `.env` 指向的数据库已执行 `npm run migrate:storage-metadata` 回填元数据。

## Upload

- `POST /upload/rich-text/image`
- `GET /upload/rich-text/image/:objectName`

V3 注意：

- 富文本图片上传需要登录，前端使用 `multipart/form-data` 字段 `file`。
- V3 编辑器支持工具栏选择文件、粘贴图片文件和拖拽图片文件，三者都复用该接口；普通文字/HTML 粘贴不走上传。
- 默认允许 `jpeg/jpg/png/gif/webp`，默认最大 5MB，可通过后端 `RICHTEXT_IMAGE_MAX_SIZE_MB` 调整。
- 后端会在存储前优化并默认转 WebP：限制最大边长、降低质量；GIF/SVG/多帧 WebP 不重编码。可通过 `IMAGE_OPTIMIZE_*` 环境变量调整或关闭，其中 `IMAGE_OPTIMIZE_CONVERT_WEBP=false` 可关闭转 WebP。
- 默认 storage scope 为 `RICHTEXT`。对象分组优先使用 `RICHTEXT_STORAGE_BUCKET`；MinIO 兼容回退 `MINIO_RICHTEXT_BUCKET`、`MINIO_HOMEIMG_BUCKET`；GitHub provider 未配置 bucket 时默认使用 `rich-text`。
- MinIO provider 返回稳定后端图片 URL，访问时后端重定向到临时签名 URL；GitHub provider 默认返回 jsDelivr CDN URL，显式设置 `RICHTEXT_GITHUB_STORAGE_CDN=raw` 或 `GITHUB_STORAGE_CDN=raw` 时返回 GitHub raw URL。富文本图片使用 GitHub 时配置 `RICHTEXT_STORAGE_PROVIDER=github`、`RICHTEXT_STORAGE_BUCKET` 和对应 `RICHTEXT_GITHUB_STORAGE_*` 环境变量。
- GitHub provider 的 owner/repo 默认指向 `1skyyks1/jack-house-img`，但服务端仍必须配置 `GITHUB_STORAGE_TOKEN`；生产环境建议显式写出 `GITHUB_STORAGE_OWNER` 和 `GITHUB_STORAGE_REPO`。
- 上传成功后端会记录 `rich_text_asset`。帖子正文、活动说明和赛事章节保存时会解析 HTML 中的 `<img src>` 并同步 `rich_text_asset_reference`；编辑器删除图片不会立即删除 GitHub/MinIO 对象，只会在内容保存后移除引用并将无引用资产标记为 `orphaned`。
- 后端 `npm run cleanup:rich-text-assets` 可清理超过保留期的 `uploaded/orphaned` 富文本图片资产；默认 dry-run，生产删除需要传 `--delete` 或设置 `RICHTEXT_ASSET_CLEANUP_DRY_RUN=false`。
- 后端 `npm run backfill:rich-text-assets` 可对历史帖子正文、活动说明和赛事章节做一次性回填；默认 dry-run，只识别本站托管图片 URL，生产写入需要传 `--apply`。
- 新环境需要先执行后端 `npm run migrate:rich-text-assets` 创建富文本图片资产表。

## Pack / Tag / Pack Comment

- `GET /pack`
- `GET /pack/:pack_id`
- `POST /pack`
- `GET /pack/osu/:bid`
- `POST /pack/osu/:bid`
- `PUT /pack/osu/:bid`
- `GET /tag`
- `PUT /tag/:pack_id`
- `POST /tag/:pack_id`
- `GET /packCom/:pack_id`
- `POST /packCom`
- `DELETE /packCom/:comment_id`

V3 注意：

- `/pack` 和 `/pack/:packId` 已迁移。
- `/newPack` 支持 osu 导入和手动外链创建。
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

## Badge / Dashboard / Home Image

- `GET /badge`
- `POST /badge`
- `POST /badge/:id`
- `DELETE /badge/:id`
- `GET /dashboard/home`
- `GET /homeImg/home`
- `GET /homeImg`
- `POST /homeImg`
- `PUT /homeImg/:img_id`
- `DELETE /homeImg/:img_id`

V3 注意：

- `/admin/badges` 和 `/admin/dashboard` 已迁移。
- `homeImg` 仅作为旧协议记录，V3 不迁移后台首页图能力；V3 首页视觉图在 `HomePage.tsx` 中写死 GitHub raw URL，不经过后端上传/压缩。
- 如果未来恢复 home image 管理，应复用 storage provider；旧记录没有 `storage_provider` 时后端读取/删除按 MinIO 兼容，已有 `public_url` / `download_url` 时直接返回该 URL。
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
- `event` 活动系统和 `tournament` 赛事系统是两个领域，不要混用数据模型。
