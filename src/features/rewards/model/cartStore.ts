import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartLine, RewardItem } from "./types"

const CART_STORAGE_KEY = "jack-house-reward-cart"
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000

type CartStore = {
  lines: CartLine[]
  persistedAt: number
  addItem: (item: RewardItem) => void
  clear: () => void
  removeItem: (itemId: number) => void
  setQuantity: (itemId: number, quantity: number) => void
  syncItems: (items: RewardItem[]) => void
  updateDetails: (itemId: number, details: Partial<Pick<CartLine, "virtualId" | "remark">>) => void
}

export const useRewardCartStore = create<CartStore>()(persist((set) => ({
  lines: [],
  persistedAt: Date.now(),
  addItem: (item) => set((state) => {
    const existing = state.lines.find((line) => line.item.id === item.id)
    if (existing) {
      return {
        lines: state.lines.map((line) => line.item.id === item.id
          ? { ...line, item, quantity: Math.min(line.quantity + 1, item.stock, item.limit_per_user ?? Number.MAX_SAFE_INTEGER) }
          : line),
        persistedAt: Date.now(),
      }
    }
    return { lines: [...state.lines, { item, quantity: 1, virtualId: "", remark: "" }], persistedAt: Date.now() }
  }),
  clear: () => set({ lines: [], persistedAt: Date.now() }),
  removeItem: (itemId) => set((state) => ({ lines: state.lines.filter((line) => line.item.id !== itemId), persistedAt: Date.now() })),
  setQuantity: (itemId, quantity) => set((state) => ({
    lines: state.lines.map((line) => line.item.id === itemId
      ? { ...line, quantity: Math.max(1, Math.min(quantity, line.item.stock, line.item.limit_per_user ?? Number.MAX_SAFE_INTEGER)) }
      : line),
    persistedAt: Date.now(),
  })),
  syncItems: (items) => set((state) => {
    const currentItems = new Map(items.map((item) => [item.id, item]))
    return {
      lines: state.lines.flatMap((line) => {
        const item = currentItems.get(line.item.id)
        if (!item || item.stock <= 0) return []
        return [{
          ...line,
          item,
          quantity: Math.max(1, Math.min(line.quantity, item.stock, item.limit_per_user ?? Number.MAX_SAFE_INTEGER)),
        }]
      }),
    }
  }),
  updateDetails: (itemId, details) => set((state) => ({
    lines: state.lines.map((line) => line.item.id === itemId ? { ...line, ...details } : line),
  })),
}), {
  name: CART_STORAGE_KEY,
  partialize: (state) => ({
    lines: state.lines.map((line) => ({ ...line, virtualId: "", remark: "" })),
    persistedAt: state.persistedAt,
  }),
  merge: (persistedState, currentState) => {
    const saved = persistedState as Partial<CartStore>
    if (!saved.persistedAt || Date.now() - saved.persistedAt > CART_TTL_MS || !Array.isArray(saved.lines)) return currentState
    return {
      ...currentState,
      lines: saved.lines.map((line) => ({ ...line, virtualId: "", remark: "" })),
      persistedAt: saved.persistedAt,
    }
  },
}))
