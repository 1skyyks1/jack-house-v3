import { Coin, Package, Question, ShoppingCartSimple, Sparkle, Truck } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  usePointBalanceQuery,
  usePointLedgerQuery,
  useRedemptionOrdersQuery,
  useRewardCartStore,
  useRewardItemsQuery,
  RewardStatusBadge,
  formatPoints,
  localizeRedemptionItemName,
  localizeRewardItem,
  type RedemptionOrder,
  type RewardItem,
} from "@/features/rewards"
import { getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { cn } from "@/lib/utils"

export function RewardsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ordersPage, setOrdersPage] = useState(1)
  const balanceQuery = usePointBalanceQuery()
  const itemsQuery = useRewardItemsQuery()
  const ledgerQuery = usePointLedgerQuery(ledgerPage)
  const ordersQuery = useRedemptionOrdersQuery(ordersPage)
  const cartCount = useRewardCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0))
  const syncCartItems = useRewardCartStore((state) => state.syncItems)

  useEffect(() => {
    if (itemsQuery.data) syncCartItems(itemsQuery.data)
  }, [itemsQuery.data, syncCartItems])

  if (itemsQuery.isError || balanceQuery.isError) {
    return <PageState title={t("rewards.loadFailed")} description={getErrorMessage(itemsQuery.error ?? balanceQuery.error)} />
  }

  return (
    <section className="space-y-4 pb-28 sm:pb-0">
      <div className="flex items-end justify-between gap-3 py-2">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkle className="size-4" weight="fill" />
            {t("rewards.eyebrow")}
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="whitespace-nowrap font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{t("rewards.title")}</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label={t("rewards.description")} className="mt-1 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button">
                  <Question className="size-5" weight="bold" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs leading-relaxed" side="right" sideOffset={8}>
                {t("rewards.description")}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex shrink-0 items-end gap-2 sm:gap-4">
          <div className="text-right sm:text-left">
            <div className="text-xs text-muted-foreground">{t("rewards.balance")}</div>
            <div className="mt-0.5 flex items-center justify-end gap-1 font-heading text-lg font-semibold tabular-nums sm:justify-start sm:gap-1.5 sm:text-2xl">
              <Coin className="size-4 text-amber-500 sm:size-5" weight="fill" />
              {balanceQuery.isLoading ? <Skeleton className="h-6 w-12 sm:h-7 sm:w-20" /> : formatPoints(balanceQuery.data?.balance ?? 0)}
            </div>
          </div>
          <Button asChild className="fixed bottom-24 right-4 z-40 size-11 shadow-lg shadow-primary/20 sm:relative sm:bottom-auto sm:right-auto sm:z-auto sm:size-9 sm:shadow-none" size="icon">
            <Link aria-label={t("rewards.cart")} data-rewards-cart-target to="/rewards/cart">
              <ShoppingCartSimple className="size-5" weight="bold" />
              {cartCount > 0 ? <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] leading-4 text-background tabular-nums">{cartCount}</span> : null}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={searchParams.get("tab") === "orders" ? "orders" : searchParams.get("tab") === "ledger" ? "ledger" : "shop"}>
        <TabsList>
          <TabsTrigger value="shop">{t("rewards.tabs.shop")}</TabsTrigger>
          <TabsTrigger value="ledger">{t("rewards.tabs.ledger")}</TabsTrigger>
          <TabsTrigger value="orders">{t("rewards.tabs.orders")}</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-5" value="shop">
          <RewardFeed items={itemsQuery.data ?? []} isLoading={itemsQuery.isLoading} />
        </TabsContent>
        <TabsContent className="mt-5" value="ledger">
          <LedgerPanel data={ledgerQuery.data} isLoading={ledgerQuery.isLoading} onPageChange={setLedgerPage} page={ledgerPage} />
        </TabsContent>
        <TabsContent className="mt-5" value="orders">
          <OrdersPanel data={ordersQuery.data} isLoading={ordersQuery.isLoading} onPageChange={setOrdersPage} page={ordersPage} />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function RewardFeed({ items, isLoading }: { items: RewardItem[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation()
  const addItem = useRewardCartStore((state) => state.addItem)
  const lines = useRewardCartStore((state) => state.lines)

  if (isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton className="aspect-[4/5] rounded-xl" key={index} />)}</div>
  }
  if (items.length === 0) return <EmptyState icon={Package} text={t("rewards.emptyItems")} />

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const content = localizeRewardItem(item, i18n.language)
        const line = lines.find((value) => value.item.id === item.id)
        const maxQuantity = Math.min(item.stock, item.limit_per_user ?? Number.MAX_SAFE_INTEGER)
        const cannotAdd = item.stock <= 0 || (line?.quantity ?? 0) >= maxQuantity
        return (
          <Card className="group gap-0 overflow-hidden py-0 transition-[border-color,box-shadow] duration-300 ease-out hover:border-primary/25 hover:shadow-lg" data-reward-card key={item.id}>
            <div className="relative aspect-[4/3] overflow-hidden bg-muted" data-reward-image>
              {item.image_url ? <img alt={content.name} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" src={item.image_url} /> : <div className="grid size-full place-items-center"><Package className="size-10 text-muted-foreground/45" /></div>}
              <Badge className="absolute left-3 top-3 bg-background/88 text-foreground shadow-sm backdrop-blur" variant="secondary">
                {item.type === "virtual" ? <Sparkle className="size-3" weight="fill" /> : <Truck className="size-3" weight="fill" />}
                {t(`rewards.types.${item.type}`)}
              </Badge>
            </div>
            <CardHeader className="p-4 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <CardTitle className="min-w-0 truncate text-lg font-medium leading-snug">{content.name}</CardTitle>
                {content.description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button aria-label={t("rewards.itemDescription")} className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button">
                        <Question className="size-4" weight="bold" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs leading-relaxed" side="top" sideOffset={8}>{content.description}</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="mt-auto space-y-4 p-4 pt-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xl font-semibold leading-none text-amber-600 tabular-nums dark:text-amber-400">
                  <Coin className="size-5" weight="fill" />
                  {formatPoints(item.point_cost)}
                </div>
                <div className={cn("rounded-full px-2.5 py-1 text-xs font-normal tabular-nums", item.stock > 0 ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive")}>{t("rewards.stock", { count: item.stock })}</div>
              </div>
              <Button
                className="w-full"
                disabled={cannotAdd}
                onClick={(event) => {
                  animateRewardToCart(event.currentTarget)
                  addItem(item)
                  toast.success(t("rewards.addedToCart", { name: content.name }))
                }}
                type="button"
                variant={line ? "secondary" : "default"}
              >
                <ShoppingCartSimple className="size-4" weight="bold" />
                {item.stock <= 0 ? t("rewards.soldOut") : line ? t("rewards.addAnother") : t("rewards.addToCart")}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function animateRewardToCart(button: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  const source = button.closest<HTMLElement>("[data-reward-card]")?.querySelector<HTMLElement>("[data-reward-image]")
  const target = document.querySelector<HTMLElement>("[data-rewards-cart-target]")
  if (!source || !target) return

  const sourceRect = source.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2)
  const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2)
  const flyer = source.cloneNode(true) as HTMLElement

  Object.assign(flyer.style, {
    borderRadius: "0.75rem",
    boxShadow: "0 16px 40px rgb(0 0 0 / 0.22)",
    height: `${sourceRect.height}px`,
    left: `${sourceRect.left}px`,
    margin: "0",
    overflow: "hidden",
    pointerEvents: "none",
    position: "fixed",
    top: `${sourceRect.top}px`,
    transformOrigin: "center",
    width: `${sourceRect.width}px`,
    zIndex: "100",
  })
  document.body.append(flyer)

  const flight = flyer.animate([
    { opacity: 0.95, transform: "translate3d(0, 0, 0) scale(1)" },
    { offset: 0.58, opacity: 0.9, transform: `translate3d(${deltaX * 0.62}px, ${deltaY * 0.28 - 28}px, 0) scale(0.48)` },
    { opacity: 0.15, transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.08)` },
  ], {
    duration: 650,
    easing: "cubic-bezier(0.22, 0.75, 0.25, 1)",
    fill: "forwards",
  })

  void flight.finished.finally(() => {
    flyer.remove()
    target.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.14)" },
      { transform: "scale(1)" },
    ], { duration: 240, easing: "ease-out" })
  })
}

type PaginationData<T> = { data: T[]; page: number; total: number; totalPages: number }

function LedgerPanel({ data, isLoading, onPageChange, page }: { data?: PaginationData<import("@/features/rewards").PointTransaction>; isLoading: boolean; onPageChange: (page: number) => void; page: number }) {
  const { t } = useTranslation()
  if (isLoading) return <ListSkeleton />
  if (!data?.data.length) return <EmptyState icon={Coin} text={t("rewards.emptyLedger")} />
  return (
    <Card className="gap-0 overflow-hidden py-0">
      {data.data.map((entry) => (
        <div className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0" key={entry.id}>
          <div className="min-w-0">
            <div className="truncate font-medium">{entry.reason}</div>
            <div className="mt-1 text-xs text-muted-foreground">{formatDate(entry.created_time)} · {t("rewards.balanceAfter", { balance: formatPoints(entry.balance_after) })}</div>
          </div>
          <div className={cn("shrink-0 font-heading text-lg font-semibold tabular-nums", entry.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>{entry.amount > 0 ? "+" : ""}{formatPoints(entry.amount)}</div>
        </div>
      ))}
      <SimplePager onPageChange={onPageChange} page={page} totalPages={data.totalPages} />
    </Card>
  )
}

function OrdersPanel({ data, isLoading, onPageChange, page }: { data?: PaginationData<RedemptionOrder>; isLoading: boolean; onPageChange: (page: number) => void; page: number }) {
  const { t, i18n } = useTranslation()
  if (isLoading) return <ListSkeleton />
  if (!data?.data.length) return <EmptyState icon={Package} text={t("rewards.emptyOrders")} />
  return (
    <div className="space-y-3">
      {data.data.map((order) => (
        <Card className="gap-4 p-4" key={order.id}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <div className="font-mono text-xs text-muted-foreground">{order.order_no}</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatDate(order.created_time)}</div>
            </div>
            <div className="flex items-center gap-2"><RewardStatusBadge status={order.status} /><span className="flex items-center gap-1 font-semibold"><Coin className="size-4 text-amber-500" weight="fill" />{formatPoints(order.total_points)}</span></div>
          </div>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div className="flex gap-3" key={item.id}>
                <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">{item.image_url ? <img alt="" className="size-full object-cover" src={item.image_url} /> : null}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{localizeRedemptionItemName(item, i18n.language)} × {item.quantity}</span><RewardStatusBadge status={item.fulfillment_status} /></div>
                  {item.virtual_id ? <p className="mt-1 text-xs text-muted-foreground">ID: {item.virtual_id}</p> : null}
                  {item.fulfillment_detail ? <p className="mt-1 text-sm text-muted-foreground">{item.fulfillment_detail}</p> : null}
                </div>
              </div>
            ))}
          </div>
          {order.recipient ? <div className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground"><Truck className="mr-1 inline size-4" />{maskContact(order.recipient, order.contact)} · {maskAddress(order.address)}</div> : null}
        </Card>
      ))}
      <SimplePager onPageChange={onPageChange} page={page} totalPages={data.totalPages} />
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof Package; text: string }) {
  return <div className="grid min-h-56 place-items-center rounded-xl border border-dashed bg-muted/20 text-center"><div><Icon className="mx-auto size-10 text-muted-foreground/50" /><p className="mt-3 text-sm text-muted-foreground">{text}</p></div></div>
}

function ListSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton className="h-20 rounded-xl" key={index} />)}</div>
}

function SimplePager({ onPageChange, page, totalPages }: { onPageChange: (page: number) => void; page: number; totalPages: number }) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null
  return <div className="flex items-center justify-end gap-2 p-3"><Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} size="sm" variant="outline">{t("rewards.previous")}</Button><span className="text-xs text-muted-foreground">{page} / {totalPages}</span><Button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} size="sm" variant="outline">{t("rewards.next")}</Button></div>
}

function maskContact(recipient: string | null, contact: string | null) {
  const safeContact = contact ? `${contact.slice(0, 3)}****${contact.slice(-4)}` : ""
  return `${recipient ?? ""} ${safeContact}`.trim()
}

function maskAddress(address: string | null) {
  if (!address) return ""
  return address.length > 8 ? `${address.slice(0, 8)}…` : address
}
