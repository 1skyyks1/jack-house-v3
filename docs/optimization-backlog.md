# Optimization Backlog

本文件记录迁移 MVP 之后可以逐步推进的小型优化和技术专项。它不是排期，只是避免后续 AI 忘记已讨论过的方向。

## P0: 上传与安全

- 用真实浏览器操作继续验收富文本图片/表格展示、剪贴板上传、拖拽上传、投稿上传交互、MinIO 代理 URL 和 GitHub provider 配置；当前 Codex 内置浏览器自动化无法设置本地 file input，也无法可靠传递二进制剪贴板项，这部分需要人工验收或引入专用 e2e runner 后再自动化。

## P1: 富文本媒体治理

- 生产环境接入定时调度 `npm run cleanup:rich-text-assets -- --delete`，并按实际内容编辑习惯确认保留期。
- 正式库如需治理历史图片，先执行 `npm run backfill:rich-text-assets` 查看 dry-run 输出，再决定是否执行 `npm run backfill:rich-text-assets -- --apply`。

## P1: 认证

- 根据正式部署域名填写 `AUTH_COOKIE_SAME_SITE`、`AUTH_COOKIE_SECURE` 和 `CORS_ORIGIN` 取值；代码已防止生产环境漏配 CORS origin 和 `SameSite=None` 未启用 Secure。
- 正式部署时继续验证跨站 cookie、CSRF header 和登出清 cookie 行为。
- 只部署 V3 后，继续验证登录响应不含 JWT token、osu OAuth redirect 不含 URL token、写请求都带 `X-CSRF-Token`。

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
