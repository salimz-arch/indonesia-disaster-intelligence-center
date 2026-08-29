"use client";

import { Activity, ArrowDownToLine, TrendingUp, Zap } from "lucide-react";

import { KpiCard } from "@/components/kpi/kpi-card";
import { useEarthquakeStats } from "@/hooks/use-earthquakes";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/severity";
import type { MagnitudeCategory } from "@/types/api";

const HOUR_LABEL: Record<number, string> = {
  24: "24 Jam",
  168: "7 Hari",
  720: "30 Hari",
};

const ORDER: MagnitudeCategory[] = [
  "low",
  "moderate",
  "significant",
  "strong",
  "major",
  "severe",
];

export function EarthquakeKpis({ hours }: { hours: number }) {
  const stats = useEarthquakeStats(hours);
  const s = stats.data?.data;

  const m5plus = s
    ? (s.distribution.strong ?? 0) +
      (s.distribution.major ?? 0) +
      (s.distribution.severe ?? 0)
    : null;

  const hourLabel = HOUR_LABEL[hours] ?? `${hours} Jam`;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {/* 1. Total gempa */}
        <KpiCard
          icon={Activity}
          label={`Gempa ${hourLabel}`}
          value={s?.total ?? null}
          loading={stats.isLoading}
          error={stats.isError ? "gagal memuat" : null}
          footer={
            <span className="text-[11px] text-slate-400">
              Seluruh magnitudo, Indonesia
            </span>
          }
        />

        {/* 2. M5+ */}
        <KpiCard
          icon={Zap}
          label="M5+"
          value={m5plus}
          accent="#F59E0B"
          loading={stats.isLoading}
          footer={
            <span className="text-[11px] text-slate-400">
              Berpotensi terasa / signifikan
            </span>
          }
        />

        {/* 3. Terbesar */}
        <KpiCard
          icon={TrendingUp}
          label="Terbesar"
          value={s?.max_magnitude?.magnitude ?? null}
          accent={
            s?.max_magnitude
              ? CATEGORY_COLOR[s.max_magnitude.category]
              : undefined
          }
          format={(v) => `M ${v.toFixed(1)}`}
          loading={stats.isLoading}
          footer={
            s?.max_magnitude ? (
              <span className="flex flex-col gap-0.5">
                <span className="line-clamp-1 text-[11px] text-slate-400">
                  {s.max_magnitude.location_text ?? "—"}
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{
                    color: CATEGORY_COLOR[s.max_magnitude.category],
                  }}
                >
                  Kategori: {CATEGORY_LABEL[s.max_magnitude.category]}
                </span>
              </span>
            ) : undefined
          }
        />

        {/* 4. Kedalaman rata-rata */}
        <KpiCard
          icon={ArrowDownToLine}
          label="Kedalaman"
          value={s?.avg_depth_km ?? null}
          unit="km"
          format={(v) => v.toFixed(0)}
          loading={stats.isLoading}
          footer={
            <span className="flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-400">
                Rata-rata hiposenter
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {s?.avg_depth_km !== null && s?.avg_depth_km !== undefined
                  ? s.avg_depth_km < 70
                    ? "Dangkal (<70 km)"
                    : s.avg_depth_km < 300
                      ? "Menengah (70–300 km)"
                      : "Dalam (>300 km)"
                  : ""}
              </span>
            </span>
          }
        />
      </div>

      {/* Distribusi magnitude */}
      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Magnitude Distribution
        </h2>
        {stats.isLoading ? (
          <div className="mt-4 space-y-2">
            {ORDER.map((k) => (
              <div
                key={k}
                className="h-8 animate-pulse rounded-lg bg-idic-border/40"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {ORDER.map((k) => {
              const count = s?.distribution?.[k] ?? 0;
              const max = Math.max(
                1,
                ...ORDER.map((x) => s?.distribution?.[x] ?? 0),
              );
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[11px] text-slate-400">
                    {CATEGORY_LABEL[k]}
                  </span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-idic-bg-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / max) * 100}%`,
                        backgroundColor: CATEGORY_COLOR[k],
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-slate-300">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-[10px] text-slate-400">
          Kategori magnitude = klasifikasi visual internal aplikasi, bukan
          klasifikasi resmi lembaga seismik.
        </p>
      </section>
    </>
  );
}
