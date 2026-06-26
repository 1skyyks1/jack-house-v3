import { ClockCounterClockwise, Note, UsersThree } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardCountsQuery } from "@/entities/dashboard"
import { AdminPage } from "@/features/admin-shell"
import { getErrorMessage, PageState } from "@/shared/components"

const anniversary = new Date("2027-06-01T00:00:00+08:00")

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const countsQuery = useDashboardCountsQuery()
  const [daysToAnniversary] = useState(() => Math.ceil((anniversary.getTime() - Date.now()) / 86_400_000))

  if (countsQuery.isError) {
    return <PageState title={t("admin.dashboard.loadFailedTitle")} description={getErrorMessage(countsQuery.error)} />
  }

  return (
    <AdminPage>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          icon={<UsersThree className="size-5" weight="bold" />}
          isLoading={countsQuery.isLoading}
          label={t("admin.dashboard.users")}
          value={countsQuery.data?.userCount}
        />
        <MetricCard
          icon={<Note className="size-5" weight="bold" />}
          isLoading={countsQuery.isLoading}
          label={t("admin.dashboard.posts")}
          value={countsQuery.data?.postCount}
        />
        <MetricCard
          icon={<ClockCounterClockwise className="size-5" weight="bold" />}
          label={t("admin.dashboard.anniversary")}
          value={daysToAnniversary >= 0 ? t("admin.dashboard.days", { count: daysToAnniversary }) : t("admin.dashboard.passed")}
        />
      </div>
    </AdminPage>
  )
}

type MetricCardProps = {
  icon: React.ReactNode
  isLoading?: boolean
  label: string
  value?: number | string
}

function MetricCard({ icon, isLoading = false, label, value }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-5 font-heading text-3xl font-semibold">
        {isLoading ? <span className="block h-8 w-20 animate-pulse rounded bg-muted" /> : value ?? "-"}
      </div>
    </div>
  )
}
