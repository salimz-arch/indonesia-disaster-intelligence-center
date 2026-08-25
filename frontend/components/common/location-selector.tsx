"use client";

import { useLocations } from "@/hooks/use-weather";

/** Dropdown pemilihan kota pantau — menggantikan hardcode "Jakarta". */
export function LocationSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const { data } = useLocations();
  const locations = data?.data.items ?? [];

  return (
    <select
      value={value ?? undefined}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Pilih lokasi pantau"
      className="shrink-0 rounded-lg border border-idic-border bg-idic-bg-2 px-3 py-1.5 text-sm text-slate-200 outline-none transition-colors focus:border-idic-cyan/50"
    >
      {locations.map((loc) => (
        <option key={loc.id} value={loc.id} className="bg-idic-bg-2">
          {loc.name}
        </option>
      ))}
    </select>
  );
}
