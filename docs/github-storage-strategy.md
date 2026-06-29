# GitHub Storage Strategy

本文件记录把图片和投稿文件迁移到 GitHub 的可行性判断。当前指定仓库为 `1skyyks1/jack-house-img`。结论先行：GitHub 很适合放少量、公开、管理员控制的静态图片；投稿文件如果确认全部公开且规模可控，也可以先通过同一 storage 抽象写入该仓库，但仍要保留回退到 MinIO/S3/R2 的能力。

## 当前状态

- V3 首页三张图已经使用 GitHub raw 链接。
- 后端已新增 `jack-house-web/backend/services/storage` 存储抽象层，`HOMEIMG`、`RICHTEXT`、`BADGES`、`EVENT_STAGE_BG` 和 `POSTFILES` 默认仍走 MinIO，可通过 `*_STORAGE_PROVIDER=github` 切到 GitHub repo provider。
- 旧后端 `homeImgController` 已改为调用 storage service；如果未来重新启用后台首页图管理，可以通过 `HOMEIMG_STORAGE_PROVIDER=github` 接入 GitHub 仓库存图。
- 投稿文件上传在 `jack-house-web/backend/controllers/post/postFileController.js`，当前流程是：
  - `multer` 接收文件到临时目录。
  - 默认限制 20MB，可通过 `POSTFILE_MAX_SIZE_MB` 调整。
  - 默认按扩展名白名单限制，可通过 `POSTFILE_ALLOWED_EXTENSIONS` 调整；可选用 `POSTFILE_ALLOWED_MIME_TYPES` 进一步收紧 MIME。
  - 校验投稿次数。
  - 不压缩、不转格式，保留原文件内容、原 MIME 和原扩展名。
  - 计算原文件 SHA-256 checksum，写入 `PostFile.checksum` 并在上传响应中返回；数据库需执行 `2026-06-29-post-file-checksum.sql`。
  - 对象文件名使用短 hash 前缀 + 原扩展名，完整 SHA-256 checksum 仍写入数据库，降低重名风险并避免文件名过长。
  - storage service 默认上传到 `MINIO_POSTFILES_BUCKET`，也可配置 `POSTFILES_STORAGE_PROVIDER=github` 写入 GitHub 仓库。
  - `PostFile.file_url` 保存 object key。
  - 下载时通过 storage service 生成下载 URL。
- 普通用户投稿入口固定为 `/postFile/upload/:post_id`；`POST /postFile` 仅保留为 `ORG/ADMIN` 后台登记已有文件记录的兼容入口。

## 官方限制摘要

- 普通 Git 仓库：GitHub 对大于 50MiB 的文件给出警告，阻止大于 100MiB 的文件；浏览器上传文件不能超过 25MiB；仓库建议保持小于 1GB，强烈建议小于 5GB。
- GitHub Contents API：读取 1MB 以内文件功能完整，1MB 到 100MB 只支持 raw/object 的部分能力，大于 100MB 不支持；目录接口还有 1000 文件限制。
- GitHub Pages：发布站点最大 1GB，软带宽限制 100GB/月，并且官方说明 Pages 不是通用免费 Web hosting/CDN。
- GitHub Releases：单个 release 最多 1000 个 assets，每个 asset 小于 2GiB，release 总大小和带宽没有固定上限。

参考官方文档：

- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases

## 方案判断

### 普通 Git 仓库 raw 文件

适合：

- 首页图、赛事 banner、少量装饰资源。
- 管理员上传、公开访问、低频替换。
- 文件较小，且可以接受 Git 历史膨胀。

不适合：

- 用户高频投稿。
- 20MB 文件长期积累。
- 需要权限控制、过期下载、审计、删除合规的文件。
- 需要从浏览器直传，因为 GitHub token 不能暴露给前端。

### GitHub Pages / jsDelivr 类 CDN

适合：

- 为公开静态图片提供更稳定的访问域名。
- 管理员维护的资源库。

不适合：

- 把 GitHub 当无限图床或文件分发系统。
- 需要鉴权、私有文件、下载统计和删除策略的投稿文件。

### GitHub Release assets

适合：

- 20MB 左右、公开、相对不可变的投稿文件实验。
- 后端统一上传，前端只拿下载 URL。
- 需要规避普通 Git 历史膨胀。

风险：

- asset 管理、命名、替换、删除和索引都需要后端封装。
- release 下最多 1000 个 assets，需要按月份、post_id 或投稿批次拆 release。
- GitHub API token、速率限制、错误重试都必须由后端处理。
- 如果未来下载量大或需要私有权限，仍应切回对象存储。

### Git LFS

不建议作为投稿文件方案。它适合版本化大文件，不适合社区站把用户上传当下载分发；带宽、配额、协作成本都会变复杂。

### MinIO / S3 / R2

仍是投稿文件的稳妥方案：

- 支持 presigned URL、权限、过期下载、替换、删除。
- 不污染 Git 历史。
- 能通过 S3-compatible SDK 平滑迁移到 Cloudflare R2、Backblaze B2、Tebi、AWS S3 等。

## 推荐路线

1. 存储层抽象已完成：业务 controller 不再直接依赖 MinIO 上传、删除和下载签名。
2. 管理员控制的公开图片、富文本图片、徽章和活动 stage 背景图已具备 GitHub repo provider 基础能力，建议先用于公开展示图片。
3. 投稿文件按用户要求不压缩、不转格式；如果使用 GitHub repo provider，需要确认投稿文件均可公开、规模可控，并按目录分组管理。对象文件名只用短 hash 前缀，完整 checksum 存数据库。
4. `post_file` 和 `home_img` 已补 `storage_provider`、`object_key`、`public_url`、`download_url`、`mime_type`；`post_file` 已补 `checksum`。
5. 运行时兼容旧记录：如果历史 `post_file` / `home_img` 还没有 `storage_provider`，读取和删除会按 MinIO 处理；如果记录已有 `public_url` 或 `download_url`，读取时直接返回该 URL。
6. 前端上传协议保持 `multipart/form-data`，不要让浏览器直接拿 GitHub token。

## 后端建议结构

位置：`/Users/bytedance/jackhouse/jack-house-web/backend`

- `services/storage/index.js`：根据环境变量选择 provider，并通过 `*_STORAGE_BUCKET` 读取 provider 无关的对象分组。
- `services/storage/minioStorage.js`：封装当前 MinIO 上传、删除、presign。
- `services/storage/githubStorage.js`：用于 GitHub Contents API 上传、删除和公开 URL 生成；默认返回 `https://cdn.jsdelivr.net/gh/1skyyks1/jack-house-img/<objectPath>` 格式的 jsDelivr CDN URL，可通过 `*_GITHUB_STORAGE_CDN=raw` 改回 raw URL。
- `controllers/post/postFileController.js`：只调用 storage service，不关心具体 provider。

当前已实现的 provider 只有 MinIO 和 GitHub Contents API。GitHub Release assets 仍只是投稿文件规模变大后的候选方向；如果要走 Release assets，需要另行实现 provider、release 分组、asset 删除和下载 URL 管理。

## 环境变量

默认不需要新增配置，`HOMEIMG`、`RICHTEXT` 和 `POSTFILES` 都会继续走 MinIO。

如果使用用户指定仓库作为通用 GitHub 存储，通用配置建议为：

- `GITHUB_STORAGE_TOKEN=<服务端 GitHub token>`，必填
- `GITHUB_STORAGE_OWNER=1skyyks1`，代码默认值也是该 owner，生产建议显式配置
- `GITHUB_STORAGE_REPO=jack-house-img`，代码默认值也是该 repo，生产建议显式配置
- `GITHUB_STORAGE_BRANCH=main`
- `GITHUB_STORAGE_CDN=jsdelivr`

如果要让管理员上传的公开首页图写入 GitHub 仓库：

- `HOMEIMG_STORAGE_PROVIDER=github`
- `HOMEIMG_STORAGE_BUCKET=home-img`
- `GITHUB_STORAGE_TOKEN`
- `GITHUB_STORAGE_OWNER=1skyyks1`
- `GITHUB_STORAGE_REPO=jack-house-img`
- `GITHUB_STORAGE_BRANCH=main`
- `GITHUB_STORAGE_BASE_PATH=assets`

如果要让富文本图片写入 GitHub 仓库：

- `RICHTEXT_STORAGE_PROVIDER=github`
- `RICHTEXT_STORAGE_BUCKET=rich-text`
- `RICHTEXT_GITHUB_STORAGE_TOKEN`
- `RICHTEXT_GITHUB_STORAGE_OWNER=1skyyks1`
- `RICHTEXT_GITHUB_STORAGE_REPO=jack-house-img`
- `RICHTEXT_GITHUB_STORAGE_BRANCH=main`
- `RICHTEXT_GITHUB_STORAGE_BASE_PATH=content`

如果要让徽章图片和活动 stage 背景图写入同一 GitHub 仓库：

- `BADGES_STORAGE_PROVIDER=github`
- `BADGES_STORAGE_BUCKET=badges`
- `BADGES_GITHUB_STORAGE_BASE_PATH=content`
- `EVENT_STAGE_BG_STORAGE_PROVIDER=github`
- `EVENT_STAGE_BG_STORAGE_BUCKET=event-stage-bg`
- `EVENT_STAGE_BG_GITHUB_STORAGE_BASE_PATH=content`

如果要让投稿文件也写入同一 GitHub 仓库：

- `POSTFILES_STORAGE_PROVIDER=github`
- `POSTFILES_STORAGE_BUCKET=post-files`
- `POSTFILES_GITHUB_STORAGE_OWNER=1skyyks1`
- `POSTFILES_GITHUB_STORAGE_REPO=jack-house-img`
- `POSTFILES_GITHUB_STORAGE_BRANCH=main`
- `POSTFILES_GITHUB_STORAGE_BASE_PATH=submissions`

如果未配置 `POSTFILES_GITHUB_STORAGE_TOKEN`，会回退使用通用 `GITHUB_STORAGE_TOKEN`。投稿文件不会走 `sharp`，不会转 WebP。

未设置 scope 专用 GitHub 变量时，会回退使用通用 `GITHUB_STORAGE_*`。

也可以为某个 scope 单独覆盖：

- `HOMEIMG_STORAGE_BUCKET`
- `HOMEIMG_GITHUB_STORAGE_TOKEN`
- `HOMEIMG_GITHUB_STORAGE_OWNER`
- `HOMEIMG_GITHUB_STORAGE_REPO`
- `HOMEIMG_GITHUB_STORAGE_BRANCH`
- `HOMEIMG_GITHUB_STORAGE_BASE_PATH`
- `HOMEIMG_GITHUB_STORAGE_PUBLIC_BASE_URL`
- `RICHTEXT_STORAGE_BUCKET`
- `RICHTEXT_GITHUB_STORAGE_TOKEN`
- `RICHTEXT_GITHUB_STORAGE_OWNER`
- `RICHTEXT_GITHUB_STORAGE_REPO`
- `RICHTEXT_GITHUB_STORAGE_BRANCH`
- `RICHTEXT_GITHUB_STORAGE_BASE_PATH`
- `RICHTEXT_GITHUB_STORAGE_PUBLIC_BASE_URL`
- `BADGES_STORAGE_BUCKET`
- `BADGES_GITHUB_STORAGE_TOKEN`
- `BADGES_GITHUB_STORAGE_OWNER`
- `BADGES_GITHUB_STORAGE_REPO`
- `BADGES_GITHUB_STORAGE_BRANCH`
- `BADGES_GITHUB_STORAGE_BASE_PATH`
- `BADGES_GITHUB_STORAGE_PUBLIC_BASE_URL`
- `EVENT_STAGE_BG_STORAGE_BUCKET`
- `EVENT_STAGE_BG_GITHUB_STORAGE_TOKEN`
- `EVENT_STAGE_BG_GITHUB_STORAGE_OWNER`
- `EVENT_STAGE_BG_GITHUB_STORAGE_REPO`
- `EVENT_STAGE_BG_GITHUB_STORAGE_BRANCH`
- `EVENT_STAGE_BG_GITHUB_STORAGE_BASE_PATH`
- `EVENT_STAGE_BG_GITHUB_STORAGE_PUBLIC_BASE_URL`
- `POSTFILES_STORAGE_BUCKET`
- `POSTFILES_GITHUB_STORAGE_TOKEN`
- `POSTFILES_GITHUB_STORAGE_OWNER`
- `POSTFILES_GITHUB_STORAGE_REPO`
- `POSTFILES_GITHUB_STORAGE_BRANCH`
- `POSTFILES_GITHUB_STORAGE_BASE_PATH`
- `POSTFILES_GITHUB_STORAGE_PUBLIC_BASE_URL`
- `POSTFILES_GITHUB_STORAGE_CDN`
- `POSTFILE_MAX_SIZE_MB`
- `POSTFILE_MAX_TOTAL_SIZE_MB`
- `POSTFILE_ALLOWED_EXTENSIONS`
- `POSTFILE_ALLOWED_MIME_TYPES`
- `EVENT_STAGE_BG_MAX_SIZE_MB`

相关数据库迁移：

- `2026-06-29-post-file-checksum.sql`：为 `post_file` 和 `home_img` 补存储元数据字段，并为 `post_file` 补 SHA-256 checksum。
- `2026-06-29-badge-event-stage-storage.sql`：为 `badge` 和 `event_stage` 补存储元数据字段，并回填旧 MinIO object key。
- 迁移 SQL 会把旧记录回填为 `storage_provider='minio'`、`object_key=<旧文件名>`；代码也保留了未回填旧记录的 MinIO fallback，但正式环境仍应执行迁移，避免后续查询和导出缺少元数据。

注意：GitHub token 只允许放在 `jack-house-web/backend` 服务端环境变量里，不能下发到 `jack-house-v3` 浏览器端。

后端已补充 `/Users/bytedance/jackhouse/jack-house-web/backend/.env.example`，包含 GitHub 存储、投稿限制、富文本图片压缩和 cookie auth 的示例配置。

后端也已补充 `npm run migrate:storage-metadata`，用于幂等迁移 `post_file`、`home_img`、`badge`、`event_stage` 的存储元数据字段。当前 `.env` 指向的数据库已经执行并复验通过。

## 前端影响

位置：`/Users/bytedance/jackhouse/jack-house-v3`

- 上传 UI 暂时不需要知道 provider。
- 展示层只读后端返回的 URL。
- 失败提示必须展示后端 `message`，统一走 `getErrorMessage` 和 Sonner/AppAlert。
- 富文本图片上传已接入 `/upload/rich-text/image`，默认使用 `RICHTEXT` storage scope；如果配置 `RICHTEXT_STORAGE_PROVIDER=github`，可走 GitHub repo provider 返回公开 jsDelivr URL。未配置 `RICHTEXT_STORAGE_BUCKET` 时，GitHub provider 默认写入 `rich-text` 分组。
- V3 编辑器已经支持工具栏选择文件、粘贴剪贴板图片文件和拖拽图片文件，三者都经后端代理上传，不在浏览器端暴露 GitHub token。
- 富文本图片上传后会落库到 `rich_text_asset`，帖子正文、活动说明和赛事章节保存时同步 `rich_text_asset_reference`；从编辑器删除图片不会立即删除 GitHub 文件，而是让无引用资产进入 `orphaned` 状态。后端 `npm run cleanup:rich-text-assets` 可扫描超过保留期的 `uploaded/orphaned` 资产，默认 dry-run；生产定时任务显式传 `--delete` 后才会删除 GitHub/MinIO 对象和数据库记录。
- 历史富文本图片可用 `npm run backfill:rich-text-assets` 回填资产和引用；脚本默认 dry-run，只识别 `1skyyks1/jack-house-img` 的 jsDelivr/GitHub raw URL 和后端富文本代理 URL，外部图片不会纳入托管资产；确认后传 `--apply`。
- 后端公开展示图片会在存储前用 `sharp` 优化并默认转 WebP；GIF、SVG 和多帧 WebP 不重编码。相关入口包括富文本图片、活动 stage 背景图、徽章和旧 homeImg。投稿文件不压缩、不改文件类型。
- V3 首页三张视觉图是 `HomePage.tsx` 中的 GitHub raw 静态 URL，不经过后端；这类图片需要在替换 GitHub 源文件前离线压缩，或未来改成走后端上传入口。

## 图片优化环境变量

- `IMAGE_OPTIMIZE_ENABLED=false`：关闭后端图片优化。
- `IMAGE_OPTIMIZE_MAX_WIDTH=2560`
- `IMAGE_OPTIMIZE_MAX_HEIGHT=2560`
- `IMAGE_OPTIMIZE_JPEG_QUALITY=82`
- `IMAGE_OPTIMIZE_PNG_QUALITY=90`
- `IMAGE_OPTIMIZE_WEBP_QUALITY=82`
- `IMAGE_OPTIMIZE_CONVERT_WEBP=false`：关闭自动转 WebP，仅保留同格式优化。

质量参数会被限制在 `1-100`；最大宽高必须是正整数，非法值会回退到默认值。同格式压缩结果如果大于等于原文件，后端会保留原图；转 WebP 时会使用 WebP 输出。

## 待确认问题

- 投稿文件写入 GitHub 仓库后是否接受全部公开？是否仍有仅作者/管理员可下载的需求？
- 单文件最大 20MB 是硬限制还是经验值？
- 允许哪些 MIME/扩展名？
- 月上传量和月下载量预估是多少？
- 用户删除投稿时，物理文件是否必须删除？
- 是否需要基于 checksum 做去重或重复上传提示？
- GitHub 图床仓库是否由个人 token 维护，还是改成 GitHub App？
- 是否接受 Release assets 的公开下载链接暴露真实仓库？
