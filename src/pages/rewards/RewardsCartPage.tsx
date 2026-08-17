import { ArrowLeft, Coin, Minus, Package, Plus, Question, ShoppingCartSimple, Trash, Truck } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatPoints, localizeRewardItem, usePointBalanceQuery, useRedeemMutation, useRewardCartStore, useRewardItemsQuery, type ShippingInfo } from "@/features/rewards"
import { MutationErrorAlert } from "@/shared/components"

const EMPTY_SHIPPING: ShippingInfo = { recipient: "", contact: "", address: "", remark: "" }

export function RewardsCartPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lines = useRewardCartStore((state) => state.lines)
  const removeItem = useRewardCartStore((state) => state.removeItem)
  const setQuantity = useRewardCartStore((state) => state.setQuantity)
  const updateDetails = useRewardCartStore((state) => state.updateDetails)
  const clear = useRewardCartStore((state) => state.clear)
  const syncCartItems = useRewardCartStore((state) => state.syncItems)
  const balanceQuery = usePointBalanceQuery()
  const itemsQuery = useRewardItemsQuery()
  const redeemMutation = useRedeemMutation()
  const [shipping, setShipping] = useState(EMPTY_SHIPPING)
  const [shippingDraft, setShippingDraft] = useState(EMPTY_SHIPPING)
  const [shippingOpen, setShippingOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const total = useMemo(() => lines.reduce((sum, line) => sum + line.item.point_cost * line.quantity, 0), [lines])
  const hasPhysical = lines.some((line) => line.item.type === "physical")
  const virtualInfoReady = lines.every((line) => line.item.type !== "virtual" || line.virtualId.trim())
  const shippingReady = !hasPhysical || Boolean(shipping.recipient.trim() && shipping.contact.trim() && shipping.address.trim())
  const shippingDraftReady = Boolean(shippingDraft.recipient.trim() && shippingDraft.contact.trim() && shippingDraft.address.trim())
  const enoughPoints = (balanceQuery.data?.balance ?? 0) >= total
  const canSubmit = lines.length > 0 && virtualInfoReady && shippingReady && enoughPoints

  useEffect(() => {
    if (itemsQuery.data) syncCartItems(itemsQuery.data)
  }, [itemsQuery.data, syncCartItems])

  if (lines.length === 0) {
    return (
      <div className="grid min-h-[55vh] place-items-center text-center">
        <div><ShoppingCartSimple className="mx-auto size-14 text-muted-foreground/45" /><h1 className="mt-4 font-heading text-2xl font-semibold">{t("rewards.cartEmpty")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("rewards.cartEmptyDescription")}</p><Button asChild className="mt-5"><Link to="/rewards">{t("rewards.goShopping")}</Link></Button></div>
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild size="icon-sm" variant="ghost"><Link aria-label={t("rewards.backToShop")} to="/rewards"><ArrowLeft className="size-5" /></Link></Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{t("rewards.cart")}</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label={t("rewards.cartTemporaryNotice")} className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button">
                  <Question className="size-4" weight="bold" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs leading-relaxed" side="bottom" sideOffset={8}>{t("rewards.cartTemporaryNotice")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="hidden items-center gap-1 text-sm font-medium sm:flex"><Coin className="size-4 text-amber-500" weight="fill" />{formatPoints(balanceQuery.data?.balance ?? 0)}</div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {lines.map((line) => {
            const content = localizeRewardItem(line.item, i18n.language)

            return (
              <Card className="gap-4 p-4" key={line.item.id}>
                <div className="flex gap-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">{line.item.image_url ? <img alt={content.name} className="size-full object-cover" src={line.item.image_url} /> : <div className="grid size-full place-items-center"><Package className="size-7 text-muted-foreground/50" /></div>}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-1.5"><span className="font-semibold">{content.name}</span>{content.description ? <Tooltip><TooltipTrigger asChild><button aria-label={t("rewards.itemDescription")} className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button"><Question className="size-4" weight="bold" /></button></TooltipTrigger><TooltipContent className="max-w-xs leading-relaxed" side="top" sideOffset={8}>{content.description}</TooltipContent></Tooltip> : null}</div><Badge className="mt-1" variant="secondary">{t(`rewards.types.${line.item.type}`)}</Badge></div><Button aria-label={t("rewards.remove")} onClick={() => removeItem(line.item.id)} size="icon-sm" variant="ghost"><Trash className="size-4" /></Button></div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"><Coin className="size-4" weight="fill" />{formatPoints(line.item.point_cost)}</span>
                      <div className="flex items-center rounded-md border"><Button disabled={line.quantity <= 1} onClick={() => setQuantity(line.item.id, line.quantity - 1)} size="icon-sm" variant="ghost"><Minus className="size-3" /></Button><span className="w-9 text-center text-sm tabular-nums">{line.quantity}</span><Button disabled={line.quantity >= Math.min(line.item.stock, line.item.limit_per_user ?? Number.MAX_SAFE_INTEGER)} onClick={() => setQuantity(line.item.id, line.quantity + 1)} size="icon-sm" variant="ghost"><Plus className="size-3" /></Button></div>
                    </div>
                  </div>
                </div>
                {line.item.type === "virtual" ? (
                  <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                    <div><Label htmlFor={`virtual-id-${line.item.id}`}>{content.idLabel || t("rewards.virtualId")} *</Label><Input className="mt-1" id={`virtual-id-${line.item.id}`} onChange={(event) => updateDetails(line.item.id, { virtualId: event.target.value })} placeholder={content.idPlaceholder || t("rewards.virtualIdPlaceholder")} value={line.virtualId} /></div>
                    <div><Label htmlFor={`remark-${line.item.id}`}>{t("rewards.remark")}</Label><Input className="mt-1" id={`remark-${line.item.id}`} onChange={(event) => updateDetails(line.item.id, { remark: event.target.value })} placeholder={t("rewards.virtualRemarkPlaceholder")} value={line.remark} /></div>
                  </div>
                ) : null}
              </Card>
            )
          })}

        </div>

        <Card className="sticky top-20">
          <CardHeader><CardTitle>{t("rewards.summary")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">{lines.map((line) => <div className="flex justify-between gap-4" key={line.item.id}><span className="truncate text-muted-foreground">{localizeRewardItem(line.item, i18n.language).name} × {line.quantity}</span><span>{formatPoints(line.item.point_cost * line.quantity)}</span></div>)}</div>
            <div className="border-t pt-3"><div className="flex items-center justify-between"><span className="font-medium">{t("rewards.total")}</span><span className="flex items-center gap-1 font-heading text-xl font-semibold"><Coin className="size-5 text-amber-500" weight="fill" />{formatPoints(total)}</span></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{t("rewards.balanceAfterShort")}</span><span>{formatPoints((balanceQuery.data?.balance ?? 0) - total)}</span></div></div>
            {hasPhysical ? (
              <div className="border-t pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium"><Truck className="size-4" />{t("rewards.shippingTitle")}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{shippingReady ? t("rewards.shippingComplete") : t("rewards.shippingIncomplete")}</p>
                  </div>
                  <Button onClick={() => { setShippingDraft(shipping); setShippingOpen(true) }} size="sm" variant="outline">{shippingReady ? t("rewards.editShipping") : t("rewards.fillShipping")}</Button>
                </div>
              </div>
            ) : null}
            {!enoughPoints || !virtualInfoReady || !shippingReady ? (
              <div className="rounded-r-sm border-l-2 border-destructive bg-destructive/10 px-2.5 py-1.5 text-destructive" role="alert">
                <div className="space-y-0.5 text-xs leading-4">
                  {!enoughPoints ? <p>{t("rewards.insufficientPoints")}</p> : null}
                  {!virtualInfoReady ? <p>{t("rewards.virtualIdRequired")}</p> : null}
                  {!shippingReady ? <p>{t("rewards.shippingRequired")}</p> : null}
                </div>
              </div>
            ) : null}
            <Button className="w-full" disabled={!canSubmit || redeemMutation.isPending} onClick={() => setConfirmOpen(true)}>{t("rewards.redeemNow")}</Button>
            <p className="text-xs leading-5 text-muted-foreground">{t("rewards.confirmNotice")}</p>
            {redeemMutation.error ? <MutationErrorAlert error={redeemMutation.error} /> : null}
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={setShippingOpen} open={shippingOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("rewards.shippingTitle")}</DialogTitle>
            <DialogDescription>{t("rewards.shippingDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!shippingDraftReady) return; setShipping(shippingDraft); setShippingOpen(false) }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="recipient">{t("rewards.recipient")} *</Label><Input className="mt-1" id="recipient" onChange={(event) => setShippingDraft((value) => ({ ...value, recipient: event.target.value }))} required value={shippingDraft.recipient} /></div>
              <div><Label htmlFor="contact">{t("rewards.contact")} *</Label><Input className="mt-1" id="contact" inputMode="tel" onChange={(event) => setShippingDraft((value) => ({ ...value, contact: event.target.value }))} required value={shippingDraft.contact} /></div>
              <div className="sm:col-span-2"><Label htmlFor="address">{t("rewards.address")} *</Label><Textarea className="mt-1" id="address" onChange={(event) => setShippingDraft((value) => ({ ...value, address: event.target.value }))} required value={shippingDraft.address} /></div>
              <div className="sm:col-span-2"><Label htmlFor="shipping-remark">{t("rewards.remark")}</Label><Input className="mt-1" id="shipping-remark" onChange={(event) => setShippingDraft((value) => ({ ...value, remark: event.target.value }))} placeholder={t("rewards.remarkPlaceholder")} value={shippingDraft.remark} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShippingOpen(false)} type="button" variant="outline">{t("rewards.cancel")}</Button>
              <Button disabled={!shippingDraftReady} type="submit">{t("rewards.saveShipping")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("rewards.confirmDialogTitle")}</AlertDialogTitle><AlertDialogDescription>{t("rewards.confirmDialogDescription", { count: lines.reduce((sum, line) => sum + line.quantity, 0), points: formatPoints(total) })}</AlertDialogDescription></AlertDialogHeader>
          <div className="rounded-lg bg-muted p-3 text-sm"><div className="flex justify-between"><span>{t("rewards.currentBalance")}</span><span>{formatPoints(balanceQuery.data?.balance ?? 0)}</span></div><div className="mt-2 flex justify-between font-semibold"><span>{t("rewards.balanceAfterShort")}</span><span>{formatPoints((balanceQuery.data?.balance ?? 0) - total)}</span></div></div>
          <AlertDialogFooter><AlertDialogCancel disabled={redeemMutation.isPending}>{t("rewards.checkAgain")}</AlertDialogCancel><AlertDialogAction disabled={redeemMutation.isPending} onClick={(event) => { event.preventDefault(); redeemMutation.mutate({ items: lines.map((line) => ({ rewardItemId: line.item.id, quantity: line.quantity, expectedUnitPoints: line.item.point_cost, virtualId: line.virtualId, remark: line.remark })), shipping: hasPhysical ? shipping : undefined }, { onSuccess: (order) => { toast.success(t("rewards.redeemSuccess", { order: order.order_no })); clear(); setConfirmOpen(false); navigate("/rewards?tab=orders") } }) }}>{redeemMutation.isPending ? t("rewards.redeeming") : t("rewards.confirmRedeem")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
