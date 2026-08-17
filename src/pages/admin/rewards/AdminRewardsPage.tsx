import type { ColumnDef } from "@tanstack/react-table"
import { Coin, Gift, MagnifyingGlass, Package, PencilSimple, Plus, Truck, User } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdjustPointsMutation,
  usePointLedgerQuery,
  useRedemptionOrdersQuery,
  useRewardItemsQuery,
  useSaveRewardItemMutation,
  useUpdateOrderItemMutation,
  RewardStatusBadge,
  formatPoints,
  localizeRedemptionItemName,
  localizeRewardItem,
  type FulfillmentStatus,
  type RedemptionOrderItem,
  type RewardItem,
  type RewardItemStatus,
  type RewardItemType,
  type SaveRewardItemRequest,
} from "@/features/rewards"
import { useUserSearchQuery, type UserSearchItem } from "@/entities/user"
import { AdminBadge, AdminPage, AdminTable } from "@/features/admin-shell"
import { MutationErrorAlert } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"

export function AdminRewardsPage() {
  const { t } = useTranslation()
  const [editorItem, setEditorItem] = useState<RewardItem | "new" | null>(null)
  const itemsQuery = useRewardItemsQuery(true)
  const ledgerQuery = usePointLedgerQuery(1, true)
  const ordersQuery = useRedemptionOrdersQuery(1, true)

  return (
    <AdminPage>
      <Tabs defaultValue="items">
        <div className="mb-4 flex items-center justify-between gap-3">
          <TabsList><TabsTrigger value="items">{t("rewards.admin.items")}</TabsTrigger><TabsTrigger value="points">{t("rewards.admin.points")}</TabsTrigger><TabsTrigger value="orders">{t("rewards.admin.orders")}</TabsTrigger></TabsList>
          <Button className="shrink-0" onClick={() => setEditorItem("new")}><Plus className="size-4" />{t("rewards.admin.addItem")}</Button>
        </div>
        <TabsContent value="items"><ItemsTable items={itemsQuery.data ?? []} isLoading={itemsQuery.isLoading} onEdit={setEditorItem} /></TabsContent>
        <TabsContent value="points"><PointsPanel ledger={ledgerQuery.data?.data ?? []} /></TabsContent>
        <TabsContent value="orders"><AdminOrders orders={ordersQuery.data?.data ?? []} /></TabsContent>
      </Tabs>
      <RewardItemDialog item={editorItem === "new" ? null : editorItem} key={editorItem === "new" ? "new" : editorItem?.id ?? "closed"} onOpenChange={(open) => { if (!open) setEditorItem(null) }} open={editorItem !== null} />
    </AdminPage>
  )
}

function ItemsTable({ items, isLoading, onEdit }: { items: RewardItem[]; isLoading: boolean; onEdit: (item: RewardItem) => void }) {
  const { t, i18n } = useTranslation()
  const columns: Array<ColumnDef<RewardItem>> = [
    { header: t("rewards.admin.item"), cell: ({ row }) => <div className="flex min-w-64 items-center gap-3"><div className="size-12 overflow-hidden rounded-md bg-muted">{row.original.image_url ? <img alt="" className="size-full object-cover" src={row.original.image_url} /> : <div className="grid size-full place-items-center"><Gift className="size-5 text-muted-foreground" /></div>}</div><div><div className="font-medium">{localizeRewardItem(row.original, i18n.language).name}</div><div className="mt-1 text-xs text-muted-foreground">#{row.original.id} · {t(`rewards.types.${row.original.type}`)}</div></div></div> },
    { header: t("rewards.admin.cost"), cell: ({ row }) => <span className="flex items-center gap-1 font-semibold"><Coin className="size-4 text-amber-500" weight="fill" />{formatPoints(row.original.point_cost)}</span> },
    { accessorKey: "stock", header: t("rewards.admin.stock") },
    { header: t("rewards.admin.status"), cell: ({ row }) => <AdminBadge tone={row.original.status === "active" ? "success" : row.original.status === "draft" ? "warning" : "info"}>{t(`rewards.itemStatus.${row.original.status}`)}</AdminBadge> },
    { header: t("rewards.admin.updated"), cell: ({ row }) => formatDate(row.original.updated_time) },
    { id: "actions", header: t("rewards.admin.actions"), cell: ({ row }) => <Button onClick={() => onEdit(row.original)} size="xs" variant="outline"><PencilSimple className="size-3.5" />{t("rewards.admin.edit")}</Button> },
  ]
  return <AdminTable columns={columns} data={items} isLoading={isLoading} />
}

const EMPTY_ITEM: SaveRewardItemRequest = { name_zh: "", name_en: "", description_zh: "", description_en: "", image_url: "", type: "virtual", point_cost: 100, stock: 0, limit_per_user: null, status: "draft", starts_at: null, ends_at: null, sort_order: 0, id_label_zh: "", id_label_en: "", id_placeholder_zh: "", id_placeholder_en: "" }

function RewardItemDialog({ item, onOpenChange, open }: { item: RewardItem | null; onOpenChange: (open: boolean) => void; open: boolean }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<SaveRewardItemRequest>(() => item ? {
    name_zh: item.name_zh ?? item.name,
    name_en: item.name_en ?? item.name,
    description_zh: item.description_zh ?? item.description ?? "",
    description_en: item.description_en ?? item.description ?? "",
    image_url: item.image_url ?? "",
    type: item.type,
    point_cost: item.point_cost,
    stock: item.stock,
    limit_per_user: item.limit_per_user,
    status: item.status,
    starts_at: toDateTimeLocal(item.starts_at),
    ends_at: toDateTimeLocal(item.ends_at),
    sort_order: item.sort_order,
    id_label_zh: item.id_label_zh ?? item.id_label ?? "",
    id_label_en: item.id_label_en ?? item.id_label ?? "",
    id_placeholder_zh: item.id_placeholder_zh ?? item.id_placeholder ?? "",
    id_placeholder_en: item.id_placeholder_en ?? item.id_placeholder ?? "",
  } : EMPTY_ITEM)
  const mutation = useSaveRewardItemMutation(item?.id)
  const update = <K extends keyof SaveRewardItemRequest>(key: K, value: SaveRewardItemRequest[K]) => setForm((current) => ({ ...current, [key]: value }))
  const isValid = form.name_zh.trim() && form.name_en.trim() && form.point_cost > 0 && form.stock >= 0
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="scrollbar-soft max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader><DialogTitle>{item ? t("rewards.admin.editItem") : t("rewards.admin.addItem")}</DialogTitle><DialogDescription>{t("rewards.admin.itemDescription")}</DialogDescription></DialogHeader>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label={t("rewards.admin.nameZh")} required><Input onChange={(event) => update("name_zh", event.target.value)} value={form.name_zh} /></Field>
          <Field label={t("rewards.admin.nameEn")} required><Input onChange={(event) => update("name_en", event.target.value)} value={form.name_en} /></Field>
          <Field label={t("rewards.admin.type")}><Select onValueChange={(value) => update("type", value as RewardItemType)} value={form.type}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="virtual">{t("rewards.types.virtual")}</SelectItem><SelectItem value="physical">{t("rewards.types.physical")}</SelectItem></SelectContent></Select></Field>
          <Field label={t("rewards.admin.status")}><Select onValueChange={(value) => update("status", value as RewardItemStatus)} value={form.status}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">{t("rewards.itemStatus.draft")}</SelectItem><SelectItem value="active">{t("rewards.itemStatus.active")}</SelectItem><SelectItem value="inactive">{t("rewards.itemStatus.inactive")}</SelectItem></SelectContent></Select></Field>
          <Field className="sm:col-span-2" label={t("rewards.admin.imageUrl")}><Input onChange={(event) => update("image_url", event.target.value)} placeholder="https://…" value={form.image_url} />{form.image_url ? <img alt="" className="mt-2 h-28 w-48 rounded-md border object-cover" src={form.image_url} /> : null}</Field>
          <Field label={t("rewards.admin.descriptionZh")}><Textarea onChange={(event) => update("description_zh", event.target.value)} rows={4} value={form.description_zh} /></Field>
          <Field label={t("rewards.admin.descriptionEn")}><Textarea onChange={(event) => update("description_en", event.target.value)} rows={4} value={form.description_en} /></Field>
          <Field label={t("rewards.admin.cost")} required><Input min={1} onChange={(event) => update("point_cost", Number(event.target.value))} type="number" value={form.point_cost} /></Field>
          <Field label={t("rewards.admin.stock")} required><Input min={0} onChange={(event) => update("stock", Number(event.target.value))} type="number" value={form.stock} /></Field>
          <Field label={t("rewards.admin.limit")}><Input min={1} onChange={(event) => update("limit_per_user", event.target.value ? Number(event.target.value) : null)} placeholder={t("rewards.admin.noLimit")} type="number" value={form.limit_per_user ?? ""} /></Field>
          <Field label={t("rewards.admin.sortOrder")}><Input onChange={(event) => update("sort_order", Number(event.target.value))} type="number" value={form.sort_order} /></Field>
            <Field label={t("rewards.admin.startsAt")}><Input onChange={(event) => update("starts_at", event.target.value || null)} type="datetime-local" value={form.starts_at ?? ""} /><p className="mt-1.5 text-xs text-muted-foreground">{t("rewards.admin.noTimeLimit")}</p></Field>
            <Field label={t("rewards.admin.endsAt")}><Input onChange={(event) => update("ends_at", event.target.value || null)} type="datetime-local" value={form.ends_at ?? ""} /><p className="mt-1.5 text-xs text-muted-foreground">{t("rewards.admin.noTimeLimit")}</p></Field>
          {form.type === "virtual" ? <><Field label={t("rewards.admin.idLabelZh")}><Input onChange={(event) => update("id_label_zh", event.target.value)} placeholder={t("rewards.virtualId")} value={form.id_label_zh} /></Field><Field label={t("rewards.admin.idLabelEn")}><Input onChange={(event) => update("id_label_en", event.target.value)} placeholder="Game ID" value={form.id_label_en} /></Field><Field label={t("rewards.admin.idPlaceholderZh")}><Input onChange={(event) => update("id_placeholder_zh", event.target.value)} value={form.id_placeholder_zh} /></Field><Field label={t("rewards.admin.idPlaceholderEn")}><Input onChange={(event) => update("id_placeholder_en", event.target.value)} value={form.id_placeholder_en} /></Field></> : null}
          {mutation.error ? <div className="sm:col-span-2"><MutationErrorAlert error={mutation.error} /></div> : null}
          </div>
          <DialogFooter className="mt-6"><Button onClick={() => onOpenChange(false)} variant="outline">{t("rewards.admin.cancel")}</Button><Button disabled={!isValid || mutation.isPending} onClick={() => mutation.mutate(form, { onSuccess: () => { toast.success(t("rewards.admin.itemSaved")); onOpenChange(false) } })}>{mutation.isPending ? t("rewards.admin.saving") : t("rewards.admin.save")}</Button></DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PointsPanel({ ledger }: { ledger: import("@/features/rewards").PointTransaction[] }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null)
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState("")
  const usersQuery = useUserSearchQuery({ page: 1, pageSize: 8, search }, search.trim().length > 0)
  const mutation = useAdjustPointsMutation()
  return (
    <div className="grid gap-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Coin className="size-5 text-amber-500" weight="fill" />{t("rewards.admin.adjustPoints")}</CardTitle><CardDescription>{t("rewards.admin.adjustDescription")}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Field label={t("rewards.admin.user")} required><div className="relative"><MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" onChange={(event) => { setSearch(event.target.value); setSelectedUser(null) }} placeholder={t("rewards.admin.searchUser")} value={selectedUser?.user_name ?? search} /></div></Field>
          {!selectedUser && usersQuery.data?.data.length ? <div className="overflow-hidden rounded-md border">{usersQuery.data.data.map((user) => <button className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent" key={user.user_id} onClick={() => { setSelectedUser(user); setSearch("") }} type="button"><User className="size-4" /><span className="flex-1">{user.user_name}</span><span className="text-xs text-muted-foreground">#{user.user_id}</span></button>)}</div> : null}
          <Field label={t("rewards.admin.amount")} required><Input onChange={(event) => setAmount(Number(event.target.value))} placeholder={t("rewards.admin.amountHint")} type="number" value={amount || ""} /></Field>
          <Field label={t("rewards.admin.reason")} required><Textarea onChange={(event) => setReason(event.target.value)} value={reason} /></Field>
          <Button className="w-full" disabled={!selectedUser || !amount || !reason.trim() || mutation.isPending} onClick={() => { if (!selectedUser) return; mutation.mutate({ user_id: selectedUser.user_id, amount, reason }, { onSuccess: ({ balance }) => { toast.success(t("rewards.admin.pointsAdjusted", { balance: formatPoints(balance) })); setAmount(0); setReason("") } }) }}>{t("rewards.admin.submitAdjustment")}</Button>
          {mutation.error ? <MutationErrorAlert error={mutation.error} /> : null}
        </CardContent>
      </Card>
      <Card className="gap-0 overflow-hidden py-0"><div className="border-b px-4 py-3 font-semibold">{t("rewards.admin.recentLedger")}</div>{ledger.map((entry) => <div className="flex items-center justify-between gap-4 border-b p-3 last:border-b-0" key={entry.id}><div><div className="text-sm font-medium">{entry.user?.user_name ?? `#${entry.user_id}`} · {entry.reason}</div><div className="mt-1 text-xs text-muted-foreground">{formatDate(entry.created_time)}</div></div><span className={entry.amount > 0 ? "font-semibold text-emerald-600" : "font-semibold text-destructive"}>{entry.amount > 0 ? "+" : ""}{formatPoints(entry.amount)}</span></div>)}</Card>
    </div>
  )
}

function AdminOrders({ orders }: { orders: import("@/features/rewards").RedemptionOrder[] }) {
  const { t, i18n } = useTranslation()
  if (!orders.length) return <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">{t("rewards.admin.noOrders")}</div>
  return <div className="space-y-4">{orders.map((order) => <Card className="gap-4 p-4" key={order.id}><div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"><div><div className="font-medium">{order.user?.user_name ?? `#${order.user_id}`}</div><div className="mt-1 font-mono text-xs text-muted-foreground">{order.order_no} · {formatDate(order.created_time)}</div></div><div className="flex items-center gap-2"><RewardStatusBadge status={order.status} /><span className="font-semibold">{formatPoints(order.total_points)} pts</span></div></div>{order.recipient ? <div className="rounded-md bg-muted/60 p-3 text-sm"><Truck className="mr-1 inline size-4" />{order.recipient} · {order.contact} · {order.address}{order.shipping_remark ? ` · ${order.shipping_remark}` : ""}</div> : null}<div className="space-y-3">{order.items.map((item) => <OrderItemEditor item={item} itemName={localizeRedemptionItemName(item, i18n.language)} key={item.id} />)}</div></Card>)}</div>
}

function OrderItemEditor({ item, itemName }: { item: RedemptionOrderItem; itemName: string }) {
  const { t } = useTranslation()
  const mutation = useUpdateOrderItemMutation()
  const [status, setStatus] = useState<FulfillmentStatus>(item.fulfillment_status)
  const [detail, setDetail] = useState(item.fulfillment_detail ?? "")
  const changed = status !== item.fulfillment_status || detail !== (item.fulfillment_detail ?? "")
  return <div className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(15rem,1fr)_11rem_minmax(14rem,1fr)_auto] lg:items-end"><div className="flex gap-3"><div className="size-12 shrink-0 overflow-hidden rounded bg-muted">{item.image_url ? <img alt="" className="size-full object-cover" src={item.image_url} /> : <Package className="m-3 size-6 text-muted-foreground" />}</div><div><div className="font-medium">{itemName} × {item.quantity}</div><div className="mt-1 text-xs text-muted-foreground">{item.item_type === "virtual" ? `ID: ${item.virtual_id}` : t("rewards.types.physical")}{item.remark ? ` · ${item.remark}` : ""}</div></div></div><Field label={t("rewards.admin.fulfillmentStatus")}><Select disabled={item.fulfillment_status === "cancelled" || item.fulfillment_status === "completed"} onValueChange={(value) => setStatus(value as FulfillmentStatus)} value={status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">{t("rewards.status.pending")}</SelectItem><SelectItem value="processing">{t("rewards.status.processing")}</SelectItem><SelectItem value="completed">{t("rewards.status.completed")}</SelectItem><SelectItem value="cancelled">{t("rewards.status.cancelled")}</SelectItem></SelectContent></Select></Field><Field label={t("rewards.admin.fulfillmentDetail")}><Input disabled={item.fulfillment_status === "cancelled"} onChange={(event) => setDetail(event.target.value)} placeholder={item.item_type === "physical" ? t("rewards.admin.trackingHint") : t("rewards.admin.deliveryHint")} value={detail} /></Field><Button disabled={!changed || mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status, detail }, { onSuccess: () => toast.success(t("rewards.admin.orderUpdated")) })} size="sm">{t("rewards.admin.update")}</Button></div>
}

function Field({ children, className, label, required }: { children: React.ReactNode; className?: string; label: string; required?: boolean }) {
  return <div className={className}><Label>{label}{required ? " *" : ""}</Label><div className="mt-1">{children}</div></div>
}

function toDateTimeLocal(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
