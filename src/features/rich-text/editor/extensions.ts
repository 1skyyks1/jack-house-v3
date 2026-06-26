import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"

export function createRichTextEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
    }),
    Link.configure({
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
      openOnClick: false,
    }),
    Placeholder.configure({
      placeholder: placeholder ?? "Write your content...",
    }),
  ]
}
