# Tournament Architecture

本文只记录赛事系统的模块边界和开发判断。产品规则见 [tournament-system.md](./tournament-system.md)，JHC 正赛流转见 [tournament-bracket-flow.md](./tournament-bracket-flow.md)，接口细节以实际代码和 [api-contract.md](./api-contract.md) 为准。

## Frontend

`jack-house-v3` 负责页面、交互和数据展示。

- 用户侧入口：`/t`, `/t/:tid`, `/t/:tid/teams`, `/t/:tid/qualifier`, `/t/:tid/bracket`, `/t/:tid/match/:matchId`, `/t/:tid/referee/:matchId`
- 后台入口：`/admin/tournaments/*`
- API 封装：`src/entities/tournament`
- 赛事页面：`src/pages/tournaments`
- 赛事后台：`src/pages/admin/tournaments`
- 共享能力：`RichTextRenderer`, `AppAlert`, `MutationErrorAlert`, `toast`, i18n, auth hooks

前端不要承载权限、成绩计算、bracket 推进或 source graph 推导。

## Backend

`jack-house-web/backend` 是赛事业务边界。

- 路由：`routes/tournamentRoute.js`
- Controller：`controllers/tournament/*`
- Service：`services/tournament/*`
- Auth middleware：`middleware/tournamentAuth.js`
- Model：`models/tournament/*`

Controller 只做参数读取和 response；业务规则进入 service；写操作考虑事务、权限、审计和冲突检测。

## Core Services

- `tournamentService`：赛事创建、更新、删除、acronym 解析、状态推导。
- `contentService`：赛事内容、Markdown/HTML、sanitizer、富文本引用。
- `teamService`：报名窗口、创建队伍、加入/退出、队长、邀请码、锁定。
- `staffService`：staff role、creator host、player 兼任规则、权限判断。
- `qualifierService`：资格赛图池、MP 绑定、拉分、两轮取高、锁榜。
- `bracketService`：32 强 bracket 生成、source graph、结果推进、reset final。
- `refereeActionService` / referee controller：roll、protect、ban、pick、比分导入、手动修正。
- `auditService`：敏感变更审计。

## Data Model

关键表：

- `tournament`
- `t_team`
- `t_player`
- `t_staff`
- `t_section`
- `t_round`
- `t_mappool`
- `t_match`
- `t_game`
- `t_match_action`
- `t_qual_mappool`
- `t_qual_score`
- `t_qual_import`
- `t_audit_log`

开发时以 Sequelize model 和真实数据库字段为准。新增字段前先确认迁移方式和旧接口兼容。

## Permission Boundary

- 全站 admin 创建赛事。
- creator host 可删除赛事和添加 host。
- host 管理赛事后台主流程。
- pooler 管理正赛图池。
- referee 管理比赛和裁判工作台。
- 前端隐藏入口不是权限边界；所有写接口都必须后端校验。
- 敏感操作写审计，包括 staff、队伍锁定后修改、资格赛修正、bracket 生成/推进、比赛结果修改、WBD/FF。

## Main Flows

### Registration

1. 用户创建或加入 team。
2. 队长提交队伍信息。
3. host 审查 player。
4. 队伍通过后普通用户不能再改队伍和成员。

### Qualifier

1. host/referee 维护资格赛图池和 MP。
2. 后端从 osu MP 拉成绩。
3. 每图两轮取最高分，汇总队伍总分。
4. host 锁榜后生成正赛。

### Bracket

1. 后端按 folded seeding 创建 #1-#16。
2. 后端按 [tournament-bracket-flow.md](./tournament-bracket-flow.md) 创建 #17-#63 的 source graph。
3. 比赛完成后，根据 `source_match_*` 推进胜者/败者。
4. 下游已有结果时禁止静默覆盖。
5. reset final 预生成，符合条件时激活。

### Referee

1. referee 设置 MP 和 roll。
2. 后端约束 protect / ban / pick 顺序和冲突。
3. 后端导入 osu MP game score。
4. referee/host 可处理 WBD、FF、手动改胜方。
5. 完成 match 后触发 bracket propagation。

## Frontend Rules

- 页面通过 `entities/tournament` query/mutation 访问数据。
- loading / empty / error / 401 / 无权限状态必须完整。
- 用户侧页面偏官网展示；后台页偏高密度工具。
- bracket list 和 bracket graph 都显示赛事 match 编号，不显示数据库 id。
- `Winner/Loser of Match #xx` 只由后端 source graph 映射展示。
- 涉及 #61、GF、reset final 时先对照 [tournament-bracket-flow.md](./tournament-bracket-flow.md)。

## Backend Rules

- Service 层负责业务约束，不把规则散落在 controller。
- 涉及多表写入时使用事务。
- 写操作返回前保证审计、缓存失效或前端 query invalidation 能覆盖关键页面。
- osu API 数据不可信，导入时要校验 player、map、score、MP game 和赛事图池归属。
- 人工覆盖历史结果时必须检查下游是否已有结果，避免静默覆盖。
