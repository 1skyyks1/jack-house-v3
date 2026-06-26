import { useMemo, useState } from "react"
import { ArrowClockwise, ClockCounterClockwise, FunnelSimple } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import {
  useTournamentAuditLogsQuery,
  useTournamentDetailQuery,
  type TournamentAuditLogQuery,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"

const pageSize = 30
const entityOptions = ["team", "player", "staff", "section", "qualifier", "qualifier_import", "qualifier_score", "bracket", "match", "referee_action"]
const actionOptions = [
  "submit_team",
  "reset_invite",
  "update_team_status",
  "approve_all_teams",
  "update_player",
  "create_section",
  "update_section",
  "delete_section",
  "import_scores",
  "manual_update",
  "calculate_ranking",
  "lock_ranking",
  "generate_double_elimination",
  "update_match",
]

export function AdminTournamentAuditPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState("all")
  const [action, setAction] = useState("all")
  const [entityId, setEntityId] = useState("")
  const [operatorId, setOperatorId] = useState("")

  const params = useMemo<TournamentAuditLogQuery>(() => ({
    action: action === "all" ? undefined : action,
    entity_id: entityId.trim() || undefined,
    entity_type: entityType === "all" ? undefined : entityType,
    operator_id: operatorId.trim() || undefined,
    page,
    pageSize,
  }), [action, entityId, entityType, operatorId, page])

  const tournamentQuery = useTournamentDetailQuery(tid)
  const auditQuery = useTournamentAuditLogsQuery(tid, params)
  const logs = auditQuery.data?.rows ?? []
  const total = auditQuery.data?.total ?? 0
  const pageCount = Math.max(Math.ceil(total / pageSize), 1)

  if (tournamentQuery.isError || auditQuery.isError) {
    return <PageState title={t("tournament.admin.audit.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? auditQuery.error)} />
  }

  function resetFilters() {
    setEntityType("all")
    setAction("all")
    setEntityId("")
    setOperatorId("")
    setPage(1)
  }

  return (
    <AdminPage
      actions={(
        <>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/tournaments">{t("tournament.admin.common.back")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/admin/tournaments/${tid}/qualifier`}>{t("tournament.admin.audit.qualifier")}</Link>
          </Button>
          <Button disabled={auditQuery.isFetching} size="sm" type="button" variant="outline" onClick={() => auditQuery.refetch()}>
            <ArrowClockwise className="size-4" />
            {t("tournament.admin.audit.refresh")}
          </Button>
        </>
      )}
    >
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ClockCounterClockwise className="size-5 text-muted-foreground" />
            {t("tournament.admin.audit.title", { name: tournamentQuery.data?.acronym ?? t("tournament.common.tournament") })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{t("tournament.admin.audit.logCount", { count: total })}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[12rem_14rem_8rem_8rem_auto]">
            <div className="grid gap-1.5">
              <Label>{t("tournament.admin.audit.entity")}</Label>
              <Select value={entityType} onValueChange={(value) => {
                setEntityType(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("tournament.admin.audit.allEntities")}</SelectItem>
                  {entityOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("tournament.admin.audit.action")}</Label>
              <Select value={action} onValueChange={(value) => {
                setAction(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("tournament.admin.audit.allActions")}</SelectItem>
                  {actionOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="audit-entity-id">{t("tournament.admin.audit.entityId")}</Label>
              <Input id="audit-entity-id" inputMode="numeric" value={entityId} onChange={(event) => {
                setEntityId(event.target.value)
                setPage(1)
              }} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="audit-operator-id">{t("tournament.admin.audit.operatorId")}</Label>
              <Input id="audit-operator-id" inputMode="numeric" value={operatorId} onChange={(event) => {
                setOperatorId(event.target.value)
                setPage(1)
              }} />
            </div>
            <Button className="self-end" type="button" variant="outline" onClick={resetFilters}>
              <FunnelSimple className="size-4" />
              {t("tournament.admin.audit.reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">{t("tournament.admin.audit.time")}</TableHead>
                <TableHead className="w-40">{t("tournament.admin.audit.operator")}</TableHead>
                <TableHead className="w-44">{t("tournament.admin.audit.target")}</TableHead>
                <TableHead>{t("tournament.admin.audit.action")}</TableHead>
                <TableHead>{t("tournament.admin.audit.oldValue")}</TableHead>
                <TableHead>{t("tournament.admin.audit.newValue")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.created_time)}</TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{log.operator?.user_name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">{log.operator_id ?? "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.entity_type}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">ID {log.entity_id ?? "-"}</p>
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="max-w-72 whitespace-normal">
                    <JsonPreview value={log.old_value_json} />
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal">
                    <JsonPreview value={log.new_value_json} />
                  </TableCell>
                </TableRow>
              ))}
              {!auditQuery.isLoading && logs.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>{t("tournament.admin.audit.noLogs")}</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pageCount > 1 ? (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setPage((current) => Math.max(current - 1, 1))
                }}
              />
            </PaginationItem>
            {getVisiblePages(page, pageCount).map((item) => (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(event) => {
                    event.preventDefault()
                    setPage(item)
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setPage((current) => Math.min(current + 1, pageCount))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <AppAlert title={t("tournament.admin.audit.scopeTitle")}>{t("tournament.admin.audit.scopeDescription")}</AppAlert>
    </AdminPage>
  )
}

function JsonPreview({ value }: { value?: string | null }) {
  const text = formatJsonPreview(value)
  return <pre className="line-clamp-4 whitespace-pre-wrap break-words rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{text}</pre>
}

function formatJsonPreview(value?: string | null) {
  if (!value) return "-"
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function getVisiblePages(current: number, total: number) {
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  return Array.from(pages).filter((item) => item >= 1 && item <= total).sort((a, b) => a - b)
}
