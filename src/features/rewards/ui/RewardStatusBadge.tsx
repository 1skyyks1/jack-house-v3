import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"

export function RewardStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  return <Badge variant={status === "completed" ? "default" : status === "cancelled" ? "destructive" : "secondary"}>{t(`rewards.status.${status}`, { defaultValue: status })}</Badge>
}
