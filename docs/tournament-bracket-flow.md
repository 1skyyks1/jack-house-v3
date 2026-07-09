# Tournament Bracket Flow

本文是 JHC 正赛赛程流转的权威说明。后续 AI 或开发者处理 bracket、schedule、match source、自动推进、裁判页图池归属时，必须以本文为准。

## 核心原则

- JHC2026 主赛不是通用 32DE 库的默认轮转。
- `Chrono Schedule` 中的 `match_id / stage / bracket / team red / team blue` 是当前赛程设计的来源。
- `match_id` 是赛事内展示编号，不能用数据库自增 `t_match.id` 替代。
- `team red / team blue` 的左右顺序要保留，它对应 `source_match_1_*` 和 `source_match_2_*`。
- Stage 中带 `P` 的行是可能性分支，不进入正式 bracket 主流转。
- `Wxx` 表示 Match #xx 的胜者，`Lxx` 表示 Match #xx 的败者。
- 前端只展示 source graph；真正的流转关系必须由后端 `source_match_1_id/result` 和 `source_match_2_id/result` 表达。
- 不要重新用“标准双败”规则推导 JHC 的 losers bracket 对位。

## Match 编号

| Range | Stage | Bracket |
| --- | --- | --- |
| #1-#16 | RO32 | Winner |
| #17-#24 | RO16 | Loser |
| #25-#32 | RO16 | Winner |
| #33-#40 | QF | Loser |
| #41-#44 | QF | Loser 2 |
| #45-#48 | QF | Winner |
| #49-#52 | SF | Loser |
| #53-#54 | SF | Loser 2 |
| #55-#56 | SF | Winner |
| #57-#58 | Finals | Loser |
| #59 | Finals | Loser 2 |
| #60 | Finals | Winner |
| #61 | Grand Finals | Loser |
| #62 | Grand Finals | Winner |
| #63 | Grand Finals | Reset |

## RO32 种子顺序

RO32 #1-#16 按资格赛种子固定如下，红蓝顺序必须保留：

```text
#1  = Seed #1  vs Seed #32
#2  = Seed #16 vs Seed #17
#3  = Seed #8  vs Seed #25
#4  = Seed #9  vs Seed #24
#5  = Seed #4  vs Seed #29
#6  = Seed #13 vs Seed #20
#7  = Seed #5  vs Seed #28
#8  = Seed #12 vs Seed #21
#9  = Seed #2  vs Seed #31
#10 = Seed #15 vs Seed #18
#11 = Seed #7  vs Seed #26
#12 = Seed #10 vs Seed #23
#13 = Seed #3  vs Seed #30
#14 = Seed #14 vs Seed #19
#15 = Seed #6  vs Seed #27
#16 = Seed #11 vs Seed #22
```

## FT 规则

- RO32 / RO16：FT5，BO9。
- QF / SF：FT6，BO11。
- Finals / Grand Finals / Reset：FT7，BO13。

## Source Graph

```text
#17  = L1  vs L2
#18  = L3  vs L4
#19  = L5  vs L6
#20  = L7  vs L8
#21  = L9  vs L10
#22  = L11 vs L12
#23  = L13 vs L14
#24  = L15 vs L16

#25  = W1  vs W2
#26  = W3  vs W4
#27  = W5  vs W6
#28  = W7  vs W8
#29  = W9  vs W10
#30  = W11 vs W12
#31  = W13 vs W14
#32  = W15 vs W16

#33  = L25 vs W24
#34  = L26 vs W23
#35  = L27 vs W22
#36  = L28 vs W21
#37  = L29 vs W20
#38  = L30 vs W19
#39  = L31 vs W18
#40  = L32 vs W17

#41  = W34 vs W33
#42  = W36 vs W35
#43  = W38 vs W37
#44  = W40 vs W39

#45  = W25 vs W26
#46  = W27 vs W28
#47  = W29 vs W30
#48  = W31 vs W32

#49  = L45 vs W43
#50  = L46 vs W44
#51  = L47 vs W41
#52  = L48 vs W42

#53  = W50 vs W49
#54  = W52 vs W51

#55  = W45 vs W46
#56  = W47 vs W48

#57  = L55 vs W54
#58  = L56 vs W53
#59  = W58 vs W57

#60  = W55 vs W56
#61  = L60 vs W59
#62  = W60 vs W61
#63  = W62 vs L62
```

## Implementation Notes

- 后端生成逻辑在 `jack-house-web/backend/services/tournament/bracketService.js`。
- 现有 JHC2026 数据的修复脚本是 `jack-house-web/backend/scripts/repair-jhc2026-bracket-flow.js`。
- 对应 SQL 记录在 `jack-house-web/backend/sql/2026-07-03-repair-jhc2026-main-bracket-flow.sql`。
- 前端展示编号逻辑在 `jack-house-v3/src/pages/tournaments/bracket/TournamentBracketPage.tsx`。
- 阶段归属逻辑在：
  - `jack-house-web/backend/services/tournament/roundStageService.js`
  - `jack-house-v3/src/pages/tournaments/_shared/tournamentRoundStages.ts`
- `#61` 是 `Grand Finals / Loser`，阶段归属为 `gf`，不是 Finals。
- reset final `#63` 预生成并隐藏，只有 `#62` 中败者组侧获胜时才激活。

## Verification

修改 bracket 逻辑后至少检查：

- #33-#40 是否为 `L25-32 vs W24-17`。
- #41-#44 是否为 `W34/W33`, `W36/W35`, `W38/W37`, `W40/W39`。
- #49-#52 是否为 `L45-48 vs W43/W44/W41/W42`。
- #57-#63 是否与 Source Graph 完全一致。
- 前端 list 中 `Winner/Loser of Match #xx` 是否使用赛事展示编号，不使用数据库 id。
- 裁判页、比赛页、performance、图池阶段归属中 #61 是否进入 Grand Finals。
