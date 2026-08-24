"use client";

import { EarthquakeMapInner } from "@/components/map/earthquake-map-inner";

/**
 * Wrapper tanpa next/dynamic — import statis penuh.
 * SSR-safe: maplibre-gl hanya di-import di dalam useEffect (browser only).
 * MapLibre gagal load → inner menampilkan error card, bukan blank.
 */
export function EarthquakeMap({
  variant = "full",
}: {
  variant?: "compact" | "full";
}) {
  return <EarthquakeMapInner variant={variant} />;
}
