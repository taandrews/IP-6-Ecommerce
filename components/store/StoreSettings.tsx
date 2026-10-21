"use client";

import { createContext, useContext } from "react";
import { DEFAULT_PREORDER } from "@/lib/preorder";
import type { PreorderSettings } from "@/types/records";

const PreorderContext = createContext<PreorderSettings>(DEFAULT_PREORDER);

/** Fed by the root layout from the admin-managed settings. */
export function StoreSettingsProvider({ preorder, children }: { preorder: PreorderSettings; children: React.ReactNode }) {
  return <PreorderContext.Provider value={preorder}>{children}</PreorderContext.Provider>;
}

export function usePreorder() {
  return useContext(PreorderContext);
}
