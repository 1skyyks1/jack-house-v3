import { zodResolver } from "@hookform/resolvers/zod"
import { FloppyDisk, LockKey, UserGear, X } from "@phosphor-icons/react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { useUpdateUserMutation } from "@/entities/user"
import { useCurrentUserQuery } from "@/features/auth"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormFieldError, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"

const createUserEditSchema = (t: TFunction) => z.object({
  confirmPassword: z.string(),
  discord: z.string().trim().max(120, t("user.edit.validation.discordTooLong")),
  password: z.string(),
  qq: z.string().trim().max(40, t("user.edit.validation.qqTooLong")),
}).superRefine((values, context) => {
  if (!values.password) return

  if (values.password.length < 6) {
    context.addIssue({
      code: "custom",
      message: t("user.edit.validation.passwordMinLength"),
      path: ["password"],
    })
  }

  if (!values.confirmPassword) {
    context.addIssue({
      code: "custom",
      message: t("user.edit.validation.confirmPasswordRequired"),
      path: ["confirmPassword"],
    })
  }

  if (values.confirmPassword && values.confirmPassword !== values.password) {
    context.addIssue({
      code: "custom",
      message: t("user.edit.validation.passwordNotMatch"),
      path: ["confirmPassword"],
    })
  }
})

type UserEditFormValues = z.infer<ReturnType<typeof createUserEditSchema>>

const defaultValues: UserEditFormValues = {
  confirmPassword: "",
  discord: "",
  password: "",
  qq: "",
}

export function UserEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUserQuery = useCurrentUserQuery()
  const userId = currentUserQuery.data?.user_id ? String(currentUserQuery.data.user_id) : ""
  const updateMutation = useUpdateUserMutation(userId)
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(createUserEditSchema(t)),
    defaultValues,
  })

  useEffect(() => {
    if (!currentUserQuery.data) return

    form.reset({
      confirmPassword: "",
      discord: currentUserQuery.data.discord ?? "",
      password: "",
      qq: currentUserQuery.data.qq ?? "",
    })
  }, [currentUserQuery.data, form])

  if (currentUserQuery.isLoading) {
    return <UserEditSkeleton />
  }

  if (currentUserQuery.isError) {
    return (
      <PageState
        title={t("user.edit.loadFailedTitle")}
        description={getErrorMessage(currentUserQuery.error)}
        action={<BackLink to="/">{t("user.edit.backHome")}</BackLink>}
      />
    )
  }

  if (!currentUserQuery.data) {
    return (
      <PageState
        title={t("user.edit.noSessionTitle")}
        description={t("user.edit.noSessionDescription")}
        action={<BackLink to="/">{t("user.edit.backHome")}</BackLink>}
      />
    )
  }

  const submit = form.handleSubmit((values) => {
    updateMutation.mutate(
      {
        discord: values.discord.trim() || undefined,
        password: values.password || undefined,
        qq: values.qq.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("user.edit.updated"))
          navigate(`/user/${currentUserQuery.data.user_id}`)
        },
      },
    )
  })

  const isSubmitting = updateMutation.isPending

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/user/${currentUserQuery.data.user_id}`}>{t("user.edit.profileBreadcrumb")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("user.edit.breadcrumb")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <form className="rounded-lg border bg-card p-5" onSubmit={submit}>
        <div className="grid gap-6 pb-6 md:grid-cols-[12rem_minmax(0,1fr)]">
          <SectionHeading
            description={t("user.edit.passwordDescription")}
            icon={<LockKey className="size-5" weight="bold" />}
            title={t("user.edit.passwordSection")}
          />
          <div className="grid gap-4">
            <FormInput
              autoComplete="new-password"
              disabled={isSubmitting}
              error={form.formState.errors.password?.message}
              label={t("user.edit.newPassword")}
              placeholder={t("user.edit.newPasswordPlaceholder")}
              type="password"
              {...form.register("password")}
            />
            <FormInput
              autoComplete="new-password"
              disabled={isSubmitting}
              error={form.formState.errors.confirmPassword?.message}
              label={t("user.edit.confirmPassword")}
              placeholder={t("user.edit.confirmPasswordPlaceholder")}
              type="password"
              {...form.register("confirmPassword")}
            />
          </div>
        </div>

        <div className="grid gap-6 border-t py-6 md:grid-cols-[12rem_minmax(0,1fr)]">
          <SectionHeading
            description={t("user.edit.contactDescription")}
            icon={<UserGear className="size-5" weight="bold" />}
            title={t("user.edit.contactSection")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              disabled={isSubmitting}
              error={form.formState.errors.qq?.message}
              label="QQ"
              placeholder={t("user.edit.qqPlaceholder")}
              {...form.register("qq")}
            />
            <FormInput
              disabled={isSubmitting}
              error={form.formState.errors.discord?.message}
              label="Discord"
              placeholder={t("user.edit.discordPlaceholder")}
              {...form.register("discord")}
            />
          </div>
        </div>

        {updateMutation.error ? <MutationErrorAlert className="mb-5" error={updateMutation.error} /> : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link to={`/user/${currentUserQuery.data.user_id}`}>
              <X className="size-4" weight="bold" />
              {t("user.edit.cancel")}
            </Link>
          </Button>
          <Button
            disabled={isSubmitting}
            type="submit"
          >
            <FloppyDisk className="size-4" weight="bold" />
            {isSubmitting ? t("user.edit.saving") : t("user.edit.save")}
          </Button>
        </div>
      </form>
    </section>
  )
}

type SectionHeadingProps = {
  description: string
  icon: React.ReactNode
  title: string
}

function SectionHeading({ description, icon, title }: SectionHeadingProps) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 font-heading text-lg font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  label: string
}

function FormInput({ className, error, id, label, ...props }: FormInputProps) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase()

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        aria-invalid={Boolean(error)}
        className={className}
        id={inputId}
        {...props}
      />
      <FormFieldError message={error} />
    </div>
  )
}

function UserEditSkeleton() {
  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="h-5 w-56 animate-pulse rounded bg-muted" />
      <div className="rounded-lg border bg-card p-5">
        <div className="grid gap-6 pb-6 md:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="h-20 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </section>
  )
}

type BackLinkProps = {
  children: React.ReactNode
  to: string
}

function BackLink({ children, to }: BackLinkProps) {
  return (
    <Button asChild>
      <Link to={to}>{children}</Link>
    </Button>
  )
}
