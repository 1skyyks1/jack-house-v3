import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import StarterKit from "@tiptap/starter-kit"

export function createRichTextEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
      link: false,
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
    Image.configure({
      HTMLAttributes: {
        loading: "lazy",
        decoding: "async",
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({
      placeholder: placeholder ?? "Write your content...",
    }),
  ]
}
