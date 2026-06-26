import type { Dispatch, FormEventHandler, ReactNode, SetStateAction } from "react"
import { Plus, Trash } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import type { TournamentMappoolMap, TournamentRound, TournamentTeam } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/shared/lib/date"
import type { RoundFormState } from "./model"
import { teamName } from "./utils"

export function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <p className="font-heading text-2xl font-semibold">{value}</p>
    </div>
  )
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function RoundsCard({
  isCreating,
  onCreateRound,
  onDeleteRound,
  onSelectRound,
  onUpdateRound,
  roundForm,
  rounds,
  setRoundForm,
}: {
  isCreating: boolean
  onCreateRound: FormEventHandler<HTMLFormElement>
  onDeleteRound: (roundId: number) => void
  onSelectRound: (roundId: number) => void
  onUpdateRound: (round: TournamentRound) => void
  roundForm: RoundFormState
  rounds: TournamentRound[]
  setRoundForm: Dispatch<SetStateAction<RoundFormState>>
}) {
  const { t } = useTranslation()

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{t("tournament.admin.bracket.rounds")}</CardTitle>
        <CardAction>
          <Badge variant="outline">{t("tournament.common.round", { round: rounds.length })}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form className="mb-4 grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_7rem_7rem_8rem_auto]" onSubmit={onCreateRound}>
          <Field label={t("tournament.admin.bracket.name")}>
            <Input required value={roundForm.name} onChange={(event) => setRoundForm((state) => ({ ...state, name: event.target.value }))} />
          </Field>
          <Field label="FT">
            <Input min={1} required type="number" value={roundForm.first_to} onChange={(event) => setRoundForm((state) => ({ ...state, first_to: event.target.value }))} />
          </Field>
          <Field label={t("tournament.admin.bracket.order")}>
            <Input type="number" value={roundForm.order} onChange={(event) => setRoundForm((state) => ({ ...state, order: event.target.value }))} />
          </Field>
          <Field label={t("tournament.common.bracket")}>
            <Select value={roundForm.bracket_type} onValueChange={(value) => setRoundForm((state) => ({ ...state, bracket_type: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("tournament.admin.bracket.winners")}</SelectItem>
                <SelectItem value="1">{t("tournament.admin.bracket.losers")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button className="self-end" disabled={isCreating} type="submit">
            <Plus className="size-4" weight="bold" />
            {t("tournament.admin.bracket.add")}
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tournament.common.round", { round: "" }).trim()}</TableHead>
              <TableHead className="w-20">FT</TableHead>
              <TableHead className="w-24">{t("tournament.admin.bracket.group")}</TableHead>
              <TableHead className="w-20 text-right">{t("tournament.admin.bracket.order")}</TableHead>
              <TableHead className="text-right">{t("tournament.admin.common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rounds.length === 0 ? (
              <TableRow>
                <TableCell className="py-8 text-center text-muted-foreground" colSpan={5}>{t("tournament.admin.bracket.noRounds")}</TableCell>
              </TableRow>
            ) : rounds.map((round) => (
              <TableRow key={round.id}>
                <TableCell>
                  <Button className="h-auto p-0 font-medium" type="button" variant="link" onClick={() => onSelectRound(round.id)}>
                    {round.name}
                  </Button>
                </TableCell>
                <TableCell>{round.first_to}</TableCell>
                <TableCell>{round.bracket_type === 1 ? t("tournament.admin.bracket.losers") : t("tournament.admin.bracket.winners")}</TableCell>
                <TableCell className="text-right">{round.order ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" type="button" variant="outline" onClick={() => onUpdateRound(round)}>{t("tournament.common.save")}</Button>
                    <Button size="sm" type="button" variant="ghost" onClick={() => onDeleteRound(round.id)}>
                      <Trash className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function TeamSelect({ onChange, teams, value }: { onChange: (value: string) => void; teams: TournamentTeam[]; value: string }) {
  const { t } = useTranslation()

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("tournament.admin.bracket.selectTeam")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t("tournament.common.tbd")} / none</SelectItem>
        {teams.map((team) => <SelectItem key={team.id} value={String(team.id)}>{teamName(team)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function MapRow({ map, onDelete }: { map: TournamentMappoolMap; onDelete: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-2">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="outline">{map.type}</Badge>
          <span className="text-xs text-muted-foreground">#{map.map_id}</span>
        </div>
        <a className="block truncate font-medium hover:underline" href={`https://osu.ppy.sh/beatmaps/${map.map_id}`} rel="noreferrer" target="_blank">
          {map.artist} - {map.title}
        </a>
        <p className="text-xs text-muted-foreground">mapped by {map.mapper} · {formatDate(map.created_time)}</p>
      </div>
      <Button size="sm" type="button" variant="ghost" onClick={onDelete}>
        <Trash className="size-4" />
      </Button>
    </div>
  )
}
