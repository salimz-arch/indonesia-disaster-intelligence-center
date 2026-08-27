"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { ListData, RainfallObservation } from "@/types/api";

export function useRainfallList() {
  return useQuery({
    queryKey: ["rainfall", "latest"],
    queryFn: () => apiGet<ListData<RainfallObservation>>("/rainfall"),
    refetchInterval: 5 * 60_000,
  });
}

export function useRainfallHistory(locationId: number | null, hours: number) {
  return useQuery({
    queryKey: ["rainfall", "history", locationId, hours],
    queryFn: () =>
      apiGet<ListData<RainfallObservation>>(
        `/rainfall/history?location_id=${locationId}&hours=${hours}`,
      ),
    enabled: locationId !== null,
    refetchInterval: 60_000,
  });
}
