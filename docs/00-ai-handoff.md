# AI Handoff

后续 AI 接手本仓库时先读本文件。本文只保留开发边界、长期规范和关键专项入口，不记录已完成清单、阶段计划或临时过程。

## 阅读顺序

1. [decision-log.md](./decision-log.md)：长期产品/技术决策。
2. [domain-model.md](./domain-model.md)：核心领域对象、状态和枚举。
3. [api-contract.md](./api-contract.md)：V3 依赖的后端接口合同。
4. [coding-standards.md](./coding-standards.md)：编码与注释规范。
5. 涉及富文本时读 [rich-text-system.md](./rich-text-system.md)。
6. 涉及赛事时读 [tournament-system.md](./tournament-system.md)；涉及正赛 bracket、schedule、match source、自动推进时必须读 [tournament-bracket-flow.md](./tournament-bracket-flow.md)。
7. 需要结构图或模块关系时读 [tournament-architecture.md](./tournament-architecture.md)。
8. 涉及部署或生产联调时读 [deployment-checklist.md](./deployment-checklist.md)。

## 仓库边界

- 前端开发在 `jack-house-v3`。
- 后端开发在 `jack-house-web/backend`。
- 旧前端 `jack-house-web/frontend` 只作为业务和视觉参考，不继续开发。
- 不做 Vue 到 React 的逐行翻译；按当前产品目标和 V3 设计重做体验。
- 后端安全、权限、数据库、上传、旧 controller 兼容都必须在 `jack-house-web/backend` 处理，不在前端伪造业务边界。

## 开发规范

- UI primitive 优先用 shadcn/ui；图标统一用 `@phosphor-icons/react`。
- 数据请求使用 TanStack Query；复杂表格使用 TanStack Table；表单使用 React Hook Form + Zod。
- 富文本展示必须走 `RichTextRenderer`，不要直接 `dangerouslySetInnerHTML`。
- 短反馈用 Sonner `toast`；页内持久提示用 `AppAlert` / `MutationErrorAlert`。
- 错误文案统一用 `getErrorMessage`，不要在页面内复制局部错误解析函数。
- Admin 页面保持高密度工具风格，不套用户侧主容器，不写大段用途说明。
- 注释只解释业务约束、兼容原因或规避原因，避免重复代码字面含义。
- 新增接口必须以后端鉴权和审计为边界；前端只做体验和入口控制。
- 新增数据字段前先检查 Sequelize model、真实数据库迁移方式和旧接口兼容。

## 赛事硬规则

- JHC 正赛赛程流转以 [tournament-bracket-flow.md](./tournament-bracket-flow.md) 为准。
- 不要用通用 32DE、bracket 库默认 losers bracket 规则或数据库自增 id 重新推导 JHC 对位。
- `Wxx/Lxx` 中的 `xx` 是赛事展示 match 编号，不是 `t_match.id`。
- 前端只展示后端 source graph；真正流转关系必须由 `source_match_1_id/result` 和 `source_match_2_id/result` 表达。
- `#61` 属于 Grand Finals 阶段，不属于 Finals。

## 文档规则

- 长期决策放 `decision-log.md`。
- 领域规则放对应专项文档，例如赛事放 `tournament-system.md`，正赛流转放 `tournament-bracket-flow.md`。
- 接口合同放 `api-contract.md`，编码规则放 `coding-standards.md`。
- 不把已完成清单、一次性计划、临时排查过程写回 AI handoff。

## 改动检查

- URL/API 语义是否保持兼容。
- loading / empty / error / 401 / 无权限是否完整。
- 移动端是否可用，文本是否不溢出。
- 富文本是否走统一 renderer。
- 后端写操作是否有权限、校验、审计和事务边界。
- 赛事 bracket 改动是否对照 `tournament-bracket-flow.md` 验证。
