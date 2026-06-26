# GitHub Storage Strategy

本文件记录把图片和投稿文件迁移到 GitHub 的可行性判断。结论先行：GitHub 很适合放少量、公开、管理员控制的静态图片；不建议把用户投稿文件直接写入普通 Git 仓库。20MB 左右的投稿文件如果要尝试 GitHub，应该通过后端抽象到 GitHub Release assets，并保留回退到 MinIO/S3/R2 的能力。

## 当前状态

- V3 首页三张图已经使用 GitHub raw 链接。
- 旧后端 `homeImgController` 仍有 MinIO 首页图逻辑，但 V3 不迁移 `/admin/homeImgs`。
- 投稿文件上传在 `jack-house-web/backend/controllers/post/postFileController.js`，当前流程是：
  - `multer` 接收文件到临时目录。
  - 校验投稿次数。
  - `config/minio.js` 上传到 `MINIO_POSTFILES_BUCKET`。
  - `PostFile.file_url` 保存 MinIO object key。
  - 下载时生成 24 小时 presigned URL。

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

1. 把存储层抽象出来，不让业务 controller 直接依赖 MinIO。
2. 管理员控制的公开图片先支持 GitHub repo provider。
3. 投稿文件先保留 MinIO provider，同时做 GitHub Release provider 的小规模实验。
4. 数据库记录 `storage_provider`、`object_key`、`public_url`、`download_url`、`mime_type`、`size`、`checksum`。
5. 前端上传协议保持 `multipart/form-data`，不要让浏览器直接拿 GitHub token。

## 后端建议结构

位置：`/Users/bytedance/jackhouse/jack-house-web/backend`

- `services/storage/index.js`：根据环境变量选择 provider。
- `services/storage/minioProvider.js`：封装当前 MinIO 上传、删除、presign。
- `services/storage/githubRepoProvider.js`：用于公开图片。
- `services/storage/githubReleaseProvider.js`：用于 20MB 投稿文件实验。
- `controllers/post/postFileController.js`：只调用 storage service，不关心具体 provider。

## 前端影响

位置：`/Users/bytedance/jackhouse/jack-house-v3`

- 上传 UI 暂时不需要知道 provider。
- 展示层只读后端返回的 URL。
- 失败提示必须展示后端 `message`，统一走 `getErrorMessage` 和 Sonner/AppAlert。
- 图片上传能力接入富文本前，先完成后端 provider、MIME 白名单和 sanitizer 白名单。

## 待确认问题

- 投稿文件是否全部公开？是否有仅作者/管理员可下载的需求？
- 单文件最大 20MB 是硬限制还是经验值？
- 允许哪些 MIME/扩展名？
- 月上传量和月下载量预估是多少？
- 用户删除投稿时，物理文件是否必须删除？
- 文件是否需要 checksum 去重？
- GitHub 图床仓库是否由个人 token 维护，还是改成 GitHub App？
- 是否接受 Release assets 的公开下载链接暴露真实仓库？
