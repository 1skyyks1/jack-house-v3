import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { useForm, type UseFormRegisterReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import osuLogo from "@/assets/pic/osu/osu.svg"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API_BASE_URL } from "@/shared/api/http"
import { FormFieldError, MutationErrorAlert } from "@/shared/components"
import { login } from "../api/authApi"
import { authQueryKeys } from "../api/authQueries"
import { type AuthDialogMode, useAuthStore } from "../model/authStore"

const createLoginSchema = (t: TFunction) => z.object({
  identifier: z.string().min(1, t("auth.validation.identifierRequired")),
  password: z.string().min(1, t("auth.validation.passwordRequired")),
})

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>

export function AuthDialog() {
  const { t } = useTranslation()
  const closeLoginDialog = useAuthStore((state) => state.closeLoginDialog)
  const dialogMode = useAuthStore((state) => state.dialogMode)
  const loginRedirect = useAuthStore((state) => state.loginRedirect)
  const setDialogMode = useAuthStore((state) => state.setDialogMode)
  const setSession = useAuthStore((state) => state.setSession)
  const showLoginDialog = useAuthStore((state) => state.showLoginDialog)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleSuccess = (session: { message?: string; token: string; userId: number }) => {
    setSession(session)
    void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser })
    void queryClient.invalidateQueries({ queryKey: authQueryKeys.permissions })
    toast.success(session.message ?? t("auth.loginSuccess"))

    if (loginRedirect) {
      navigate(loginRedirect)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeLoginDialog()
    }
  }

  const handleOsuLogin = () => {
    window.localStorage.setItem("loginRedirect", loginRedirect ?? window.location.pathname + window.location.search)
    window.location.href = `${API_BASE_URL}/auth/osu`
  }

  return (
    <Dialog open={showLoginDialog} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-sm font-medium text-muted-foreground">{t("auth.brand")}</p>
          <DialogTitle className="font-heading text-2xl">
            {dialogMode === "login" ? t("auth.login") : t("auth.createAccount")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={dialogMode} onValueChange={(value) => setDialogMode(value as AuthDialogMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
            <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-5" value="login">
            <LoginForm onOsuLogin={handleOsuLogin} onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent className="mt-5" value="register">
            <OsuOnlyRegister onOsuLogin={handleOsuLogin} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

type AuthFormProps = {
  onSuccess: (session: { message?: string; token: string; userId: number }) => void
}

type LoginFormProps = AuthFormProps & {
  onOsuLogin: () => void
}

function LoginForm({ onOsuLogin, onSuccess }: LoginFormProps) {
  const { t } = useTranslation()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: { identifier: "", password: "" },
  })
  const mutation = useMutation({ mutationFn: login, onSuccess })

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <TextField
        autoComplete="username"
        label={t("auth.identifierLabel")}
        placeholder={t("auth.identifierPlaceholder")}
        registration={form.register("identifier")}
        error={form.formState.errors.identifier?.message}
      />
      <TextField
        autoComplete="current-password"
        label={t("auth.passwordLabel")}
        placeholder={t("auth.passwordPlaceholder")}
        registration={form.register("password")}
        type="password"
        error={form.formState.errors.password?.message}
      />
      <SubmitButton isPending={mutation.isPending}>{mutation.isPending ? t("auth.loggingIn") : t("auth.login")}</SubmitButton>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-medium text-muted-foreground">{t("auth.thirdPartyLogin")}</span>
          <Separator className="flex-1" />
        </div>
        <Button className="h-11 w-full gap-3" type="button" variant="outline" onClick={onOsuLogin}>
          <img alt="" className="h-6 w-auto" src={osuLogo} />
          <span>{t("auth.loginWithOsu")}</span>
        </Button>
      </div>
      {mutation.error ? <MutationErrorAlert error={mutation.error} /> : null}
    </form>
  )
}

function OsuOnlyRegister({ onOsuLogin }: Pick<LoginFormProps, "onOsuLogin">) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        {t("auth.registerHint")}
      </p>
      <Button className="h-11 w-full gap-3" type="button" variant="outline" onClick={onOsuLogin}>
        <img alt="" className="h-6 w-auto" src={osuLogo} />
        <span>{t("auth.continueWithOsu")}</span>
      </Button>
    </div>
  )
}

type TextFieldProps = {
  autoComplete: string
  error?: string
  label: string
  placeholder: string
  registration: UseFormRegisterReturn
  type?: string
}

function TextField({ autoComplete, error, label, placeholder, registration, type = "text" }: TextFieldProps) {
  const inputId = registration.name

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        autoComplete={autoComplete}
        id={inputId}
        placeholder={placeholder}
        type={type}
        {...registration}
      />
      <FormFieldError message={error} />
    </div>
  )
}

type SubmitButtonProps = {
  children: string
  isPending: boolean
}

function SubmitButton({ children, isPending }: SubmitButtonProps) {
  return (
    <Button className="w-full" type="submit" disabled={isPending}>
      {children}
    </Button>
  )
}
