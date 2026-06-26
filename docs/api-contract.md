# API Contract

V3 第一阶段兼容旧 Express API。页面组件不直接消费原始 axios response，API 层负责 unwrap、类型化和错误归一。

## 基础约定

- API base：开发环境 `VITE_API_BASE_URL=http://127.0.0.1:3000`。
- 认证：当前兼容 `Authorization: Bearer <token>`。
- 语言：`Accept-Language: zh | en`。
- 401：清理前端会话并打开登录流。
- 后端响应 envelope 不完全一致，API 函数需要按接口确认并归一。

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/osu`
- `GET /auth/osu/callback`

V3 注意：

- 登录成功当前仍接收 `{ token, userId }` 以兼容旧后端。
- `/oauth/complete` 处理 URL 参数、toast 反馈和登录后跳转。
- `POST /auth/register` 作为旧接口记录保留；V3 UI 暂不开放 email/password 注册，Register tab 只引导 osu OAuth。

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
- `/admin/users` 可创建/编辑 `user_name`、`avatar`、`password`、`role`、`status`。
- React admin permission key 必须和后端 `ADMIN_PERMISSIONS` 对齐。

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

- `/user/:userId` 投稿文件列表已接旧 `GET /postFile/user/:user_id`。
- 用户侧投稿文件上传和 note 编辑已迁移。
- 后台投稿审核、下载临时 URL、删除和 `.xlsx` 导出在 `/admin/postFiles`。
- 文件类型/大小限制和大数据量导出策略待确认。

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
- 旧后端 `eventStageController.updateStage` 引用未定义 `desc`，真实联调前建议修后端。
- Stage 背景图沿用旧前端 1MB 限制，尺寸/格式规则待确认。

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
- `homeImg` 仅作为旧协议记录，V3 不迁移后台首页图能力。

## Tournament

旧后端和旧前端存在 tournament 路由。迁移 MVP 阶段没有实现赛事页面；后续赛事系统作为独立专项推进，先读 [tournament-system.md](file:///Users/bytedance/jackhouse/jack-house-v3/docs/tournament-system.md)。

注意：

- 不要只因为后端存在接口就一次性铺满所有赛事页面。
- 每个 tournament 接口都需要重新确认权限、错误响应和真实可用性。
- `event` 活动系统和 `tournament` 赛事系统是两个领域，不要混用数据模型。
