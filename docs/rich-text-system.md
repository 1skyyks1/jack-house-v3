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
- 图片上传与插入，包括工具栏选择文件、粘贴图片文件、拖拽图片文件
- 表格插入、追加行/列、删除表格

## 展示规则

- 页面不得直接使用 `dangerouslySetInnerHTML` 渲染后端 HTML。
- 帖子、公告、活动描述、图包描述、赛事规则/说明/奖项/FAQ 等 HTML 都必须通过 `RichTextRenderer`。
- 赛事规则可以使用 Markdown 作为 source，但前台仍渲染转换后的 HTML，并经过 `RichTextRenderer` 和 sanitizer。
- `RichTextRenderer` 负责 sanitizer、外链安全属性、富文本 class、empty state。
- 旧帖子/公告、活动描述和赛事内容保存时也会经过后端 `sanitize-html` 白名单清洗。
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
- 图片上传统一使用 `POST /upload/rich-text/image`；工具栏、剪贴板图片和拖拽图片都走同一个接口。
- 富文本图片经后端写入 GitHub 仓库并默认返回 jsDelivr CDN URL；浏览器端不持有 GitHub token。
- 当前编辑器里删除图片只会移除 HTML 中的 `<img>` 引用，不会立即删除 GitHub 对象。
- 后端已增加富文本图片资产记录：上传成功后写入 `rich_text_asset`；帖子正文、活动说明和赛事章节保存时会解析 `<img src>`，分别用 `post_translation`、`event`、`t_section` + 对应 id 写入 `rich_text_asset_reference`。更新内容时，不再引用的图片只会移除对应引用；如果没有任何引用，资产状态标记为 `orphaned`。
- 后端已提供 `npm run cleanup:rich-text-assets`。默认 dry-run，生产定时任务显式启用后才会物理删除 GitHub 对象和数据库记录。
- 后端已提供 `npm run backfill:rich-text-assets` 用于历史内容回填，只识别本站 GitHub/jsDelivr URL。
- 表格当前以 HTML 存储，后端 sanitizer 已允许 `table/thead/tbody/tr/th/td` 及基础 `align/colspan/rowspan` 属性。

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
- 生产环境是否启用定时执行 `npm run cleanup:rich-text-assets -- --delete`，以及保留期是否沿用默认 7 天。
- 是否需要在正式库执行 `npm run backfill:rich-text-assets -- --apply` 做历史富文本图片回填；执行前必须先看 dry-run 输出。
