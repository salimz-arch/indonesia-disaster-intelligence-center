"use client";

import { SourceTag } from "@/components/common/source-tag";
import { INTENSITY_COLOR, INTENSITY_LABEL } from "@/lib/severity";
import type { RainfallIntensity, RainfallObservation } from "@/types/api";

const SCALE: RainfallIntensity[] = [
  "none",
  "light",
  "moderate",
  "heavy",
  "very_heavy",
  "extreme",
];

/** Monitor panel §10: intensitas kini + akumulasi 1j/6j/24j + skala intensitas. */
export function RainfallMonitorPanel({
  observation,
  locationName,
}: {
  observation: RainfallObservation;
  locationName: string;
}) {
  const color = INTENSITY_COLOR[observation.intensity];

  return (
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
        <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Rainfall Monitor
        </h2>
        <span className="min-w-0 shrink-0 truncate rounded-full border border-idic-border bg-idic-bg-2 px-2.5 py-0.5 text-[11px] text-slate-300">
          {locationName}
        </span>
      </div>

      {/* Intensitas kini */}
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <span
          className="rounded-xl border px-4 py-2 text-sm font-bold tracking-wide"
          style={{
            color,
            borderColor: `${color}55`,
            backgroundColor: `${color}14`,
          }}
        >
          {INTENSITY_LABEL[observation.intensity]}
        </span>
        <div className="min-w-0">
          <div className="font-mono text-3xl font-semibold tabular-nums">
            {observation.rainfall_1h_mm.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-slate-400">
              mm / 1 jam
            </span>
          </div>
        </div>
      </div>

      {/* Akumulasi */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Accum label="1 Jam" value={observation.rainfall_1h_mm} />
        <Accum label="6 Jam" value={observation.rainfall_6h_mm} />
        <Accum label="24 Jam" value={observation.rainfall_24h_mm} />
      </div>

      {/* Skala intensitas — level aktif di-highlight */}
      <div className="mt-4">
        <div className="flex gap-1">
          {SCALE.map((level) => (
            <div
              key={level}
              className="h-1.5 flex-1 rounded-full"
              style={{
                backgroundColor: INTENSITY_COLOR[level],
                opacity: level === observation.intensity ? 1 : 0.25,
              }}
              title={INTENSITY_LABEL[level]}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] uppercase tracking-wide text-slate-600">
          <span>None</span>
          <span>Light</span>
          <span>Moderate</span>
          <span>Heavy</span>
          <span>Very Heavy</span>
          <span>Extreme</span>
        </div>
      </div>

      <div className="mt-4">
        <SourceTag
          source={observation.source}
          timestamp={observation.observed_at}
        />
      </div>
    </section>
  );
}

function Accum({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-3 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {value !== null ? value.toFixed(1) : "—"}
        <span className="text-[10px] font-normal text-slate-500"> mm</span>
      </div>
    </div>
  );
}
