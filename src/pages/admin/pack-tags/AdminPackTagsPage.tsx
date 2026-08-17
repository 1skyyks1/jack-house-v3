import { zodResolver } from "@hookform/resolvers/zod"
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react"
import type { ColumnDef } from "@tanstack/react-table"
import type { TFunction } from "i18next"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import {
  getPackTagCategoryLabel,
  useAdminPackTagsQuery,
  useCreatePackTagMutation,
  useDeletePackTagMutation,
  useUpdatePackTagMutation,
  type AdminPackTag,
  type PackTagCategory,
} from "@/entities/pack"
import { AdminPage, AdminTable } from "@/features/admin-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormFieldError, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"

const tagCategories: PackTagCategory[] = ["pattern", "bpm", "difficulty"]

const createTagSchema = (t: TFunction) => z.object({
  category: z.enum(tagCategories),
  enabled: z.boolean(),
  name_en: z.string().trim().min(1, t("admin.packTags.validation.nameEn")).max(255),
  name_zh: z.string().trim().min(1, t("admin.packTags.validation.nameZh")).max(255),
  sort_order: z.number().int().min(0, t("admin.packTags.validation.order")),
  tag_key: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("admin.packTags.validation.key")).max(64),
})

type TagFormValues = z.infer<ReturnType<typeof createTagSchema>>

export function AdminPackTagsPage() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<AdminPackTag | null>(null)
  const tagsQuery = useAdminPackTagsQuery()
  const deleteMutation = useDeletePackTagMutation()

  const openCreate = () => {
    setEditingTag(null)
    setIsDialogOpen(true)
  }

  const columns: Array<ColumnDef<AdminPackTag>> = [
    {
      accessorKey: "tag_id",
      header: t("admin.packTags.table.id"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.tag_id}</span>,
    },
    {
      accessorKey: "tag_key",
      header: t("admin.packTags.table.key"),
      cell: ({ row }) => <code className="text-xs">{row.original.tag_key}</code>,
    },
    {
      accessorKey: "name_zh",
      header: t("admin.packTags.table.nameZh"),
      cell: ({ row }) => <span className="font-medium">{row.original.name_zh}</span>,
    },
    {
      accessorKey: "name_en",
      header: t("admin.packTags.table.nameEn"),
      cell: ({ row }) => <span>{row.original.name_en}</span>,
    },
    {
      accessorKey: "category",
      header: t("admin.packTags.table.category"),
      cell: ({ row }) => <Badge variant="outline">{getPackTagCategoryLabel(row.original.category)}</Badge>,
    },
    {
      accessorKey: "sort_order",
      header: t("admin.packTags.table.order"),
    },
    {
      accessorKey: "usage_count",
      header: t("admin.packTags.table.usage"),
    },
    {
      accessorKey: "enabled",
      header: t("admin.packTags.table.status"),
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? "default" : "secondary"}>
          {t(`admin.packTags.status.${row.original.enabled ? "enabled" : "disabled"}`)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: t("admin.packTags.table.actions"),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingTag(row.original)
              setIsDialogOpen(true)
            }}
            size="xs"
            type="button"
            variant="outline"
          >
            <PencilSimple className="size-3.5" weight="bold" />
            {t("admin.packTags.actions.edit")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleteMutation.isPending} size="xs" type="button" variant="destructive">
                <Trash className="size-3.5" weight="bold" />
                {t("admin.packTags.actions.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("admin.packTags.deleteDialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {row.original.usage_count > 0
                    ? t("admin.packTags.deleteDialog.inUse", { count: row.original.usage_count })
                    : t("admin.packTags.deleteDialog.description", { name: row.original.name_zh })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("admin.packTags.form.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending || row.original.usage_count > 0}
                  onClick={() => deleteMutation.mutate(row.original.tag_id, {
                    onSuccess: () => toast.success(t("admin.packTags.deleted")),
                  })}
                  variant="destructive"
                >
                  {deleteMutation.isPending ? t("admin.packTags.actions.deleting") : t("admin.packTags.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  if (tagsQuery.isError) {
    return <PageState title={t("admin.packTags.loadFailedTitle")} description={getErrorMessage(tagsQuery.error)} />
  }

  return (
    <AdminPage>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">{t("admin.packTags.title")}</h1>
        <Button onClick={openCreate} type="button">
          <Plus className="size-4" weight="bold" />
          {t("admin.packTags.add")}
        </Button>
      </div>
      <TagDialog
        editingTag={editingTag}
        key={editingTag?.tag_id ?? "new"}
        onOpenChange={setIsDialogOpen}
        open={isDialogOpen}
      />
      <AdminTable
        columns={columns}
        data={tagsQuery.data ?? []}
        emptyLabel={t("admin.packTags.empty")}
        isLoading={tagsQuery.isLoading}
      />
      {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}
    </AdminPage>
  )
}

function TagDialog({ editingTag, onOpenChange, open }: {
  editingTag: AdminPackTag | null
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const createMutation = useCreatePackTagMutation()
  const updateMutation = useUpdatePackTagMutation()
  const mutation = editingTag ? updateMutation : createMutation
  const form = useForm<TagFormValues>({
    defaultValues: {
      category: editingTag?.category ?? "pattern",
      enabled: editingTag?.enabled ?? true,
      name_en: editingTag?.name_en ?? "",
      name_zh: editingTag?.name_zh ?? "",
      sort_order: editingTag?.sort_order ?? 10,
      tag_key: editingTag?.tag_key ?? "",
    },
    resolver: zodResolver(createTagSchema(t)),
  })
  const category = useWatch({ control: form.control, name: "category" })
  const enabled = useWatch({ control: form.control, name: "enabled" })

  const submit = (values: TagFormValues) => {
    const normalized = {
      category: values.category,
      enabled: values.enabled,
      name_en: values.name_en.trim(),
      name_zh: values.name_zh.trim(),
      sort_order: values.sort_order,
    }
    const options = {
      onSuccess: () => {
        toast.success(t(editingTag ? "admin.packTags.updated" : "admin.packTags.created"))
        onOpenChange(false)
      },
    }

    if (editingTag) {
      updateMutation.mutate({ tagId: editingTag.tag_id, values: normalized }, options)
    } else {
      createMutation.mutate({ ...normalized, tag_key: values.tag_key.trim() }, options)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(editingTag ? "admin.packTags.form.editTitle" : "admin.packTags.form.createTitle")}</DialogTitle>
          <DialogDescription>{t("admin.packTags.form.description")}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <TagInput
            disabled={Boolean(editingTag)}
            error={form.formState.errors.tag_key?.message}
            hint={t("admin.packTags.form.keyHint")}
            label={t("admin.packTags.form.key")}
            {...form.register("tag_key")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TagInput error={form.formState.errors.name_zh?.message} label={t("admin.packTags.form.nameZh")} {...form.register("name_zh")} />
            <TagInput error={form.formState.errors.name_en?.message} label={t("admin.packTags.form.nameEn")} {...form.register("name_en")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("admin.packTags.form.category")}</Label>
              <Select
                onValueChange={(value) => form.setValue("category", value as PackTagCategory, { shouldValidate: true })}
                value={category}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tagCategories.map((category) => (
                    <SelectItem key={category} value={category}>{t(`admin.packTags.categories.${category}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TagInput
              error={form.formState.errors.sort_order?.message}
              label={t("admin.packTags.form.order")}
              min={0}
              type="number"
              {...form.register("sort_order", { valueAsNumber: true })}
            />
          </div>
          <label className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium">
            <Checkbox
              checked={enabled}
              onCheckedChange={(checked) => form.setValue("enabled", checked === true, { shouldValidate: true })}
            />
            {t("admin.packTags.form.enabled")}
          </label>
          {mutation.error ? <MutationErrorAlert error={mutation.error} /> : null}
          <DialogFooter>
            <Button disabled={mutation.isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t("admin.packTags.form.cancel")}
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? t("admin.packTags.form.saving") : t("admin.packTags.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TagInput({ error, hint, label, ...props }: React.ComponentProps<typeof Input> & {
  error?: string
  hint?: string
  label: string
}) {
  const id = props.name
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input aria-invalid={Boolean(error)} id={id} {...props} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FormFieldError message={error} />
    </div>
  )
}
