import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-3 font-heading text-3xl font-semibold">{t("common.notFound")}</h1>
      <Link className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" to="/">
        {t("common.home")}
      </Link>
    </section>
  )
}

