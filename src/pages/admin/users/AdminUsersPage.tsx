import { zodResolver } from "@hookform/resolvers/zod"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, MagnifyingGlass, PencilSimple, Plus, Trash } from "@phosphor-icons/react"
import type { TFunction } from "i18next"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import {
  getUserRoleLabel,
  getUserStatusLabel,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUserDetailQuery,
  useUserListQuery,
  type UserProfile,
  type UserRole,
  type UserStatus,
} from "@/entities/user"
import { AdminBadge, AdminPage, AdminPagination, AdminTable } from "@/features/admin-shell"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormFieldError, FormPageSkeleton, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { usePageParam } from "../_shared/usePageParam"

const PAGE_SIZE = 9

const createUserFormSchema = (t: TFunction) => z.object({
  avatar: z.string().trim().url(t("admin.users.validation.avatarUrl")).or(z.literal("")),
  password: z.string(),
  role: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  user_name: z.string().trim().min(3, t("admin.users.validation.usernameLength")).max(15, t("admin.users.validation.usernameLength")),
})

type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>

const defaultUserFormValues: UserFormValues = {
  avatar: "",
  password: "",
  role: 0,
  status: 0,
  user_name: "",
}

type EditorMode = { type: "create" } | { type: "edit"; userId: string } | null

export function AdminUsersPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam("page")
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "")
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const search = searchParams.get("search") ?? ""
  const usersQuery = useUserListQuery({ page, pageSize: PAGE_SIZE, search })
  const deleteMutation = useDeleteUserMutation()

  const columns: Array<ColumnDef<UserProfile>> = [
    {
      accessorKey: "user_id",
      header: t("admin.users.table.id"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.user_id}</span>,
    },
    {
      header: t("admin.users.table.user"),
      cell: ({ row }) => (
        <div className="flex min-w-56 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted text-xs font-semibold">
            {row.original.avatar ? <img alt="" className="size-full object-cover" src={row.original.avatar} /> : row.original.user_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.user_name}</div>
            <div className="truncate text-xs text-muted-foreground">{row.original.email ?? t("admin.users.table.noEmail")}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: t("admin.users.table.role"),
      cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "status",
      header: t("admin.users.table.status"),
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "osu_uid",
      header: t("admin.users.table.osu"),
      cell: ({ row }) => row.original.osu_uid ? (
        <a className="font-medium text-primary hover:underline" href={`https://osu.ppy.sh/users/${row.original.osu_uid}`} rel="noopener noreferrer" target="_blank">
          {row.original.osu_uid}
        </a>
      ) : (
        <span className="text-muted-foreground">{t("admin.users.table.notBound")}</span>
      ),
    },
    {
      accessorKey: "created_time",
      header: t("admin.users.table.created"),
      cell: ({ row }) => formatDate(row.original.created_time),
    },
    {
      id: "actions",
      header: t("admin.users.table.actions"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <AdminActionLink to={`/user/${row.original.user_id}`}>
            <Eye className="size-3.5" weight="bold" />
            {t("admin.users.actions.profile")}
          </AdminActionLink>
          <Button
            onClick={() => setEditorMode({ type: "edit", userId: String(row.original.user_id) })}
            size="xs"
            type="button"
            variant="outline"
          >
            <PencilSimple className="size-3.5" weight="bold" />
            {t("admin.users.actions.edit")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleteMutation.isPending} size="xs" type="button" variant="destructive">
                <Trash className="size-3.5" weight="bold" />
                {t("admin.users.actions.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("admin.users.deleteDialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("admin.users.deleteDialog.description", { name: row.original.user_name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>{t("user.edit.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    deleteMutation.mutate(row.original.user_id, { onSuccess: () => toast.success(t("admin.users.deleteSuccess")) })
                  }}
                  variant="destructive"
                >
                  {deleteMutation.isPending ? t("admin.users.actions.deleting") : t("admin.users.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  const applySearch = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", "1")
    if (searchDraft.trim()) {
      nextParams.set("search", searchDraft.trim())
    } else {
      nextParams.delete("search")
    }
    setSearchParams(nextParams)
  }

  if (usersQuery.isError) {
    return <PageState title={t("admin.users.loadFailedTitle")} description={getErrorMessage(usersQuery.error)} />
  }

  return (
    <AdminPage>
      <div className="space-y-4">
        <div className="flex min-w-0 items-center gap-2">
          <Input
            className="min-w-0 flex-1"
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applySearch()
            }}
            placeholder={t("admin.users.searchPlaceholder")}
            value={searchDraft}
          />
          <Button aria-label={t("admin.users.search")} className="shrink-0" onClick={applySearch} type="button" variant="outline">
            <MagnifyingGlass className="size-4" weight="bold" />
            <span className="hidden sm:inline">{t("admin.users.search")}</span>
          </Button>
          <Button
            aria-label={t("admin.users.create")}
            className="shrink-0"
            onClick={() => setEditorMode({ type: "create" })}
            type="button"
          >
            <Plus className="size-4" weight="bold" />
            <span className="hidden sm:inline">{t("admin.users.create")}</span>
          </Button>
        </div>

        <Dialog open={editorMode !== null} onOpenChange={(open) => {
          if (!open) setEditorMode(null)
        }}>
          {editorMode ? <UserEditorDialog mode={editorMode} onClose={() => setEditorMode(null)} /> : null}
        </Dialog>

        <AdminTable columns={columns} data={usersQuery.data?.data ?? []} isLoading={usersQuery.isLoading} />
        {usersQuery.data ? (
          <AdminPagination
            onPageChange={setPage}
            page={usersQuery.data.page}
            total={usersQuery.data.total}
            totalPages={usersQuery.data.totalPages}
          />
        ) : null}
        {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}
      </div>
    </AdminPage>
  )
}

type UserEditorDialogProps = {
  mode: NonNullable<EditorMode>
  onClose: () => void
}

function UserEditorDialog({ mode, onClose }: UserEditorDialogProps) {
  const { t } = useTranslation()
  const isEditing = mode.type === "edit"
  const userId = isEditing ? mode.userId : ""
  const userQuery = useUserDetailQuery(userId || undefined)
  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation(userId)
  const form = useForm<UserFormValues>({
    resolver: zodResolver(createUserFormSchema(t)),
    defaultValues: defaultUserFormValues,
    values: isEditing && userQuery.data ? {
      avatar: userQuery.data.avatar ?? "",
      password: "",
      role: userQuery.data.role,
      status: userQuery.data.status,
      user_name: userQuery.data.user_name,
    } : defaultUserFormValues,
  })
  const roleValue = useWatch({ control: form.control, name: "role" })
  const statusValue = useWatch({ control: form.control, name: "status" })
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const submit = form.handleSubmit((values) => {
    if (isEditing) {
      updateMutation.mutate(
        {
          avatar: values.avatar.trim() || undefined,
          password: values.password || undefined,
          role: values.role,
          status: values.status,
          user_name: values.user_name.trim(),
        },
        {
          onSuccess: () => {
            toast.success(t("admin.users.updateSuccess"))
            onClose()
          },
        },
      )
      return
    }

    createMutation.mutate(
      {
        avatar: values.avatar.trim() || null,
        password: values.password,
        role: values.role,
        status: values.status,
        user_name: values.user_name.trim(),
      },
      {
        onSuccess: () => {
          toast.success(t("admin.users.createSuccess"))
          onClose()
        },
      },
    )
  })

  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEditing ? t("admin.users.editor.editTitle") : t("admin.users.editor.createTitle")}</DialogTitle>
        <DialogDescription>
          {isEditing ? t("admin.users.editor.editDescription") : t("admin.users.editor.createDescription")}
        </DialogDescription>
      </DialogHeader>

      {isEditing && userQuery.isLoading ? (
        <FormPageSkeleton />
      ) : userQuery.isError ? (
        <PageState title={t("common.requestFailed")} description={getErrorMessage(userQuery.error)} />
      ) : (
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-3 md:grid-cols-2">
            <AdminInput error={form.formState.errors.user_name?.message} label={t("admin.users.editor.username")} {...form.register("user_name")} />
            <AdminInput error={form.formState.errors.avatar?.message} label={t("admin.users.editor.avatarUrl")} {...form.register("avatar")} />
            <AdminInput
              error={form.formState.errors.password?.message}
              label={isEditing ? t("admin.users.editor.passwordOptional") : t("admin.users.editor.password")}
              type="password"
              {...form.register("password")}
            />
            <div className="grid grid-cols-2 gap-3">
              <AdminSelect
                label={t("admin.users.editor.role")}
                onValueChange={(value) => form.setValue("role", Number(value) as UserRole, { shouldDirty: true, shouldValidate: true })}
                options={[
                  { label: getUserRoleLabel(0), value: "0" },
                  { label: getUserRoleLabel(1), value: "1" },
                  { label: getUserRoleLabel(2), value: "2" },
                ]}
                value={String(roleValue)}
              />
              <AdminSelect
                label={t("admin.users.editor.status")}
                onValueChange={(value) => form.setValue("status", Number(value) as UserStatus, { shouldDirty: true, shouldValidate: true })}
                options={[
                  { label: getUserStatusLabel(0), value: "0" },
                  { label: getUserStatusLabel(1), value: "1" },
                  { label: getUserStatusLabel(2), value: "2" },
                ]}
                value={String(statusValue)}
              />
            </div>
          </div>
          {createMutation.error ? <MutationErrorAlert error={createMutation.error} /> : null}
          {updateMutation.error ? <MutationErrorAlert error={updateMutation.error} /> : null}
          <DialogFooter>
            <Button onClick={onClose} type="button" variant="outline">
              {t("user.edit.cancel")}
            </Button>
            <Button
              disabled={isSubmitting || (isEditing && userQuery.isLoading)}
              type="submit"
            >
              {isSubmitting ? t("admin.users.editor.saving") : isEditing ? t("admin.users.editor.update") : t("admin.users.editor.create")}
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
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

type AdminSelectProps = {
  label: string
  onValueChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}

function AdminSelect({ label, onValueChange, options, value }: AdminSelectProps) {
  return (
    <div>
      <Label>{label}</Label>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="mt-1 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type AdminActionLinkProps = {
  children: React.ReactNode
  to: string
}

function AdminActionLink({ children, to }: AdminActionLinkProps) {
  return (
    <Button asChild size="xs" variant="outline">
      <Link to={to}>{children}</Link>
    </Button>
  )
}

function UserRoleBadge({ role }: { role: UserRole }) {
  const tone = role === 2 ? "success" : role === 1 ? "warning" : "info"
  return <AdminBadge tone={tone}>{getUserRoleLabel(role)}</AdminBadge>
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  const tone = status === 2 ? "danger" : status === 1 ? "warning" : "info"
  return <AdminBadge tone={tone}>{getUserStatusLabel(status)}</AdminBadge>
}
