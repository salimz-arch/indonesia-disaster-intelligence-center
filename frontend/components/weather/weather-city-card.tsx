"use client";

import { motion } from "framer-motion";

import { SourceTag } from "@/components/common/source-tag";
import { WeatherAnimation } from "@/components/weather/weather-animation";
import { WeatherIcon, weatherColor } from "@/components/weather/weather-icon";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WeatherObservation } from "@/types/api";

export function WeatherCityCard({
  weather,
  locationName,
  active,
  onSelect,
  badge,
}: {
  weather: WeatherObservation;
  locationName: string;
  active?: boolean;
  onSelect?: () => void;
  badge?: { label: string; color: string } | null;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-idic-cyan/50 bg-idic-card ring-1 ring-idic-cyan/30"
          : "border-idic-border bg-idic-card hover:border-idic-cyan/30",
      )}
    >
      {/* Animasi cuaca — HANYA latar dekoratif bawah kartu, tidak menimpa konten atas */}
      <WeatherAnimation
        condition={weather.condition_code}
        windSpeed={weather.wind_speed_kmh}
      />

      <div className="relative z-[1]">
        {/* Baris 1: badge (jika ada) — terpisah, tidak menimpa apapun */}
        {badge && (
          <div className="mb-2">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide"
              style={{
                color: badge.color,
                backgroundColor: `${badge.color}1A`,
                border: `1px solid ${badge.color}55`,
              }}
            >
              {badge.label}
            </span>
          </div>
        )}

        {/* Baris 2: nama kota (kiri) + ikon kondisi (kanan) — tidak ada elemen lain */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{locationName}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">
              {timeAgo(weather.observed_at)}
            </div>
          </div>
          <div className="shrink-0">
            <WeatherIcon condition={weather.condition_code} size={26} />
          </div>
        </div>

        {/* Baris 3: suhu besar + label kondisi berwarna */}
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-semibold tabular-nums">
            {weather.temperature_c.toFixed(1)}°
          </span>
          <span
            className="truncate text-[11px] font-medium"
            style={{ color: weatherColor(weather.condition_code) }}
          >
            {weather.condition_text}
          </span>
        </div>

        {/* Baris 4: metrik ringkas */}
        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="whitespace-nowrap">
            💧 {weather.humidity_pct.toFixed(0)}%
          </span>
          <span className="whitespace-nowrap">
            💨 {weather.wind_speed_kmh.toFixed(0)} km/h
          </span>
          <span
            className={cn(
              "whitespace-nowrap font-mono tabular-nums",
              weather.precipitation_mm > 0
                ? "text-idic-blue"
                : "text-slate-500",
            )}
          >
            ☔ {weather.precipitation_mm.toFixed(1)} mm
          </span>
        </div>

        {/* Baris 5: sumber */}
        <div className="mt-2 border-t border-idic-border/40 pt-2">
          <SourceTag source={weather.source} timestamp={weather.observed_at} />
        </div>
      </div>
    </motion.button>
  );
}
