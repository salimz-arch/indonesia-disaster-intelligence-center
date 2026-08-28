"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { AlertItem, ListData } from "@/types/api";

export function useActiveAlerts() {
  return useQuery({
    queryKey: ["alerts", "active"],
    queryFn: () => apiGet<ListData<AlertItem>>("/alerts"),
    refetchInterval: 60_000,
  });
}
export function useAlertHistory(limit = 50) {
  return useQuery({
    queryKey: ["alerts", "history", limit],
    queryFn: () =>
      apiGet<ListData<AlertItem>>(`/alerts/history?limit=${limit}`),
    refetchInterval: 60_000,
  });
}
