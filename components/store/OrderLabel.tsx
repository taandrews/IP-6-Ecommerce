"use client";

import { useGeo } from "@/components/store/Geo";

/**
 * Label for the site's order buttons. Where we don't sell yet the buttons
 * still lead to the products, but don't ask the visitor to pre-order.
 */
export function OrderLabel() {
  const { sellable } = useGeo();
  return <>{sellable ? "Pre Order Now" : "Explore IP6 Original"}</>;
}
