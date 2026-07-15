import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowSquareOut, CheckCircle, MagnifyingGlass, Plus, Tag, X } from "@phosphor-icons/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPackTypeLabel,
  getPackTagLabel,
  getVisiblePackTagGroups,
  filterPackTagIdsForType,
  useCreatePackMutation,
  useImportOsuPackMutation,
  useOsuPackPreviewMutation,
  usePackTagsQuery,
  type OsuPackPreview,
  type PackTag,
  type PackType,
} from "@/entities/pack"
import { cn } from "@/lib/utils"
import { FormFieldError, InlineSkeleton, MutationErrorAlert } from "@/shared/components"

type CreateMode = "manual" | "osu"

const packTypes: PackType[] = [0, 1, 2, 3]

const createOsuImportSchema = (t: TFunction) => z.object({
  beatmapsetId: z.string().trim().regex(/^\d+$/, t("pack.new.validation.beatmapsetNumeric")),
  type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
})

const createManualPackSchema = (t: TFunction) => z.object({
  creator: z.string().trim().min(1, t("pack.new.validation.creatorRequired")).max(255, t("pack.new.validation.creatorTooLong")),
  title: z.string().trim().min(1, t("pack.new.validation.titleRequired")).max(255, t("pack.new.validation.titleTooLong")),
  type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  url: z.string().trim().url(t("pack.new.validation.urlInvalid")).or(z.literal("")),
})

type OsuImportFormValues = z.infer<ReturnType<typeof createOsuImportSchema>>
type ManualPackFormValues = z.infer<ReturnType<typeof createManualPackSchema>>

export function NewPackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<CreateMode>("osu")
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [selectedType, setSelectedType] = useState<PackType>(0)
  const [preview, setPreview] = useState<OsuPackPreview | null>(null)
  const tagsQuery = usePackTagsQuery()
  const previewMutation = useOsuPackPreviewMutation()
  const importMutation = useImportOsuPackMutation()
  const createMutation = useCreatePackMutation()
  const osuForm = useForm<OsuImportFormValues>({
    resolver: zodResolver(createOsuImportSchema(t)),
    defaultValues: { beatmapsetId: "", type: 0 },
  })
  const manualForm = useForm<ManualPackFormValues>({
    resolver: zodResolver(createManualPackSchema(t)),
    defaultValues: { creator: "", title: "", type: 0, url: "" },
  })

  const setPackType = (nextType: PackType) => {
    setSelectedType(nextType)
    osuForm.setValue("type", nextType, { shouldDirty: true, shouldValidate: true })
    manualForm.setValue("type", nextType, { shouldDirty: true, shouldValidate: true })

    setSelectedTags((tagIds) => filterPackTagIdsForType(tagIds, tagsQuery.data ?? [], nextType))
  }

  const toggleTag = (tagId: number) => {
    setSelectedTags((tagIds) => (tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId]))
  }

  const resetAll = () => {
    osuForm.reset()
    manualForm.reset()
    setSelectedType(0)
    setSelectedTags([])
    setPreview(null)
  }

  const checkOsuBeatmapset = osuForm.handleSubmit((values) => {
    previewMutation.mutate(values.beatmapsetId, {
      onSuccess: (nextPreview) => {
        setPreview(nextPreview)
        toast.success(t("pack.new.checkSuccess"))
      },
      onError: () => {
        setPreview(null)
      },
    })
  })

  const submitOsuImport = osuForm.handleSubmit((values) => {
    if (!preview) {
      toast.error(t("pack.new.previewFirst"))
      return
    }

    importMutation.mutate(
      {
        beatmapsetId: values.beatmapsetId,
        tags: selectedTags,
        type: values.type,
      },
      {
        onSuccess: () => {
          toast.success(t("pack.new.importSuccess"))
          navigate("/pack")
        },
      },
    )
  })

  const submitManualPack = manualForm.handleSubmit((values) => {
    createMutation.mutate(
      {
        creator: values.creator.trim(),
        tags: selectedTags,
        title: values.title.trim(),
        type: values.type,
        url: values.url.trim() || undefined,
      },
      {
        onSuccess: (createdPack) => {
          toast.success(t("pack.new.createSuccess"))
          navigate(createdPack.pack_id ? `/pack/${createdPack.pack_id}` : "/pack")
        },
      },
    )
  })

  const isSubmitting = importMutation.isPending || createMutation.isPending

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/pack">{t("pack.detail.breadcrumb")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("pack.new.breadcrumb")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex justify-end">
          <ModeSwitch mode={mode} onModeChange={(nextMode) => {
            setMode(nextMode)
            setPackType(0)
            setSelectedTags([])
            setPreview(null)
          }} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-6">
            {mode === "osu" ? (
              <OsuImportForm
                form={osuForm}
                isChecking={previewMutation.isPending}
                isSubmitting={isSubmitting}
                onCheck={checkOsuBeatmapset}
                onPreviewClear={() => setPreview(null)}
                onSubmit={submitOsuImport}
                preview={preview}
                previewError={previewMutation.error}
                submitError={importMutation.error}
              />
            ) : (
              <ManualPackForm
                form={manualForm}
                isSubmitting={isSubmitting}
                onSubmit={submitManualPack}
                submitError={createMutation.error}
              />
            )}

            <PackTypePicker selectedType={selectedType} onSelectType={setPackType} />

            <TagSelector
              isError={tagsQuery.isError}
              isLoading={tagsQuery.isLoading}
              onToggleTag={toggleTag}
              packType={selectedType}
              selectedTags={selectedTags}
              tags={tagsQuery.data ?? []}
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border bg-background p-4">
              <h2 className="font-heading text-xl font-semibold">{t("pack.new.submitTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "osu" ? t("pack.new.submitDescriptionOsu") : t("pack.new.submitDescriptionManual")}
              </p>
              <div className="mt-4 grid gap-2">
                <Button
                  disabled={isSubmitting || previewMutation.isPending}
                  onClick={mode === "osu" ? submitOsuImport : submitManualPack}
                  type="button"
                >
                  <Plus className="size-4" weight="bold" />
                  {isSubmitting ? t("pack.new.submitting") : t("pack.new.createPack")}
                </Button>
                <Button
                  disabled={isSubmitting || previewMutation.isPending}
                  onClick={resetAll}
                  type="button"
                  variant="outline"
                >
                  <X className="size-4" weight="bold" />
                  {t("pack.list.reset")}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 font-medium text-foreground">
                <Tag className="size-4" weight="bold" />
                {t("pack.new.selectedTags")}
              </div>
              <p className="mt-2">{selectedTags.length === 0 ? t("pack.new.none") : t("pack.new.selectedCount", { count: selectedTags.length })}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

type ModeSwitchProps = {
  mode: CreateMode
  onModeChange: (mode: CreateMode) => void
}

function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  const { t } = useTranslation()
  return (
    <Tabs className="w-full md:w-auto" value={mode} onValueChange={(value) => onModeChange(value as CreateMode)}>
      <TabsList className="grid w-full grid-cols-2 md:w-72">
        <TabsTrigger value="osu">{t("pack.new.modeOsu")}</TabsTrigger>
        <TabsTrigger value="manual">{t("pack.new.modeManual")}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

type OsuImportFormProps = {
  form: ReturnType<typeof useForm<OsuImportFormValues>>
  isChecking: boolean
  isSubmitting: boolean
  onCheck: () => void
  onPreviewClear: () => void
  onSubmit: () => void
  preview: OsuPackPreview | null
  previewError: unknown
  submitError: unknown
}

function OsuImportForm({ form, isChecking, isSubmitting, onCheck, onPreviewClear, onSubmit, preview, previewError, submitError }: OsuImportFormProps) {
  const { t } = useTranslation()
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault()
      onSubmit()
    }}>
      <div>
        <Label htmlFor="beatmapsetId">{t("pack.new.beatmapsetLabel")}</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            className="min-w-0 flex-1"
            id="beatmapsetId"
            inputMode="numeric"
            placeholder={t("pack.new.beatmapsetPlaceholder")}
            aria-invalid={Boolean(form.formState.errors.beatmapsetId)}
            {...form.register("beatmapsetId", {
              onChange: () => {
                if (preview) {
                  form.clearErrors("beatmapsetId")
                  onPreviewClear()
                }
              },
            })}
          />
          <Button
            disabled={isChecking || isSubmitting}
            onClick={onCheck}
            type="button"
            variant="outline"
          >
            <MagnifyingGlass className="size-4" weight="bold" />
            {isChecking ? t("pack.new.checking") : t("pack.new.check")}
          </Button>
        </div>
        <FormFieldError message={form.formState.errors.beatmapsetId?.message} />
      </div>

      {preview ? <OsuPreviewCard preview={preview} beatmapsetId={form.getValues("beatmapsetId")} /> : null}
      {previewError ? <MutationErrorAlert error={previewError} /> : null}
      {submitError ? <MutationErrorAlert error={submitError} /> : null}
    </form>
  )
}

type ManualPackFormProps = {
  form: ReturnType<typeof useForm<ManualPackFormValues>>
  isSubmitting: boolean
  onSubmit: () => void
  submitError: unknown
}

function ManualPackForm({ form, isSubmitting, onSubmit, submitError }: ManualPackFormProps) {
  const { t } = useTranslation()
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault()
      onSubmit()
    }}>
      <div>
        <Label htmlFor="manualTitle">{t("pack.new.titleLabel")}</Label>
        <Input
          className="mt-2"
          disabled={isSubmitting}
          id="manualTitle"
          placeholder={t("pack.new.titlePlaceholder")}
          aria-invalid={Boolean(form.formState.errors.title)}
          {...form.register("title")}
        />
        <FormFieldError message={form.formState.errors.title?.message} />
      </div>

      <div>
        <Label htmlFor="manualCreator">{t("pack.new.creatorLabel")}</Label>
        <Input
          className="mt-2"
          disabled={isSubmitting}
          id="manualCreator"
          placeholder={t("pack.new.creatorPlaceholder")}
          aria-invalid={Boolean(form.formState.errors.creator)}
          {...form.register("creator")}
        />
        <FormFieldError message={form.formState.errors.creator?.message} />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="manualUrl">{t("pack.new.urlLabel")}</Label>
        <Input
          className="mt-2"
          disabled={isSubmitting}
          id="manualUrl"
          placeholder={t("pack.new.urlPlaceholder")}
          aria-invalid={Boolean(form.formState.errors.url)}
          {...form.register("url")}
        />
        <FormFieldError message={form.formState.errors.url?.message} />
      </div>

      {submitError ? <div className="md:col-span-2"><MutationErrorAlert error={submitError} /></div> : null}
    </form>
  )
}

type OsuPreviewCardProps = {
  beatmapsetId: string
  preview: OsuPackPreview
}

function OsuPreviewCard({ beatmapsetId, preview }: OsuPreviewCardProps) {
  const { t } = useTranslation()
  return (
    <a
      className="relative block min-h-28 overflow-hidden rounded-lg border text-white"
      href={`https://osu.ppy.sh/beatmapsets/${beatmapsetId}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      {preview.cover ? <img alt="" className="absolute inset-0 size-full object-cover" src={preview.cover} /> : <div className="absolute inset-0 bg-muted" />}
      <div className="absolute inset-0 bg-black/62" />
      <div className="relative flex min-h-28 items-end justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-100">
            <CheckCircle className="size-4" weight="bold" />
            {t("pack.new.previewReady")}
          </div>
          <h2 className="mt-2 break-words font-heading text-xl font-semibold">
            {preview.artist} - {preview.title}
          </h2>
          <p className="mt-1 text-sm text-white/78">{t("pack.new.createdBy", { name: preview.creator })}</p>
        </div>
        <ArrowSquareOut className="size-5 shrink-0 text-white/78" weight="bold" />
      </div>
    </a>
  )
}

type PackTypePickerProps = {
  onSelectType: (type: PackType) => void
  selectedType: PackType
}

function PackTypePicker({ onSelectType, selectedType }: PackTypePickerProps) {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold">{t("pack.new.typeTitle")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {packTypes.map((type) => (
          <Button
            className={cn(
              selectedType !== type && "text-muted-foreground",
            )}
            key={type}
            onClick={() => onSelectType(type)}
            type="button"
            variant={selectedType === type ? "default" : "outline"}
          >
            {getPackTypeLabel(type)}
          </Button>
        ))}
      </div>
    </section>
  )
}

type TagSelectorProps = {
  isError: boolean
  isLoading: boolean
  onToggleTag: (tagId: number) => void
  packType: PackType
  selectedTags: number[]
  tags: PackTag[]
}

function TagSelector({ isError, isLoading, onToggleTag, packType, selectedTags, tags }: TagSelectorProps) {
  const { t } = useTranslation()
  if (packType === 1) {
    return (
      <section className="rounded-lg border bg-background p-4">
        <h2 className="font-heading text-xl font-semibold">{t("pack.new.tagsTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("pack.new.collectionNoTags")}</p>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-background p-4">
        <h2 className="font-heading text-xl font-semibold">{t("pack.new.tagsTitle")}</h2>
        <InlineSkeleton className="mt-4" count={6} />
      </section>
    )
  }

  if (isError) {
    return <TagState title={t("pack.new.tagsTitle")} description={t("pack.list.tagsUnavailable")} />
  }

  const groups = getVisiblePackTagGroups(tags, packType)

  return (
    <section className="rounded-lg border bg-background p-4">
      <h2 className="font-heading text-xl font-semibold">{t("pack.new.tagsTitle")}</h2>
      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <Button
                  className={cn(
                    "h-8",
                    !selectedTags.includes(tag.tag_id) && "text-muted-foreground",
                  )}
                  key={tag.tag_id}
                  onClick={() => onToggleTag(tag.tag_id)}
                  type="button"
                  variant={selectedTags.includes(tag.tag_id) ? "default" : "outline"}
                >
                  {getPackTagLabel(tag)}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

type TagStateProps = {
  description: string
  title: string
}

function TagState({ description, title }: TagStateProps) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </section>
  )
}
