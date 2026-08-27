"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import { useRealtimeStore } from "@/stores/realtime-store";
import type { HealthData } from "@/types/api";

export type SystemStatus =
  | "connecting"
  | "live"
  | "degraded"
  | "reconnecting"
  | "offline";

/**
 * Status header = SSE (koneksi realtime) + /health (kesehatan infra).
 * Prioritas: reconnecting > offline > degraded > live > connecting.
 * SSE dimiliki use-realtime; hook ini hanya membaca store.
 */
export function useSystemStatus() {
  const connection = useRealtimeStore((s) => s.connection);

  const query = useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthData>("/health"),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  const health = query.data?.data;

  let status: SystemStatus;
  if (connection === "reconnecting") {
    status = "reconnecting";
  } else if (query.isError) {
    status = "offline";
  } else if (
    health &&
    (health.components.database !== "ok" || health.components.cache !== "ok")
  ) {
    status = "degraded";
  } else if (connection === "live") {
    status = "live";
  } else {
    status = "connecting";
  }

  return { status, health };
}
