"use client";

import { useMemo } from "react";

import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/common/states";
import { INTENSITY_COLOR } from "@/lib/severity"; // ✅ DIPINDAH DARI rainfall-client
import { rainfallIntensityClient } from "@/lib/rainfall-client";
import type { RainfallObservation } from "@/types/api";

interface Bucket {
  label: string; // "HH:00" WIB
  value: number; // mm/jam — observasi terakhir dalam bucket
}

/** Chart tren hujan — CSS bars per jam (ECharts penuh menyusul di Step 14). */
export function RainfallHistoryChart({
  items,
  loading,
  error,
  errorMessage,
  onRetry,
  hours,
  locationName,
}: {
  items: RainfallObservation[];
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hours: number;
  locationName: string;
}) {
  const buckets = useMemo<Bucket[]>(() => {
    // Observasi ascending → bucket per jam WIB, ambil nilai terakhir per bucket
    const map = new Map<string, Bucket>();
    for (const o of items) {
      const d = new Date(o.observed_at);
      const hh = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        hour12: false,
      }).format(d);
      const day = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
      }).format(d);
      const key = `${day} ${hh}`;
      map.set(key, { label: `${hh}:00`, value: o.rainfall_1h_mm });
    }
    return [...map.values()];
  }, [items]);

  const max = Math.max(0.1, ...buckets.map((b) => b.value));
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 6));

  return (
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Tren {hours} Jam
        </h2>
        {buckets.length > 0 && (
          <span className="text-[11px] text-slate-500">
            {locationName} · maks {max.toFixed(1)} mm/jam
          </span>
        )}
      </div>

      {error && (
        <ErrorState
          message={errorMessage ?? "Gagal memuat history hujan"}
          onRetry={onRetry}
        />
      )}
      {loading && <ListSkeleton rows={3} />}
      {!error && !loading && buckets.length === 0 && (
        <EmptyState
          title="Belum ada data history"
          description="Collector merekam observasi setiap 10 menit — data tren terbentuk seiring waktu."
        />
      )}

      {!error && !loading && buckets.length > 0 && (
        <>
          <div className="flex h-36 items-end gap-[3px]">
            {buckets.map((b, i) => {
              const intensity = rainfallIntensityClient(b.value);
              const hPct = Math.max(2, (b.value / max) * 100);
              return (
                <div
                  key={i}
                  className="min-w-0 flex-1 rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${hPct}%`,
                    backgroundColor: INTENSITY_COLOR[intensity],
                  }}
                  title={`${b.label} WIB — ${b.value.toFixed(1)} mm (${intensity})`}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-[3px]">
            {buckets.map((_, i) => (
              <div
                key={i}
                className="min-w-0 flex-1 text-center text-[9px] tabular-nums text-slate-600"
              >
                {i % labelEvery === 0 ? buckets[i].label : ""}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-600">
            Tinggi bar = curah per jam (mm). Warna mengikuti klasifikasi
            intensitas internal. Waktu dalam WIB.
          </p>
        </>
      )}
    </section>
  );
}
