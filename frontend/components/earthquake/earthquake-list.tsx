"use client";

import { ChevronLeft, ChevronRight, Activity } from "lucide-react";

import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/common/states";
import { MagnitudeBadge } from "@/components/earthquake/magnitude-badge";
import { formatDepth, formatTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Earthquake } from "@/types/api";

export function EarthquakeList({
  items,
  loading,
  isFetching,
  error,
  errorMessage,
  onRetry,
  selectedId,
  onSelect,
  page,
  totalPages,
  onPageChange,
}: {
  items: Earthquake[];
  loading: boolean;
  isFetching: boolean;
  error: boolean;
  errorMessage?: string;
  onRetry: () => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Activity size={14} className="text-idic-cyan" aria-hidden />
          Event List
          {isFetching && !loading && (
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-idic-cyan"
              aria-label="memuat"
            />
          )}
        </h2>
      </div>

      {error && (
        <ErrorState
          message={errorMessage ?? "Gagal memuat data gempa"}
          onRetry={onRetry}
        />
      )}

      {loading && <ListSkeleton rows={8} />}

      {!error && !loading && items.length === 0 && (
        <EmptyState
          title="Tidak ada gempa pada filter ini"
          description="Coba perlebar rentang waktu atau turunkan batas magnitudo."
        />
      )}

      {!error && !loading && items.length > 0 && (
        <ul className="space-y-1">
          {items.map((eq) => (
            <Row
              key={eq.id}
              eq={eq}
              active={eq.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      {!error && !loading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-idic-border/50 pt-3">
          <PagerButton
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            label="Halaman sebelumnya"
          >
            <ChevronLeft size={14} aria-hidden />
          </PagerButton>
          <span className="text-xs text-slate-500">
            Halaman {page} / {totalPages}
          </span>
          <PagerButton
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            label="Halaman berikutnya"
          >
            <ChevronRight size={14} aria-hidden />
          </PagerButton>
        </div>
      )}
    </section>
  );
}

function PagerButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-idic-border text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Row({
  eq,
  active,
  onSelect,
}: {
  eq: Earthquake;
  active: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(eq.id)}
        aria-pressed={active}
        className={cn(
          "flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
          active
            ? "bg-idic-cyan/10 ring-1 ring-idic-cyan/40"
            : "hover:bg-white/5",
        )}
      >
        <MagnitudeBadge magnitude={eq.magnitude} category={eq.category} />
        {eq.potential_tsunami && (
          <span className="shrink-0 rounded border border-idic-red/50 bg-idic-red/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-idic-red">
            TSUNAMI
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm leading-snug">
            {eq.location_text ??
              `${eq.latitude.toFixed(2)}, ${eq.longitude.toFixed(2)}`}
          </div>
          <div className="truncate text-[11px] text-slate-500">
            {formatDepth(eq.depth_km)} · {formatTime(eq.event_time)} ·{" "}
            {eq.provider}
          </div>
        </div>
        <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-500">
          {timeAgo(eq.event_time)}
        </span>
      </button>
    </li>
  );
}
