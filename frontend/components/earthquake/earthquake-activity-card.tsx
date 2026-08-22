"use client";

import { ArrowRight, Mountain } from "lucide-react";
import Link from "next/link";

import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/common/states";

import { MagnitudeBadge } from "@/components/earthquake/magnitude-badge";
import { useLatestEarthquakes } from "@/hooks/use-earthquakes";
import { formatDepth, formatTime, timeAgo } from "@/lib/format";
import type { Earthquake } from "@/types/api";

export function EarthquakeActivityCard() {
  const { data, isLoading, isError, error, refetch } = useLatestEarthquakes(8);

  return (
    <section className="min-w-0 w-full rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <h2 className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Mountain size={14} className="text-idic-cyan" aria-hidden />
          Earthquake Activity
        </h2>

        <Link
          href="/earthquake"
          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-idic-cyan hover:underline"
        >
          Lihat semua <ArrowRight size={12} aria-hidden />
        </Link>
      </div>

      {isLoading && <ListSkeleton rows={6} />}

      {isError && (
        <ErrorState
          message={
            error instanceof Error ? error.message : "Gagal memuat data gempa"
          }
          onRetry={() => refetch()}
        />
      )}

      {data && data.data.items.length === 0 && (
        <EmptyState
          title="Belum ada gempa tercatat"
          description="Collector memeriksa BMKG & USGS setiap 60 detik — data akan muncul otomatis."
        />
      )}

      {data && data.data.items.length > 0 && (
        <>
          <ul className="divide-y divide-idic-border/50">
            {data.data.items.map((eq) => (
              <EarthquakeRow key={eq.id} eq={eq} />
            ))}
          </ul>

          <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
            Kategori magnitude merupakan klasifikasi visual internal aplikasi,
            bukan klasifikasi resmi lembaga seismik.
          </p>
        </>
      )}
    </section>
  );
}

function EarthquakeRow({ eq }: { eq: Earthquake }) {
  return (
    <li className="flex min-w-0 items-center gap-3 py-2.5">
      <MagnitudeBadge magnitude={eq.magnitude} category={eq.category} />

      {eq.potential_tsunami && (
        <span className="shrink-0 rounded border border-idic-red/50 bg-idic-red/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-idic-red">
          TSUNAMI
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="wrap-break-word text-sm leading-snug line-clamp-2 sm:truncate sm:leading-normal">
          {eq.location_text ??
            `${eq.latitude.toFixed(2)}, ${eq.longitude.toFixed(2)}`}
        </div>

        <div className="wrap-break-word text-[11px] text-slate-500">
          {formatDepth(eq.depth_km)} · {formatTime(eq.event_time)}
        </div>
      </div>

      <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-500">
        {timeAgo(eq.event_time)}
      </span>
    </li>
  );
}
