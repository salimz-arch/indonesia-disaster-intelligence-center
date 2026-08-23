"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { Earthquake, ListData } from "@/types/api";

export function useLatestEarthquakes(limit = 20) {
  return useQuery({
    queryKey: ["earthquakes", "latest", limit],
    queryFn: () =>
      apiGet<ListData<Earthquake>>(`/earthquakes/latest?limit=${limit}`),
    refetchInterval: 60_000, // seirama siklus collector BMKG
  });
}

export function useEarthquakeCount(hours = 24, minMagnitude?: number) {
  const params = new URLSearchParams({ hours: String(hours), limit: "1" });
  if (minMagnitude !== undefined) {
    params.set("min_magnitude", String(minMagnitude));
  }
  return useQuery({
    queryKey: ["earthquakes", "count", hours, minMagnitude ?? null],
    queryFn: () =>
      apiGet<ListData<Earthquake>>(`/earthquakes?${params.toString()}`),
    refetchInterval: 60_000,
    select: (result) => result.data.total, // hanya butuh angka total
  });
}

/** Query peta: filter waktu + limit besar (marker penuh di viewport). */
export function useEarthquakes(hours: number, limit = 200) {
  return useQuery({
    queryKey: ["earthquakes", "query", hours, limit],
    queryFn: () =>
      apiGet<ListData<Earthquake>>(
        `/earthquakes?hours=${hours}&limit=${limit}`,
      ),
    refetchInterval: 60_000,
  });
}
