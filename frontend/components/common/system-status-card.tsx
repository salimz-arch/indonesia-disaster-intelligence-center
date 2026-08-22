"use client";

import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";

import { ErrorState } from "@/components/common/states";
import { apiGet } from "@/lib/api-client";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { DataSourceItem, ListData, SourceStatus } from "@/types/api";

const STATUS_STYLE: Record<SourceStatus, { label: string; color: string }> = {
  online: { label: "CONNECTED", color: "#22C55E" },
  degraded: { label: "DEGRADED", color: "#F59E0B" },
  offline: { label: "OFFLINE", color: "#EF4444" },
  unknown: { label: "STANDBY", color: "#64748B" },
};

function SourceStatusDot({ status }: { status: SourceStatus }) {
  const cfg = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold"
      style={{ color: cfg.color }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

export function SystemStatusCard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiGet<ListData<DataSourceItem>>("/sources"),
    refetchInterval: 60_000,
  });

  return (
    <section className="min-w-0 w-full rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
        <h2 className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Database size={14} aria-hidden /> Data Sources
        </h2>
        {data && (
          <span className="shrink-0 text-[11px] text-slate-500">
            {data.data.items.filter((s) => s.status === "online").length}/
            {data.data.items.length} online
          </span>
        )}
      </div>

      {isError && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Gagal memuat status sumber data"
          }
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-idic-border/40"
            />
          ))}
        </div>
      )}

      {data && (
        <ul className="divide-y divide-idic-border/50">
          {data.data.items.map((s) => (
            // Mobile: stack vertikal (nama atas, status bawah rata kanan).
            // sm+: baris horizontal — identik layout desktop sebelumnya.
            <li
              key={s.id}
              className="flex min-w-0 flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm">{s.name}</div>
                <div className="text-[11px] capitalize text-slate-500">
                  {s.category}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <SourceStatusDot status={s.status} />
                  <div className="whitespace-nowrap text-[11px] text-slate-500">
                    {s.latency_ms !== null ? `${s.latency_ms} ms` : "—"}
                  </div>
                </div>
                {/* w-40 fixed width hanya ≥sm — di mobile tersembunyi, tidak bisa mendorong lebar */}
                <div className="hidden w-40 text-right text-[11px] text-slate-500 sm:block">
                  {s.last_success_at ? (
                    <span title={formatDateTime(s.last_success_at)}>
                      {timeAgo(s.last_success_at)}
                    </span>
                  ) : (
                    "belum ada data"
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
