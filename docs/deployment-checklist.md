# Deployment Checklist

本文记录当前推荐的部署检查项，目标环境是：

- 生产环境运行新前端 `jack-house-v3`。
- 后端使用 `jack-house-web/backend` 当前代码。
- 认证只使用 httpOnly cookie + CSRF，不再兼容旧前端 Bearer token。

## 后端环境变量

生产进程必须显式设置：

```env
NODE_ENV=production
CORS_ORIGIN=https://你的新前端域名
FRONTEND_URL=https://你的新前端域名
```

如果前后端同站部署，例如 `https://jackhouse.xyz` 调 `https://api.jackhouse.xyz`，可以使用：

```env
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=true
```

如果还需要本地 V3 调线上后端，需要额外允许本地 origin，并使用跨站 cookie：

```env
CORS_ORIGIN=https://你的新前端域名,http://localhost:5173,http://127.0.0.1:5173
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true
```

`CORS_ORIGIN` 写浏览器地址栏里的 origin，只包含协议、域名和端口，不带路径，不带尾部 `/`。

## 存储环境变量

GitHub 存储 token 只放后端环境变量，不放 V3 前端：

```env
GITHUB_STORAGE_TOKEN=...
GITHUB_STORAGE_OWNER=1skyyks1
GITHUB_STORAGE_REPO=jack-house-img
GITHUB_STORAGE_BRANCH=main
GITHUB_STORAGE_CDN=jsdelivr
```

富文本图片、徽章、活动 stage 背景图和投稿文件可以按 scope 切到 GitHub：

```env
RICHTEXT_STORAGE_PROVIDER=github
RICHTEXT_STORAGE_BUCKET=rich-text
RICHTEXT_GITHUB_STORAGE_BASE_PATH=content

BADGES_STORAGE_PROVIDER=github
BADGES_STORAGE_BUCKET=badges
BADGES_GITHUB_STORAGE_BASE_PATH=content

EVENT_STAGE_BG_STORAGE_PROVIDER=github
EVENT_STAGE_BG_STORAGE_BUCKET=event-stage-bg
EVENT_STAGE_BG_GITHUB_STORAGE_BASE_PATH=content

POSTFILES_STORAGE_PROVIDER=github
POSTFILES_STORAGE_BUCKET=post-files
POSTFILES_GITHUB_STORAGE_BASE_PATH=submissions
```

投稿文件不会压缩、不会转格式；富文本图片、徽章和活动 stage 背景图会走 `sharp` 优化并默认转 WebP。

## 部署前命令

在 `jack-house-web/backend`：

```bash
npm install
npm run migrate:storage-metadata
npm run migrate:rich-text-assets
npm run check:deploy -- --print-summary
npm run check:secrets
```

如果还需要本地 V3 调线上后端，用：

```bash
npm run check:deploy -- --require-local-v3 --print-summary
```

在 `jack-house-v3`：

```bash
pnpm install
pnpm exec tsc -b
pnpm run lint
pnpm run build
```

## 部署后验证

- V3 登录成功后响应不返回 JWT token，浏览器只通过 httpOnly cookie 保持登录态。
- osu OAuth callback URL 不包含 `token` 参数，只使用 `userId` 完成前端状态同步。
- 写请求带 `X-CSRF-Token`；本地 V3 调线上后端时，前端会先通过 `GET /auth/csrf` 读取线上 cookie 里的 CSRF token。
- 浏览器 Network 中跨域响应包含正确的 `Access-Control-Allow-Origin`，且不是 `*`。
- 富文本图片上传返回 jsDelivr URL，并能在正文中显示。
- 投稿上传返回原始 `file_name`，数据库对象名为短 hash 前缀 + 原扩展名，文件内容不被压缩或转格式。
- 个人页投稿列表只展示文件名、上传时间、大小和状态，不展示下载入口和审批意见。
