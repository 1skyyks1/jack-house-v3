# Domain Model

本文件只记录 V3 前端迁移需要理解的核心实体和枚举。数据库细节以旧后端模型为准。

## User / Role / Badge

`User`

- 主键：`user_id`
- 常用字段：`user_name`、`email`、`avatar`、`role`、`status`、`osu_uid`、`qq`、`discord`
- `role`：0 user、1 organizer、2 admin
- `status`：旧前端按 active/restricted/banned 展示

`Badge`

- 主键：`id`
- 字段：`name`、`url`、`minio_img_name`、`redirect_url`
- 用户和徽章多对多。

注意：

- 系统权限主要看 `User.role` 和 `/permissions`，不要把展示型 `Role` 与权限模型混用。
- 用户自助编辑第一版不开放头像、邮箱、用户名、osu UID。

## Post / Forum / Submission

`Post`

- 主键：`post_id`
- 字段：`user_id`、`type`、`end`、`limit`、`folder_id`
- `type`：0 normal、1 request、2 event post、3 announcement
- 与 `PostTranslation`、`PostFile`、`PostComment` 一对多。

`PostTranslation`

- 字段：`language`、`title`、`content`
- `content` 当前为 HTML 字符串。

`PostFile`

- 字段：`file_id`、`post_id`、`user_id`、`file_name`、`file_url`、`note`、`status`、`feedback`、`size`
- 用于征稿帖投稿。
- `status`：0 pending、1 approved、2 rejected。

注意：

- type 3 公告在后台公告页管理。
- 富文本展示必须统一 sanitizer 和 renderer。

## Pack / Beatmap / Tag

`Pack`

- 主键：`pack_id`
- 常用字段：`artist`、`artist_unicode`、`title`、`title_unicode`、`creator`、`osu_bid`、`other_url`、`type`、`status`、`description`、`cover_id`
- `type`：0 practice、1 collection、2 dan-like、3 other/legacy
- `status` 对应 osu beatmapset 状态。
- 与 `PackMap` 一对多，与 `Tag` 多对多。

`PackMap`

- 字段：`rating`、`length`、`real_length`、`version`、`od`、`hp`、`bpm`、`key_count`、`ln_count`

`Tag`

- 用于图包筛选和详情标签维护。
- V3 按旧前端 tag 顺序和分组逻辑展示。

注意：

- 当前仅 ADMIN 可在详情页刷新 osu 元数据和整体替换标签。
- 图包基础字段编辑尚缺后端协议确认。

## Event

`Event`

- 主键：`id`
- 字段：`name`、`desc`、`start`、`end`
- `desc` 为 HTML 字符串。

`EventStage`

- 字段：`id`、`event_id`、`map_id`、`artist`、`title`、`mapper`、`bg`
- 背景图为 multipart 上传。

`EventScore`

- 用于活动总榜、stage 榜和用户成绩。

注意：

- 这是旧活动系统，不是 tournament 赛事系统。
- Stage 管理当前沿用旧前端批量创建和 1MB 背景图限制。

## Home Image

- 旧模型存在 `HomeImg`，但 V3 不迁移后台配置首页图。
- 不新增 `home-image` entity。

## Tournament

- 旧后端模型集中在 `jack-house-web/backend/models/tournament/*`，V3 前端类型集中在 `src/entities/tournament`。
- 赛事 API 根路径为 `/t`，页面路由为 `/t` 和 `/admin/tournaments/*`。
- 赛事已接入公开页、组队、资格赛、正赛、裁判工作台和后台管理入口。
- 关键领域包括 `Tournament`、`TTeam`、`TPlayer`、`TStaff`、`TSection`、`TRound`、`TMappool`、`TQualMappool`、`TQualScore`、`TMatch`、`TMatchAction`、`TAuditLog`。
- 详细规则、权限、状态机和数据结构见 [tournament-system.md](./tournament-system.md)；正赛流转见 [tournament-bracket-flow.md](./tournament-bracket-flow.md)。
