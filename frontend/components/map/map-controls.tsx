"use client";

import { Loader2, Radar, RefreshCw } from "lucide-react";

import { CATEGORY_COLOR } from "@/lib/severity";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = [
  { value: 24, label: "24H" },
  { value: 168, label: "7D" },
];

export interface MapControlsProps {
  hours: number;
  onHoursChange: (hours: number) => void;
  radarOn: boolean;
  onRadarToggle: () => void;
  radarLoading: boolean;
  radarError: boolean;
  frameLabel: { time: string; nowcast: boolean } | null;
  quakesLoading: boolean;
  quakesError: boolean;
  onRetryQuakes: () => void;
}

/** Overlay kontrol: time range, radar toggle, status chips (§21 subset — filter penuh di step berikutnya). */
export function MapControls({
  hours,
  onHoursChange,
  radarOn,
  onRadarToggle,
  radarLoading,
  radarError,
  frameLabel,
  quakesLoading,
  quakesError,
  onRetryQuakes,
}: MapControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex flex-wrap items-center gap-2 sm:inset-x-auto sm:right-3 sm:top-3">
      {/* Time range */}
      <div
        role="group"
        aria-label="Time range"
        className="pointer-events-auto flex overflow-hidden rounded-lg border border-idic-border bg-idic-bg-2/90 backdrop-blur-sm"
      >
        {HOUR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onHoursChange(opt.value)}
            aria-pressed={hours === opt.value}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold transition-colors",
              hours === opt.value
                ? "bg-idic-cyan/15 text-idic-cyan"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Radar toggle */}
      <button
        type="button"
        onClick={onRadarToggle}
        aria-pressed={radarOn}
        className={cn(
          "pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors",
          radarOn
            ? "border-idic-blue/50 bg-idic-blue/15 text-idic-blue"
            : "border-idic-border bg-idic-bg-2/90 text-slate-400 hover:text-slate-200",
        )}
      >
        {radarLoading ? (
          <Loader2 size={13} className="animate-spin" aria-hidden />
        ) : (
          <Radar size={13} aria-hidden />
        )}
        Radar {radarOn ? "ON" : "OFF"}
      </button>

      {/* Waktu frame radar aktif */}
      {radarOn && frameLabel && (
        <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-idic-border bg-idic-bg-2/90 px-2.5 py-1.5 font-mono text-xs text-slate-300 backdrop-blur-sm">
          {frameLabel.time}
          {frameLabel.nowcast && (
            <span className="rounded bg-idic-magenta/20 px-1 text-[9px] font-bold tracking-wide text-idic-magenta">
              FORECAST
            </span>
          )}
        </span>
      )}

      {radarOn && radarError && (
        <span className="pointer-events-auto rounded-lg border border-idic-red/40 bg-idic-red/10 px-2.5 py-1.5 text-xs text-idic-red">
          radar unavailable
        </span>
      )}

      {quakesLoading && (
        <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-idic-border bg-idic-bg-2/90 px-2.5 py-1.5 text-xs text-slate-400 backdrop-blur-sm">
          <Loader2 size={12} className="animate-spin" aria-hidden />
          loading quakes…
        </span>
      )}

      {quakesError && (
        <button
          type="button"
          onClick={onRetryQuakes}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-idic-red/40 bg-idic-red/10 px-2.5 py-1.5 text-xs text-idic-red backdrop-blur-sm"
        >
          <RefreshCw size={12} aria-hidden /> retry quakes
        </button>
      )}
    </div>
  );
}

const LEGEND_ITEMS = [
  { label: "<3", color: CATEGORY_COLOR.low },
  { label: "3–4", color: CATEGORY_COLOR.moderate },
  { label: "4–5", color: CATEGORY_COLOR.significant },
  { label: "5–6", color: CATEGORY_COLOR.strong },
  { label: "6–7", color: CATEGORY_COLOR.major },
  { label: "7+", color: CATEGORY_COLOR.severe },
];

/** Legenda magnitude — warna + label teks (§27: tidak mengandalkan warna saja). */
export function MapLegend() {
  return (
    <div className="absolute bottom-2 left-2 z-10 rounded-lg border border-idic-border bg-idic-bg-2/90 p-2 backdrop-blur-sm">
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
        Magnitude
      </div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-1">
        {LEGEND_ITEMS.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1 text-[10px] text-slate-300"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
