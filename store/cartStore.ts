'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQty: (variantId: string, qty: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) => {
        const existing = get().items.find((i) => i.variantId === incoming.variantId)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.variantId === incoming.variantId
                ? { ...i, quantity: i.quantity + incoming.quantity }
                : i
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, incoming] }))
        }
      },

      removeItem: (variantId) =>
        set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),

      updateQty: (variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(variantId)
          return
        }
        set((s) => ({
          items: s.items.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i)),
        }))
      },

      clearCart: () => set({ items: [] }),

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    { name: 'klickables-cart' }
  )
)
