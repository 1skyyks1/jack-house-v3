import {
  ClipboardText,
  GithubLogo,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  calculateDanAccuracies,
  DAN_CATALOG,
  DAN_PRESETS,
  formatAccuracy,
  type AccuracyCalculationMode,
} from "@/features/accuracy-calculator"
import { cn } from "@/lib/utils"
import { ToolsBreadcrumb } from "../_shared/ToolsBreadcrumb"

type DanSource = "preset" | "custom"

type CustomSong = {
  id: number
  name: string
  noteCount: string
}

const initialGroup = DAN_CATALOG[0]
const initialDanId = initialGroup.dans[0].id

function createInitialCustomSongs(): CustomSong[] {
  return Array.from({ length: 4 }, (_, index) => ({ id: index + 1, name: "", noteCount: "" }))
}

export function AccuracyCalculatorPage() {
  const { t } = useTranslation()
  const nextCustomSongId = useRef(5)
  const [source, setSource] = useState<DanSource>("preset")
  const [mode, setMode] = useState<AccuracyCalculationMode>("cumulative-to-song")
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroup.id)
  const [selectedDanId, setSelectedDanId] = useState(initialDanId)
  const [scoreV2, setScoreV2] = useState(false)
  const [customSongs, setCustomSongs] = useState<CustomSong[]>(createInitialCustomSongs)
  const [accuracyInputs, setAccuracyInputs] = useState<string[]>(() => Array(DAN_PRESETS[initialDanId].num).fill(""))

  const selectedGroup = DAN_CATALOG.find((group) => group.id === selectedGroupId) ?? initialGroup
  const selectedPreset = DAN_PRESETS[selectedDanId] ?? DAN_PRESETS[initialDanId]
  const canUseScoreV2 = source === "preset" && Boolean(selectedPreset.lnote)
  const songs = useMemo(() => source === "preset"
    ? selectedPreset.song.map((name, index) => ({
        name,
        noteCount: selectedPreset.note[index] + (scoreV2 ? selectedPreset.lnote?.[index] ?? 0 : 0),
      }))
    : customSongs.map((song, index) => ({
        name: song.name.trim() || t("accuracyCalculator.untitledSong", { index: index + 1 }),
        noteCount: parsePositiveNumber(song.noteCount),
      })), [customSongs, scoreV2, selectedPreset, source, t])

  const calculation = useMemo(() => calculateDanAccuracies(
    mode,
    songs.map((song) => song.noteCount),
    accuracyInputs.map(parseAccuracy),
  ), [accuracyInputs, mode, songs])

  const resetAccuracyInputs = (count: number) => setAccuracyInputs(Array(count).fill(""))

  const changeSource = (value: string) => {
    const nextSource = value as DanSource
    setSource(nextSource)
    setScoreV2(false)
    resetAccuracyInputs(nextSource === "preset" ? selectedPreset.num : customSongs.length)
  }

  const changeGroup = (groupId: string) => {
    const nextGroup = DAN_CATALOG.find((group) => group.id === groupId) ?? initialGroup
    const nextDanId = nextGroup.dans[0].id
    setSelectedGroupId(nextGroup.id)
    setSelectedDanId(nextDanId)
    setScoreV2(false)
    resetAccuracyInputs(DAN_PRESETS[nextDanId].num)
  }

  const changeDan = (danId: string) => {
    setSelectedDanId(danId)
    setScoreV2(false)
    resetAccuracyInputs(DAN_PRESETS[danId].num)
  }

  const updateCustomSong = (id: number, patch: Partial<Pick<CustomSong, "name" | "noteCount">>) => {
    setCustomSongs((current) => current.map((song) => song.id === id ? { ...song, ...patch } : song))
  }

  const addCustomSong = () => {
    const id = nextCustomSongId.current
    nextCustomSongId.current += 1
    setCustomSongs((current) => [...current, { id, name: "", noteCount: "" }])
    setAccuracyInputs((current) => [...current, ""])
  }

  const removeCustomSong = (id: number) => {
    if (customSongs.length <= 1) return
    const index = customSongs.findIndex((song) => song.id === id)
    setCustomSongs((current) => current.filter((song) => song.id !== id))
    setAccuracyInputs((current) => current.filter((_value, itemIndex) => itemIndex !== index))
  }

  const updateAccuracy = (index: number, value: string) => {
    setAccuracyInputs((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  const copyResult = async () => {
    if (!calculation) return
    const danName = source === "preset"
      ? selectedGroup.dans.find((dan) => dan.id === selectedDanId)?.name ?? selectedDanId
      : t("accuracyCalculator.customDan")
    const content = [
      source === "preset" ? `${selectedGroup.name} - ${danName}` : danName,
      ...calculation.values.map((value, index) => `${index + 1}. ${formatAccuracy(value)}%`),
    ].join("\n")

    try {
      await navigator.clipboard.writeText(content)
      toast.success(t("accuracyCalculator.copySuccess"))
    } catch {
      toast.error(t("accuracyCalculator.copyFailed"))
    }
  }

  const inputLabel = mode === "cumulative-to-song"
    ? t("accuracyCalculator.cumulativeAccuracy")
    : t("accuracyCalculator.songAccuracy")
  const resultLabel = mode === "cumulative-to-song"
    ? t("accuracyCalculator.songAccuracy")
    : t("accuracyCalculator.cumulativeAccuracy")

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToolsBreadcrumb current={t("accuracyCalculator.title")} />
        <a className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href="https://github.com/uzxn/acc" rel="noreferrer" target="_blank">
          <GithubLogo className="size-4" weight="fill" />
          {t("accuracyCalculator.sourceLink")}
        </a>
      </div>

      <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8">
        <aside className="h-fit space-y-5 border-b pb-8 lg:sticky lg:top-20 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <h2 className="font-heading text-lg font-semibold">{t("accuracyCalculator.settingsTitle")}</h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>{t("accuracyCalculator.sourceType")}</Label>
              <Tabs onValueChange={changeSource} value={source}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preset">{t("accuracyCalculator.preset")}</TabsTrigger>
                  <TabsTrigger value="custom">{t("accuracyCalculator.custom")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>{t("accuracyCalculator.calculationMode")}</Label>
              <Select onValueChange={(value) => setMode(value as AccuracyCalculationMode)} value={mode}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cumulative-to-song">{t("accuracyCalculator.cumulativeToSong")}</SelectItem>
                  <SelectItem value="song-to-cumulative">{t("accuracyCalculator.songToCumulative")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {source === "preset" ? (
              <>
                <div className="space-y-2">
                  <Label>{t("accuracyCalculator.danSeries")}</Label>
                  <Select onValueChange={changeGroup} value={selectedGroup.id}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAN_CATALOG.map((group) => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("accuracyCalculator.dan")}</Label>
                  <Select onValueChange={changeDan} value={selectedDanId}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {selectedGroup.dans.map((dan) => <SelectItem key={dan.id} value={dan.id}>{dan.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {canUseScoreV2 ? (
                  <div className="flex items-center justify-between gap-4 border-t pt-5">
                    <Label htmlFor="accuracy-score-v2">ScoreV2</Label>
                    <Switch checked={scoreV2} id="accuracy-score-v2" onCheckedChange={setScoreV2} />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">
          <section className="scroll-mt-24 pb-10" id="dan-input">
            <h1 className="font-heading text-xl font-semibold">
              {source === "preset" ? selectedGroup.dans.find((dan) => dan.id === selectedDanId)?.name : t("accuracyCalculator.customDan")}
            </h1>
            <div className="mt-5">
              <div className="hidden grid-cols-[2.5rem_minmax(0,1fr)_8rem_9rem] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground sm:grid">
                <span>#</span>
                <span>{t("accuracyCalculator.song")}</span>
                <span>{t("accuracyCalculator.objects")}</span>
                <span>{inputLabel}</span>
              </div>
              {songs.map((song, index) => {
                const customSong = customSongs[index]
                const accuracy = accuracyInputs[index] ?? ""
                const accuracyIsInvalid = accuracy !== "" && !isValidAccuracy(accuracy)
                return (
                  <div className="grid gap-3 px-2 py-3 even:bg-muted/20 sm:grid-cols-[2.5rem_minmax(0,1fr)_8rem_9rem] sm:items-center" key={source === "custom" ? customSong.id : `${selectedDanId}-${index}`}>
                    <span className="font-heading text-sm font-semibold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    {source === "custom" ? (
                      <div className="flex min-w-0 gap-2">
                        <Input
                          aria-label={t("accuracyCalculator.songName", { index: index + 1 })}
                          onChange={(event) => updateCustomSong(customSong.id, { name: event.target.value })}
                          placeholder={t("accuracyCalculator.songNamePlaceholder")}
                          value={customSong.name}
                        />
                        <Button aria-label={t("accuracyCalculator.removeSong")} disabled={customSongs.length <= 1} onClick={() => removeCustomSong(customSong.id)} size="icon" type="button" variant="ghost">
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="min-w-0 break-words text-sm leading-relaxed">{song.name}</span>
                    )}
                    {source === "custom" ? (
                      <Input
                        aria-label={t("accuracyCalculator.objectCount", { index: index + 1 })}
                        inputMode="numeric"
                        min="1"
                        onChange={(event) => updateCustomSong(customSong.id, { noteCount: event.target.value })}
                        placeholder="0"
                        step="1"
                        type="number"
                        value={customSong.noteCount}
                      />
                    ) : (
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">{song.noteCount.toLocaleString()}</span>
                    )}
                    <div className="relative">
                      <Input
                        aria-invalid={accuracyIsInvalid}
                        aria-label={t("accuracyCalculator.accuracyInput", { index: index + 1 })}
                        className="pr-8"
                        inputMode="decimal"
                        onChange={(event) => updateAccuracy(index, event.target.value)}
                        placeholder="99.00"
                        type="text"
                        value={accuracy}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                )
              })}
              {source === "custom" ? (
                <Button className="mt-3" onClick={addCustomSong} type="button" variant="ghost">
                  <Plus className="size-4" />
                  {t("accuracyCalculator.addSong")}
                </Button>
              ) : null}
            </div>
          </section>

          <section className="scroll-mt-24 border-t pt-8" id="dan-result">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold">{resultLabel}</h2>
              <Button disabled={!calculation} onClick={copyResult} size="sm" type="button" variant="outline">
                <ClipboardText className="size-4" />
                {t("accuracyCalculator.copy")}
              </Button>
            </div>
            {calculation?.hasImpossibleAccuracy ? (
              <div className="mt-5 flex gap-3 border-l-2 border-destructive py-1 pl-3 text-destructive">
                <WarningCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{t("accuracyCalculator.impossibleTitle")}</p>
                  <p className="mt-1 text-sm">{t("accuracyCalculator.impossibleDescription")}</p>
                </div>
              </div>
            ) : null}
            {calculation ? (
              <Table className="mt-5">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{t("accuracyCalculator.song")}</TableHead>
                    <TableHead className="text-right">{t("accuracyCalculator.objects")}</TableHead>
                    <TableHead className="text-right">{resultLabel}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {songs.map((song, index) => (
                    <TableRow className="border-b-0 even:bg-muted/20" key={`${song.name}-${index}`}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="max-w-[32rem] whitespace-normal">{song.name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{calculation.effectiveNoteCounts[index].toLocaleString()}</TableCell>
                      <TableCell className={cn("text-right font-mono font-semibold tabular-nums", (calculation.values[index] < 0 || calculation.values[index] > 100) && "text-destructive")}>
                        {formatAccuracy(calculation.values[index])}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  )
}

function parsePositiveNumber(value: string) {
  if (!value.trim()) return Number.NaN
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN
}

function parseAccuracy(value: string) {
  if (!value.trim()) return Number.NaN
  return Number(value)
}

function isValidAccuracy(value: string) {
  const parsed = parseAccuracy(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
}
