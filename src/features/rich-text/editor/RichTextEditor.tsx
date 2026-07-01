import type { Editor } from "@tiptap/react"
import { EditorContent, useEditor } from "@tiptap/react"
import {
  Code,
  ImageSquare,
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  Quotes,
  Table as TableIcon,
  TextB,
  TextH,
  TextItalic,
  TextStrikethrough,
} from "@phosphor-icons/react"
import type { ChangeEvent, FormEvent, MouseEvent, ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/shared/components"
import { createRichTextEditorExtensions } from "./extensions"
import { uploadRichTextImage } from "./uploadImage"
import "./rich-text-editor.css"

export type RichTextEditorProps = {
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
  const { t } = useTranslation()
  const syncedValueRef = useRef(value || "")
  const disabledRef = useRef(disabled)
  const editorRef = useRef<Editor | null>(null)
  const [imageUploadCount, setImageUploadCount] = useState(0)
  const isUploadingImage = imageUploadCount > 0

  const uploadAndInsertImage = useCallback(
    async (targetEditor: Editor, file: File) => {
      setImageUploadCount((current) => current + 1)

      try {
        const uploaded = await uploadRichTextImage(file)
        targetEditor.chain().focus().setImage({ src: uploaded.url, alt: file.name }).run()
        toast.success(t("richText.image.uploadSuccess"))
      } catch (error) {
        toast.error(error instanceof Error ? getErrorMessage(error) : t("richText.image.uploadFailed"))
      } finally {
        setImageUploadCount((current) => Math.max(0, current - 1))
      }
    },
    [t],
  )

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
      handlePaste: (_view, event) => {
        if (disabledRef.current) return false

        const files = getImageFilesFromDataTransfer(event.clipboardData)
        const currentEditor = editorRef.current

        if (!files.length || !currentEditor) return false

        event.preventDefault()
        files.forEach((file) => void uploadAndInsertImage(currentEditor, file))
        return true
      },
      handleDrop: (_view, event) => {
        if (disabledRef.current) return false

        const files = getImageFilesFromDataTransfer(event.dataTransfer)
        const currentEditor = editorRef.current

        if (!files.length || !currentEditor) return false

        event.preventDefault()
        files.forEach((file) => void uploadAndInsertImage(currentEditor, file))
        return true
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      editorRef.current = currentEditor
    },
    onDestroy: () => {
      editorRef.current = null
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
    disabledRef.current = disabled

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
        <RichTextToolbar
          disabled={disabled || !editor}
          editor={editor}
          isUploadingImage={isUploadingImage}
          onUploadImage={uploadAndInsertImage}
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

type RichTextToolbarProps = {
  disabled: boolean
  editor: Editor | null
  isUploadingImage: boolean
  onUploadImage: (targetEditor: Editor, file: File) => Promise<void>
}

function RichTextToolbar({ disabled, editor, isUploadingImage, onUploadImage }: RichTextToolbarProps) {
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
      <ImageToolbarButton
        disabled={disabled}
        editor={editor}
        isUploading={isUploadingImage}
        onUploadImage={onUploadImage}
      />
      <ToolbarDivider />
      <TableToolbarButtons disabled={disabled} editor={editor} />
    </div>
  )
}

type TableToolbarButtonsProps = {
  disabled: boolean
  editor: Editor | null
}

function TableToolbarButtons({ disabled, editor }: TableToolbarButtonsProps) {
  const { t } = useTranslation()
  const tableActive = Boolean(editor?.isActive("table"))

  return (
    <>
      <ToolbarButton
        disabled={disabled}
        label={t("richText.toolbar.insertTable")}
        onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled || !tableActive}
        label={t("richText.toolbar.addColumn")}
        onClick={() => editor?.chain().focus().addColumnAfter().run()}
      >
        <TableIcon className="size-4" weight="bold" />
        <span className="text-[10px] leading-none">C+</span>
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled || !tableActive}
        label={t("richText.toolbar.addRow")}
        onClick={() => editor?.chain().focus().addRowAfter().run()}
      >
        <TableIcon className="size-4" weight="bold" />
        <span className="text-[10px] leading-none">R+</span>
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled || !tableActive}
        label={t("richText.toolbar.deleteTable")}
        onClick={() => editor?.chain().focus().deleteTable().run()}
      >
        <TableIcon className="size-4" weight="bold" />
        <span className="text-[10px] leading-none">x</span>
      </ToolbarButton>
    </>
  )
}

type ImageToolbarButtonProps = {
  disabled: boolean
  editor: Editor | null
  isUploading: boolean
  onUploadImage: (targetEditor: Editor, file: File) => Promise<void>
}

function ImageToolbarButton({ disabled, editor, isUploading, onUploadImage }: ImageToolbarButtonProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const openFilePicker = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !editor) return

    await onUploadImage(editor, file)
  }

  return (
    <>
      <ToolbarButton
        disabled={disabled || isUploading}
        label={isUploading ? t("richText.image.uploading") : t("richText.toolbar.image")}
        onClick={openFilePicker}
      >
        <ImageSquare className="size-4" weight="bold" />
      </ToolbarButton>
      <input
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
    </>
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

function getImageFilesFromDataTransfer(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return []

  const files = Array.from(dataTransfer.files ?? [])
  if (files.length) return files.filter(isImageFile)

  return Array.from(dataTransfer.items ?? [])
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file && isImageFile(file)))
}

function isImageFile(file: File) {
  return file.type.startsWith("image/")
}
