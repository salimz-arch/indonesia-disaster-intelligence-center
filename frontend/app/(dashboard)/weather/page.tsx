"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { Disclaimer } from "@/components/common/disclaimer";
import {
  ErrorState,
  EmptyState,
  ListSkeleton,
} from "@/components/common/states";
import { PageHeader } from "@/components/common/page-header";
import { WeatherCityCard } from "@/components/weather/weather-city-card";
import { WeatherDetailPanel } from "@/components/weather/weather-detail-panel";
import { useLatestWeather, useLocations } from "@/hooks/use-weather";

type SortKey = "name" | "temp-desc" | "temp-asc" | "rain-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Nama(a-z)" },
  { value: "temp-desc", label: "Terpanas" },
  { value: "temp-asc", label: "Terdingin" },
  { value: "rain-desc", label: "Terbasah" },
];

export default function WeatherPage() {
  const weather = useLatestWeather();
  const locations = useLocations();
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const locMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const loc of locations.data?.data.items ?? []) m.set(loc.id, loc.name);
    return m;
  }, [locations.data]);

  const items = useMemo(() => {
    const list = [...(weather.data?.data.items ?? [])];
    switch (sort) {
      case "temp-desc":
        return list.sort((a, b) => b.temperature_c - a.temperature_c);
      case "temp-asc":
        return list.sort((a, b) => a.temperature_c - b.temperature_c);
      case "rain-desc":
        return list.sort((a, b) => b.precipitation_mm - a.precipitation_mm);
      default:
        return list.sort((a, b) =>
          (locMap.get(a.location_id) ?? "").localeCompare(
            locMap.get(b.location_id) ?? "",
          ),
        );
    }
  }, [weather.data, sort, locMap]);

  // Highlight ekstrem
  const extremes = useMemo(() => {
    const list = weather.data?.data.items ?? [];
    if (list.length < 2) return { hottest: -1, coldest: -1, wettest: -1 };
    const hottest = list.reduce((a, b) =>
      b.temperature_c > a.temperature_c ? b : a,
    ).location_id;
    const coldest = list.reduce((a, b) =>
      b.temperature_c < a.temperature_c ? b : a,
    ).location_id;
    const wettest = list.reduce((a, b) =>
      b.precipitation_mm > a.precipitation_mm ? b : a,
    ).location_id;
    return { hottest, coldest, wettest };
  }, [weather.data]);

  const selected = useMemo(
    () => items.find((w) => w.location_id === selectedId) ?? null,
    [items, selectedId],
  );

  const badgeFor = (locId: number) => {
    if (locId === extremes.hottest)
      return { label: "TERPANAS", color: "#F97316" };
    if (locId === extremes.coldest)
      return { label: "TERDINGIN", color: "#38BDF8" };
    if (
      locId === extremes.wettest &&
      (weather.data?.data.items ?? []).some((w) => w.precipitation_mm > 0)
    )
      return { label: "TERBASAH", color: "#22D3EE" };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Weather Monitoring"
          description="Observasi cuaca 16 kota — Open-Meteo, diperbarui setiap 10 menit"
        />
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Urutkan
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Urutkan kota"
            className="rounded-lg border border-idic-border bg-idic-bg-2 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-idic-cyan/50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-idic-bg-2">
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {weather.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListSkeleton key={i} rows={1} />
          ))}
        </div>
      )}

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

      {weather.data && items.length === 0 && (
        <EmptyState
          title="Belum ada observasi cuaca"
          description="Collector mengisi data setiap 10 menit — jalankan scripts/ingest_once.py untuk mengisi sekarang."
        />
      )}

      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((w) => (
            <WeatherCityCard
              key={w.location_id}
              weather={w}
              locationName={
                locMap.get(w.location_id) ?? `Lokasi ${w.location_id}`
              }
              active={w.location_id === selectedId}
              onSelect={() =>
                setSelectedId(
                  w.location_id === selectedId ? null : w.location_id,
                )
              }
              badge={badgeFor(w.location_id)}
            />
          ))}
        </div>
      )}

      <Disclaimer />

      {/* Detail bottom sheet — mobile & tablet (sampai xl) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm xl:hidden"
          onClick={() => setSelectedId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Detail cuaca"
        >
          <div
            className="max-h-[80dvh] w-full overflow-y-auto rounded-t-2xl border-t border-idic-border bg-idic-bg p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Tutup detail"
              className="mb-2 ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-idic-border text-slate-400 hover:border-idic-red/50 hover:text-idic-red"
            >
              <X size={14} aria-hidden />
            </button>
            <WeatherDetailPanel
              weather={selected}
              locationName={locMap.get(selected.location_id) ?? ""}
            />
          </div>
        </div>
      )}
    </div>
  );
}
