import { zodResolver } from "@hookform/resolvers/zod"
import type { ColumnDef } from "@tanstack/react-table"
import { Link as LinkIcon, Plus, Trash, UsersThree } from "@phosphor-icons/react"
import type { TFunction } from "i18next"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import {
  useAddUsersToBadgeMutation,
  useBadgeListQuery,
  useDeleteBadgeMutation,
  useUploadBadgeMutation,
  type Badge,
} from "@/entities/badge"
import { useUserListQuery } from "@/entities/user"
import { AdminPage, AdminPagination, AdminTable } from "@/features/admin-shell"
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
import { FormFieldError, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { usePageParam } from "../_shared/usePageParam"

const PAGE_SIZE = 7

const createUploadSchema = (t: TFunction) => z.object({
  file: z.instanceof(File, { message: t("admin.badges.validation.chooseImage") }),
  name: z.string().trim().min(1, t("admin.badges.validation.nameRequired")).max(120, t("admin.badges.validation.nameTooLong")),
  redirect_url: z.string().trim().url(t("admin.badges.validation.redirectInvalid")).or(z.literal("")),
})

type UploadFormValues = z.infer<ReturnType<typeof createUploadSchema>>

type AssignTarget = {
  badgeId: number
  badgeName: string
} | null

export function AdminBadgesPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam("page")
  const [showUpload, setShowUpload] = useState(false)
  const [assignTarget, setAssignTarget] = useState<AssignTarget>(null)
  const badgesQuery = useBadgeListQuery({ page, pageSize: PAGE_SIZE })
  const deleteMutation = useDeleteBadgeMutation()

  const columns: Array<ColumnDef<Badge>> = [
    {
      accessorKey: "id",
      header: t("admin.badges.table.id"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
    },
    {
      header: t("admin.badges.table.badge"),
      cell: ({ row }) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="grid h-11 w-24 shrink-0 place-items-center overflow-hidden rounded border bg-muted text-xs text-muted-foreground">
            {row.original.signedUrl ? <img alt={row.original.name} className="size-full object-cover" src={row.original.signedUrl} /> : t("admin.badges.table.noImage")}
          </div>
          <div className="min-w-0">
            <div className="break-words font-medium">{row.original.name}</div>
            <div className="mt-1 truncate text-xs text-muted-foreground">{row.original.redirect_url || t("admin.badges.table.noRedirect")}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "created_time",
      header: t("admin.badges.table.created"),
      cell: ({ row }) => formatDate(row.original.created_time),
    },
    {
      id: "actions",
      header: t("admin.badges.table.actions"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          {row.original.redirect_url ? (
            <Button asChild size="xs" variant="outline">
              <a href={row.original.redirect_url} rel="noopener noreferrer" target="_blank">
                <LinkIcon className="size-3.5" weight="bold" />
                {t("admin.badges.actions.open")}
              </a>
            </Button>
          ) : null}
          <Button
            onClick={() => setAssignTarget({ badgeId: row.original.id, badgeName: row.original.name })}
            size="xs"
            type="button"
            variant="outline"
          >
            <UsersThree className="size-3.5" weight="bold" />
            {t("admin.badges.actions.assign")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleteMutation.isPending} size="xs" type="button" variant="destructive">
                <Trash className="size-3.5" weight="bold" />
                {t("admin.badges.actions.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("admin.badges.deleteDialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("admin.badges.deleteDialog.description", { name: row.original.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>{t("user.edit.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    deleteMutation.mutate(row.original.id, { onSuccess: () => toast.success(t("admin.badges.deleted")) })
                  }}
                  variant="destructive"
                >
                  {deleteMutation.isPending ? t("admin.badges.actions.deleting") : t("admin.badges.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  if (badgesQuery.isError) {
    return <PageState title={t("admin.badges.loadFailedTitle")} description={getErrorMessage(badgesQuery.error)} />
  }

  return (
    <AdminPage
      actions={
        <Button
          onClick={() => setShowUpload(true)}
          type="button"
        >
          <Plus className="size-4" weight="bold" />
          {t("admin.badges.upload")}
        </Button>
      }
    >
      <div className="space-y-4">
        <UploadBadgeDialog isOpen={showUpload} onOpenChange={setShowUpload} />
        <AssignBadgeDialog target={assignTarget} onOpenChange={(open) => {
          if (!open) setAssignTarget(null)
        }} />

        <AdminTable columns={columns} data={badgesQuery.data?.data ?? []} isLoading={badgesQuery.isLoading} />
        {badgesQuery.data ? (
          <AdminPagination
            onPageChange={setPage}
            page={badgesQuery.data.page}
            total={badgesQuery.data.total}
            totalPages={badgesQuery.data.totalPages}
          />
        ) : null}
        {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}
      </div>
    </AdminPage>
  )
}

type UploadBadgeDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function UploadBadgeDialog({ isOpen, onOpenChange }: UploadBadgeDialogProps) {
  const { t } = useTranslation()
  const uploadMutation = useUploadBadgeMutation()
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(createUploadSchema(t)),
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("admin.badges.uploadDialog.title")}</DialogTitle>
          <DialogDescription>{t("admin.badges.uploadDialog.description")}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            uploadMutation.mutate(
              {
                file: values.file,
                name: values.name.trim(),
                redirect_url: values.redirect_url.trim(),
              },
              {
                onSuccess: () => {
                  toast.success(t("admin.badges.uploaded"))
                  form.reset()
                  onOpenChange(false)
                },
              },
            )
          })}
        >
          <AdminInput error={form.formState.errors.name?.message} label={t("admin.badges.uploadDialog.badgeName")} {...form.register("name")} />
          <AdminInput error={form.formState.errors.redirect_url?.message} label={t("admin.badges.uploadDialog.redirectUrl")} {...form.register("redirect_url")} />
          <div className="md:col-span-2">
            <Label htmlFor="badge-file">{t("admin.badges.uploadDialog.imageFile")}</Label>
            <Input
              className="mt-1"
              id="badge-file"
              onChange={(event) => form.setValue("file", event.target.files?.[0] as File, { shouldValidate: true })}
              type="file"
            />
            <FormFieldError message={form.formState.errors.file?.message} />
          </div>
          {uploadMutation.error ? <div className="md:col-span-2"><MutationErrorAlert error={uploadMutation.error} /></div> : null}
          <DialogFooter className="md:col-span-2">
            <Button disabled={uploadMutation.isPending} type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("admin.badges.uploadDialog.cancel")}
            </Button>
            <Button disabled={uploadMutation.isPending} type="submit">
              {uploadMutation.isPending ? t("admin.badges.uploadDialog.uploading") : t("admin.badges.uploadDialog.upload")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type AssignBadgeDialogProps = {
  onOpenChange: (open: boolean) => void
  target: AssignTarget
}

function AssignBadgeDialog({ onOpenChange, target }: AssignBadgeDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const usersQuery = useUserListQuery({ page: 1, pageSize: 10, search: query })
  const assignMutation = useAddUsersToBadgeMutation()

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{target ? t("admin.badges.assignDialog.title", { name: target.badgeName }) : t("admin.badges.assignDialog.fallbackTitle")}</DialogTitle>
          <DialogDescription>{t("admin.badges.assignDialog.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.badges.assignDialog.searchUsers")}
            value={query}
          />
          <div className="scrollbar-soft max-h-56 overflow-auto rounded-md border bg-card">
            {query && usersQuery.isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">{t("admin.badges.assignDialog.searching")}</p>
            ) : query && usersQuery.data && usersQuery.data.data.length > 0 ? (
              usersQuery.data.data.map((user) => (
                <Label className="flex cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent" key={user.user_id}>
                  <Checkbox
                    checked={selectedUserIds.includes(user.user_id)}
                    onCheckedChange={(checked) => {
                      setSelectedUserIds((current) =>
                        checked ? [...current, user.user_id] : current.filter((id) => id !== user.user_id),
                      )
                    }}
                  />
                  <span>{user.user_name}</span>
                  <span className="text-xs text-muted-foreground">#{user.user_id}</span>
                </Label>
              ))
            ) : (
              <p className="p-3 text-sm text-muted-foreground">{query ? t("admin.badges.assignDialog.noUsersFound") : t("admin.badges.assignDialog.typeToSearch")}</p>
            )}
          </div>
          {assignMutation.error ? <MutationErrorAlert error={assignMutation.error} /> : null}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("admin.badges.assignDialog.cancel")}
          </Button>
          <Button
            disabled={assignMutation.isPending || selectedUserIds.length === 0 || !target}
            onClick={() => {
              if (!target) return

              assignMutation.mutate(
                { badgeId: target.badgeId, userIds: selectedUserIds },
                {
                  onSuccess: () => {
                    toast.success(t("admin.badges.assigned"))
                    setSelectedUserIds([])
                    setQuery("")
                    onOpenChange(false)
                  },
                },
              )
            }}
            type="button"
          >
            {assignMutation.isPending ? t("admin.badges.assignDialog.assigning") : t("admin.badges.assignDialog.assign", { count: selectedUserIds.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type AdminInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  label: string
}

function AdminInput({ error, id, label, ...props }: AdminInputProps) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase()

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        className="mt-1"
        id={inputId}
        {...props}
      />
      <FormFieldError message={error} />
    </div>
  )
}
