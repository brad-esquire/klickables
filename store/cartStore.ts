'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeAt: (index: number) => void
  updateQtyAt: (index: number, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) => {
        // Items with a customization or personalization always get their own line —
        // merging would collapse distinct buyer inputs (e.g. "BW" and "AB").
        const isUnique = !!incoming.customization || !!incoming.personalization
        const existingIndex = isUnique
          ? -1
          : get().items.findIndex(
              (i) => i.variantId === incoming.variantId && !i.customization && !i.personalization
            )
        if (existingIndex >= 0) {
          set((s) => ({
            items: s.items.map((i, idx) =>
              idx === existingIndex ? { ...i, quantity: i.quantity + incoming.quantity } : i
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, incoming] }))
        }
      },

      removeAt: (index) =>
        set((s) => ({ items: s.items.filter((_, i) => i !== index) })),

      updateQtyAt: (index, qty) => {
        if (qty <= 0) {
          get().removeAt(index)
          return
        }
        set((s) => ({
          items: s.items.map((it, i) => (i === index ? { ...it, quantity: qty } : it)),
        }))
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: 'klickables-cart' }
  )
)

// Returns true only after Zustand has finished reading from localStorage.
// Use this instead of a plain `mounted` check to avoid the hydration race
// where mounted becomes true before persist finishes loading stored items.
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (useCartStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])
  return hydrated
}
