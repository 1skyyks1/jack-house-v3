# Deployment Checklist

本文记录当前推荐的部署检查项，目标环境是：

- 生产环境仍运行旧前端 `jack-house-web/frontend`。
- 后端使用 `jack-house-web/backend` 当前代码。
- 本地调试使用新前端 `jack-house-v3` 连接线上后端。

## 后端环境变量

旧前端仍依赖 `localStorage.token` 和 `Authorization: Bearer`，因此线上后端必须保留：

```env
NODE_ENV=production
AUTH_LEGACY_BEARER_ENABLED=true
```

生产环境必须显式配置 CORS origin。`CORS_ORIGIN` 写浏览器地址栏里的 origin，只包含协议、域名和端口，不带路径，不带尾部 `/`：

```env
CORS_ORIGIN=https://旧前端生产域名,http://localhost:5173,http://127.0.0.1:5173
```

如果本地 V3 要登录线上后端，线上后端 cookie 必须允许跨站 HTTPS：

```env
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true
```

如果只是同站生产部署且不需要本地 V3 登录线上后端，可以使用 `AUTH_COOKIE_SAME_SITE=lax`；但当前“旧前端生产 + V3 本地测试”组合建议直接使用 `none + secure`。

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
npm run check:deploy -- --profile=legacy-v3 --print-summary
npm run check:secrets
```

在 `jack-house-v3`：

```bash
pnpm install
pnpm exec tsc -b
pnpm run lint
pnpm run build
```

## 部署后验证

- 旧前端生产登录成功，响应里仍有 `token`，后续接口继续带 `Authorization: Bearer`。
- 旧前端退出登录只清本地 token，不依赖 `/auth/logout`。
- 本地 V3 `.env` 设置 `VITE_API_BASE_URL=https://线上后端域名` 后，可以登录并调用需要 cookie 的接口。
- 浏览器 Network 中跨域响应包含正确的 `Access-Control-Allow-Origin`，且不是 `*`。
- 富文本图片上传返回 jsDelivr URL，并能在正文中显示。
- 投稿上传返回原始 `file_name`，数据库对象名为短 hash 前缀 + 原扩展名，文件内容不被压缩或转格式。
- 个人页投稿列表只展示文件名、上传时间、大小和状态，不展示下载入口和审批意见。

## 切到纯 V3 后

旧前端下线后，可以把后端改为：

```env
AUTH_LEGACY_BEARER_ENABLED=false
```

改完后需要验证登录响应不再返回 `token`，osu OAuth redirect 不再带 URL token，写请求必须带 `X-CSRF-Token`。
