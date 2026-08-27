"use client";

import { useRealtime } from "@/hooks/use-realtime";

/** Satu koneksi SSE untuk seluruh dashboard. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtime();
  return <>{children}</>;
}
