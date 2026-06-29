# Tournament Architecture

本文基于 [tournament-technical-plan.md](./tournament-technical-plan.md) 绘制赛事系统架构图。它用于实现前快速对齐边界、模块、数据关系、权限和核心流程；细节规则仍以技术方案为准。

## 1. 系统上下文

```mermaid
flowchart LR
  Player["参赛用户<br/>站内 User"]
  Captain["队长<br/>Player + captain"]
  Staff["赛事 Staff<br/>host / pooler / referee / streamer / commentator"]
  Admin["全站 Admin"]
  Visitor["公开访客"]
  Osu["osu! MP / osu! profile"]

  subgraph V3["jack-house-v3 前端"]
    PublicSite["赛事官网<br/>/t /t/:tid"]
    TeamLobby["报名与组队<br/>/t/:tid/teams"]
    RulesPage["规则与内容页<br/>/t/:tid/rules"]
    QualifierPage["资格赛榜单<br/>/t/:tid/qualifier"]
    BracketPage["正赛对阵<br/>/t/:tid/bracket"]
    MatchPage["比赛详情<br/>/t/:tid/match/:matchId"]
    RefereeDesk["裁判工作台<br/>/t/:tid/referee/:matchId"]
    AdminPanel["赛事后台<br/>/admin/tournaments/*"]
  end

  subgraph Backend["jack-house-web/backend"]
    Express["Express routes<br/>/t"]
    Services["Tournament services<br/>权限 / 状态机 / 事务 / 审计"]
    Models["Sequelize models<br/>models/tournament/*"]
  end

  subgraph Storage["持久化与外部数据"]
    MariaDB["MariaDB<br/>tournament tables"]
    Audit["t_audit_log"]
    ImportLog["t_qualifier_import"]
  end

  Visitor --> PublicSite
  Player --> TeamLobby
  Captain --> TeamLobby
  Staff --> AdminPanel
  Staff --> RefereeDesk
  Admin --> AdminPanel

  PublicSite --> Express
  TeamLobby --> Express
  RulesPage --> Express
  QualifierPage --> Express
  BracketPage --> Express
  MatchPage --> Express
  RefereeDesk --> Express
  AdminPanel --> Express

  Express --> Services
  Services --> Models
  Models --> MariaDB
  Services --> Audit
  Services --> ImportLog
  Services <--> Osu
```

## 2. 前后端分层

```mermaid
flowchart TB
  subgraph Frontend["jack-house-v3"]
    Router["React Router<br/>用户侧 /t/*<br/>后台 /admin/tournaments/*"]
    Pages["Pages<br/>Tournament pages<br/>Admin tournament pages"]
    Features["Features<br/>auth / admin permissions<br/>rich text / bracket / referee"]
    Entities["Entities<br/>tournament api<br/>queries / types / schemas"]
    Shared["Shared<br/>http / i18n / AppAlert<br/>MutationErrorAlert / toast<br/>RichTextRenderer / RichTextToc"]
  end

  subgraph ApiLayer["HTTP API"]
    PublicApi["公开接口<br/>list / detail / sections<br/>teams / staff / qualifier / bracket / match"]
    UserApi["登录接口<br/>create team / join / leave<br/>submit / update player"]
    StaffApi["Staff 后台接口<br/>content / staff / qualifier<br/>rounds / bracket / matches / referee"]
  end

  subgraph Backend["jack-house-web/backend"]
    Routes["routes/tournamentRoute.js<br/>tid 解析 ID 或 acronym"]
    Controllers["controllers/tournament/*<br/>参数读取 / response"]
    Services["services/tournament/*<br/>业务规则收口"]
    Middleware["middleware<br/>authMiddleware<br/>isHost / isPooler / isReferee / isStaff"]
    Models["models/tournament/*<br/>Sequelize"]
  end

  subgraph Database["MariaDB"]
    Tables["tournament / t_team / t_player / t_staff<br/>t_section / t_round / t_mappool<br/>t_match / t_game / t_match_action<br/>t_qual_* / t_audit_log"]
  end

  Router --> Pages
  Pages --> Features
  Features --> Entities
  Entities --> Shared
  Entities --> PublicApi
  Entities --> UserApi
  Entities --> StaffApi

  PublicApi --> Routes
  UserApi --> Routes
  StaffApi --> Routes
  Routes --> Middleware
  Routes --> Controllers
  Controllers --> Services
  Services --> Models
  Services --> Middleware
  Models --> Tables
```

## 3. 后端服务拆分

```mermaid
flowchart LR
  Controller["Tournament controllers"]

  subgraph Services["services/tournament"]
    TournamentService["tournamentService<br/>创建 / 更新 / 删除<br/>acronym 解析<br/>状态推导"]
    ContentService["contentService<br/>Markdown 保存<br/>HTML 生成<br/>sanitizer 策略"]
    TeamService["teamService<br/>报名窗口<br/>创建 / 加入 / 离队<br/>队长 / 邀请码 / 锁定"]
    StaffService["staffService<br/>staff role<br/>creator host<br/>参赛互斥"]
    QualifierService["qualifierService<br/>MP 绑定<br/>拉分 / 导入日志<br/>每图两轮取高<br/>锁榜"]
    BracketService["bracketService<br/>32 强双败生成<br/>slot 来源<br/>reset final"]
    RefereeService["refereeService<br/>roll<br/>protect / ban / pick<br/>比分导入 / 手动修正<br/>冲突检测"]
    AuditService["auditService<br/>敏感变更审计"]
  end

  subgraph Models["Sequelize models"]
    Tournament["Tournament"]
    Section["TSection"]
    Team["TTeam"]
    Player["TPlayer"]
    Staff["TStaff"]
    Round["TRound"]
    Mappool["TMappool"]
    Match["TMatch"]
    Game["TGame"]
    Action["TMatchAction"]
    Qual["TQualMappool / TQualScore / TQualifierImport"]
    Audit["TAuditLog"]
  end

  Controller --> TournamentService
  Controller --> ContentService
  Controller --> TeamService
  Controller --> StaffService
  Controller --> QualifierService
  Controller --> BracketService
  Controller --> RefereeService

  TournamentService --> Tournament
  TournamentService --> StaffService
  TournamentService --> AuditService
  ContentService --> Section
  ContentService --> AuditService
  TeamService --> Team
  TeamService --> Player
  TeamService --> StaffService
  TeamService --> AuditService
  StaffService --> Staff
  StaffService --> Player
  StaffService --> AuditService
  QualifierService --> Qual
  QualifierService --> Team
  QualifierService --> Player
  QualifierService --> AuditService
  BracketService --> Round
  BracketService --> Match
  BracketService --> Team
  BracketService --> AuditService
  RefereeService --> Match
  RefereeService --> Game
  RefereeService --> Action
  RefereeService --> Mappool
  RefereeService --> AuditService
  AuditService --> Audit
```

## 4. 领域数据模型

```mermaid
erDiagram
  USER ||--o{ T_PLAYER : "plays as"
  USER ||--o{ T_STAFF : "staff roles"
  USER ||--o{ TOURNAMENT : "created_by"

  TOURNAMENT ||--o{ T_SECTION : "has content"
  TOURNAMENT ||--o{ T_TEAM : "has teams"
  TOURNAMENT ||--o{ T_STAFF : "has staff"
  TOURNAMENT ||--o{ T_ROUND : "has rounds"
  TOURNAMENT ||--o{ T_QUAL_MAPPOOL : "has qualifier maps"
  TOURNAMENT ||--o{ T_QUALIFIER_IMPORT : "has import logs"
  TOURNAMENT ||--o{ T_AUDIT_LOG : "has audits"

  T_TEAM ||--o{ T_PLAYER : "has players"
  T_TEAM ||--o{ T_QUAL_SCORE : "has qualifier scores"
  T_TEAM ||--o{ T_MATCH : "as team1"
  T_TEAM ||--o{ T_MATCH : "as team2"

  T_ROUND ||--o{ T_MAPPPOOL : "has mappool"
  T_ROUND ||--o{ T_MATCH : "has matches"

  T_MATCH ||--o{ T_GAME : "has games"
  T_MATCH ||--o{ T_MATCH_ACTION : "has timeline"
  T_MATCH ||--o{ T_AUDIT_LOG : "audited changes"

  T_QUAL_MAPPOOL ||--o{ T_QUAL_SCORE : "scored by"

  USER {
    int user_id PK
    string user_name
    string avatar
    string osu_uid
    string qq
    string discord
  }

  TOURNAMENT {
    int id PK
    string name
    string acronym
    string banner
    int team_size_min
    int team_size_max
    int qual_top_n
    datetime reg_start
    datetime reg_end
    datetime qual_start
    datetime qual_end
    int created_by FK
  }

  T_TEAM {
    int id PK
    int t_id FK
    string name
    string display_name
    string avatar
    bool is_open
    string invite_code
    int captain_player_id
    int status
    string qual_mp_id
    int qual_rank
    int qual_score
    datetime locked_at
  }

  T_PLAYER {
    int id PK
    int t_id FK
    int team_id FK
    int user_id FK
    string user_name_snapshot
    string avatar_snapshot
    string contact_qq
    string contact_discord
    string timezone
    string review_status
    bool is_captain
  }

  T_STAFF {
    int id PK
    int t_id FK
    int user_id FK
    string role
  }

  T_SECTION {
    int id PK
    int t_id FK
    string type
    string title
    string format
    text source_markdown
    text content_html
    int sort_order
    int updated_by
  }

  T_ROUND {
    int id PK
    int t_id FK
    string name
    string bracket_type
    int first_to
    int order
  }

  T_MAPPPOOL {
    int id PK
    int round_id FK
    string type
    string map_id
    string artist
    string title
    string mapper
  }

  T_MATCH {
    int id PK
    int round_id FK
    string mp_id
    int team1_id FK
    int team2_id FK
    int team1_score
    int team2_score
    int winner_id
    string result_type
    bool winner_overridden
    bool is_possible
    int status
  }

  T_MATCH_ACTION {
    int id PK
    int match_id FK
    string action_type
    int team_id
    int map_id
    json value_json
    int created_by
  }

  T_AUDIT_LOG {
    int id PK
    int t_id FK
    string entity_type
    int entity_id
    string action
    json old_value_json
    json new_value_json
    int operator_id
  }
```

## 5. 权限与角色边界

```mermaid
flowchart TB
  Request["HTTP request"]
  Auth{"已登录?"}
  Public{"公开接口?"}
  Admin{"全站 admin?"}
  Staff{"是本届 staff?"}
  Host{"host?"}
  Creator{"creator host?"}
  Pooler{"pooler?"}
  Referee{"referee?"}
  Captain{"队长?"}
  RegOpen{"报名期?"}

  PublicData["允许读取公开赛事数据"]
  CreateTournament["允许创建赛事"]
  DeleteTournament["允许删除赛事"]
  AddHost["允许添加 host"]
  ManageTournament["允许管理赛事基础信息"]
  ManageMappool["允许管理图池"]
  ManageQualifier["允许绑定 MP / 导入成绩"]
  RefereeDesk["允许使用裁判台"]
  TeamMutation["允许报名 / 组队 / 离队 / 踢人"]
  Deny["拒绝并返回明确错误"]

  Request --> Public
  Public -- yes --> PublicData
  Public -- no --> Auth
  Auth -- no --> Deny
  Auth -- yes --> Admin

  Admin -- yes --> CreateTournament
  Admin -- yes --> DeleteTournament
  Admin -- yes --> AddHost
  Admin -- yes --> ManageTournament

  Admin -- no --> Staff
  Staff -- no --> Captain
  Staff -- yes --> Host
  Host -- yes --> ManageTournament
  Host -- yes --> ManageQualifier
  Host --> Creator
  Creator -- yes --> DeleteTournament
  Creator -- yes --> AddHost

  Staff --> Pooler
  Pooler -- yes --> ManageMappool

  Staff --> Referee
  Referee -- yes --> ManageQualifier
  Referee -- yes --> RefereeDesk

  Captain --> RegOpen
  RegOpen -- yes --> TeamMutation
  RegOpen -- no --> Deny
```

## 6. 用户侧路由与页面结构

```mermaid
flowchart TB
  Entry["/t<br/>赛事列表"]
  Home["/t/:tid<br/>赛事官网首页"]
  Rules["/t/:tid/rules<br/>规则 / FAQ / 奖项"]
  Teams["/t/:tid/teams<br/>组队大厅 / 报名状态"]
  Qualifier["/t/:tid/qualifier<br/>资格赛图池 / 榜单"]
  Bracket["/t/:tid/bracket<br/>32 强双败对阵图"]
  Schedule["/t/:tid/schedule<br/>时间线 / 赛程"]
  Match["/t/:tid/match/:matchId<br/>比赛详情"]
  Referee["/t/:tid/referee/:matchId<br/>裁判工作台"]

  Entry --> Home
  Home --> Rules
  Home --> Teams
  Home --> Qualifier
  Home --> Bracket
  Home --> Schedule
  Bracket --> Match
  Schedule --> Match
  Match --> Referee

  subgraph SharedUI["复用能力"]
    RichText["RichTextRenderer<br/>RichTextToc"]
    Query["TanStack Query<br/>loading / empty / error"]
    Auth["RequireAuth<br/>登录弹窗 / 401 处理"]
    Theme["shadcn/ui<br/>Tailwind token<br/>暗色适配"]
  end

  Rules --> RichText
  Entry --> Query
  Home --> Query
  Teams --> Auth
  Referee --> Auth
  Bracket --> Theme
```

## 7. 后台路由与管理面

```mermaid
flowchart TB
  List["/admin/tournaments<br/>赛事列表"]
  New["/admin/tournaments/new<br/>创建赛事"]
  Settings["/admin/tournaments/:tid/settings<br/>基础设置 / 时间 / acronym"]
  Content["/admin/tournaments/:tid/content<br/>规则 / 说明 / 奖项 / FAQ"]
  Teams["/admin/tournaments/:tid/teams<br/>队伍 / player 审查 / 快照修正"]
  Staff["/admin/tournaments/:tid/staff<br/>staff 授权 / role 分组"]
  Qualifier["/admin/tournaments/:tid/qualifier<br/>资格赛 MP / 导入 / 锁榜"]
  Rounds["/admin/tournaments/:tid/rounds<br/>轮次 / FT / 图池"]
  Bracket["/admin/tournaments/:tid/bracket<br/>生成 / 手动调整 bracket"]
  Matches["/admin/tournaments/:tid/matches<br/>比赛 / 赛程 / 结果"]

  List --> New
  List --> Settings
  Settings --> Content
  Settings --> Teams
  Settings --> Staff
  Settings --> Qualifier
  Settings --> Rounds
  Rounds --> Bracket
  Bracket --> Matches

  subgraph AdminBase["现有后台基础设施"]
    AdminPage["AdminPage"]
    AdminTable["AdminTable"]
    Pagination["AdminPagination"]
    Alerts["AppAlert / MutationErrorAlert / Sonner"]
    Dialog["AlertDialog<br/>危险确认"]
  end

  List --> AdminTable
  Teams --> AdminTable
  Staff --> AdminTable
  Qualifier --> AdminTable
  Matches --> AdminTable
  New --> AdminPage
  Settings --> AdminPage
  Content --> AdminPage
  Bracket --> Alerts
  Settings --> Dialog
```

## 8. 报名与组队流程

```mermaid
sequenceDiagram
  actor User as 用户
  participant Web as jack-house-v3
  participant API as tournament route
  participant TeamSvc as teamService
  participant StaffSvc as staffService
  participant DB as MariaDB
  participant Audit as auditService

  User->>Web: 打开 /t/:tid/teams
  Web->>API: GET /t/:tid/teams
  API->>TeamSvc: listTeams(tid)
  TeamSvc->>DB: 读取 team + player 快照
  DB-->>Web: 队伍大厅数据

  User->>Web: 创建队伍或加入队伍
  Web->>API: POST /teams 或 /join
  API->>TeamSvc: mutateTeam(userId, payload)
  TeamSvc->>StaffSvc: 校验 staff 不能参赛
  TeamSvc->>DB: 校验报名期 / 同赛事唯一 player
  TeamSvc->>DB: 创建 team / player 快照
  TeamSvc->>Audit: 队伍创建或加入审计
  TeamSvc-->>Web: 返回最新 team

  User->>Web: 队长提交队伍
  Web->>API: POST /teams/:teamId/submit
  API->>TeamSvc: submitTeam(teamId)
  TeamSvc->>DB: 校验队长 / 人数 / 报名期
  TeamSvc->>DB: 更新 team.status
  TeamSvc-->>Web: 提交成功
```

## 9. 内容发布流程

```mermaid
sequenceDiagram
  actor Host as Host
  participant Admin as 后台内容页
  participant API as tournament route
  participant ContentSvc as contentService
  participant Markdown as Markdown renderer
  participant Sanitizer as HTML sanitizer
  participant DB as t_section
  participant Public as 前台规则页

  Host->>Admin: 编辑 source_markdown
  Admin->>Admin: 前端预览 HTML
  Host->>API: 保存 section
  API->>ContentSvc: saveSection(tid, payload)
  ContentSvc->>Markdown: Markdown -> HTML
  Markdown-->>ContentSvc: content_html
  ContentSvc->>Sanitizer: 清洗 HTML
  Sanitizer-->>ContentSvc: safe content_html
  ContentSvc->>DB: 保存 source_markdown + content_html
  ContentSvc-->>Admin: 保存成功

  Public->>API: GET /t/:tid/sections
  API->>ContentSvc: getPublicSections(tid)
  ContentSvc->>DB: 只读展示字段
  DB-->>Public: content_html
  Public->>Public: RichTextRenderer + RichTextToc
```

## 10. 资格赛流程

```mermaid
flowchart TB
  Registered["已报名 team/player<br/>review 不影响资格赛"]
  MpSet["referee/host 绑定 qual_mp_id"]
  Import["导入 osu MP 成绩"]
  Raw["保存原始成绩<br/>失败原因 / import log"]
  Normalize["按 player.user_id -> User.osu_uid 匹配"]
  BestOfTwo["每图两轮取最高分"]
  Total["汇总 team.qual_score"]
  Ranking["计算 team.qual_rank"]
  Lock["host 锁榜"]
  Public["用户侧展示<br/>总分 / 榜单 / MP 外链"]
  Admin["管理端展示<br/>原始成绩 / 修正 / 日志"]

  Registered --> MpSet
  MpSet --> Import
  Import --> Raw
  Raw --> Normalize
  Normalize --> BestOfTwo
  BestOfTwo --> Total
  Total --> Ranking
  Ranking --> Lock
  Ranking --> Public
  Raw --> Admin
  Admin --> Total
```

## 11. 32 强双败正赛生成

```mermaid
flowchart TB
  LockedRanking["锁定的资格赛 Top 32"]
  Seed["Folded seeding<br/>#1 vs #32<br/>#2 vs #31"]
  WB["Winners bracket matches"]
  LB["Losers bracket matches"]
  GF["Grand final"]
  Reset["Reset final<br/>预生成但隐藏"]
  Champion["Champion"]

  SlotModel["Bracket source/slot model<br/>source_type / source_ref<br/>或 t_bracket_slot"]
  RoundConfig["Round FT/BO 配置<br/>TRound.first_to"]
  Matches["TMatch<br/>team1/team2/winner/status/result"]

  LockedRanking --> Seed
  Seed --> WB
  WB -- winner --> WB
  WB -- loser --> LB
  LB -- winner --> LB
  LB -- losers final winner --> GF
  GF -- winners side wins --> Champion
  GF -- losers side wins --> Reset
  Reset --> Champion

  SlotModel --> WB
  SlotModel --> LB
  SlotModel --> GF
  SlotModel --> Reset
  RoundConfig --> Matches
  WB --> Matches
  LB --> Matches
  GF --> Matches
  Reset --> Matches
```

## 12. 裁判工作台状态机

```mermaid
stateDiagram-v2
  state "等待 Roll" as WaitingRoll
  state "高点 Protect" as ProtectHigh
  state "低点 Protect" as ProtectLow
  state "低点 Ban" as BanLow
  state "高点 Ban" as BanHigh
  state "高点 Pick" as PickHigh
  state "低点 Pick" as PickLow
  state "轮流 Pick" as AlternatingPick
  state "导入比分" as ImportScore
  state "比分确认" as ScoreReview
  state "手动改胜方" as ResultEdit
  state "WBD 或 FF" as WBDorFF
  state "完成" as Complete

  [*] --> WaitingRoll
  WaitingRoll --> ProtectHigh: Roll 完成
  ProtectHigh --> ProtectLow
  ProtectLow --> BanLow
  BanLow --> BanHigh
  BanHigh --> PickHigh
  PickHigh --> PickLow
  PickLow --> AlternatingPick
  AlternatingPick --> ImportScore: 当前局完成 Pick
  ImportScore --> ScoreReview: 拉取 osu MP 成绩
  ScoreReview --> AlternatingPick: Match 未结束
  ScoreReview --> ResultEdit: Referee 手动改胜方
  ResultEdit --> Complete: 审计后确认
  ScoreReview --> Complete: 达到 FT
  WaitingRoll --> WBDorFF: WBD 或 FF
  ProtectHigh --> WBDorFF
  AlternatingPick --> WBDorFF
  WBDorFF --> Complete: 写入 FT 对 -1
  Complete --> [*]
```

## 13. 裁判台数据流

```mermaid
sequenceDiagram
  actor Referee as Referee
  participant Desk as 裁判工作台
  participant API as referee API
  participant RefSvc as refereeService
  participant Match as TMatch
  participant Action as TMatchAction
  participant Game as TGame
  participant Audit as t_audit_log
  participant Osu as osu MP

  Referee->>Desk: 输入 roll / protect / ban / pick
  Desk->>Desk: 本地校验顺序与冲突
  Desk->>API: 2 秒 debounce autosave
  API->>RefSvc: saveAction(matchId, action)
  RefSvc->>Action: 读取全部 action timeline
  RefSvc->>RefSvc: 全局冲突检测
  RefSvc->>Action: 写入或更新 action
  RefSvc->>Audit: 修改历史 action 时写审计
  RefSvc-->>Desk: 返回最新 timeline

  Referee->>Desk: 导入比分
  Desk->>API: POST /matches/:matchId/import-score
  API->>RefSvc: importScore(matchId)
  RefSvc->>Osu: 拉取 MP 成绩
  Osu-->>RefSvc: score data
  RefSvc->>Game: 写单局比分
  RefSvc->>Match: 更新 match score / winner
  RefSvc-->>Desk: 返回比赛结果

  Referee->>Desk: 手动改胜方
  Desk->>API: PATCH /matches/:matchId/result
  API->>RefSvc: overrideWinner(payload)
  RefSvc->>Match: winner_overridden = true
  RefSvc->>Audit: 记录手动改胜方
  RefSvc-->>Desk: 返回审计后的结果
```

## 14. 审计触发点

```mermaid
flowchart LR
  Sensitive["敏感操作"]
  Creator["creator host / admin override"]
  LockedTeam["队伍锁定后修改"]
  Review["player 审查变更"]
  QualFix["资格赛成绩手动修正"]
  WinnerOverride["MP 拉分后手动改胜方"]
  BracketAdjust["bracket 手动调整"]
  WBD["WBD / FF 设置"]
  AuditSvc["auditService"]
  AuditTable["t_audit_log<br/>old_value_json<br/>new_value_json<br/>operator_id"]

  Sensitive --> Creator
  Sensitive --> LockedTeam
  Sensitive --> Review
  Sensitive --> QualFix
  Sensitive --> WinnerOverride
  Sensitive --> BracketAdjust
  Sensitive --> WBD
  Creator --> AuditSvc
  LockedTeam --> AuditSvc
  Review --> AuditSvc
  QualFix --> AuditSvc
  WinnerOverride --> AuditSvc
  BracketAdjust --> AuditSvc
  WBD --> AuditSvc
  AuditSvc --> AuditTable
```

## 15. 数据迁移顺序

```mermaid
flowchart TB
  Backup["备份数据库"]
  TestDB["测试库演练"]
  P1["t_player 增加 t_id / 快照 / 联系方式 / timezone / remark / review_status"]
  P2["回填 t_player.t_id = t_team.t_id"]
  P3["回填 player 快照"]
  T1["t_team 增加 avatar / is_open / captain_player_id / locked_at"]
  T2["回填 captain_player_id"]
  Tour1["tournament 增加 created_by"]
  Tour2["从 host staff 回填 creator"]
  Match1["t_match 增加 result_type / result_note / winner_overridden 等"]
  Section["创建 t_section"]
  Validate["验证数据一致性"]
  Unique["添加 unique<br/>(t_id, user_id)"]

  Backup --> TestDB
  TestDB --> P1
  P1 --> P2
  P2 --> P3
  P3 --> T1
  T1 --> T2
  T2 --> Tour1
  Tour1 --> Tour2
  Tour2 --> Match1
  Match1 --> Section
  Section --> Validate
  Validate --> Unique
```

## 16. 实施依赖图

```mermaid
flowchart TB
  Migration["1. 数据库迁移演练"]
  Service["2. service 层和权限 helper"]
  Content["3. content section<br/>Markdown -> HTML"]
  Public["4. 公开只读赛事页"]
  Team["5. 报名与组队闭环"]
  Staff["6. staff 管理<br/>creator host 权限"]
  Qualifier["7. 资格赛 MP / 导入 / 排名"]
  BracketMock["8. bracket mock 技术验证"]
  BracketGen["9. 32 强双败生成"]
  MatchAdmin["10. 正赛 round / mappool / match 后台"]
  Referee["11. 裁判工作台"]
  Import["12. 历史赛事补录工具"]

  Migration --> Service
  Service --> Content
  Content --> Public
  Service --> Team
  Service --> Staff
  Team --> Qualifier
  Staff --> Qualifier
  Qualifier --> BracketMock
  BracketMock --> BracketGen
  BracketGen --> MatchAdmin
  MatchAdmin --> Referee
  Public --> Import
  Team --> Import
  Qualifier --> Import
  MatchAdmin --> Import
```

## 17. 实现检查矩阵

| 区域 | 核心产物 | 必须验证 |
| --- | --- | --- |
| 数据库 | 迁移 SQL、回填脚本、约束 | 测试库演练、可回滚、旧数据可读 |
| 后端 service | tournament/team/staff/content/qualifier/bracket/referee/audit | 业务规则不散落 controller |
| 权限 | creator host、host、pooler、referee、staff、admin | 删除赛事、添加 host、staff 参赛互斥、报名窗口 |
| 内容 | `t_section`、Markdown 保存、HTML 缓存 | 前台只读 HTML，渲染走 `RichTextRenderer` |
| 报名 | team/player 快照、公开/私密队伍、邀请码 | 同赛事唯一 player、队伍锁定限制 |
| 资格赛 | MP 绑定、导入日志、两轮取高、锁榜 | 用户侧不展示两轮原始成绩 |
| 正赛 | 32 强双败、slot/source、GF reset | folded seeding、隐藏 reset final |
| 裁判台 | action timeline、autosave、冲突检测 | 无 websocket、无 undo、历史修改冲突禁止保存 |
| 审计 | `t_audit_log` | 敏感变更记录 old/new/operator |
| 前端 | 用户侧官网、后台管理、bracket、裁判台 | 移动端、暗色主题、loading/empty/error |
