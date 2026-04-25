'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQty: (variantId: string, qty: number) => void
  clearCart: () => void
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
