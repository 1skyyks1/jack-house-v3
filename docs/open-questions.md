# Open Questions

只保留会影响后续开发边界的问题。已决策内容应移到 `decision-log.md` 或专题文档。

## 赛事系统

- 32 强双败对阵图优先评估 `@g-loot/react-tournament-brackets`，是否能满足 JHC 样式、移动端和交互要求？

## 富文本

- 是否保存 Tiptap JSON，还是长期只存 HTML？

## 投稿与上传

- 投稿文件是否全部公开？是否存在仅作者/管理员可下载的需求？
- GitHub 图床仓库使用个人 token、fine-grained PAT，还是 GitHub App？
- 投稿文件写入 `1skyyks1/jack-house-img` 普通仓库后，月上传量、仓库体积、公开下载和删除策略是否能长期接受？如果不能，回退 MinIO/S3/R2。
- 文件删除时是否必须物理删除远端对象？

## 后端联调

- 后端错误响应是否要统一 envelope？
- 是否需要 OpenAPI/Zod 作为长期接口合同来源？
