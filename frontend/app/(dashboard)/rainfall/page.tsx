"use client";

import { CloudRain, Droplets, Map as MapIcon, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Disclaimer } from "@/components/common/disclaimer";
import { EmptyState, ErrorState } from "@/components/common/states";
import { LocationSelector } from "@/components/common/location-selector";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/kpi/kpi-card";
import { RainfallCityGrid } from "@/components/rainfall/rainfall-city-grid";
import { RainfallHistoryChart } from "@/components/rainfall/rainfall-history-chart";
import { RainfallMonitorPanel } from "@/components/rainfall/rainfall-monitor-panel";
import { useRainfallHistory, useRainfallList } from "@/hooks/use-rainfall";
import { useLocations } from "@/hooks/use-weather";
import { INTENSITY_COLOR } from "@/lib/severity";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = [24, 48, 72];

export default function RainfallPage() {
  const [locationId, setLocationId] = useState<number | null>(null);
  const [chartHours, setChartHours] = useState(24);

  const list = useRainfallList();
  const history = useRainfallHistory(locationId, chartHours);
  const { data: locData } = useLocations();

  const locMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const loc of locData?.data.items ?? []) m.set(loc.id, loc.name);
    return m;
  }, [locData]);

  useEffect(() => {
    if (locationId === null && locData?.data.items.length) {
      const jakarta = locData.data.items.find((l) => l.name === "Jakarta");
      setLocationId(jakarta?.id ?? locData.data.items[0].id);
    }
  }, [locData, locationId]);

  const items = useMemo(() => list.data?.data.items ?? [], [list.data]);

  const selected = useMemo(
    () => items.find((r) => r.location_id === locationId) ?? null,
    [items, locationId],
  );

  const kpis = useMemo(() => {
    if (items.length === 0) return null;
    const raining = items.filter((r) => r.rainfall_1h_mm > 0).length;
    const peak1h = items.reduce((a, b) =>
      b.rainfall_1h_mm > a.rainfall_1h_mm ? b : a,
    );
    const peak24 = items.reduce((a, b) =>
      (b.rainfall_24h_mm ?? 0) > (a.rainfall_24h_mm ?? 0) ? b : a,
    );
    return { raining, peak1h, peak24 };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Rainfall Monitoring"
          description="Curah hujan & intensitas 16 kota — Open-Meteo, diperbarui setiap 10 menit"
        />
        <LocationSelector value={locationId} onChange={setLocationId} />
      </div>

      {kpis && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            icon={CloudRain}
            label="Kota Hujan"
            value={kpis.raining}
            accent="#38BDF8"
            footer={
              <span className="text-[11px] text-slate-500">
                dari {items.length} kota pantau
              </span>
            }
          />
          <KpiCard
            icon={Droplets}
            label="Puncak 1 Jam"
            value={kpis.peak1h.rainfall_1h_mm}
            unit="mm"
            accent={INTENSITY_COLOR[kpis.peak1h.intensity]}
            format={(v) => v.toFixed(1)}
            footer={
              <span className="line-clamp-1 text-[11px] text-slate-500">
                {locMap.get(kpis.peak1h.location_id) ?? "—"}
              </span>
            }
          />
          <KpiCard
            icon={TrendingUp}
            label="Akumulasi 24 Jam"
            value={kpis.peak24.rainfall_24h_mm}
            unit="mm"
            format={(v) => v.toFixed(1)}
            footer={
              <span className="line-clamp-1 text-[11px] text-slate-500">
                {locMap.get(kpis.peak24.location_id) ?? "—"}
              </span>
            }
          />
        </div>
      )}

      {list.isLoading && (
        <div className="h-40 animate-pulse rounded-2xl border border-idic-border bg-idic-card" />
      )}
      {list.isError && (
        <ErrorState
          message={
            list.error instanceof Error
              ? list.error.message
              : "Gagal memuat data hujan"
          }
          onRetry={() => list.refetch()}
        />
      )}
      {list.data && items.length === 0 && (
        <EmptyState
          title="Belum ada observasi hujan"
          description="Collector mengisi data setiap 10 menit — jalankan scripts/ingest_once.py untuk mengisi sekarang."
        />
      )}

      {selected && (
        <RainfallMonitorPanel
          observation={selected}
          locationName={locMap.get(selected.location_id) ?? ""}
        />
      )}

      {locationId !== null && (
        <>
          <div className="flex justify-end">
            <div
              role="group"
              aria-label="Rentang chart"
              className="flex overflow-hidden rounded-lg border border-idic-border"
            >
              {HOUR_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setChartHours(h)}
                  aria-pressed={chartHours === h}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold transition-colors",
                    chartHours === h
                      ? "bg-idic-cyan/15 text-idic-cyan"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  )}
                >
                  {h} Jam
                </button>
              ))}
            </div>
          </div>
          <RainfallHistoryChart
            items={history.data?.data.items ?? []}
            loading={history.isLoading}
            error={history.isError}
            errorMessage={
              history.error instanceof Error ? history.error.message : undefined
            }
            onRetry={() => history.refetch()}
            hours={chartHours}
            locationName={locMap.get(locationId) ?? ""}
          />
        </>
      )}

      {items.length > 0 && (
        <RainfallCityGrid
          items={items}
          locMap={locMap}
          selectedId={locationId}
          onSelect={setLocationId}
        />
      )}

      <section className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-idic-border bg-idic-card p-5">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Radar Hujan
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Animasi pergerakan sistem hujan (frame 2 jam terakhir + nowcast 30
            menit) tersedia sebagai layer di peta monitoring.
          </p>
        </div>
        <Link
          href="/peta"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-idic-border px-4 py-2 text-sm text-idic-cyan transition-colors hover:border-idic-cyan/50 hover:bg-idic-cyan/10"
        >
          <MapIcon size={15} aria-hidden /> Buka Peta
        </Link>
      </section>

      <Disclaimer />
    </div>
  );
}
