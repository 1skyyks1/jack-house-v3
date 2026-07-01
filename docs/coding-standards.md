# Coding Standards

本文件记录项目级编码规范。规则应保持少而稳定，只写会影响后续维护的一致性要求。

## 注释

- 注释只解释不明显的业务约束、兼容原因或规避原因。
- 注释尽量简短，优先使用 `// xxxx` 单行格式。
- 不写重复代码含义的注释，例如“设置变量”“调用函数”。
- `eslint-disable`、兼容旧接口、绕开框架限制时，必须用一句简短注释说明原因。

示例：

```ts
// Keep legacy API field names.
const payload = { post_id: postId }
```
