# Open Questions

只保留会影响后续开发边界的问题。已决策内容应移到 `decision-log.md` 或专题文档。

## 赛事系统

- 32 强双败对阵图优先评估 `@g-loot/react-tournament-brackets`，是否能满足 JHC 样式、移动端和交互要求？

## 富文本

- 是否保存 Tiptap JSON，还是长期只存 HTML？
- 图片/表格扩展何时做，使用什么上传协议和 sanitizer 白名单？
- 是否需要服务端保存前清洗 HTML？

## 投稿与上传

- 征稿投稿是否限制文件类型、单文件大小、总大小？
- 活动 stage 背景图是否需要更严格的类型、尺寸和大小限制？当前沿用旧前端 1MB 限制。
- 投稿文件是否全部公开？是否存在仅作者/管理员可下载的需求？
- GitHub 图床仓库使用个人 token、fine-grained PAT，还是 GitHub App？
- 20MB 投稿文件是否接受 GitHub Release assets 方案，还是继续使用 MinIO/S3/R2？
- 文件删除时是否必须物理删除远端对象？

## 认证与安全

- httpOnly cookie 认证专项何时启动？
- 是否需要兼容旧前端一段时间？
- 正式部署是否跨站？如果跨站，需要确认 CORS、SameSite、Secure、CSRF 策略。

## 后端联调

- 旧后端 `eventStageController.updateStage` 引用未定义的 `desc`，真实联调前需要修复。
- 后端错误响应是否要统一 envelope？
- 是否需要 OpenAPI/Zod 作为长期接口合同来源？
