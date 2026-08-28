"use client";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Siren,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  ConditionDonutChart,
  DepthDistributionChart,
  EarthquakeTimelineChart,
  HourlyChart,
  MagnitudeDistributionChart,
  RainfallTrendChart,
  TemperatureTrendChart,
} from "@/components/analytics/analytics-charts";
import { Disclaimer } from "@/components/common/disclaimer";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/kpi/kpi-card";
import {
  useAnalyticsEarthquakes,
  useAnalyticsRainfall,
  useAnalyticsWeather,
} from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";

const DAY_OPTIONS = [7, 30, 90];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const eq = useAnalyticsEarthquakes(days);
  const rain = useAnalyticsRainfall(days);
  const wx = useAnalyticsWeather(days);
  const s = eq.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Analytics"
          description="Analisis historis gempa, curah hujan, dan cuaca — agregat harian (WIB)"
        />
        <div
          role="group"
          aria-label="Rentang waktu"
          className="flex overflow-hidden rounded-lg border border-idic-border"
        >
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold transition-colors",
                days === d
                  ? "bg-idic-cyan/15 text-idic-cyan"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              {d} Hari
            </button>
          ))}
        </div>
      </div>

      {s && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            icon={Activity}
            label={`Total Gempa ${days}H`}
            value={s.summary.total}
            footer={
              <span className="text-[11px] text-slate-500">
                semua magnitudo
              </span>
            }
          />
          <KpiCard
            icon={TrendingUp}
            label="Rata-rata / Hari"
            value={s.summary.avg_per_day}
            format={(v) => v.toFixed(1)}
            accent="#38BDF8"
            footer={
              <span className="text-[11px] text-slate-500">
                gempa per hari ({s.summary.total} total ÷ {days} hari)
              </span>
            }
          />
          <KpiCard
            icon={Zap}
            label="Terbesar"
            value={s.summary.max_magnitude}
            format={(v) => `M ${v.toFixed(1)}`}
            accent="#F59E0B"
            footer={
              s.summary.max_magnitude_location && (
                <span className="line-clamp-1 text-[11px] text-slate-500">
                  {s.summary.max_magnitude_location}
                </span>
              )
            }
          />
          <KpiCard
            icon={CalendarDays}
            label="Hari Teraktif"
            value={s.summary.most_active_day_count}
            accent="#F97316"
            footer={
              s.summary.most_active_day && (
                <span className="text-[11px] text-slate-500">
                  {s.summary.most_active_day}
                </span>
              )
            }
          />
        </div>
      )}

      <ChartCard
        title="Earthquake Activity"
        subtitle={`Jumlah event & magnitudo maks per hari — ${days} hari`}
      >
        {eq.isLoading && <ChartSkeleton />}
        {eq.isError && (
          <ErrorState
            message={
              eq.error instanceof Error ? eq.error.message : "Gagal memuat"
            }
            onRetry={() => eq.refetch()}
          />
        )}
        {s && <EarthquakeTimelineChart data={s} />}
        {eq.data && !s?.timeline.length && (
          <EmptyState title="Belum ada data gempa pada rentang ini" />
        )}
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Magnitude Distribution"
          subtitle="Kategori visual internal"
        >
          {s ? <MagnitudeDistributionChart data={s} /> : <ChartSkeleton />}
        </ChartCard>
        <ChartCard title="Depth Distribution" subtitle="Kedalaman hiposenter">
          {s ? <DepthDistributionChart data={s} /> : <ChartSkeleton />}
        </ChartCard>
        <ChartCard title="Aktivitas per Jam" subtitle="WIB — jam kejadian">
          {s ? <HourlyChart data={s} /> : <ChartSkeleton />}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Rainfall Trend"
          subtitle="Puncak intensitas harian (mm/jam)"
        >
          {rain.isLoading && <ChartSkeleton />}
          {rain.isError && (
            <ErrorState
              message={
                rain.error instanceof Error
                  ? rain.error.message
                  : "Gagal memuat"
              }
              onRetry={() => rain.refetch()}
            />
          )}
          {rain.data &&
            (rain.data.data.timeline.length > 0 ? (
              <RainfallTrendChart data={rain.data.data} />
            ) : (
              <EmptyState title="Belum ada data hujan pada rentang ini" />
            ))}
        </ChartCard>
        <ChartCard
          title="Temperature Trend"
          subtitle="Rata-rata / min / max harian — 16 kota"
        >
          {wx.isLoading && <ChartSkeleton />}
          {wx.isError && (
            <ErrorState
              message={
                wx.error instanceof Error ? wx.error.message : "Gagal memuat"
              }
              onRetry={() => wx.refetch()}
            />
          )}
          {wx.data &&
            (wx.data.data.timeline.length > 0 ? (
              <TemperatureTrendChart data={wx.data.data} />
            ) : (
              <EmptyState title="Belum ada data suhu pada rentang ini" />
            ))}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Weather Conditions"
          subtitle="Distribusi kondisi (semua observasi)"
        >
          {wx.data &&
            (Object.keys(wx.data.data.condition_counts).length > 0 ? (
              <ConditionDonutChart data={wx.data.data} />
            ) : (
              <EmptyState title="Belum ada data kondisi cuaca" />
            ))}
        </ChartCard>
        <ChartCard
          title="Disaster Events"
          subtitle="Distribusi event bencana non-seismik"
        >
          <EmptyState
            title="Belum ada provider event bencana aktif"
            description="Modul flood/landslide/forest-fire menunggu sumber data resmi yang tersedia. Kami tidak menampilkan data tiruan."
          />
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-idic-border/60 bg-idic-bg-2/50 p-3">
            <Siren size={16} className="shrink-0 text-slate-500" aria-hidden />
            <p className="text-[11px] leading-relaxed text-slate-500">
              Data gempa berasal dari BMKG/USGS; cuaca & hujan dari Open-Meteo.
              Event bencana lain membutuhkan feed resmi yang belum tersedia
              publik.
            </p>
          </div>
        </ChartCard>
      </div>
      <Disclaimer />
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <BarChart3 size={14} className="text-idic-cyan" aria-hidden /> {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ChartSkeleton() {
  return <div className="h-[240px] animate-pulse rounded-xl bg-idic-bg-2/60" />;
}
