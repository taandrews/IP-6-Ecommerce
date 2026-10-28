"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine } from "@/types";
import { lineTotalCents } from "@/lib/preorder";

interface CartState {
  lines: CartLine[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Adds a line. The drawer opens unless openDrawer is false (add and keep shopping). */
  add: (line: CartLine, opts?: { openDrawer?: boolean }) => void;
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
      add: (line, opts) => {
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
          drawerOpen: opts?.openDrawer ?? true,
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
      // localStorage is read synchronously, so without this the first client render already has
      // the saved lines while the server rendered an empty cart: a hydration mismatch in the
      // drawer and the nav badge. CartDrawer rehydrates after mount instead.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // The retired 60-count option must not return from a saved cart.
          state.lines = state.lines.filter((line) => line.variantId !== "sup-capsule-60");
          Object.assign(state, derive(state.lines));
        }
      },
    },
  ),
);

function derive(lines: CartLine[]) {
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotalCents = lines.reduce((s, l) => s + lineTotalCents(l), 0);
  return { count, subtotalCents };
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
