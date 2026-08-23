"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { RadarData } from "@/types/api";

/** Frames radar RainViewer — hanya fetch saat radar diaktifkan (enabled). */
export function useRadar(enabled: boolean) {
  return useQuery({
    queryKey: ["radar", "frames"],
    queryFn: () => apiGet<RadarData>("/radar"),
    enabled,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000, // RainViewer memperbarui frame ±tiap 10 menit
    retry: 1,
  });
}
