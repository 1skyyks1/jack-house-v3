# Tournament Technical Plan

本文是 JH 赛事系统的完整技术方案，面向后续 AI 和开发者。它记录“怎么实现”，不再展开长篇讨论过程；已确定的产品决策见 `decision-log.md`，领域背景见 `tournament-system.md`，架构图见 `tournament-architecture.md`。

## 1. 项目边界

### 仓库

- 前端：`/Users/bytedance/jackhouse/jack-house-v3`
- 后端：`/Users/bytedance/jackhouse/jack-house-web/backend`
- 旧前端参考：`/Users/bytedance/jackhouse/jack-house-web/frontend`

### 首期目标

- 建立独立于旧 `event` 活动系统的 tournament 赛事系统。
- 支持赛事官网、规则展示、报名组队、staff、资格赛、32 强双败正赛、裁判工作台和后台管理。
- 沿用 Express + Sequelize + MariaDB，不在首期做后端 TypeScript 化、ORM 替换或独立后端仓库。
- 前端用 React + TypeScript + shadcn/ui 实现用户侧和后台侧。

### 非目标

- 不把旧活动 `event` 改造成赛事系统。
- 不建立第二套赛事账号体系。
- 不支持非站内 user 作为正式 player/staff 身份。
- 不做站内约战聊天或排期协商。
- 不公开资格赛两轮原始成绩详情。
- 不在首期支持任意赛制生成器。

## 2. 核心产品规则

### 赛事

- 赛事按“届”建模，JHC2026 和 JHC2027 是两个独立 tournament。
- `acronym` 用作公开 URL，例如 `/t/JHC2026`；修改 acronym 后旧地址失效。
- 赛事状态主要由时间字段推导，host 可以在后台越过当前时间状态修正数据。
- 创建赛事需要全站 admin 权限。
- 创建者自动成为 creator host。
- 只有 creator host 或全站 admin 可以删除赛事、添加其他 host。
- 普通 host 可以管理赛事内容、报名、staff、比赛数据，但不能添加 host 或删除赛事。

### 身份

- `User` 是唯一身份来源。
- `TPlayer` 表示某个 user 在某届赛事某支 team 中的参赛记录。
- `TStaff` 表示某个 user 在某届赛事中的工作人员角色。
- 同一个 tournament 中，同一个 user 只能有一个有效 player。
- player 保存报名时的用户名、头像、联系方式、timezone、remark 等快照。
- `User.user_id` 与 `User.osu_uid` 一一对应，`osu_uid` 不需要在 player 上做快照。
- 公开历史页面、队伍页、成绩页、bracket 展示 player 快照。
- 管理后台同时展示 player 快照和当前 User 信息。
- 历史赛事补录遇到非站内选手时，创建导入用占位 User 后再挂 player。

### 报名与组队

- 单人也属于 team，因为 team 承载队名、头像、邀请码、队长、锁定状态等信息。
- 有有效 team/player 即视为报名，不另建 registration 表。
- 报名期内，用户可退出当前 team 再加入其他 team。
- 队伍人数首期 1-2 人，tournament 保留 `team_size_min` / `team_size_max`。
- 支持私密队伍和公开队伍，两种都在组队大厅展示。
- 私密队伍通过邀请码加入；公开队伍可以直接加入。
- 队长可以重置邀请码、踢出队员、提交队伍信息。
- 普通用户的组队、退队、踢人、提交仅限报名期。
- 队伍通过后普通用户不能修改队伍信息，host 可后台修正。
- 队伍没有 rejected 状态；官方审查针对 player。
- `review_failed` 只影响正赛资格，用户侧不公开标红。
- 资格赛只要报名即可参加，player 审查结果不影响资格赛。

### Staff

首期角色：

- `host`
- `pooler`
- `referee`
- `streamer`
- `commentator`

规则：

- 一个 user 可以拥有多个 staff role，用多行记录表达。
- `(t_id, user_id, role)` 唯一。
- 所有 staff 默认公开展示，并按 role 分组。
- 只有 staff 才能看到赛事后台。
- 首期所有 staff 都不允许参赛。
- 给已参赛 user 添加 staff 时，后端应阻止并提示 host 手动处理。

### 内容与规则

- 赛事规则、介绍、奖项、FAQ 等内容放在 tournament 自己的内容表，不复用 forum/post。
- 赛事规则主格式是 Markdown，便于迁移 osu 侧规则文档。
- 保存时保留 `source_markdown`，并生成 `content_html` 作为前台渲染缓存。
- 前台使用 `RichTextRenderer` 渲染 `content_html`，使用 `RichTextToc` 生成目录。
- Tiptap 可用于其他富文本场景，但规则页不要求用 Tiptap 重写。
- 不承诺 Markdown 与 Tiptap 富文本的无损双向转换。

### 资格赛

- 每队一人上场。
- 资格赛图池固定 stage 1-7，不需要正赛 type/mod。
- 每队资格赛只绑定一个 osu MP。
- qualifier MP ID 只允许 referee/host 填写或修改。
- 同一个 MP 中可打两轮；第二轮可以不打或只重打部分图。
- 每张图取两轮最高分，总分为每图最高分相加。
- 用户侧展示榜单、总分、队伍、osu MP 外链。
- 管理端展示 import log、失败原因、原始导入成绩和手动修正记录。

### 正赛

- 首期固定 32 强双败制。
- 使用 folded seeding：#1 vs #32、#2 vs #31、#3 vs #30。
- 需要支持 grand final reset：败者组冠军赢下第一场 GF 后，显示预生成的 reset final。
- round 固定配置 FT/BO，不做单 match override。
- 正赛 mappool type 固定为 `FU` / `DS` / `MD` / `LT` / `AC` / `QS` / `MN` / `RM` / `MX` / `DF` / `TB`。
- 每场正赛只绑定一个 osu MP，MP ID 可修改。
- 手动创建/更新 match 时，后端校验 round、team、winner 都属于当前 tournament 和当前 match。
- match 状态首期只区分未开始和完成，旧值 `1` 作为兼容。
- WBD/FF 不细分原因，只保留 note。
- WBD 优先级高于普通比分：winner 得到 round FT 分数，loser 记 `-1`。
- osu MP 拉分后默认按分数判胜；referee 可手动改胜方，但必须提示并写审计。

### 裁判工作台

- referee 输入双方 roll 点。
- 高点先 protect，低点再 protect。
- 低点先 ban，高点再 ban。
- 高点先 pick，低点再 pick，后续轮流 pick。
- 不做 websocket 实时同步。
- 修改后 2 秒 debounce 自动保存。
- 不做 undo，选错时直接修改对应 action。
- 允许修改历史 protect/ban/pick，但如果导致冲突则禁止保存。

冲突规则：

- 已 protect 的图不能 ban。
- 已 ban 的图不能 pick。
- 已 pick 的图不能再次 pick。
- 双方不能 protect 同一图。

## 3. 后端模型

后端优先升级旧 tournament 表和模型，不另建平行模型。字段名尽量沿用旧后端实际命名，例如 `t_id`。

### Tournament

模型：`models/tournament/tournament.js`

关键字段：

- `id`
- `name`
- `acronym`
- `banner`
- `team_size_min`
- `team_size_max`
- `qual_top_n`
- `reg_start`
- `reg_end`
- `qual_start`
- `qual_end`
- `status`
- `created_by`
- `created_time`
- `updated_time`

规则：

- `created_by` 是 creator host 权限来源。
- 创建赛事时必须同步创建 creator host staff 记录。
- 状态展示建议由时间推导，旧 `status` 只作为兼容和后台 override 辅助。

### TSection

模型：`models/tournament/tSection.js`

用途：

- 保存 tournament 自有内容块。
- 支持规则 Markdown source 和 HTML 缓存。

字段：

- `id`
- `t_id`
- `type`：`rules` / `description` / `prize` / `faq`
- `title`
- `format`：`markdown` / `html`
- `source_markdown`
- `content_html`
- `sort_order`
- `updated_by`
- `created_time`
- `updated_time`

实现要求：

- 公开接口只返回展示必要字段。
- 管理接口返回 `source_markdown`。
- 后端保存时生成 `content_html`。
- 后端使用 `markdown-it` 渲染 Markdown/GFM 风格内容，并用 `sanitize-html` 白名单清洗后保存 `content_html`。

### TTeam

模型：`models/tournament/tTeam.js`

字段：

- `id`
- `t_id`
- `name`
- `display_name`
- `avatar`
- `is_open`
- `invite_code`
- `captain_id`，兼容旧逻辑，指向 user
- `captain_player_id`，长期逻辑，指向 player
- `status`
- `qual_mp_id`
- `qual_rank`
- `qual_score`
- `locked_at`
- `created_time`
- `updated_time`

状态建议：

- `0`：created / pending
- `1`：approved
- `2`：reserved / legacy submitted-ish
- `3`：locked

实现要求：

- 新逻辑以 `captain_player_id` 判断队长。
- `captain_id` 暂时保留，避免旧 include 和旧接口直接崩。
- 加入公开队伍使用 `team_id`。
- 加入私密队伍使用 `invite_code`。

### TPlayer

模型：`models/tournament/tPlayer.js`

字段：

- `id`
- `team_id`
- `t_id`
- `user_id`
- `user_name_snapshot`
- `avatar_snapshot`
- `contact_qq`
- `contact_discord`
- `timezone`
- `remark`
- `review_status`
- `is_captain`
- `created_time`

`review_status`：

- `review_pending`
- `review_passed`
- `review_failed`

索引：

- `(t_id, user_id)` 唯一
- `(team_id, user_id)`
- `review_status`

实现要求：

- 创建/加入队伍时写入 `t_id` 和 player 快照。
- 写入时校验 `player.t_id === team.t_id`。
- 创建/加入队伍时拒绝当前 tournament 已是 staff 的 user。
- 报名期退队会物理删除旧 player，数据库层必须加唯一约束 `(t_id, user_id)`。
- 成绩拉取通过 `player.user_id -> User.osu_uid`。

### TStaff

模型：`models/tournament/tStaff.js`

字段：

- `id`
- `t_id`
- `user_id`
- `role`
- `created_time`

约束：

- `(t_id, user_id, role)` 唯一。

权限：

- 添加 host：creator host 或全站 admin。
- 删除赛事：creator host 或全站 admin。
- 普通赛事后台管理：staff，其中具体写操作按 role 收紧。

### TRound

模型：`models/tournament/tRound.js`

字段：

- `id`
- `t_id`
- `name`
- `bracket_type`
- `first_to`
- `order`
- `start_time`
- `end_time`

实现要求：

- `first_to` 是 round 级 FT 配置。
- bracket 生成后 round 不应随意删除，必要时走重建流程。
- 后端创建/更新 round 时校验 `bracket_type`、`first_to`、`order` 和时间字段，并写 audit。
- 删除 round 前必须确认没有关联 match 和 mappool，否则拒绝删除。

### TMappool

模型：`models/tournament/tMappool.js`

字段：

- `id`
- `round_id`
- `type`
- `map_id`
- `artist`
- `title`
- `mapper`

实现要求：

- 正赛 type 只允许固定枚举。
- 资格赛图池继续使用 `TQualMappool`，不混入正赛 `TMappool`。
- 写入 round mappool 时校验 round 属于当前 tournament、type 属于首期枚举、同一 round 不重复添加同一 beatmap；删除时校验 map 归属当前 tournament。

### TQualMappool

模型：`models/tournament/tQualMappool.js`

字段：

- `id`
- `t_id`
- `stage`
- `map_id`
- `artist`
- `title`
- `mapper`

实现要求：

- stage 固定 1-7。
- 同一 tournament 中 `(t_id, index)` 和 `(t_id, map_id)` 必须唯一。
- 后端写入资格赛图池时校验 stage、beatmap、权重和必填元数据，并写 audit。
- 删除资格赛图前必须确认没有关联成绩，否则拒绝删除。
- 排名计算按 team + map 取最高分。

### TQualScore

模型：`models/tournament/tQualScore.js`

字段：

- `id`
- `team_id`
- `player_id`
- `map_id`
- `score`
- `attempt_no`
- `source_mp_id`
- `source_game_id`
- `import_id`
- `is_manual`
- `created_time`

实现要求：

- 导入时建议保留每次有效成绩行，而不是只覆盖最高分。
- 排名计算时按 `(team_id, map_id)` 取最高分。
- 手动修正写 `is_manual = true` 并记录 audit。
- 重复导入同一 `source_game_id + team_id + player_id + map_id` 时应跳过或更新，不应制造重复有效行。

### TQualImport

模型：`models/tournament/tQualImport.js`

用途：

- 记录资格赛 MP 导入任务。

字段：

- `id`
- `t_id`
- `team_id`
- `mp_id`
- `status`：`running` / `success` / `failed`
- `message`
- `imported_by`
- `created_time`

实现要求：

- 每次导入开始先创建 import log。
- 导入成功写入成功状态和统计信息。
- 导入失败写入失败状态和错误信息。

### TMatch

模型：`models/tournament/tMatch.js`

字段：

- `id`
- `round_id`
- `mp_id`
- `team1_id`
- `team2_id`
- `team1_roll`
- `team2_roll`
- `team1_score`
- `team2_score`
- `winner_id`
- `result_type`：`normal` / `wbd` / `ff`
- `result_note`
- `winner_overridden`
- `is_possible`
- `bracket_group`
- `round_no`
- `slot_no`
- `source_match_1_id`
- `source_match_1_result`
- `source_match_2_id`
- `source_match_2_result`
- `hidden_until_match_id`
- `scheduled_time`
- `status`

实现要求：

- `status = 0` 表示未开始。
- `status = 2` 表示完成。
- `status = 1` 只作为旧值兼容。
- `is_possible` 可用于隐藏 reset final。
- `bracket_group/round_no/slot_no` 用于前端稳定绘制 bracket。
- `source_match_*` 用于表达后续场次参赛队来源。
- `hidden_until_match_id` 用于 reset final 这类预生成但暂时隐藏的场次。

### TMatchAction

模型：`models/tournament/tMatchAction.js`

字段建议：

- `id`
- `match_id`
- `action_type`：`roll` / `protect` / `ban` / `pick` / `score_import` / `score_edit` / `note`
- `team_id`
- `map_id`
- `value_json`
- `sort_order`
- `created_by`
- `created_time`
- `updated_time`

实现要求：

- referee workbench 读写 action timeline。
- 修改历史 action 时必须重算全局冲突。
- 不需要 undo 表达；错误操作直接修改原 action。

### TAuditLog

模型：`models/tournament/tAuditLog.js`

字段：

- `id`
- `t_id`
- `entity_type`
- `entity_id`
- `action`
- `old_value_json`
- `new_value_json`
- `operator_id`
- `created_time`

必须审计：

- creator host / 全站 admin override。
- 内容块创建、修改、删除。
- 队伍提交、锁定、状态变更。
- 队伍锁定后的 host 修正。
- player 审查状态变更。
- qualifier 导入和手动修正。
- 正赛成绩导入和手动改胜方。
- WBD/FF 设置。
- bracket 生成和手动调整。

## 4. 数据迁移

SQL 草案：

- `/Users/bytedance/jackhouse/jack-house-web/backend/sql/2026-06-19-tournament-player-team-prep.sql`
- `/Users/bytedance/jackhouse/jack-house-web/backend/sql/2026-06-22-tournament-qualifier-lock.sql`

执行原则：

- 不直接在生产库首次运行。
- 先备份，后测试库演练。
- 先加 nullable columns，再回填；确认无重复 player 后立即加 `(t_id, user_id)` unique，`t_id` 的 NOT NULL 可按旧数据清理进度执行。
- SQL 草案可能包含重复 index 风险，真实执行前需要按当前库结构检查。

建议顺序：

1. 为 `t_player` 增加 `t_id`、快照、联系方式、timezone、remark、review_status。
2. 回填 `t_player.t_id = t_team.t_id`。
3. 回填 player 快照。
4. 为 `t_team` 增加 `avatar`、`is_open`、`captain_player_id`、`locked_at`。
5. 回填 `captain_player_id`。
6. 为 `tournament` 增加 `created_by`。
7. 从已有 host staff 中回填 creator，无法判断时人工指定。
8. 为 `t_match` 增加 result 字段。
9. 创建 `t_section`、`t_audit_log`、`t_qual_import`。
10. 为 `t_qual_score` 增加 import/source 字段。
11. 为 `tournament` 增加 `qual_locked_at`、`qual_locked_by`、`qual_locked_top_n`。
12. 验证无重复有效 player 后，添加 `(t_id, user_id)` unique。

## 5. 后端分层

目标结构：

- controller：参数读取、调用 service、返回 response。
- service：权限校验、事务、状态机、业务规则、audit。
- model：数据结构和关联。
- middleware：认证和粗粒度角色检查。

建议 service：

- `tournamentService.js`
- `teamService.js`
- `staffService.js`
- `contentService.js`
- `qualifierService.js`
- `bracketService.js`
- `refereeService.js`
- `auditService.js`

必须进入 service 的规则：

- tournament id/acronym 解析。
- creator host 判断。
- staff 参赛互斥。
- 同赛事唯一 player 校验。
- player 快照写入。
- 报名窗口校验。
- 队伍锁定后修改限制。
- player review 对正赛资格的影响。
- qualifier 两轮每图取高。
- WBD FT:-1 写入。
- 手动改胜方的提醒和审计。
- ban/protect/pick 冲突检测。

## 6. API 方案

路径沿用旧 `/tournament`，前端页面使用 `/t`。

### 公开接口

- `GET /tournament`
- `GET /tournament/:tid`
- `GET /tournament/:tid/sections`
- `GET /tournament/:tid/teams`
- `GET /tournament/:tid/staff`
- `GET /tournament/:tid/qualifier`
- `GET /tournament/:tid/bracket`
- `GET /tournament/:tid/matches/:matchId`

### 报名与队伍

- `POST /tournament/:tid/teams`
- `POST /tournament/:tid/teams/:teamId/join`
- `POST /tournament/:tid/teams/join-by-code`
- `POST /tournament/:tid/teams/:teamId/leave`
- `POST /tournament/:tid/teams/:teamId/kick`
- `POST /tournament/:tid/teams/:teamId/reset-invite`
- `POST /tournament/:tid/teams/:teamId/submit`
- `PATCH /tournament/:tid/players/:playerId`

### 后台配置

- `POST /tournament`
- `PATCH /tournament/:tid`
- `DELETE /tournament/:tid`
- `POST /tournament/:tid/staff`
- `DELETE /tournament/:tid/staff/:staffId`
- `POST /tournament/:tid/sections`
- `PATCH /tournament/:tid/sections/:sectionId`
- `DELETE /tournament/:tid/sections/:sectionId`
- `GET /tournament/:tid/audit-logs`

权限：

- 创建赛事：全站 admin。
- 删除赛事：creator host 或全站 admin。
- 添加 host：creator host 或全站 admin。
- 内容、队伍、资格赛配置：host。
- 裁判台和成绩导入：host/referee。

### 资格赛

- `GET /tournament/:tid/qualifier/mappool`
- `POST /tournament/:tid/qualifier/mappool`
- `PUT /tournament/:tid/qualifier/mappool/:mapId`
- `DELETE /tournament/:tid/qualifier/mappool/:mapId`
- `GET /tournament/:tid/qualifier/scores`
- `GET /tournament/:tid/qualifier/imports`
- `POST /tournament/:tid/qualifier/fetch-scores`
- `POST /tournament/:tid/qualifier/calculate-ranking`
- `GET /tournament/:tid/qualifier/ranking`
- `PUT /tournament/:tid/qualifier/scores/:scoreId`
- `POST /tournament/:tid/qualifier/lock`

导入 payload：

```json
{
  "team_id": 12,
  "mp_id": 123456789
}
```

排名计算：

- 查询 team 的所有有效 qualifier score。
- 对每个 `(team_id, map_id)` 取最高分。
- 将每队每图最高分相加。
- 按总分倒序生成 rank。
- 回写 `team.qual_score` 和 `team.qual_rank`。

### 正赛

- `POST /tournament/:tid/bracket/generate`
- `GET /tournament/:tid/bracket`
- `PATCH /tournament/:tid/matches/:matchId/schedule`
- `PATCH /tournament/:tid/matches/:matchId/mp`
- `POST /tournament/:tid/matches/:matchId/import-score`
- `PATCH /tournament/:tid/matches/:matchId/result`
- `POST /tournament/:tid/matches/:matchId/actions`
- `PATCH /tournament/:tid/matches/:matchId/actions/:actionId`

WBD payload：

```json
{
  "result_type": "wbd",
  "winner_id": 123,
  "result_note": "Opponent no show"
}
```

WBD 写入：

- `winner_id = payload.winner_id`
- winner score = `round.first_to`
- loser score = `-1`
- `status = 2`
- 写入 audit log。

## 7. 前端方案

### 技术栈

- React + TypeScript
- React Router
- TanStack Query
- shadcn/ui
- Tailwind CSS
- Sonner
- RichTextRenderer / RichTextToc
- Markdown 编辑/预览管线
- bracket 候选：`@g-loot/react-tournament-brackets`

### 用户侧路由

- `/t`
- `/t/:tid`
- `/t/:tid/rules`
- `/t/:tid/teams`
- `/t/:tid/qualifier`
- `/t/:tid/bracket`
- `/t/:tid/schedule`
- `/t/:tid/match/:matchId`
- `/t/:tid/referee/:matchId`

设计原则：

- 用户侧是赛事官网，不做成后台表格。
- 页面视觉参考旧站整体社区风格，同时比旧实现更清晰、更现代。
- 首页展示赛事品牌、关键时间、报名 CTA、阶段入口、公告、staff。
- 规则页支持 Markdown 渲染后的富文本展示和目录。
- 队伍大厅要突出公开/私密队伍、人数、状态、加入动作。
- bracket 页必须支持横向滚动/缩放，不强行把 32 强双败压进移动端单屏。

### 后台路由

- `/admin/tournaments`
- `/admin/tournaments/new`
- `/admin/tournaments/:tid/settings`
- `/admin/tournaments/:tid/content`
- `/admin/tournaments/:tid/teams`
- `/admin/tournaments/:tid/staff`
- `/admin/tournaments/:tid/qualifier`
- `/admin/tournaments/:tid/rounds`
- `/admin/tournaments/:tid/bracket`
- `/admin/tournaments/:tid/matches`
- `/admin/tournaments/:tid/audit`

后台原则：

- 后台撑满页面，不套用户侧主容器。
- 复用 `AdminPage`、`AdminTable`、`AdminPagination`、`AdminBadge`。
- 优先使用 shadcn/ui，不手写已有 primitive。
- 删除、危险操作使用 `AlertDialog`。
- 短反馈使用 Sonner。
- 页内持久错误使用 `AppAlert` / `MutationErrorAlert`。
- 不在每页顶部写大段“页面名 + 用途说明”。

### 前端数据模块

建议目录：

- `src/entities/tournament/api`
- `src/entities/tournament/model`
- `src/features/tournament/components`
- `src/pages/tournaments/list`
- `src/pages/tournaments/detail`
- `src/pages/tournaments/bracket`
- `src/pages/tournaments/teams`
- `src/pages/tournaments/qualifier`
- `src/pages/tournaments/match`
- `src/pages/tournaments/referee`
- `src/pages/admin/tournaments`

API 封装要求：

- query key 按 tournament id/acronym 分层。
- mutation 成功后精确 invalidate。
- 后端错误统一走 `getErrorMessage`。
- 未登录和无权限要有明确状态。

### Markdown 规则编辑

后台编辑：

- 左侧 Markdown textarea/editor。
- 右侧预览。
- 保存提交 `source_markdown`。
- 后端返回生成后的 `content_html`。

前台展示：

- 只消费 `content_html`。
- 使用 `RichTextRenderer`。
- 使用 `RichTextToc` 从 heading 生成目录。

已落地：

- 后端使用 `markdown-it` 渲染 Markdown/GFM 风格内容。
- 后端保存前使用 `sanitize-html` 白名单清洗。
- 后台内容页已接入编辑中实时预览，预览接口复用后端渲染与 sanitizer 管线。
- 公开 `/sections` 只返回展示字段和 `content_html`，后台编辑用 host 管理接口读取 `source_markdown`。
- 图片、表格、链接策略与富文本系统保持一致，白名单可按真实规则文档继续微调。

## 8. Bracket 方案

### 数据生成

输入：

- 锁定后的 qualifier top 32。
- folded seeding 规则。
- 每个 round 的 FT 配置。

输出：

- winners bracket matches。
- losers bracket matches。
- grand final。
- reset final，预生成但隐藏。

推进：

- winners match winner 进下一轮 winners。
- winners match loser 落入对应 losers slot。
- losers match loser 淘汰。
- losers match winner 继续 losers。
- losers final winner 进入 GF。
- 如果 losers side winner 赢 GF，则显示 reset final。
- reset final winner 为 champion。

### 数据字段建议

现有 `TMatch` 可先支持基础展示，但建议尽快补充 bracket slot 表或字段：

- `bracket_group`：`winner` / `loser` / `grand_final` / `reset_final`
- `round_no`
- `slot_no`
- `source_match_1_id`
- `source_match_1_result`：`winner` / `loser`
- `source_match_2_id`
- `source_match_2_result`
- `hidden_until_match_id`

不要长期只靠 round/order 临时推导，否则手动调整和 reset final 会很难维护。

### 前端库验证

优先评估 `@g-loot/react-tournament-brackets`：

- 是否能表达 32 强 double elimination。
- 是否能自定义 match card。
- 是否能展示 WBD/FF、比分、MP link、状态。
- 是否能适配暗色主题。
- 是否能在移动端横向滚动/缩放。
- 是否能隐藏 reset final，并在需要时显示。

如果不满足：

- 自研 SVG/HTML 混合 bracket。
- 以 round 列为横轴、slot 为纵轴。
- match card 用普通 React 组件。
- 连线用 SVG path。

## 9. 裁判工作台方案

### 页面组成

- match 基础信息。
- 双方队伍与 player。
- roll 输入。
- 当前阶段提示。
- mappool grid。
- protect/ban/pick 状态。
- action timeline。
- autosave 状态。
- 冲突提示。
- MP 导入结果。

### Autosave

- 用户修改 action 后进入 dirty 状态。
- 2 秒无继续输入后保存。
- 保存前调用本地冲突检测。
- 后端仍必须再次冲突检测。
- 保存成功后刷新 action timeline。
- 保存失败显示页内错误，不丢失本地编辑。

### 权限

- referee/host 可操作。
- streamer/commentator/pooler 默认只读，后续可细分。
- 前端隐藏不可用按钮，但后端必须鉴权。

## 10. 历史赛事补录

问题：

- 已有两届比赛，部分选手可能不是站内 user。

方案：

- 不引入 external player。
- 导入时创建占位 User。
- 占位 User 写入 `user_name`、`osu_uid`、`avatar`。
- 可以后续增加 `User.is_imported`、`User.import_source`、`User.import_batch_id`。
- 后续如本人注册，可做账号认领/合并工具。

补录顺序：

1. 创建 tournament。
2. 通过 `/admin/tournaments/:tid/import` 粘贴 JSON，先 `dry_run` 预检。
3. 正式导入时后端按 `user_id -> osu_uid -> 占位 User` 解析选手。
4. 后端在同一事务中创建 team 和 player 快照，并自动设置 captain。
5. 导入 staff。
6. 导入 qualifier ranking。
7. 导入 bracket、match、result。

当前实现：

- 后端已新增 `POST /tournament/:tid/import/teams`，需要 host 权限。
- payload 以 `batch_id` + `teams[]` 为根；team 支持 `name/display_name/avatar/status/qual_rank/qual_score/qual_mp_id/locked_at`；player 支持 `user_id/osu_uid/user_name/avatar/is_captain/review_status/contact/timezone/remark`。
- `dry_run: true` 会执行完整校验和解析，并在事务中回滚，不写入数据库。
- 非站内选手会创建 `password/email/qq/discord` 为空的占位 `User`，写入 `user_name/osu_uid/avatar`。
- player remark 自动追加 `[historical-import:<batch_id>]`，同时写 `historical_import` audit，便于追踪批次。

## 11. 测试与验收

### 后端测试重点

- 全站 admin 才能创建赛事。
- 创建者自动成为 creator host。
- 普通 host 不能添加 host 或删除赛事。
- 同赛事同 user 不能加入两队。
- staff 不能参赛。
- 已参赛 user 添加 staff 返回明确错误。
- 公开队伍可直接加入。
- 私密队伍必须邀请码加入。
- 报名期外普通用户不能加入、退出、踢人、提交。
- 队伍锁定后 player 不能自改。
- host 修改 player review 写 audit。
- qualifier 两轮每图取最高。
- WBD 写入 FT:-1。
- 手动改胜方写 audit。
- ban/protect/pick 冲突禁止保存。

### 前端验收重点

- 赛事首页不像后台管理页。
- 规则 Markdown 展示与目录正常。
- 组队大厅公开/私密队伍交互清晰。
- player 审查失败不在用户侧羞辱展示。
- qualifier 榜单能解释总分来源。
- bracket 在宽屏和移动端都可读。
- 裁判台 autosave、冲突提示、错误反馈清楚。
- 后台所有危险操作有确认。
- 所有写操作有成功/失败反馈。

### 迁移验证

- 旧 player 能回填 `t_id`。
- 旧 team 能回填 `captain_player_id`。
- 旧 tournament 能回填 `created_by`。
- SQL 在测试库可重复演练。
- 重复 index/字段创建在真实执行前已处理。

## 12. 实施顺序

建议按以下顺序推进：

1. 数据库迁移 SQL 在测试库演练。
2. 完成 tournament service 和权限 helper。
3. 完成 content section：Markdown 保存、HTML 生成、规则页展示。
4. 完成公开赛事页骨架。
5. 完成报名与组队闭环。
6. 完成 staff 管理和 creator host 权限。
7. 完成 audit log 查询与关键写操作接入。
8. 重构资格赛 MP 导入、原始成绩记录和排名计算。
9. 用 mock 数据验证 bracket 库。
10. 实现 32 强双败 bracket 生成。
11. 实现正赛 round/mappool/match 后台。
12. 实现裁判工作台和 action 冲突检测。
13. 已完成历史赛事补录工具。
14. 联调、验收、补测试。

## 13. 当前代码进度

已落地后端准备：

- `TPlayer` 已补 `t_id`、快照、联系方式、timezone、remark、review status。
- `TTeam` 已补 `avatar`、`is_open`、`captain_player_id`、`locked_at`。
- `Tournament` 已补 `created_by`、`qual_locked_at`、`qual_locked_by`、`qual_locked_top_n`。
- `TMatch` 已补 `result_type`、`result_note`、`winner_overridden`。
- `TMappool.type` 注释已更新为首期正赛 type。
- 已新增 `TSection`、`TAuditLog`、`TQualImport` 模型。
- `TQualScore` 已补 `attempt_no`、`source_mp_id`、`source_game_id`、`import_id`、`is_manual`。
- 已新增 SQL 草案：`backend/sql/2026-06-19-tournament-player-team-prep.sql`、`backend/sql/2026-06-22-tournament-qualifier-lock.sql`。
- 创建赛事时已写入 `created_by`。
- 创建赛事路由已限制为全站 admin。
- 删除赛事已限制为 creator host 或全站 admin。
- 添加 host 已限制为 creator host 或全站 admin。
- 添加任意 staff 前已检查该 user 是否已参赛。
- 已新增 `contentService` 和内容块 controller。
- 已新增 `teamService`，收口创建队伍、加入队伍、离开队伍、更新队伍状态、批量通过。
- 创建队伍支持 `is_open`。
- 加入队伍支持 `team_id` 公开加入和 `invite_code` 私密加入。
- 队伍加入/离开已校验报名期、同赛事唯一 player、osu 绑定、队伍人数和锁定状态。
- 已新增提交队伍、重置邀请码、踢出队员、host 更新 player 接口。
- 已新增 `auditService`、`auditController` 和 audit log 查询接口。
- 已接入主要关键写操作 audit：内容块、创建队伍、加入队伍、退出队伍、队伍提交、队长踢人、host 踢人 override、重置邀请码、队伍状态更新、批量通过、host 更新 player、staff 添加/移除、资格赛、bracket、match 和裁判 action。
- host/admin 已可通过踢人接口做队伍成员 override 修正；普通队长仍受报名期和锁定限制；后台 teams 页已接入队伍信息 host 修正入口，host 可在报名期外或队伍锁定后修正 `name/display_name/avatar/is_open`。
- 已新增 `qualifierService`，收口资格赛 MP 导入、导入日志、重复成绩跳过、来源字段写入、每图最高分排名、手动修分和资格赛锁榜；资格赛导入支持指定 team，也支持同一 MP 中多队同时打图时按 score `user_id` 自动归属到本届 player/team。
- 已新增资格赛 import log 查询接口：`GET /tournament/:tid/qualifier/imports`。
- 已新增资格赛成绩手动修正接口：`PUT /tournament/:tid/qualifier/scores/:scoreId`，并写入 audit。
- 已新增资格赛锁榜接口：`POST /tournament/:tid/qualifier/lock`，锁榜后禁止资格赛图池变更、成绩导入、手动修分和重算排名。
- `TMatch` 已补 bracket 位置和来源字段：`bracket_group`、`round_no`、`slot_no`、`source_match_*`、`hidden_until_match_id`。
- 已新增 `bracketService`，支持固定 32 强双败 bracket 预生成，生成前要求资格赛排名已锁定。
- `POST /tournament/:tid/bracket/generate` 已改为生成 15 个 round / 63 场 match：WB 31、LB 30、GF 1、Reset Final 1。
- 正赛首轮种子已按确认规则生成：`#1 vs #32`、`#2 vs #31`、依次类推。
- 生成 bracket 时会过滤无正赛资格队伍：队伍至少需要一名 player 不是 `review_failed`。
- 已新增 bracket 自动推进：match 完成后会按 `source_match_*` 将 winner/loser 填入后续场次。
- 自动推进已接入 `updateMatch`、MP 拉分完成和裁判手动更新单局比分。
- 下游比赛已有结果时，自动推进会阻止静默覆盖，提示先人工处理后续比赛。
- `updateMatch` 已支持 WBD/FF：按 round FT 写入 `FT:-1`，并记录 match audit。
- 已新增 `TMatchAction` 模型、关联和 SQL 草案，用于独立保存 protect/ban/pick 时间线。
- 已新增 `refereeActionService`，支持 protect/ban/pick 创建与修改，并阻止已保护图被 ban、已 ban 图被 pick、重复 pick 等冲突。
- 裁判工作台 `recordAction` 已改为写入 `TMatchAction`，并保留旧 payload `action_type: 0/1/2`、`action_by: 1/2` 兼容。
- 已新增修改裁判操作接口：`PUT /tournament/:tid/referee/:matchId/action/:actionId`。
- 旧 undo 接口已改为返回“不支持撤销，请直接修改对应操作”。
- 前端已新增 `entities/tournament` API/types/query 模块。
- 用户侧已启用 `/t`、`/t/:tid`、`/t/:tid/bracket` 三个基础页面，不再全部落到暂停页。
- `/t/:tid/bracket` 已能按后端 `bracket_group/round_no/slot_no` 横向展示 bracket 列表，并隐藏未激活 reset final。
- `/t/:tid/bracket` 已新增移动端纵向折叠轮次视图，窄屏不用横向拖完整 bracket 也能逐轮查看 match。
- 用户侧已新增 `/t/:tid/teams` 队伍大厅基础页面，支持查看公开/私密队伍、创建队伍、公开加入和邀请码加入；当前用户已在队伍或已是本届 staff 时前置禁用报名/加入入口。
- 队伍大厅已接入队长提交队伍、退出队伍、踢出队员、重置邀请码等报名期核心操作。
- 队伍大厅已接入队伍信息编辑、队长转让、提交后锁定态展示、报名期提示和报名期外禁用；后端对应写操作会写 audit。
- 公开队伍列表后端已排除 `invite_code` 字段，避免私密队伍邀请码泄露；队长重置邀请码时由专用接口返回新 code。
- 用户侧已新增 `/t/:tid/qualifier` 资格赛基础页面，展示资格赛图池和公开排名，不展示两轮原始成绩。
- 用户侧已新增 `/t/:tid/match/:matchId` 比赛详情页，展示双方队伍、player、比分、状态、MP 外链、roll、WBD/FF note 和已打图记录。
- `GET /tournament/:tid/match/:matchId` 已增加 match 归属赛事校验，避免跨赛事读取任意 match。
- 后台已新增 `/admin/tournaments` 赛事列表入口，使用现有 AdminPage/AdminTable。
- 后台已新增 `/admin/tournaments/new` 基础创建页，可创建 tournament 本体；创建者 host 仍由后端创建接口负责写入。
- 后台已新增 `/admin/tournaments/:tid/settings` 基础设置页，并抽出 `TournamentSettingsForm` 复用创建/编辑字段和校验。
- 后台已新增 `/admin/tournaments/:tid/content` 内容管理页，支持 `rules/description/prize/faq` Markdown 内容块的创建、编辑、删除和已保存 HTML 预览。
- 前端 `entities/tournament` 已补 section create/update/delete mutation。
- 后台已新增 `/admin/tournaments/:tid/teams` 队伍管理页，支持查看队伍/成员、更新队伍状态、批量通过队伍、修改 player review 状态、host 修正队伍信息和 host 移除非队长 player。
- 前端 `entities/tournament` 已补 team status、approve all、player update mutation。
- 后台已新增 `/admin/tournaments/:tid/staff` staff 管理页，支持搜索站内用户、添加 `host/pooler/referee/streamer/commentator` 角色、按 role 分组展示和移除 staff。
- 前端 `entities/tournament` 已补 staff list/create/delete query 与 mutation。
- staff 查询/新增/删除逻辑已抽离到 `staffService`，添加/移除 staff 已写 audit。
- 后台已新增 `/admin/tournaments/:tid/qualifier` 资格赛管理页，支持添加图池、按指定队伍和 MP ID 导入成绩，或按 MP 内 score.user_id 自动识别本届所有队伍导入成绩；查看导入日志、查看原始成绩、手动修正 score、触发排名重算和锁榜；资格赛图池写操作会校验 stage/beatmap 唯一性并写 audit，已有成绩的资格赛图不能直接删除。
- 锁榜后 `/admin/tournaments/:tid/qualifier` 会禁用资格赛写操作并展示锁定状态。
- 前端 `entities/tournament` 已补 qualifier mappool/scores/imports/fetch/recalculate/lock/update-score query 与 mutation。
- 后台已新增 `/admin/tournaments/:tid/bracket` 正赛管理页，支持 round 创建/删除、round mappool 增删、手动创建 match、生成 32 强双败 bracket、更新 match 结果/WBD/FF/MP ID 和触发 MP 分数导入；round 写操作会校验字段并写 audit，删除 round 前会阻止误删已有 match/mappool 的轮次；round mappool type 使用固定枚举选择，后端会校验 type、round 归属和重复 beatmap；手动 match 创建/更新会校验 round/team/winner 归属并写 audit。
- 用户侧 `/t/:tid/bracket` 已按 winners / losers / grand final / reset final 分区展示 bracket，保留横向浏览并提示隐藏的 reset final。
- 用户侧已新增 `/t/:tid/referee/:matchId` 裁判工作台，支持 roll、protect/ban/pick 时间线、2 秒 debounce autosave 修改历史 action、按 roll 推荐下一步、timeout、osu! 指令复制和已打图比分修正。
- 裁判台和 match 相关写接口已校验 `match.round.t_id === tid`，避免 staff 用本赛事权限读写其他赛事 match。
- 前端 `entities/tournament` 已补 round、round mappool、bracket generate、match create/update/fetch-scores、referee data/action/roll/timeout/game-score query 与 mutation。
- 后台已新增 `/admin/tournaments/:tid/audit` 审计日志页，支持 entity/action/operator/entity id 过滤、分页、old/new JSON 摘要展示。
- 前端 `entities/tournament` 已补 audit log list query。
- 后台已新增 `/admin/tournaments/:tid/import` 历史补录页面，支持 JSON 示例、dry-run 预检、正式导入和结果摘要；赛事列表已增加 Import 入口。
- 前端 `entities/tournament` 已补 historical import request/result types、API 和 mutation。
- 后端已新增 `tournamentService`，收口赛事列表、详情、创建、更新、删除；创建赛事和 creator host 写入处于同一事务，赛事 create/update/delete 已写 audit。
- 后台内容页已新增 Markdown 编辑中预览；后端新增 `POST /tournament/:tid/sections/preview`，公开 sections 接口不再返回 `source_markdown`。
- audit 覆盖已复核并补齐：裁判 roll、timeout、单局比分手动修正、正赛 MP 拉分都会记录审计；预览和不支持的 undo 不写持久数据，因此不写 audit。
- 前端赛事后台设置表单已将 schema/default/转换逻辑拆到 `TournamentSettingsFormModel`，避免 Fast Refresh 混合导出；资格赛和 staff 后台页的派生数组依赖已稳定。`pnpm exec tsc -b`、`pnpm run lint`、`pnpm run build` 已通过，lint 当前 0 warning，build 仅剩 Vite 大 chunk 提示。
- 前端已新增赛事后台专用路由守卫：全站 admin 可进入所有赛事后台页，具体 tournament 的 staff 可进入该届 `/admin/tournaments/:tid/*` 管理页；新建赛事入口仍只对全站 tournament 权限开放。赛事详情页会为全站 admin 或本届 staff 展示 Manage 入口，避免普通赛事 staff 被全站 admin 权限守卫挡在后台外。
- osu MP 拉分已统一走 `osu-api-v2-js` 的 `api.getMatch(matchId, { after, limit })`，按官方 matches 文档补齐事件分页，避免默认 100 条 events 截断；资格赛和正赛解析都按已知 `beatmap_id` 匹配图池，并按 score `user_id` 对应站内 `User.osu_uid` 归属到 player/team，不依赖 osu 房间内红蓝队。

## 14. 未决项

代码侧首期主链路已收口，剩余集中在真实环境联调和验收：

- 测试库/生产库 SQL 迁移演练，确认旧 tournament/player/team 数据、索引和 nullable 回填策略与真实库一致。
- 真实 osu MP API 拉分行为验收，覆盖资格赛两轮取高、多队同 MP 自动归属、正赛 MP 拉分、失败日志和手动修正。
- 真实赛事规则 Markdown 验收，确认 sanitizer 白名单是否需要继续放宽或收紧。
- 真实数据下 bracket 最终视觉、移动端阅读体验、暗色主题和 reset final 隐藏验收。

相关但不阻塞首期的问题：

- sanitizer 白名单是否需要根据真实规则文档继续放宽或收紧；当前已有保存清洗和前端二次清洗。
- 投稿文件和富文本图片最终使用 GitHub、MinIO、S3/R2 中哪种 provider。
- 旧活动后台仍有非赛事遗留问题：`eventStageController.updateStage` 的 `desc` 未定义，后续做活动联调时再处理。
