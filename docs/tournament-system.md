# Tournament System

赛事系统是独立产品线，不等同于旧 `event` 活动系统。本文只保留后续开发必须遵守的领域规则和判断边界。

## 仓库边界

- 前端：`jack-house-v3`
- 后端：`jack-house-web/backend`
- 旧前端：`jack-house-web/frontend` 只作为业务和视觉参考。
- 涉及接口、权限、数据库、上传、osu MP 拉分和审计时，必须改后端。

## 系统定位

- `event` 是站内活动/排行活动。
- `tournament` 是完整赛事生命周期：官网、报名、队伍、staff、图池、资格赛、正赛、裁判、赛程和结果沉淀。
- 两者可以复用用户链接、头像、排行榜 UI、富文本、上传等基础能力，但领域模型不要混用。
- 赛事按“届”建模，`JHC2026`、`JHC2027` 是独立 tournament。
- `acronym` 是公开 URL 标识，例如 `/t/JHC2026`；修改后旧 acronym 失效，不做历史 alias。

## 身份模型

- 全部正式身份都关联站内 `User`。
- `TTeam` 是参赛单元，单人赛也创建 team。
- `TPlayer` 表示某个 user 在某届赛事某支队伍里的成员身份，不是独立账号。
- 同一 tournament 中同一 user 只能有一个有效 player。
- `TStaff` 表示某个 user 在某届赛事中的工作人员身份，可多角色。
- 不支持外部嘉宾或非站内 staff/player 作为正式身份；历史补录如遇到非站内选手，创建导入用占位 `User` 再挂 player。
- 公开历史页面、队伍页、成绩页和 bracket 默认展示报名时 player 快照。
- `User.osu_uid` 是成绩拉取身份来源，不在 player 再存一份可变 osu uid。

## Team 规则

- 队伍人数由 `team_size_min/max` 控制，JHC 当前支持 1-2 人。
- 队伍可为私密队伍或公开队伍；私密队伍用邀请码加入，公开队伍可直接加入。
- 队长可重置邀请码、踢队员；队员可退出队伍；这些普通操作只允许报名期内发生。
- 队伍通过后普通用户不能再换人或改队伍信息；host 可以后台修正并写审计。
- 审查针对 player，不是 team。
- 正赛资格受 player 审查影响：单人队 player 未通过则不能进正赛；双人队一人未通过时，另一人可继续单独参赛。

## Staff 与权限

- 创建赛事需要全站 admin；创建者自动成为 creator host。
- 只有 creator host 可以删除赛事和添加其他 host。
- host 可以管理赛事后台、队伍审查、资格赛、正赛和 staff。
- pooler 管理正赛图池。
- referee 管理比赛、MP、拉分、WBD/FF、裁判操作。
- custom mapper/tester/streamer/commentator 主要用于公开展示和排班，不默认获得后台写权限。
- tester/streamer/commentator 可以同时作为 player；其余 staff role 与 player 身份互斥。
- 全站 admin 可以作为紧急管理权限，但不自动成为赛事公开 staff。
- 赛事写操作必须由后端鉴权；前端隐藏按钮只是体验优化。
- 涉及 host override、admin override、队伍锁定后修改、成绩修正和 bracket 推进的操作应写入赛事审计日志。

## 内容与富文本

- 赛事规则、说明、公告、奖项、FAQ、时间线等内容属于 tournament 自己的内容体系，不依赖 forum/post。
- 规则主入口支持 Markdown source，保存时生成 HTML，前台展示统一走 `RichTextRenderer`，目录走 `RichTextToc`。
- 不承诺 Markdown 和 Tiptap HTML 之间的无损双向切换。

## 资格赛

- 资格赛图池固定为 stage 1-7。
- 每队只绑定一个 osu MP；同一个 MP 中可打两轮。
- 每张图取两轮最高分，总分为每图最高分相加。
- qualifier MP ID 只能由 host/referee 填写或修改。
- 站内不公开两轮原始成绩详情；用户侧展示对局、总分、排名和 osu MP 外链。
- 管理端展示导入日志、失败原因、原始成绩和手动修正记录。
- 锁榜后生成正赛；生成前必须确认晋级名额和 player 审查状态。

## 正赛与 Bracket

- 首期固定 32 强双败制，采用 folded seeding：资格赛 #1 vs #32、#2 vs #31，以此类推。
- JHC 正赛不是通用 32DE 默认轮转。match 编号、`Wxx/Lxx` source graph、红蓝队顺序和 #61 阶段归属必须以 [tournament-bracket-flow.md](./tournament-bracket-flow.md) 为准。
- `Wxx/Lxx` 中的 `xx` 是赛事展示 match 编号，不是数据库 `t_match.id`。
- 后端 `source_match_1_id/result` 和 `source_match_2_id/result` 是唯一真实流转来源；前端不能自己推导对位。
- reset final 预生成并默认隐藏，只有败者组侧赢下 GF 时激活。
- 每场正赛只绑定一个 osu MP；MP ID 可修改，但不保存多个 MP。
- match 状态只需要区分未开始和完成，旧值 `1` 仅作兼容。
- 支持 WBD 和 FF，由 referee/host 设置；不细分原因枚举，只保留备注。
- WBD 优先级高于普通比分，默认记为胜方 FT 分数、负方 `-1`。
- osu MP 拉分后默认按比分判胜；referee 可手动改胜方，但必须提醒并记录审计。

## 裁判工作台

- 裁判工作台是独立工作流，不是比赛详情页附加按钮。
- 展示比赛基础信息、双方队伍/队员、osu UID、邀请命令、图池状态、操作时间线、比分和异常提示。
- 操作顺序：高点先 protect，低点再 protect；低点先 ban，高点再 ban；高点先 pick，低点再 pick，后续轮流。
- 已 protect 的图不能被 ban；已 ban 的图不能 pick；已 pick 的图不能再次 pick。
- 裁判可以修改历史 protect/ban/pick，但如果导致后续冲突，后端必须拒绝保存并要求先修正冲突。
- 不做实时多人同步；保存后其他用户刷新获取新状态。

## 开发判断

- 新增赛事能力前先确认它属于公开用户侧、赛事后台、裁判台还是后端能力。
- 所有权限、状态推进、成绩计算、bracket source graph 和审计都必须落在后端。
- 前端页面只负责展示、输入、交互效率和错误处理。
- 涉及正赛 flow 时先读 [tournament-bracket-flow.md](./tournament-bracket-flow.md)，不要参考通用 bracket 文章或库默认规则推导 JHC 对位。
