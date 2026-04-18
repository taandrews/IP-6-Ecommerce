"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine } from "@/types";

interface CartState {
  lines: CartLine[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (line: CartLine) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      drawerOpen: false,
      count: 0,
      subtotalCents: 0,
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      add: (line) => {
        const existing = get().lines.find(
          (l) => l.variantId === line.variantId && !!l.subscription === !!line.subscription,
        );
        const lines = existing
          ? get().lines.map((l) =>
              l === existing ? { ...l, qty: l.qty + line.qty } : l,
            )
          : [...get().lines, line];
        set({
          lines,
          drawerOpen: true,
          ...derive(lines),
        });
      },
      remove: (variantId) => {
        const lines = get().lines.filter((l) => l.variantId !== variantId);
        set({ lines, ...derive(lines) });
      },
      setQty: (variantId, qty) => {
        const next = Math.max(1, qty);
        const lines = get().lines.map((l) => (l.variantId === variantId ? { ...l, qty: next } : l));
        set({ lines, ...derive(lines) });
      },
      clear: () => set({ lines: [], count: 0, subtotalCents: 0 }),
    }),
    {
      name: "ip6-cart-v1",
      storage: createJSONStorage(() => (typeof window === "undefined" ? dummyStorage : localStorage)),
      partialize: (s) => ({ lines: s.lines }),
      onRehydrateStorage: () => (state) => {
        if (state) Object.assign(state, derive(state.lines));
      },
    },
  ),
);

function derive(lines: CartLine[]) {
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotalCents = lines.reduce((s, l) => {
    const discount = l.subscription ? l.subscription.discountPct / 100 : 0;
    return s + Math.round(l.unitPriceCents * l.qty * (1 - discount));
  }, 0);
  return { count, subtotalCents };
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
