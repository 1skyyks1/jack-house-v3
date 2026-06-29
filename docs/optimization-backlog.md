# Optimization Backlog

本文件记录迁移 MVP 之后可以逐步推进的小型优化和技术专项。它不是排期，只是避免后续 AI 忘记已讨论过的方向。

## 已完成

- 用户管理接口权限收口：`POST /user` 已要求 `ADMIN`；`PUT /user/:user_id` 已拆分 admin 写入和 self-update 字段白名单，普通用户不能创建账号或自助写入 `role/status/email/osu_uid/avatar/user_name` 等敏感字段。
- 用户详情字段脱敏：`GET /user/:user_id` 保持公开个人页可访问，但匿名或普通他人访问不返回 `email` 等管理字段；本人或 `ADMIN` 带有效登录态访问时才返回完整非密码字段。
- 用户列表分页收口：完整 `GET /user` 列表已限制为 `ORG/ADMIN` 且最大 `pageSize=50`；轻量 `/user/search` 需要登录、最短搜索词 2 个字符且最大 `pageSize=20`。
- 修正旧后端 controller 的 `roles` 导入方式：`config/roles.js` 导出 `{ ROLES, ADMIN_PERMISSIONS }`，controller 已统一解构 `ROLES`，避免 `ROLES.ADMIN` 判定失效。
- 存储层抽象：`homeImgController`、`postFileController`、富文本上传、徽章上传和活动 stage 背景图上传已改为调用 `services/storage`，默认继续走 MinIO，并支持用 `*_STORAGE_BUCKET` 和 GitHub repo provider 接入公开图片。
- 存储元数据字段：`post_file`、`home_img`、`badge` 和 `event_stage` 已补 `storage_provider`、`object_key`、`public_url`、`download_url`、`mime_type`；上传文件记录已补 `checksum`。数据库迁移脚本为 `2026-06-29-post-file-checksum.sql` 和 `2026-06-29-badge-event-stage-storage.sql`。
- 数据库迁移执行：当前 `.env` 指向的数据库已通过 `npm run migrate:storage-metadata` 完成 `post_file`、`home_img`、`badge`、`event_stage` 字段添加、`idx_post_file_checksum` 创建和旧 MinIO 记录回填；脚本已验证可重复执行。
- 旧上传记录兼容：历史 `post_file` / `home_img` 如果还没回填 `storage_provider`，运行时会按 MinIO 处理；已有公开 URL 时读取直接返回 URL。
- 投稿文件上传校验：默认 20MB 单文件、100MB 单用户单征稿总大小、扩展名白名单、可选 MIME 白名单和 SHA-256 checksum 持久化已接入。
- 投稿文件兼容创建口收口：普通用户只能走 `/postFile/upload/:post_id`，`POST /postFile` 已限制为 `ORG/ADMIN` 后台登记入口，并校验 post/user、provider、URL、checksum、size、征稿数量上限、单文件大小上限和总大小上限。
- 投稿文件列表安全输出：`GET /postFile/user/:user_id` 保留给个人页展示投稿列表，但后端只返回列表字段，不返回下载信息、对象 key、checksum、note 或审批意见，并限制公开列表 `pageSize <= 20`；下载和审核仍走后台受限接口。
- 上传图片优化：后端已用 `sharp` 在存储前优化并默认转 WebP，覆盖富文本图片、活动 stage 背景图、徽章和旧 homeImg；GIF/SVG/多帧 WebP 保持原样。投稿文件不压缩、不转格式，完整 SHA-256 入库，对象文件名使用短 hash 前缀 + 原扩展名。V3 首页写死的 GitHub raw 图片不经过后端，需要离线压缩源文件。
- 活动 stage 背景图使用专用上传器，默认 1MB，允许 `jpeg/jpg/png/gif/webp`，并会在校验失败时清理临时文件。
- 活动 stage 更新接口已按字段白名单收口，并统一使用 `stage.*` 响应文案。
- httpOnly cookie 认证：后端登录、注册和 osu OAuth callback 已写入 cookie，cookie 写请求已有双提交 CSRF 校验，`/auth/logout` 清理 cookie，V3 axios 已开启 `withCredentials`；生产环境若启用 credentials 但未配置 `CORS_ORIGIN`/`FRONTEND_URL` 会启动失败，`AUTH_COOKIE_SAME_SITE=none` 时强制要求 `AUTH_COOKIE_SECURE=true`。
- V3 去 token 化：V3 已不再读取/写入 `localStorage.token`，axios 不再发送 `Authorization: Bearer`，OAuth 完成页不再要求 URL token；后端默认 `AUTH_LEGACY_BEARER_ENABLED=true` 兼容旧前端，旧前端下线后可设为 `false` 关闭 Bearer、登录响应 token 和 OAuth URL token。
- 富文本图片上传：后端已提供 `/upload/rich-text/image`，V3 Tiptap 编辑器已接 Image extension，支持工具栏选择文件、粘贴图片文件和拖拽图片文件，默认走 `RICHTEXT` storage scope。
- 富文本图片引用追踪基础设施：后端已新增 `rich_text_asset` 和 `rich_text_asset_reference`，上传成功后记录资产，帖子正文、活动说明和赛事章节创建/更新时解析 `<img src>` 并同步 `post_translation`、`event`、`t_section` 引用；不再引用的资产只标记为 `orphaned`，不会由编辑器删除动作立即物理删除远端对象。
- 富文本图片孤儿清理脚本：后端已新增 `npm run cleanup:rich-text-assets`，默认 dry-run，扫描超过 `RICHTEXT_ASSET_CLEANUP_RETENTION_DAYS` 的 `uploaded/orphaned` 资产；显式传 `--delete` 或设置 `RICHTEXT_ASSET_CLEANUP_DRY_RUN=false` 才会删除远端对象和数据库记录。
- 富文本图片历史回填脚本：后端已新增 `npm run backfill:rich-text-assets`，默认 dry-run，扫描现有帖子正文、活动说明和赛事章节 HTML；可识别本站 jsDelivr、GitHub raw 和 `/upload/rich-text/image/:objectName` URL，外部图片跳过，显式传 `--apply` 才写入资产和引用。
- 富文本表格编辑：V3 Tiptap 编辑器已接 Table extension，支持插入表格、追加行/列和删除表格；后端 sanitizer 已允许基础 table 标签和单元格属性。
- 服务端富文本清洗：旧帖子/公告、活动描述和赛事内容保存时均经过后端 sanitizer。
- GitHub provider 真实联调：已用服务端 `.env` token 对 `1skyyks1/jack-house-img` 的 `codex-smoke` 路径完成普通文件上传/删除、富文本图片 WebP 上传/删除和投稿 `.osu` 原扩展名上传/删除；样板和文档可用 `npm run check:secrets` 防止 token 泄漏。
- HTTP 上传 smoke：已在临时后端服务上通过 `/upload/rich-text/image` 和 `/postFile/upload/:post_id` 验收 GitHub 上传链路；富文本图片为 WebP + 16 位 hash 文件名，投稿文件保留原扩展名并使用 16 位 hash 文件名，完整 checksum 入库；测试记录和 GitHub smoke 对象已清理。
- 上传失败 JSON 输出：富文本图片、投稿文件、活动 stage 背景图、徽章和旧 homeImg 上传入口已统一 multer 错误处理，文件过大返回 413 JSON，文件类型/字段错误返回 400 JSON，前端现有 `getErrorMessage` / `MutationErrorAlert` 可展示后端 `message`。

## P0: 上传与安全

- 用真实浏览器操作继续验收富文本图片/表格展示、剪贴板上传、拖拽上传、投稿上传交互、MinIO 代理 URL 和 GitHub provider 配置；当前 Codex 内置浏览器自动化无法设置本地 file input，也无法可靠传递二进制剪贴板项，这部分需要人工验收或引入专用 e2e runner 后再自动化。

## P1: 富文本媒体治理

- 生产环境接入定时调度 `npm run cleanup:rich-text-assets -- --delete`，并按实际内容编辑习惯确认保留期。
- 正式库如需治理历史图片，先执行 `npm run backfill:rich-text-assets` 查看 dry-run 输出，再决定是否执行 `npm run backfill:rich-text-assets -- --apply`。

## P1: 认证

- 根据正式部署域名填写 `AUTH_COOKIE_SAME_SITE`、`AUTH_COOKIE_SECURE` 和 `CORS_ORIGIN` 取值；代码已防止生产环境漏配 CORS origin 和 `SameSite=None` 未启用 Secure。
- 正式部署时继续验证跨站 cookie、CSRF header 和登出清 cookie 行为。
- 如果仍部署旧前端，保持 `AUTH_LEGACY_BEARER_ENABLED=true`；确认只部署 V3 后再改为 `false`。

## P1: 赛事系统

- 首期公开页、报名组队、资格赛、正赛、裁判工作台和后台管理已接入。
- 后续重点是真实赛事内容联调、权限验收、边界数据验收和比赛流程演练。

## P2: 体验与性能

- 大页面继续检查 loading、empty、error、未登录、无权限状态。
- 对大型路由继续拆分懒加载，关注 build chunk warning。
- 图片资源统一尺寸、格式和懒加载策略。
- 移动端优先检查顶栏、列表工具栏、分页、详情页双栏布局。

## P2: 后台效率

- 继续收敛后台表格、筛选、分页、批量操作的共享组件。
- 复杂删除/危险操作继续使用 `AlertDialog`。
- 导出大数据量时确认是否改成后端异步任务。

## P3: 文档治理

- `00-ai-handoff.md` 只记录当前事实和入口。
- 决策写入 `decision-log.md`。
- 未决边界写入 `open-questions.md`。
- 专项长期方案写入独立文档，不继续堆在 handoff。
