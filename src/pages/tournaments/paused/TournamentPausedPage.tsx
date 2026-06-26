import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { PageState } from "@/shared/components"

export function TournamentPausedPage() {
  const { t } = useTranslation()

  return (
    <PageState
      title={t("tournament.paused.title")}
      description={t("tournament.paused.description")}
      action={
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" to="/">
          {t("tournament.paused.backHome")}
        </Link>
      }
    />
  )
}
