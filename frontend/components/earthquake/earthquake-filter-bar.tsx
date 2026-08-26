"use client";

import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EarthquakeFilters {
  hours: number;
  minMagnitude: number;
}

const HOUR_OPTIONS = [
  { value: 24, label: "24 Jam" },
  { value: 168, label: "7 Hari" },
  { value: 720, label: "30 Hari" },
];

const MAG_OPTIONS = [
  { value: 0, label: "Semua" },
  { value: 2.5, label: "M2.5+" },
  { value: 4, label: "M4+" },
  { value: 5, label: "M5+" },
];

const DEFAULT_FILTERS: EarthquakeFilters = { hours: 24, minMagnitude: 0 };

export function EarthquakeFilterBar({
  filters,
  onChange,
  total,
  loading,
}: {
  filters: EarthquakeFilters;
  onChange: (filters: EarthquakeFilters) => void;
  total: number | null;
  loading: boolean;
}) {
  const isDefault =
    filters.hours === DEFAULT_FILTERS.hours &&
    filters.minMagnitude === DEFAULT_FILTERS.minMagnitude;

  return (
    <section className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-idic-border bg-idic-card p-3">
      <ChipGroup
        ariaLabel="Rentang waktu"
        options={HOUR_OPTIONS}
        active={filters.hours}
        onSelect={(hours) => onChange({ ...filters, hours })}
      />

      <div className="hidden h-6 w-px bg-idic-border sm:block" aria-hidden />

      <ChipGroup
        ariaLabel="Magnitudo minimum"
        options={MAG_OPTIONS}
        active={filters.minMagnitude}
        onSelect={(minMagnitude) => onChange({ ...filters, minMagnitude })}
      />

      <div className="ml-auto flex min-w-0 items-center gap-3">
        <span className="whitespace-nowrap text-xs text-slate-500">
          {loading ? "memuat…" : total !== null ? `${total} event` : "—"}
        </span>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1 rounded-lg border border-idic-border px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan"
          >
            <RotateCcw size={12} aria-hidden /> Reset
          </button>
        )}
      </div>
    </section>
  );
}

function ChipGroup<T extends number>({
  options,
  active,
  onSelect,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  active: T;
  onSelect: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex overflow-hidden rounded-lg border border-idic-border"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          aria-pressed={active === opt.value}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold transition-colors",
            active === opt.value
              ? "bg-idic-cyan/15 text-idic-cyan"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
