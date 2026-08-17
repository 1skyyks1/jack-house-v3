import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  adjustPoints,
  createRewardItem,
  getPointBalance,
  getPointLedger,
  getRedemptionOrders,
  getRewardItems,
  redeemRewards,
  updateOrderItem,
  updateRewardItem,
  type RedeemRequest,
  type SaveRewardItemRequest,
} from "./rewardsApi"

export const rewardQueryKeys = {
  root: ["rewards"] as const,
  balance: ["rewards", "balance"] as const,
  items: ["rewards", "items"] as const,
  ledger: (page: number, admin = false) => ["rewards", admin ? "admin-ledger" : "ledger", page] as const,
  orders: (page: number, admin = false) => ["rewards", admin ? "admin-orders" : "orders", page] as const,
  adminItems: ["rewards", "admin-items"] as const,
}

export function usePointBalanceQuery(enabled = true) {
  return useQuery({ enabled, queryFn: getPointBalance, queryKey: rewardQueryKeys.balance, staleTime: 30_000 })
}

export function useRewardItemsQuery(admin = false) {
  return useQuery({ queryFn: () => getRewardItems(admin), queryKey: admin ? rewardQueryKeys.adminItems : rewardQueryKeys.items })
}

export function usePointLedgerQuery(page: number, admin = false) {
  return useQuery({ queryFn: () => getPointLedger(page, admin), queryKey: rewardQueryKeys.ledger(page, admin) })
}

export function useRedemptionOrdersQuery(page: number, admin = false) {
  return useQuery({ queryFn: () => getRedemptionOrders(page, admin), queryKey: rewardQueryKeys.orders(page, admin) })
}

export function useRedeemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: RedeemRequest) => redeemRewards(request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rewardQueryKeys.root }),
      ])
    },
  })
}

export function useSaveRewardItemMutation(id?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: SaveRewardItemRequest) => id ? updateRewardItem(id, request) : createRewardItem(request),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: rewardQueryKeys.root }),
  })
}

export function useAdjustPointsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adjustPoints,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: rewardQueryKeys.root }),
  })
}

export function useUpdateOrderItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateOrderItem,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: rewardQueryKeys.root }),
  })
}
