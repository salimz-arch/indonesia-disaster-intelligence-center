"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { apiGet } from "@/lib/api-client";
import { useRealtimeStore } from "@/stores/realtime-store";
import type { HealthData } from "@/types/api";

export type SystemStatus = "connecting" | "live" | "degraded" | "offline";

/** Derive status header dari /health polling (Step 12: digantikan SSE heartbeat). */
export function useSystemStatus() {
  const setConnection = useRealtimeStore((s) => s.setConnection);

  const query = useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthData>("/health"),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  const health = query.data?.data;
  const status: SystemStatus = query.isError
    ? "offline"
    : health
      ? health.components.database === "ok" && health.components.cache === "ok"
        ? "live"
        : "degraded"
      : "connecting";

  useEffect(() => {
    setConnection(status);
  }, [status, setConnection]);

  return { status, health };
}
