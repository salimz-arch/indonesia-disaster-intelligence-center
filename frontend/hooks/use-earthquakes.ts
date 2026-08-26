"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { Earthquake, EarthquakeStats, ListData } from "@/types/api";

export function useLatestEarthquakes(limit = 20) {
  return useQuery({
    queryKey: ["earthquakes", "latest", limit],
    queryFn: () =>
      apiGet<ListData<Earthquake>>(`/earthquakes/latest?limit=${limit}`),
    refetchInterval: 60_000,
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
    select: (result) => result.data.total,
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

export interface EarthquakePageParams {
  hours: number;
  minMagnitude: number; // 0 = semua
  page: number;
  pageSize?: number;
}

/** Pagination server-side — keepPreviousData agar pindah halaman tanpa flash skeleton. */
export function useEarthquakePage({
  hours,
  minMagnitude,
  page,
  pageSize = 20,
}: EarthquakePageParams) {
  const params = new URLSearchParams({
    hours: String(hours),
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (minMagnitude > 0) {
    params.set("min_magnitude", String(minMagnitude));
  }
  return useQuery({
    queryKey: ["earthquakes", "page", hours, minMagnitude, page, pageSize],
    queryFn: () =>
      apiGet<ListData<Earthquake>>(`/earthquakes?${params.toString()}`),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useEarthquakeStats(hours: number) {
  return useQuery({
    queryKey: ["earthquakes", "stats", hours],
    queryFn: () => apiGet<EarthquakeStats>(`/earthquakes/stats?hours=${hours}`),
    refetchInterval: 60_000,
  });
}
