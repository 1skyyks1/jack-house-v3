# Decision Log

本文件只记录仍会影响后续开发的决策。阶段性方案、试验性做法和已经被实现替换的旧描述不再保留。

## 前端优先

- V3 第一阶段优先重构前端。
- 后端 Express + Sequelize + MariaDB 保留在 `jack-house-web/backend`，后续后端相关代码也在此处修改。
- 后端 TypeScript 化、ORM 替换、数据库 migration 暂缓。
- React V3 先兼容现有 API、权限、上传和 osu 相关逻辑。

## 不是机械迁移

- 不逐行翻译 Vue 文件。
- 保留旧前端真实业务逻辑、URL/API 语义和用户任务。
- 可以重组页面结构、组件边界、交互和视觉。
- 页面范围以 `jack-house-web/frontend` 的真实页面为准，不按废弃/预留后端接口扩范围。

## UI 与样式

- 全站主方案：shadcn/ui + Radix UI + Tailwind CSS。
- 图标库：`@phosphor-icons/react`，与 `components.json` 的 `iconLibrary: "phosphor"` 保持一致。
- 新增 shadcn primitives 必须用 `pnpm dlx shadcn@latest add <component>`。
- 旧 Element Plus 组件应优先映射到 shadcn 对等组件。
- Ant Design 不作为全站主 UI。
- 主题切换使用 `next-themes`，通过 `class="dark"` 驱动 `src/index.css` 中的设计 token，不为单页写死固定暗色稿。
- 顶栏语言和亮/暗主题都使用一键切换按钮，不做语言按钮组，也不使用主题 Switch。
- 顶栏移动端导航使用 shadcn `Sheet` 抽屉，不在小屏硬塞桌面横向导航。
- 用户侧做 ToC 社区体验；后台侧做高密度工具体验。
- 全站背景回归纯色主题背景，浅色为白、深色为黑；不再使用全局渐变底色。
- 首页采用三屏全屏海报式入口，而不是信息流首页或双栏卡片首页。
- 首页只保留 `JACK HOUSE / JACKMAPS / TOURNEY` 三个主入口，不再承担“最新内容看板”职责。
- 首页进入时强制深色主题氛围，退出首页后恢复原主题状态。

## Admin 边界

- Admin 页面撑满页面，不套用户侧主容器。
- Admin 不放每页固定大标题和用途说明；上下文优先通过 breadcrumb、筛选栏、工具栏表达。
- 已建立 `AdminPage`、`AdminTable`、`AdminPagination`、`AdminBadge`。
- 后台复杂表格使用 TanStack Table，基础控件使用 shadcn primitives。
- 后台删除确认统一使用 shadcn `AlertDialog`，不使用 `window.confirm`。

## 认证

- V3 认证统一使用 httpOnly cookie + CSRF，不发送 Bearer 头；后端不再接受旧前端 Bearer token。
- 当前注册入口只开放 osu OAuth；email/password 注册表单先不在 V3 UI 暴露。
- `POST /auth/register` 保留为旧后端预留接口；邮箱注册当前不作为 V3 缺陷处理。
- V3 已从 `localStorage.token` 切到 httpOnly cookie，cookie 写请求使用双提交 CSRF token；正式部署必须显式配置 `CORS_ORIGIN` 或 `FRONTEND_URL`。同站部署可继续使用 `AUTH_COOKIE_SAME_SITE=lax`；本地 V3 调线上后端或前后端跨站部署时，应使用 `AUTH_COOKIE_SAME_SITE=none` 和 `AUTH_COOKIE_SECURE=true`，并把实际前端 origin 写入 `CORS_ORIGIN`。
- 后端登录响应和 osu OAuth redirect 不再返回或携带 JWT token。

## 富文本

- 用 Tiptap 替代 WangEditor。
- 第一版提交 HTML 兼容旧后端字段。
- 展示层统一使用 `RichTextRenderer` + DOMPurify。
- 目录统一使用 `RichTextToc`，页面不再各自接 tocbot。
- 发帖页预览必须走 `RichTextRenderer`，不能绕过 sanitizer。
- 图片和表格首期继续存 HTML；图片通过后端 `/upload/rich-text/image` 上传，前端支持按钮、粘贴和拖拽图片文件，表格允许基础 `table/thead/tbody/tr/th/td` 结构。是否长期双写 Tiptap JSON 仍未决。

## 范围排除

- 不迁移旧 `/admin/homeImgs`；V3 首页不保留后台配置首页图。
- 公告 type 3 独立在 `/admin/announcement` 管理，不通过 `/forum/editor/:id?` 暴露。

## 赛事系统

- 赛事系统已作为迁移 MVP 之后的独立产品线接入 V3；继续按 `tournament-implementation-spec.md`、`tournament-technical-plan.md` 和 `tournament-architecture.md` 联调与验收。
- 后端赛事 API 根路径为 `/t`，前端公开页面路由也使用 `/t`；不要再新增 `/tournament` API 调用。
- 赛事系统与旧 `event` 活动系统保持领域隔离，只复用 UI、用户链接、排行榜展示、富文本和上传等基础能力。
- 赛事按“届”建模，JHC2026 和 JHC2027 即使属于同一系列，也作为两个独立 tournament。
- `acronym` 可作为公开 URL，如 `/t/JHC2026`；host 修改后旧 acronym 失效。
- 赛事状态主要由时间自动推导，但 host 可以在非当前状态时间下管理和修正数据。
- 赛事规则、说明、公告、时间线等内容放在 tournament 自己的表里，不依赖 forum/post。
- 赛事账号体系复用全站 `User`；player 是用户在某支赛事队伍中的成员记录，通过 `team.tournament_id` 归属赛事；staff 是用户在某届赛事中的工作人员记录，直接关联 `tournament_id`。
- 不支持外部嘉宾或非站内 staff/player 作为正式身份。历史赛事补录如遇到当年选手不是站内用户，建议创建导入用占位 `User`，再挂 player，避免产生第二套赛事身份系统。
- staff 权限和 staff 公开展示倾向解耦；全站 admin 可以作为紧急管理权限，但不自动成为赛事公开 staff。
- 当前身份模型倾向采用 `User + TournamentTeam + TournamentPlayer/TPlayer snapshot`，沿用 `Tournament -> Team -> Player` 主关系，不另起一套完全独立的赛事账号系统。
- player 不保存 `osu_uid_snapshot`。`User.user_id` 和 `User.osu_uid` 一一对应且 `osu_uid` 不可改变，成绩拉取直接通过 `player.user_id -> User.osu_uid`。
- `TPlayer` 冗余 `tournament_id`，旧后端实际字段名沿用 `t_id`，用于同赛事唯一校验和减少常见查询 join；service 层保证该字段与 team 归属一致。
- player 没有单独展示名，公开名称使用报名时的 `user_name_snapshot`。不提供用户手动刷新快照入口，确需修改由 host 后台处理并审计。
- 公开历史页面、队伍页、成绩页、bracket 默认展示 player 快照；当前报名管理后台同时展示 player 快照和当前 `User`。
- 赛事规则、说明、奖项、FAQ 使用 tournament 自己的内容表。赛事规则主入口支持 Markdown source，便于迁移 osu 侧规则文档；保存时保留 Markdown 原文并生成 HTML，前台展示统一走 `RichTextRenderer`，规则页目录走 `RichTextToc`。Tiptap 可作为可选富文本能力，但不要求用它重写规则。
- 赛事写操作必须由后端鉴权；前端隐藏按钮只能作为体验优化，不能作为权限边界。
- 涉及 host override、全站 admin override、队伍成员锁定后修改、成绩修正的操作倾向写入赛事审计日志。
- 同一个 tournament 中同一个 user 只能有一个有效 player；报名期内允许退出当前 team 再加入其他 team。
- 单人赛也统一创建 team；本模型下有有效 team/player 即视为报名。
- 直接升级旧 `TPlayer`，不新建并行 `TournamentPlayer`；`TTeam` 长期使用 `captain_player_id` 表达队长，旧 `captain_id=user_id` 可短期兼容或派生。
- 队伍由队长提交信息，支持 1-2 人和预留 min/max 人数字段；队伍通过后锁定普通修改，host 可以后台修正。
- 队伍锁定后 player 自己不能修改联系方式、timezone 或备注，只有 host 可后台修正。
- 没有队伍拒绝状态；官方审查针对 player。资格赛只要求报名，player 审查结果只影响正赛资格。
- 用户侧不公开标红或强调 `review_failed`，该状态只影响正赛资格，具体审查状态主要在后台展示。
- 支持私密队伍和公开队伍两种组队方式，两种都在组队大厅展示；私密队伍需要邀请码加入，公开队伍不需要邀请码。
- 队长可以重置邀请码。
- 队长可踢队员，队员可退出队伍，但仅限报名期。
- staff 继续采用多行多角色模型，`(tournament_id, user_id, role)` 唯一；所有 staff 默认公开展示并按 role 分组。当前角色为 `host`、`pooler`、`referee`、`streamer`、`commentator`。
- 创建赛事需要全站 admin 权限，不设计独立赛事内管理员角色；创建者自动成为 creator host。
- 只有 creator host 可以删除赛事和添加其他 host；普通 host 不拥有这两个权限。
- 只有 staff 才能看到赛事后台；不存在隐藏后台协作人员。
- 第一版默认所有 staff 都不允许参赛，降低权限和利益冲突复杂度。
- 资格赛和正赛成绩都通过 osu match 信息获取；常规拉取权限仅 referee 和 host，手动修正作为异常处理。
- 资格赛每队只绑定一个 osu MP；队伍可在同一个 MP 中打两轮，最终每张图取两轮最高分，总分为每图最高分相加。
- qualifier MP ID 只允许 referee/host 填写或修改，队长不能提交。
- 资格赛图池固定为 stage 1-7，不需要 type/mod 信息。
- 站内不公开资格赛两轮原始成绩详情；用户侧展示对局、比分/总分和 osu MP 外链，具体详情跳转 osu MP 查看。
- 正赛第一版只支持 32 强双败制，采用 folded seeding，如 #1 vs #32、#2 vs #31，并需要在网站上绘制完整对阵图。
- 双败需要支持 grand final reset：败者组冠军赢下第一场 GF 后，需要再打一场 reset final；reset final 在 bracket 数据中预生成但隐藏。
- 32 强对阵图优先评估上下分区的双败 SVG bracket，候选库为 `@g-loot/react-tournament-brackets`；如果样式/移动端/数据结构不满足再自研。
- 正赛 round 固定配置 BO/FT，不做单个 match override。
- 正赛 mappool 首期 type 固定为 `FU` / `DS` / `MD` / `LT` / `AC` / `QS` / `MN` / `RM` / `MX` / `DF` / `TB`。
- 正赛每场比赛只绑定一个 osu MP，MP ID 可修改但不保存多个 MP。
- 正赛 match 状态只需要区分未开始和完成。
- 正赛支持 WBD 和 FF，由 referee/host 设置；不细分原因枚举，只保留备注 note。WBD 优先级高于普通比分，设置后默认记为获胜所需分数对 `-1`，例如 FT7 记为 `7:-1`。
- osu MP 拉分后胜方默认按分数自动判定；referee 可以手动修改胜方，但必须提醒并记录审计。
- 比赛时间由 host/referee 后台填写；约战讨论不在网站内完成。
- 裁判工作台按 roll 结果自动约束 protect、ban、pick 顺序；修改后 2 秒 debounce 自动保存，不做实时多人同步，也不做 undo，选错时直接修改对应操作。允许修改历史 ban/pick/protect，但如果会导致 protect/ban/pick 冲突则禁止保存。

## 上传与存储

- GitHub 仓库 `1skyyks1/jack-house-img` 作为当前公开图片与投稿文件的候选存储仓库；浏览器端不持有 token，所有上传经后端代理。
- 投稿文件通过后端 storage provider 抽象兼容 MinIO/GitHub；投稿文件不压缩、不转格式，完整 SHA-256 入库，对象文件名使用短 hash 前缀 + 原扩展名。GitHub 方案上线前必须确认投稿文件全部可公开、规模可控；如果后续需要私有下载、权限、统计或大流量，再切回 MinIO/S3/R2。
- 富文本图片上传和表格编辑已接入；上传成功后记录 `rich_text_asset`，帖子正文、活动说明和赛事章节保存时同步 `rich_text_asset_reference`。编辑器删除图片不会立即删除远端对象，先在保存后移除引用并把无引用资产标记为 `orphaned`；后端清理脚本和历史回填脚本都默认 dry-run，生产显式启用后再写入或物理清理。

## 页面策略

- `/about` 保持旧站 TOC/索引页定位，不做普通介绍页。
- `/user/edit` 第一版只开放密码、QQ、Discord；头像、邮箱、用户名、osu UID 不开放自助编辑。
- 征稿投稿第一版先迁用户侧上传/备注/查看闭环，后台审核放在 `/admin/postFiles`。
- 图包维护不常驻在 `/pack/:packId` 页面；管理员入口与 Pack info 的分享按钮并列，点击后用 shadcn Dialog 承载刷新 osu 元数据、整体替换标签。
- 活动 `event` 链路先迁旧前端已有的活动详情、活动后台、stage 管理；不等同于赛事系统迁移。
- 公告 `type=3` 维持独立后台管理，不与普通帖子编辑器混用。

## 统一反馈

- 页面内持久消息、错误、警告、说明使用 `AppAlert` / `MutationErrorAlert`。
- 后端错误、未知错误等展示文案统一通过共享 `getErrorMessage` 解析。
- 保存成功、复制成功、发布成功等短生命周期反馈使用 Sonner `toast`。
- 不引入已弃用的 shadcn 旧 Toast/useToast。

## 导出

- `/admin/postFiles` 使用真实 `.xlsx` 导出。
- `exceljs` 和 `file-saver` 通过动态 import 在导出时加载。
- 大数据量导出策略仍待后续确认。
