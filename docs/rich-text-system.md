# Rich Text System

V3 用统一富文本系统替代旧 WangEditor + `v-html` + 页面内 tocbot。

## 目标

- 编辑器核心：Tiptap。
- 第一阶段存储/提交：HTML，兼容旧后端字段。
- 展示层：`RichTextRenderer` + DOMPurify + 集中样式。
- 目录：`RichTextToc`，由统一 heading 解析生成。
- 后续可扩展 JSON + HTML 双写，但不能影响当前旧 API 兼容。

## 已落地

- `features/rich-text/editor/RichTextEditor.tsx`
- `features/rich-text/editor/extensions.ts`
- `features/rich-text/renderer/RichTextRenderer.tsx`
- `features/rich-text/renderer/RichTextToc.tsx`
- `features/rich-text/renderer/sanitizeHtml.ts`
- `features/rich-text/styles/rich-text.css`

当前编辑器能力：

- 段落
- H2/H3/H4
- 粗体、斜体、删除线
- 有序/无序列表
- 引用
- 代码块
- 链接

## 展示规则

- 页面不得直接使用 `dangerouslySetInnerHTML` 渲染后端 HTML。
- 帖子、公告、活动描述、图包描述、赛事规则/说明/奖项/FAQ 等 HTML 都必须通过 `RichTextRenderer`。
- 赛事规则可以使用 Markdown 作为 source，但前台仍渲染转换后的 HTML，并经过 `RichTextRenderer` 和 sanitizer。
- `RichTextRenderer` 负责 sanitizer、外链安全属性、富文本 class、empty state。
- blockquote、列表、代码块、表格、图片、长链接必须在样式层可见且不撑破容器。

## 目录规则

- TOC 只读取 H2/H3/H4。
- 中文标题必须能生成稳定 anchor。
- 重复标题必须去重，不能产生重复 id。
- 页面不再直接初始化 tocbot，也不使用全局 `.js-toc` / `.js-toc-content`。

## 编辑器规则

- 编辑器输出 HTML 兼容旧 `/post`、`/event` 等接口。
- 发帖页预览必须走 `RichTextRenderer`。
- 编辑器 toolbar 可用 shadcn Button/Tooltip/Dialog 等组合，不引入重型全套 UI 库。
- 图片/表格扩展前必须先确认上传协议、文件限制和 sanitizer 白名单。

## 验收清单

富文本相关改动必须检查：

- blockquote 样式可见。
- H2/H3/H4 正常进入目录。
- 中文标题和重复标题 anchor 正常。
- 外链安全属性正常。
- 图片和表格不撑破移动端。
- XSS payload 被清理。
- 编辑器和详情页展示效果语义一致。

## 待确认

- 是否需要保存 Tiptap JSON 作为长期内容格式。
- 图片上传是否沿用旧上传接口，还是建立统一 UploadField/预签名流程。
- 表格扩展的最小能力范围。
- 是否补服务端富文本清洗。
