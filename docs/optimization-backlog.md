# Optimization Backlog

本文件记录迁移 MVP 之后可以逐步推进的小型优化和技术专项。它不是排期，只是避免后续 AI 忘记已讨论过的方向。

## P0: 上传与安全

- 抽象后端 storage provider，先兼容当前 MinIO。
- 为投稿文件补 MIME、扩展名、大小、checksum 校验。
- 富文本图片上传前，先确定 GitHub/MinIO/S3 provider 和 sanitizer 白名单。
- 所有上传失败都要向用户展示后端 `message`。

## P1: 认证

- 规划从 `localStorage.token` 到 httpOnly cookie。
- 后端补 Set-Cookie、logout 清 cookie、CORS credentials、CSRF 策略。
- 前端 axios/query 统一开启 credentials 后再切换。
- 迁移期间确认是否需要兼容旧前端。

## P1: 赛事系统

- 按 [tournament-system.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/tournament-system.md) 分阶段推进。
- 先做公开只读页和报名闭环，再做后台和裁判工作台。

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
