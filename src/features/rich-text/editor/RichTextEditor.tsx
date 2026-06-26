import type { Editor } from "@tiptap/react"
import { EditorContent, useEditor } from "@tiptap/react"
import {
  Code,
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextH,
  TextItalic,
  TextStrikethrough,
} from "@phosphor-icons/react"
import type { FormEvent, MouseEvent, ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { createRichTextEditorExtensions } from "./extensions"
import "./rich-text-editor.css"

type RichTextEditorProps = {
  disabled?: boolean
  error?: string
  id?: string
  label: string
  minHeightClassName?: string
  onBlur?: () => void
  onChange: (html: string) => void
  placeholder?: string
  value: string
}

export function RichTextEditor({
  disabled = false,
  error,
  id,
  label,
  minHeightClassName = "min-h-64",
  onBlur,
  onChange,
  placeholder,
  value,
}: RichTextEditorProps) {
  const syncedValueRef = useRef(value || "")

  const editor = useEditor({
    editable: !disabled,
    extensions: createRichTextEditorExtensions(placeholder),
    content: value || "",
    editorProps: {
      attributes: {
        "aria-label": label,
        class: cn("rich-text-editor-content rich-text", minHeightClassName),
        id: id ?? "",
      },
    },
    onBlur: () => onBlur?.(),
    onUpdate: ({ editor: currentEditor }) => {
      if (currentEditor.isDestroyed) return

      const nextValue = currentEditor.getHTML()
      syncedValueRef.current = nextValue
      onChange(nextValue)
    },
  })

  useEffect(() => {
    if (!editor) return

    editor.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    const nextValue = value || ""

    if (syncedValueRef.current === nextValue) return

    syncedValueRef.current = nextValue
    editor.commands.setContent(nextValue, { emitUpdate: false })
  }, [editor, value])

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-background transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
          disabled && "opacity-70",
        )}
      >
        <RichTextToolbar disabled={disabled || !editor} editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

type RichTextToolbarProps = {
  disabled: boolean
  editor: Editor | null
}

function RichTextToolbar({ disabled, editor }: RichTextToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-1 border-b bg-muted/45 p-2">
      <ToolbarButton
        active={editor?.isActive("bold")}
        disabled={disabled}
        label={t("richText.toolbar.bold")}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <TextB className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("italic")}
        disabled={disabled}
        label={t("richText.toolbar.italic")}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <TextItalic className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("strike")}
        disabled={disabled}
        label={t("richText.toolbar.strike")}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarDivider />
      {[2, 3, 4].map((level) => (
        <ToolbarButton
          active={editor?.isActive("heading", { level })}
          disabled={disabled}
          key={level}
          label={t("richText.toolbar.heading", { level })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run()}
        >
          <TextH className="size-4" weight="bold" />
          <span className="text-[11px] leading-none">{level}</span>
        </ToolbarButton>
      ))}
      <ToolbarDivider />
      <ToolbarButton
        active={editor?.isActive("bulletList")}
        disabled={disabled}
        label={t("richText.toolbar.bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <ListBullets className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("orderedList")}
        disabled={disabled}
        label={t("richText.toolbar.orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("blockquote")}
        disabled={disabled}
        label={t("richText.toolbar.quote")}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quotes className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("codeBlock")}
        disabled={disabled}
        label={t("richText.toolbar.codeBlock")}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="size-4" weight="bold" />
      </ToolbarButton>
      <LinkToolbarButton disabled={disabled} editor={editor} />
    </div>
  )
}

type LinkToolbarButtonProps = {
  disabled: boolean
  editor: Editor | null
}

function LinkToolbarButton({ disabled, editor }: LinkToolbarButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const active = editor?.isActive("link")

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (nextOpen) {
      setUrl((editor?.getAttributes("link").href as string | undefined) ?? "https://")
    }
  }

  const applyLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editor) return

    const nextUrl = url.trim()

    if (!nextUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      setOpen(false)
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: nextUrl }).run()
    setOpen(false)
  }

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run()
    setUrl("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("richText.toolbar.link")}
          aria-pressed={active}
          className={cn(
            "min-w-8 gap-0.5 px-2 text-muted-foreground",
            active && "bg-background text-primary shadow-sm",
          )}
          disabled={disabled}
          size="icon-sm"
          title={t("richText.toolbar.link")}
          type="button"
          variant="ghost"
        >
          <LinkIcon className="size-4" weight="bold" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-3 p-3">
        <form className="space-y-3" onSubmit={applyLink}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="rich-text-link-url">
              {t("richText.link.urlLabel")}
            </Label>
            <Input
              autoFocus
              id="rich-text-link-url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder={t("richText.link.urlPlaceholder")}
              type="text"
              value={url}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button disabled={!active} onClick={removeLink} size="sm" type="button" variant="ghost">
              {t("richText.link.remove")}
            </Button>
            <Button size="sm" type="submit">
              {t("richText.link.save")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

type ToolbarButtonProps = {
  active?: boolean
  children: ReactNode
  disabled: boolean
  label: string
  onClick: () => void
}

function ToolbarButton({ active, children, disabled, label, onClick }: ToolbarButtonProps) {
  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onClick()
  }

  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "min-w-8 gap-0.5 px-2 text-muted-foreground",
        active && "bg-background text-primary shadow-sm",
      )}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <span className="mx-1 h-8 w-px bg-border" />
}
