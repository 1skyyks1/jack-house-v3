# Tournament Implementation Spec

本文是 JH 赛事系统首期开发的完整技术方案。它面向后续 AI 和开发者，目标是可以直接按本文拆任务、查模型、对接口、做验收。

相关背景：

- 产品规则和讨论沉淀：[tournament-system.md](./tournament-system.md)
- 原始技术计划和进度细节：[tournament-technical-plan.md](./tournament-technical-plan.md)
- 架构图：[tournament-architecture.md](./tournament-architecture.md)
- 长期决策：[decision-log.md](./decision-log.md)

## 1. 目标与边界

### 仓库边界

- 前端：`/Users/bytedance/jackhouse/jack-house-v3`
- 后端：`/Users/bytedance/jackhouse/jack-house-web/backend`
- 旧前端参考：`/Users/bytedance/jackhouse/jack-house-web/frontend`

### 首期目标

- 构建独立于旧 `event` 活动系统的 `tournament` 赛事系统。
- 支持赛事官网、Markdown 规则、报名组队、staff 展示、资格赛榜单、32 强双败正赛、比赛详情、裁判工作台和后台管理。
- 保持 Express + Sequelize + MariaDB，不在首期迁移后端 TypeScript 或替换 ORM。
- 前端使用 React + TypeScript + shadcn/ui，并延续当前 V3 的实体层、query hook、页面组织方式。

### 非目标

- 不把旧 `event` 活动系统改造成 tournament。
- 不建立第二套赛事账号体系。
- 不支持非站内 user 作为正式 player/staff 身份。
- 不在站内实现约战聊天、排期协商。
- 不公开资格赛每轮原始成绩详情。
- 不在首期支持任意赛制生成器。
- 不把赛事规则强制改写成 Tiptap 富文本。

## 2. 领域规则

### Tournament

- 赛事按“届”建模，JHC2026、JHC2027 是两个独立 tournament。
- `acronym` 作为公开 URL 标识，例如 `/t/JHC2026`；修改后旧 acronym 失效。
- 创建赛事需要全站 admin 权限。
- 创建者自动成为 creator host。
- 只有 creator host 或全站 admin 可以删除赛事、添加其他 host。
- 普通 host 可以管理赛事内容、队伍、资格赛、正赛、staff，但不能添加 host 或删除赛事。
- 赛事状态主要由时间字段推导；host 可以在后台越过当前时间状态修正数据。

### Identity

- `User` 是唯一身份来源。
- `TPlayer` 表示某个 user 在某届赛事某支队伍中的参赛记录。
- `TStaff` 表示某个 user 在某届赛事中的工作人员角色。
- 同一个 tournament 中，同一个 user 只能有一个有效 player。
- 同一个 user 可以在不同 tournament 中拥有多条 player 记录。
- player 创建时保存用户名、头像、联系方式、timezone、remark 快照。
- player 不保存 `osu_uid_snapshot`，因为 `User.osu_uid` 与 user 一一对应且不可变。
- 历史赛事补录遇到非站内选手时，创建导入用占位 User，再创建 player。

### Team

- 单人也必须属于一个 team。
- 有有效 team/player 即视为报名，不另建 registration 表。
- 队伍人数首期 1-2 人，保留 `team_size_min` / `team_size_max`。
- 支持公开队伍和私密队伍，两种都在组队大厅展示。
- 公开队伍可以直接加入；私密队伍需要邀请码。
- 队长可以重置邀请码、踢出队员、提交队伍信息。
- 报名期内用户可退队再加入其他队。
- 队伍锁定后，普通用户不能改队伍信息、成员、player 联系方式；host 可后台修正。
- 队伍没有 rejected 状态；官方审查针对 player。
- `review_failed` 只影响正赛资格，不在用户侧公开羞辱式展示。

### Staff

首期角色：

- `host`
- `pooler`
- `referee`
- `streamer`
- `commentator`

规则：

- staff 多角色用多行记录表达。
- `(t_id, user_id, role)` 唯一。
- 所有 staff 默认公开展示，并按 role 分组。
- 只有 staff 能进入赛事后台。
- 首期所有 staff 不允许参赛。
- 给已参赛 user 添加 staff 时，后端应阻止并提示 host 手动处理。

### Rules And Content

- 赛事规则、介绍、奖项、FAQ 放在 tournament 自己的内容表，不复用 forum/post。
- 规则主格式是 Markdown，便于迁移 osu 侧规则文档。
- 后端保存 `source_markdown`，同时生成 `content_html` 作为展示缓存。
- 前台只消费 `content_html`，统一使用 `RichTextRenderer` 展示，并用 `RichTextToc` 生成目录。
- 不承诺 Markdown 与 Tiptap 富文本无损双向转换。
- 后端已使用 `markdown-it` 渲染 Markdown/GFM 风格内容，并用 `sanitize-html` 白名单清洗后保存 `content_html`。

### Qualifier

- 每队一人上场。
- 资格赛图池固定 stage 1-7，不需要正赛 type/mod。
- 每队只绑定一个 osu MP。
- 同一个 MP 可打两轮；第二轮可不打或只重打部分图。
- 每张图取两轮最高分，总分为每图最高分相加。
- qualifier MP ID 只允许 host/referee 填写或修改。
- 用户侧展示队伍、总分、排名、MP 外链。
- 管理端展示导入日志、失败原因、原始导入成绩和手动修正记录。

### Main Stage

- 首期固定 32 强双败制。
- 使用 folded seeding：`#1 vs #32`、`#2 vs #31`、依次类推。
- 支持 grand final reset：reset final 预生成但默认隐藏，败者组冠军赢下 GF 后显示。
- round 固定配置 FT/BO，不做单 match override。
- 正赛 mappool type 固定为 `FU` / `DS` / `MD` / `LT` / `AC` / `QS` / `MN` / `RM` / `MX` / `DF` / `TB`。
- 每场正赛只绑定一个 osu MP，MP ID 可修改。
- 手动创建/更新 match 时，后端必须校验 round、team、winner 都属于当前 tournament 和当前 match。
- match 状态首期只区分未开始和完成，旧值 `1` 只作兼容。
- WBD/FF 不细分枚举原因，只保留 note。
- WBD/FF 优先级高于普通比分：胜方写入 round FT 分，负方写入 `-1`。
- osu MP 拉分后默认按比分判胜；referee 可手动改胜方，但必须提示并写 audit。

### Referee Workbench

- referee 输入双方 roll 点。
- 高点先 protect，低点再 protect。
- 低点先 ban，高点再 ban。
- 高点先 pick，低点再 pick，后续轮流 pick。
- 修改后 2 秒 debounce 自动保存。
- 不做 undo；选错时直接修改对应 action。
- 允许修改历史 protect/ban/pick，但保存前必须检查冲突。

冲突规则：

- 双方不能 protect 同一张图。
- 已 protect 的图不能 ban。
- 已 ban 的图不能 pick。
- 已 pick 的图不能再次 pick。

## 3. 系统架构

### 前端分层

```txt
src/app
  router.tsx
src/entities/tournament
  api/tournamentApi.ts
  api/tournamentQueries.ts
  model/types.ts
src/features/tournament
  components/*
src/pages/tournaments
  list / detail / bracket / teams / qualifier / match / referee / paused
src/pages/admin/tournaments
  list / new / settings / content / teams / import / qualifier / bracket / staff / audit
src/shared
  http / ui / rich-text / errors / i18n
```

要求：

- 页面只负责组合 UI、读取 params、调用 query/mutation。
- API 和类型集中在 `entities/tournament`。
- 共享组件优先放 `features/tournament/components`，不要复制到每个 page。
- 用户侧页面做赛事官网体验，避免后台表格化。
- 后台页面使用现有 `AdminPage`、`AdminTable`、shadcn/ui，撑满页面。

### 后端分层

```txt
routes/tournamentRoute.js
controllers/tournament/*
services/tournament/*
models/tournament/*
middleware/tournamentAuth.js
sql/*
```

要求：

- route 只负责路径和粗粒度权限。
- controller 只读参数、调用 service、返回 response。
- service 收口事务、状态机、权限细节、审计和业务规则。
- model 只表达表结构和关联。
- 涉及敏感写操作必须写 `TAuditLog`。

## 4. 数据模型

### Tournament

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

实现要求：

- `created_by` 是 creator host 权限来源。
- 创建赛事时同步创建 creator host staff。
- 公开访问支持 id/acronym 解析。

### TSection

用途：赛事内容块。

关键字段：

- `id`
- `t_id`
- `type`：`rules` / `description` / `prize` / `faq`
- `title`
- `format`：`markdown` / `html`
- `source_markdown`
- `content_html`
- `sort_order`
- `updated_by`

实现要求：

- 公开接口不返回 `source_markdown`。
- 管理接口返回 `source_markdown` 便于编辑。
- 保存时生成 `content_html`。

### TTeam

关键字段：

- `id`
- `t_id`
- `name`
- `display_name`
- `avatar`
- `is_open`
- `invite_code`
- `captain_id`
- `captain_player_id`
- `status`
- `qual_mp_id`
- `qual_rank`
- `qual_score`
- `locked_at`

实现要求：

- 新逻辑以 `captain_player_id` 判断队长。
- `captain_id` 短期兼容旧逻辑。
- 公开列表不能泄露 `invite_code`。
- 重置邀请码只通过专用接口返回新 code。

### TPlayer

关键字段：

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

实现要求：

- 创建/加入队伍时写入 `t_id` 和快照。
- 写入时校验 `player.t_id === team.t_id`。
- `(t_id, user_id)` 必须是唯一约束；报名期退队会物理删除旧 player 记录。
- 创建队伍和加入队伍必须拒绝当前 tournament 已是 staff 的 user。

### TStaff

关键字段：

- `id`
- `t_id`
- `user_id`
- `role`
- `created_time`

约束：

- `(t_id, user_id, role)` 唯一。

### TQualMappool

关键字段：

- `id`
- `t_id`
- `index`
- `map_id`
- `artist`
- `title`
- `mapper`
- `weight`

实现要求：

- stage/index 固定 1-7。
- 同一 tournament 中 `(t_id, index)` 和 `(t_id, map_id)` 必须唯一。
- 后端写入资格赛图池时校验 stage、beatmap、权重和必填元数据，并写 audit。
- 删除资格赛图前必须确认没有关联成绩，否则拒绝删除。

### TQualScore

关键字段：

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

- 导入时保留有效成绩行，不只覆盖最高分。
- 排名时按 `(team_id, map_id)` 取最高分。
- 手动修正写 `is_manual = true` 并记录 audit。
- 重复导入相同 `source_game_id + team_id + player_id + map_id` 不制造重复有效行。

### TQualImport

用途：记录资格赛 MP 导入任务。

关键字段：

- `id`
- `t_id`
- `team_id`
- `mp_id`
- `status`：`running` / `success` / `failed`
- `message`
- `imported_by`
- `created_time`

### TRound / TMappool

`TRound` 关键字段：

- `id`
- `t_id`
- `name`
- `bracket_type`
- `first_to`
- `order`
- `start_time`
- `end_time`

`TMappool` 关键字段：

- `id`
- `round_id`
- `type`
- `map_id`
- `artist`
- `title`
- `mapper`

实现要求：

- `first_to` 是 round 级 FT 配置。
- 后端创建/更新 round 时校验 `bracket_type`、`first_to`、`order` 和时间字段，并写 audit。
- 删除 round 前必须确认没有关联 match 和 mappool，否则拒绝删除。
- 正赛 mappool type 只允许固定枚举。
- 资格赛图池使用 `TQualMappool`，不混入 `TMappool`。
- 后端写入 round mappool 时必须校验 round 属于当前 tournament、type 属于首期枚举、同一 round 不能重复添加同一 beatmap；删除时也必须校验 map 归属当前 tournament。

### TMatch

关键字段：

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

- `status = 0` 未开始。
- `status = 2` 完成。
- `status = 1` 只兼容旧值。
- `bracket_group/round_no/slot_no` 用于前端稳定绘制 bracket。
- `source_match_*` 用于自动推进。
- `hidden_until_match_id` 用于 reset final 隐藏/激活。

### TMatchAction

用途：独立保存 protect/ban/pick 等裁判时间线，避免继续混用 `TGame`。

关键字段：

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

- 创建和修改都必须重算冲突。
- 不设计 undo。
- 旧 payload `action_type: 0/1/2`、`action_by: 1/2` 短期兼容。

### TAuditLog

关键字段：

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
- bracket 生成。
- 正赛成绩导入、WBD/FF、手动改胜方。

## 5. API 方案

路径沿用旧后端 `/tournament`，前端页面使用 `/t`。

### Public

- `GET /tournament`
- `GET /tournament/:tid`
- `GET /tournament/:tid/sections`
- `GET /tournament/:tid/teams`
- `GET /tournament/:tid/staff`
- `GET /tournament/:tid/qualifier`
- `GET /tournament/:tid/bracket`
- `GET /tournament/:tid/match/:matchId`

### Team

- `POST /tournament/:tid/teams`
- `POST /tournament/:tid/teams/:teamId/join`
- `POST /tournament/:tid/teams/join-by-code`
- `POST /tournament/:tid/teams/:teamId/leave`
- `POST /tournament/:tid/teams/:teamId/kick`
- `POST /tournament/:tid/teams/:teamId/reset-invite`
- `POST /tournament/:tid/teams/:teamId/submit`
- `PATCH /tournament/:tid/players/:playerId`

### Admin And Content

- `POST /tournament`
- `PUT /tournament/:tid`
- `DELETE /tournament/:tid`
- `POST /tournament/:tid/staff`
- `DELETE /tournament/:tid/staff/:staffId`
- `POST /tournament/:tid/sections`
- `PUT /tournament/:tid/sections/:sectionId`
- `DELETE /tournament/:tid/sections/:sectionId`
- `GET /tournament/:tid/audit-logs`

### Qualifier

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

### Bracket And Match

- `POST /tournament/:tid/bracket/generate`
- `GET /tournament/:tid/bracket`
- `PUT /tournament/:tid/match/:matchId`
- `POST /tournament/:tid/match/:matchId/fetch-scores`
- `GET /tournament/:tid/referee/:matchId`
- `POST /tournament/:tid/referee/:matchId/action`
- `PUT /tournament/:tid/referee/:matchId/action/:actionId`
- `POST /tournament/:tid/referee/:matchId/game-score`

WBD/FF payload：

```json
{
  "result_type": "wbd",
  "winner_id": 123,
  "result_note": "Opponent no show"
}
```

写入规则：

- `winner_id = payload.winner_id`
- winner score = `round.first_to`
- loser score = `-1`
- `status = 2`
- 写 audit。
- 调用 bracket propagation，推进 winner/loser 到下游 match。

## 6. 前端页面方案

### 用户侧路由

- `/t`：赛事列表。
- `/t/:tid`：赛事首页，展示 banner、状态、关键时间、入口、规则摘要、staff。
- `/t/:tid/teams`：组队大厅，创建队伍、公开加入、邀请码加入、提交、退队、踢人、重置邀请码；当前用户已在队伍或已是本届 staff 时前置禁用报名/加入入口。
- `/t/:tid/qualifier`：资格赛图池和公开榜单。
- `/t/:tid/bracket`：32 强双败 bracket。
- `/t/:tid/match/:matchId`：比赛详情、双方、比分、MP 外链、已打图。
- `/t/:tid/referee/:matchId`：裁判工作台。

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

### UI 规则

- 用户侧不是管理系统，要更接近社区官网和赛事页面。
- 后台撑满页面，避免用户侧大容器和大段说明文案。
- 优先使用 shadcn/ui，不手写已有 primitive。
- 删除、踢人、重置、锁定等危险操作使用 `AlertDialog`。
- 短生命周期成功/复制反馈使用 Sonner。
- 页内持久错误、警告、空状态使用 `AppAlert` / `MutationErrorAlert`。
- 错误文案统一通过 `getErrorMessage`。
- 富文本展示必须使用 `RichTextRenderer`，不能在页面直接 `dangerouslySetInnerHTML`。

### Query And Mutation

建议 query key：

```ts
["tournaments"]
["tournament", tid]
["tournament", tid, "sections"]
["tournament", tid, "teams"]
["tournament", tid, "qualifier"]
["tournament", tid, "bracket"]
["tournament", tid, "match", matchId]
```

mutation 要求：

- 创建/加入/退出/提交队伍后 invalidate `teams`。
- 重置邀请码只更新当前 team 或刷新 `teams`。
- qualifier 导入、手动修正后 invalidate `qualifier` 和 `teams`。
- match 更新、拉分、WBD/FF 后 invalidate `match` 和 `bracket`。
- content 保存后 invalidate `sections` 和 tournament detail。

## 7. 后端服务方案

### 必须收口到 service 的规则

- tournament id/acronym 解析。
- creator host 判断。
- staff 与 player 互斥。
- 同赛事唯一 player 校验。
- player 快照写入。
- 报名窗口校验。
- 队伍锁定后修改限制。
- player review 对正赛资格的影响。
- qualifier 两轮每图取高。
- WBD/FF 写入 `FT:-1`。
- 手动改胜方提示和 audit。
- bracket 下游自动推进与冲突阻止。
- protect/ban/pick 冲突检测。

### Service 拆分

- `tournamentService.js`：创建、更新、删除、状态推导、acronym 解析。
- `teamService.js`：报名窗口、创建/加入/退出、队长、邀请码、提交、锁定。
- `staffService.js`：staff role、creator host、参赛互斥。
- `contentService.js`：Markdown 保存、HTML 生成、内容块 CRUD。
- `qualifierService.js`：MP 绑定、导入日志、每图取高、排名计算、手动修正、资格赛锁榜。
- `bracketService.js`：32 强双败生成、slot 来源、reset final、自动推进。
- `refereeActionService.js`：roll/protect/ban/pick、冲突检测、action 修改。
- `auditService.js`：统一审计日志。

## 8. 数据迁移方案

SQL 草案：

- `/Users/bytedance/jackhouse/jack-house-web/backend/sql/2026-06-19-tournament-player-team-prep.sql`
- `/Users/bytedance/jackhouse/jack-house-web/backend/sql/2026-06-22-tournament-qualifier-lock.sql`

执行原则：

- 先备份，后测试库演练。
- 先加 nullable columns，再回填；确认无重复 player 后立即加 `(t_id, user_id)` unique，`t_id` 的 NOT NULL 可按旧数据清理进度执行。
- 真实执行前按当前库结构检查重复字段和重复 index。
- 旧数据无法自动判断 creator host 时，人工指定。

建议顺序：

1. 给 `t_player` 增加 `t_id`、快照、联系方式、timezone、remark、review_status。
2. 回填 `t_player.t_id = t_team.t_id`。
3. 回填 player 快照。
4. 给 `t_team` 增加 `avatar`、`is_open`、`captain_player_id`、`locked_at`。
5. 回填 `captain_player_id`。
6. 给 `tournament` 增加 `created_by`。
7. 回填 creator host。
8. 给 `t_match` 增加 result/bracket/source 字段。
9. 创建 `t_section`、`t_audit_log`、`t_qual_import`、`t_match_action`。
10. 给 `t_qual_score` 增加 import/source/manual 字段。
11. 给 `tournament` 增加 `qual_locked_at`、`qual_locked_by`、`qual_locked_top_n`。
12. 验证无重复有效 player 后，添加 `(t_id, user_id)` unique。

## 9. Bracket 技术方案

### 生成输入

- 锁定后的 qualifier top 32。
- folded seeding 规则。
- 每个 round 的 FT 配置。

### 生成输出

- winners bracket：31 场。
- losers bracket：30 场。
- grand final：1 场。
- reset final：1 场，预生成但默认隐藏。
- 总计 63 场 match。

### 推进规则

- WB 胜者进入下一轮 WB。
- WB 负者落入对应 LB slot。
- LB 负者淘汰。
- LB 胜者继续 LB。
- LB final 胜者进入 GF。
- 如果来自 LB 的队伍赢 GF，则显示 reset final。
- reset final 胜者为 champion。

### 前端展示

优先评估 `@g-loot/react-tournament-brackets`：

- 能否表达 32 强 double elimination。
- 能否自定义 match card。
- 能否展示 WBD/FF、比分、MP link、状态。
- 能否适配暗色主题。
- 能否在移动端横向滚动/缩放。
- 能否隐藏 reset final。

如果不满足：

- 自研横向 round 列布局。
- match card 使用普通 React 组件。
- 连线用 SVG path。
- 数据仍以 `bracket_group/round_no/slot_no/source_match_*` 为准。

## 10. Markdown 规则方案

### 首期实现

- 后台以 Markdown textarea/editor 作为主编辑入口。
- 保存提交 `source_markdown`。
- 后端生成 `content_html`。
- 前台规则页渲染 `content_html`。
- TOC 从 HTML heading 提取。

### 长期实现

推荐管线：

- Markdown parse：`remark-parse`
- GFM：`remark-gfm`
- 转 HTML：`remark-rehype` + `rehype-stringify`
- sanitizer：`rehype-sanitize`

安全要求：

- 限制 script/event handler。
- 链接加 `rel="noopener noreferrer"`。
- 图片源需配合上传/图床白名单。
- 表格、引用、列表、标题需要与现有 `RichTextRenderer` 样式一致。

## 11. 权限矩阵

| 操作 | Visitor | User | Captain | Referee | Host | Creator Host | Admin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 查看赛事公开页 | yes | yes | yes | yes | yes | yes | yes |
| 创建队伍 | no | reg only | reg only | no if staff | no if staff | no if staff | no if staff |
| 加入队伍 | no | reg only | reg only | no if staff | no if staff | no if staff | no if staff |
| 退出队伍 | no | reg only | reg only | no | no | no | no |
| 提交队伍 | no | no | reg only | no | no | no | no |
| 踢队员 | no | no | captain only | no | host override | host override | yes |
| 修改规则/内容 | no | no | no | no | yes | yes | yes |
| 添加普通 staff | no | no | no | no | yes | yes | yes |
| 添加 host | no | no | no | no | no | yes | yes |
| 删除赛事 | no | no | no | no | no | yes | yes |
| 绑定 qualifier MP | no | no | no | yes | yes | yes | yes |
| 导入资格赛成绩 | no | no | no | yes | yes | yes | yes |
| 生成 bracket | no | no | no | no | yes | yes | yes |
| 修改 match 结果 | no | no | no | yes | yes | yes | yes |
| 裁判 action | no | no | no | yes | yes | yes | yes |
| 查看 audit | no | no | no | no | yes | yes | yes |

说明：

- 表格中的 staff 不参赛是首期默认策略。
- 前端隐藏按钮只是体验优化，后端必须鉴权。

## 12. 当前代码状态

### 已完成

- 后端模型已补 `TPlayer`、`TTeam`、`Tournament`、`TMatch`、`TQualScore` 所需字段。
- 已新增 `TSection`、`TAuditLog`、`TQualImport`、`TMatchAction`。
- 已新增 SQL 草案。
- 创建赛事限制为 admin，创建时写 `created_by`。
- 删除赛事、添加 host 限制为 creator host/admin。
- 添加 staff 时阻止已参赛 user。
- `teamService` 已支持创建队伍、公开/私密加入、退出、提交、踢人、重置邀请码。
- `teamService` 已为创建队伍、加入队伍、退出队伍、队长踢人、host 踢人 override、邀请码满员清除等报名关键写操作写入 audit。
- host/admin 已可通过踢人接口做队伍成员 override 修正；普通队长仍受报名期和锁定限制；后台 teams 页已接入队伍信息 host 修正入口，host 可在报名期外或队伍锁定后修正 `name/display_name/avatar/is_open`。
- 公开队伍列表已避免泄露 `invite_code`。
- `contentService` 已支持赛事内容块。
- `auditService` 已接入内容块、报名/组队、staff、资格赛、bracket、match 和裁判 action 的主要关键写操作。
- `qualifierService` 已支持 MP 导入、导入日志、来源字段、每图取高排名、手动修正、资格赛锁榜。
- 锁榜后后端会禁止资格赛图池变更、成绩导入、手动修分和重算排名。
- `bracketService` 已支持固定 32 强双败预生成和结果推进，生成正赛前要求资格赛已锁榜。
- `refereeActionService` 已支持 protect/ban/pick 创建和修改，并做冲突检查。
- `GET /tournament/:tid/match/:matchId` 已增加 match 归属赛事校验。
- 前端 `entities/tournament` API/types/query 已建立。
- 用户侧已实现 `/t`、`/t/:tid`、`/t/:tid/teams`、`/t/:tid/qualifier`、`/t/:tid/bracket`、`/t/:tid/match/:matchId`、`/t/:tid/referee/:matchId`。
- `/t/:tid/match/:matchId` 已展示双方队伍、player、比分、状态、MP 外链、roll、WBD/FF note 和已打图记录。
- `/t/:tid/bracket` 已按 winners / losers / grand final / reset final 分区展示 bracket，保留横向浏览并提示隐藏的 reset final。
- `/t/:tid/referee/:matchId` 已实现裁判工作台基础闭环，支持 roll、protect/ban/pick 时间线、2 秒 debounce autosave 修改历史 action、按 roll 推荐下一步、冲突依赖后端校验、timeout、osu! 指令复制和已打图比分修正。
- 裁判台和 match 相关写接口必须校验 `match.round.t_id === tid`，避免 staff 用本赛事权限读写其他赛事 match。
- 后台已实现 `/admin/tournaments` 列表入口。
- 后台已实现 `/admin/tournaments/new` 基础创建页，可创建 tournament 本体并触发后端 creator host 逻辑。
- 后台已实现 `/admin/tournaments/:tid/settings` 基础设置页，并抽出 `TournamentSettingsForm` 供创建和编辑复用。
- 后台已实现 `/admin/tournaments/:tid/content` 内容管理页，支持创建、编辑、删除 `rules/description/prize/faq` Markdown 内容块，并用 `RichTextRenderer` 展示已保存 HTML 预览。
- 前端 `entities/tournament` 已补 section create/update/delete mutation。
- 后台已实现 `/admin/tournaments/:tid/teams` 队伍管理页，支持查看队伍/成员、更新队伍状态、批量通过队伍、修改 player review 状态、host 修正队伍信息和 host 移除非队长 player。
- 前端 `entities/tournament` 已补 team status、approve all、player update mutation。
- 用户侧队伍大厅已支持队长编辑队伍信息、转让队长和提交后锁定态展示；对应后端写操作会写 audit。
- 后台已实现 `/admin/tournaments/:tid/staff` staff 管理页，支持搜索站内用户、添加 `host/pooler/referee/streamer/commentator` 角色、按 role 分组展示和移除 staff。
- 前端 `entities/tournament` 已补 staff list/create/delete query 与 mutation。
- staff 查询/新增/删除逻辑已抽离到 `staffService`，添加/移除 staff 已写 audit。
- 后台已实现 `/admin/tournaments/:tid/qualifier` 资格赛管理页，支持添加资格赛图池、按指定 team + MP ID 导入成绩，或按 MP 内 score.user_id 自动识别本届所有队伍导入成绩；查看导入日志、查看原始成绩、手动修正 score、触发排名重算和锁榜；资格赛图池写操作会校验 stage/beatmap 唯一性并写 audit，已有成绩的资格赛图不能直接删除。
- 锁榜后 `/admin/tournaments/:tid/qualifier` 会禁用资格赛写操作并展示锁定状态。
- 前端 `entities/tournament` 已补 qualifier mappool/scores/imports/fetch/recalculate/lock/update-score query 与 mutation。
- 后台已实现 `/admin/tournaments/:tid/bracket` 正赛管理页，支持 round 创建/删除、round mappool 增删、手动创建 match、生成 32 强双败 bracket、更新 match 结果/WBD/FF/MP ID 和触发 MP 分数导入；round 写操作会校验字段并写 audit，删除 round 前会阻止误删已有 match/mappool 的轮次；round mappool type 使用固定枚举选择，后端会校验 type、round 归属和重复 beatmap；手动 match 创建/更新会校验 round/team/winner 归属并写 audit。
- 前端 `entities/tournament` 已补 round、round mappool、bracket generate、match create/update/fetch-scores、referee data/action/roll/timeout/game-score query 与 mutation。
- 后台已实现 `/admin/tournaments/:tid/audit` 审计日志页，支持 entity/action/operator/entity id 过滤、分页、old/new JSON 摘要展示。
- 前端 `entities/tournament` 已补 audit log list query。
- 后端已新增 `POST /tournament/:tid/import/teams` 历史赛事队伍/选手补录接口，host 可提交 JSON 批次；接口会按 `user_id -> osu_uid -> 占位 User` 解析选手，创建 team/player 快照，写入 `[historical-import:<batch_id>]` remark，并记录 `historical_import` audit。支持 `dry_run` 预检，预检事务回滚不落库。
- 后台已新增 `/admin/tournaments/:tid/import` 历史补录页面，支持粘贴 JSON、dry-run 预检、正式导入和结果摘要展示；赛事列表已增加 Import 入口。
- `tournamentService` 已抽离赛事列表、详情、创建、更新、删除；创建赛事会在同一事务中创建 creator host 并写 `tournament/create` audit，更新/删除赛事也会写 audit。
- 后台内容页已新增编辑中 Markdown 预览，调用后端 `POST /tournament/:tid/sections/preview` 复用 `markdown-it` + `sanitize-html` 管线；公开内容接口只返回 `content_html` 等展示字段，不再泄露 `source_markdown`，后台编辑改走 host 管理接口 `/sections/manage`。
- `/t/:tid/bracket` 已新增移动端纵向折叠轮次视图，桌面端保留横向 bracket 浏览。
- `/t/:tid/teams` 已补报名未开始/开放/已结束提示，报名期外会禁用创建、加入和当前队伍成员操作入口；空状态会根据报名状态给出不同提示。
- audit 覆盖已复核并补齐：裁判 roll、timeout、单局比分手动修正、正赛 MP 拉分现在都会记录 `TAuditLog`；`sections/preview` 和不支持的 undo 不产生持久写入，不写 audit。
- 前端赛事后台设置表单已将 schema/default/转换逻辑拆到 `TournamentSettingsFormModel`，避免 Fast Refresh 混合导出；资格赛和 staff 后台页的派生数组依赖已稳定。`pnpm exec tsc -b`、`pnpm run lint`、`pnpm run build` 已通过，lint 当前 0 warning，build 仅剩 Vite 大 chunk 提示。
- 前端已新增赛事后台专用路由守卫：全站 admin 可进入所有赛事后台页，具体 tournament 的 staff 可进入该届 `/admin/tournaments/:tid/*` 管理页；新建赛事入口仍只对全站 tournament 权限开放。赛事详情页会为全站 admin 或本届 staff 展示 Manage 入口，避免普通赛事 staff 被全站 admin 权限守卫挡在后台外。
- osu MP 拉分已统一走 `osu-api-v2-js` 的 `api.getMatch(matchId, { after, limit })`，按官方 matches 文档补齐事件分页，避免默认 100 条 events 截断；资格赛和正赛解析都按已知 `beatmap_id` 匹配图池，并按 score `user_id` 对应站内 `User.osu_uid` 归属到 player/team，不依赖 osu 房间内红蓝队。

## 13. 开发优先级

### P0：闭环可用

1. 完成真实环境联调验收中的问题修复，重点是测试库 SQL 迁移演练、真实 osu MP API 返回数据校验、真实规则文档 sanitizer 白名单、真实数据下 bracket 视觉/移动端验收。

### P1：稳定和体验

已完成首期代码侧收口；剩余体验问题进入真实联调验收处理。

### P2：长期优化

1. OpenAPI/Zod 接口合同。
2. 后端 TS 化评估。
3. 更细 staff 权限。
4. GitHub/S3/R2 上传 provider 抽象。
5. 账号认领/导入用户合并工具。

## 14. 验收清单

### 后端

- admin 才能创建赛事。
- 创建者自动成为 creator host。
- 普通 host 不能添加 host 或删除赛事。
- staff 不能参赛。
- 同赛事同 user 不能加入两队。
- 报名期外普通用户不能加入、退出、踢人、提交。
- 公开队伍无需邀请码，私密队伍必须邀请码。
- 公开接口不泄露私密邀请码。
- 队伍锁定后普通用户不能自改。
- player review 修改写 audit。
- qualifier 两轮每图取最高。
- WBD/FF 写入 `FT:-1`。
- 手动改胜方写 audit。
- bracket 下游已有结果时阻止静默覆盖。
- protect/ban/pick 冲突禁止保存。

### 前端

- 赛事用户侧页面不像后台管理页。
- 规则 Markdown 展示、目录、链接、表格、引用正常。
- 组队大厅公开/私密队伍操作清晰。
- 未登录操作打开登录弹窗或给出明确提示。
- 所有 mutation 有成功/失败反馈。
- qualifier 榜单展示总分和 MP 外链。
- bracket 宽屏和移动端都可读。
- 比赛详情能展示双方、比分、状态、MP、已打图。
- 裁判台 autosave 状态和冲突提示清楚。
- 后台危险操作有确认。

### 数据迁移

- 测试库执行 SQL 成功。
- 旧 player 回填 `t_id`。
- 旧 team 回填 `captain_player_id`。
- 旧 tournament 回填 `created_by`。
- 重复字段/index 已处理。
- 导入历史数据可以通过 `dry_run` 预检，正式导入后可按 `historical_import` audit 和 player remark 里的 `batch_id` 追踪；真实库批量回滚仍建议先走 SQL 演练。

## 15. 风险与未决项

### 仍需确认

- 真实数据下 bracket 最终视觉、移动端阅读体验、暗色主题和 reset final 隐藏是否满足 JHC 使用要求；当前已有移动端纵向折叠视图和 reset final 隐藏逻辑，但仍需验收。
- Markdown/GFM sanitizer 已有后端 `sanitize-html` 保存清洗和前端 DOMPurify 二次清洗；白名单是否需要根据真实规则文档继续放宽或收紧仍需验收。
- 投稿文件和富文本图片最终使用 GitHub、MinIO、S3/R2 中哪种 provider。

### 主要风险

- 旧 tournament 表字段和 SQL 草案可能与真实生产库存在差异，必须先测试库演练。
- bracket 自动推进如果允许任意人工改历史结果，必须阻止下游静默覆盖。
- Markdown 渲染已接 sanitizer，但白名单调整必须谨慎，避免重新引入 XSS 风险。
- 裁判工作台没有实时同步，多个 referee 同时操作时可能产生覆盖；首期通过刷新和后端冲突检测降低风险。
- GitHub 不适合作为所有投稿文件的长期存储，20MB 文件更适合评估 Release assets、S3/R2 或继续 MinIO。

## 16. AI 开发入口

后续 AI 接手赛事系统时建议按顺序阅读：

1. 本文。
2. [00-ai-handoff.md](./00-ai-handoff.md)
3. [decision-log.md](./decision-log.md) 中的赛事系统部分。
4. 当前要修改的前端页面或后端 service。
5. 只在需要背景时阅读 [tournament-system.md](./tournament-system.md) 和 [tournament-technical-plan.md](./tournament-technical-plan.md)。

开发时优先遵守：

- 前端页面状态来自 `entities/tournament` query hook。
- 后端业务规则进入 service。
- 写操作必须考虑 audit。
- 页面不要直接绕过共享错误处理和富文本渲染。
- 不要根据旧后端预留接口扩功能，功能范围以本文首期目标为准。
