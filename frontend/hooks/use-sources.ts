"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { DataSourceItem, ListData } from "@/types/api";

export function useSources() {
  return useQuery({
    queryKey: ["sources"], // key sama dgn SystemStatusCard → otomatis dedup
    queryFn: () => apiGet<ListData<DataSourceItem>>("/sources"),
    refetchInterval: 60_000,
  });
}
