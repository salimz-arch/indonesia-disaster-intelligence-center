"use client";

import {
  Cloud,
  Droplets,
  Gauge,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

import { SourceTag } from "@/components/common/source-tag";
import { EmptyState, ErrorState } from "@/components/common/states";
import { WeatherIcon, weatherColor } from "@/components/weather/weather-icon";
import { useLatestWeather, useLocations } from "@/hooks/use-weather";
import { windDirectionLabel } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function WeatherConditionCard() {
  const weather = useLatestWeather();
  const locations = useLocations();

  const locMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const loc of locations.data?.data.items ?? []) m.set(loc.id, loc.name);
    return m;
  }, [locations.data]);

  const primary = useMemo(() => {
    const items = weather.data?.data.items ?? [];
    return (
      items.find((w) => locMap.get(w.location_id) === "Jakarta") ??
      items[0] ??
      null
    );
  }, [weather.data, locMap]);

  const locationName = primary
    ? (locMap.get(primary.location_id) ?? null)
    : null;

  return (
    <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Current Weather
        </h2>
        {locationName && (
          <span className="rounded-full border border-idic-border bg-idic-bg-2 px-2.5 py-0.5 text-[11px] text-slate-300">
            {locationName}
          </span>
        )}
      </div>

      {weather.isLoading && <WeatherCardSkeleton />}

      {weather.isError && (
        <ErrorState
          message={
            weather.error instanceof Error
              ? weather.error.message
              : "Gagal memuat data cuaca"
          }
          onRetry={() => weather.refetch()}
        />
      )}

      {weather.data && !primary && (
        <EmptyState
          title="Belum ada observasi cuaca"
          description="Collector mengisi data setiap 10 menit — jalankan scripts/ingest_once.py di backend untuk mengisi sekarang."
        />
      )}

      {primary && (
        <>
          <div className="flex items-center gap-5">
            <WeatherIcon condition={primary.condition_code} size={56} />
            <div>
              <div className="font-mono text-4xl font-semibold tabular-nums">
                {primary.temperature_c.toFixed(1)}°
              </div>
              <div
                className="mt-1 text-sm font-medium"
                style={{ color: weatherColor(primary.condition_code) }}
              >
                {primary.condition_text}
              </div>
              {primary.feels_like_c !== null && (
                <div className="mt-0.5 text-xs text-slate-500">
                  Feels like {primary.feels_like_c.toFixed(1)}°C
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric
              icon={Droplets}
              label="Humidity"
              value={`${primary.humidity_pct.toFixed(0)}%`}
            />
            <Metric
              icon={Wind}
              label="Wind"
              value={`${primary.wind_speed_kmh.toFixed(0)} km/h ${windDirectionLabel(primary.wind_direction_deg)}`}
            />
            <Metric
              icon={Gauge}
              label="Pressure"
              value={`${primary.pressure_hpa.toFixed(0)} hPa`}
            />
            <Metric
              icon={Cloud}
              label="Cloud"
              value={
                primary.cloud_cover_pct !== null
                  ? `${primary.cloud_cover_pct.toFixed(0)}%`
                  : "—"
              }
            />
            <Metric
              icon={Sun}
              label="UV Index"
              value={
                primary.uv_index !== null ? primary.uv_index.toFixed(1) : "—"
              }
            />
            <Metric
              icon={Droplets}
              label="Precip"
              value={`${primary.precipitation_mm.toFixed(1)} mm`}
            />
          </div>

          <div className="mt-4">
            <SourceTag
              source={primary.source}
              timestamp={primary.observed_at}
            />
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon size={12} aria-hidden />
        {label}
      </div>
      <div className="mt-1 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}

function WeatherCardSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-5">
        <Skeleton className="h-14 w-14 rounded-xl bg-idic-border/60" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-24 bg-idic-border/60" />
          <Skeleton className="h-4 w-20 bg-idic-border/60" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 bg-idic-border/60" />
        ))}
      </div>
    </div>
  );
}
