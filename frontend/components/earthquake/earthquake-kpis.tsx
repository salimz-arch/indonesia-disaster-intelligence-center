"use client";

import { Activity, ArrowDownToLine, TrendingUp, Zap } from "lucide-react";

import { CardSkeleton } from "@/components/common/states";
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
        <KpiCard
          icon={Activity}
          label={`Gempa ${hourLabel}`}
          value={s?.total ?? null}
          loading={stats.isLoading}
          error={stats.isError ? "gagal memuat" : null}
        />
        <KpiCard
          icon={Zap}
          label="M5+"
          value={m5plus}
          accent="#F59E0B"
          loading={stats.isLoading}
          footer={
            <span className="text-[11px] text-slate-500">
              Signifikan ke atas
            </span>
          }
        />
        <KpiCard
          icon={TrendingUp}
          label="Terbesar"
          value={s?.max_magnitude?.magnitude ?? null}
          accent={
            s?.max_magnitude
              ? CATEGORY_COLOR[s.max_magnitude.category]
              : undefined
          }
          format={(v) => v.toFixed(1)}
          loading={stats.isLoading}
          footer={
            s?.max_magnitude?.location_text && (
              <span className="line-clamp-1 text-[11px] text-slate-500">
                {s.max_magnitude.location_text}
              </span>
            )
          }
        />
        <KpiCard
          icon={ArrowDownToLine}
          label="Kedalaman"
          value={s?.avg_depth_km ?? null}
          unit="km"
          format={(v) => v.toFixed(0)}
          loading={stats.isLoading}
          footer={<span className="text-[11px] text-slate-500">rata-rata</span>}
        />
      </div>

      {/* Distribusi magnitude — CSS bars (ECharts masuk Step 14) */}
      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Magnitude Distribution
        </h2>
        {stats.isLoading ? (
          <div className="mt-4 space-y-2">
            {ORDER.map((k) => (
              <CardSkeleton key={k} />
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
                  <span className="w-24 shrink-0 text-[11px] text-slate-500">
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
        <p className="mt-3 text-[10px] text-slate-600">
          Kategori magnitude = klasifikasi visual internal aplikasi, bukan
          klasifikasi resmi lembaga seismik.
        </p>
      </section>
    </>
  );
}
