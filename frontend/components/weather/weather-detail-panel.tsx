"use client";

import {
  Cloud,
  Droplets,
  Gauge,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { SourceTag } from "@/components/common/source-tag";
import { WeatherAnimation } from "@/components/weather/weather-animation";
import { WeatherIcon, weatherColor } from "@/components/weather/weather-icon";
import { windDirectionLabel } from "@/lib/format";
import type { WeatherObservation } from "@/types/api";

export function WeatherDetailPanel({
  weather,
  locationName,
}: {
  weather: WeatherObservation;
  locationName: string;
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border border-idic-border bg-idic-card p-5">
      <WeatherAnimation
        condition={weather.condition_code}
        windSpeed={weather.wind_speed_kmh}
      />

      <div className="relative z-[1]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Current Weather
          </h2>
          <span className="min-w-0 shrink-0 truncate rounded-full border border-idic-border bg-idic-bg-2 px-2.5 py-0.5 text-[11px] text-slate-300">
            {locationName}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <WeatherIcon condition={weather.condition_code} size={56} />
          <div className="min-w-0">
            <div className="font-mono text-4xl font-semibold tabular-nums">
              {weather.temperature_c.toFixed(1)}°
            </div>
            <div
              className="mt-1 break-words text-sm font-medium"
              style={{ color: weatherColor(weather.condition_code) }}
            >
              {weather.condition_text}
            </div>
            {weather.feels_like_c !== null && (
              <div className="mt-0.5 text-xs text-slate-500">
                Feels like {weather.feels_like_c.toFixed(1)}°C
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Metric
            icon={Droplets}
            label="Humidity"
            value={`${weather.humidity_pct.toFixed(0)}%`}
          />
          <Metric
            icon={Wind}
            label="Wind"
            value={`${weather.wind_speed_kmh.toFixed(0)} km/h ${windDirectionLabel(weather.wind_direction_deg)}`}
          />
          <Metric
            icon={Gauge}
            label="Pressure"
            value={`${weather.pressure_hpa.toFixed(0)} hPa`}
          />
          <Metric
            icon={Cloud}
            label="Cloud"
            value={
              weather.cloud_cover_pct !== null
                ? `${weather.cloud_cover_pct.toFixed(0)}%`
                : "—"
            }
          />
          <Metric
            icon={Sun}
            label="UV Index"
            value={
              weather.uv_index !== null ? weather.uv_index.toFixed(1) : "—"
            }
          />
          <Metric
            icon={Droplets}
            label="Precip"
            value={`${weather.precipitation_mm.toFixed(1)} mm`}
          />
        </div>

        <div className="mt-4 min-w-0">
          <SourceTag source={weather.source} timestamp={weather.observed_at} />
        </div>
      </div>
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
    <div className="min-w-0 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon size={12} className="shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div className="mt-1 break-words font-mono text-sm tabular-nums">
        {value}
      </div>
    </div>
  );
}
