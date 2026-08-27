"use client";

import { CloudRain } from "lucide-react";

import { INTENSITY_COLOR, INTENSITY_LABEL } from "@/lib/severity";
import { cn } from "@/lib/utils";
import type { RainfallObservation } from "@/types/api";

/** Grid ringkas semua kota: intensitas + angka 1j/24j, klik = pilih lokasi. */
export function RainfallCityGrid({
  items,
  locMap,
  selectedId,
  onSelect,
}: {
  items: RainfallObservation[];
  locMap: Map<number, string>;
  selectedId: number | null;
  onSelect: (locationId: number) => void;
}) {
  const sorted = [...items].sort((a, b) => b.rainfall_1h_mm - a.rainfall_1h_mm);

  return (
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        <CloudRain size={14} className="text-idic-blue" aria-hidden />
        Semua Kota — diurutkan hujan 1 jam
      </h2>

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((r) => {
          const color = INTENSITY_COLOR[r.intensity];
          const active = r.location_id === selectedId;
          return (
            <li key={r.location_id}>
              <button
                type="button"
                onClick={() => onSelect(r.location_id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-idic-cyan/50 bg-idic-cyan/10 ring-1 ring-idic-cyan/30"
                    : "border-idic-border/60 bg-idic-bg-2/50 hover:border-idic-cyan/30",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {locMap.get(r.location_id) ?? `Lokasi ${r.location_id}`}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-slate-400">
                    1j {r.rainfall_1h_mm.toFixed(1)} · 24j{" "}
                    {r.rainfall_24h_mm !== null
                      ? r.rainfall_24h_mm.toFixed(0)
                      : "—"}{" "}
                    mm
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
                  style={{
                    color,
                    borderColor: `${color}55`,
                    backgroundColor: `${color}14`,
                  }}
                >
                  {INTENSITY_LABEL[r.intensity]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
