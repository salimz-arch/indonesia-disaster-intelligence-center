"use client";

import {
  Activity,
  CloudRain,
  RadioTower,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

import { KpiCard } from "@/components/kpi/kpi-card";
import { useEarthquakeCount } from "@/hooks/use-earthquakes";
import { useSources } from "@/hooks/use-sources";
import {
  useLatestRainfall,
  useLatestWeather,
  useLocations,
} from "@/hooks/use-weather";
import { INTENSITY_COLOR } from "@/lib/severity";

/** 6 KPI §15 — semua dari data live. "Active Alerts" menyusul di Step 15. */
export function OverviewKpis() {
  const count24 = useEarthquakeCount(24);
  const countM5 = useEarthquakeCount(24, 5);
  const weather = useLatestWeather();
  const rainfall = useLatestRainfall();
  const locations = useLocations();
  const sources = useSources();

  const locMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const loc of locations.data?.data.items ?? []) m.set(loc.id, loc.name);
    return m;
  }, [locations.data]);

  // Lokasi referensi: Jakarta, fallback item pertama
  const primaryWeather = useMemo(() => {
    const items = weather.data?.data.items ?? [];
    return (
      items.find((w) => locMap.get(w.location_id) === "Jakarta") ??
      items[0] ??
      null
    );
  }, [weather.data, locMap]);

  // Hujan puncak: lokasi dengan rainfall 1 jam tertinggi
  const peakRain = useMemo(() => {
    const items = rainfall.data?.data.items ?? [];
    if (items.length === 0) return null;
    return items.reduce((a, b) =>
      b.rainfall_1h_mm > a.rainfall_1h_mm ? b : a,
    );
  }, [rainfall.data]);

  const onlineSources =
    sources.data?.data.items.filter((s) => s.status === "online").length ??
    null;
  const totalSources = sources.data?.data.items.length ?? null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        icon={Activity}
        label="Gempa 24 Jam"
        value={count24.data ?? null}
        loading={count24.isLoading}
        error={count24.isError ? "gagal memuat" : null}
      />
      <KpiCard
        icon={Zap}
        label="M5+ 24 Jam"
        value={countM5.data ?? null}
        accent="#F59E0B"
        loading={countM5.isLoading}
        error={countM5.isError ? "gagal memuat" : null}
      />
      <KpiCard
        icon={Thermometer}
        label="Suhu"
        value={primaryWeather?.temperature_c ?? null}
        unit="°C"
        format={(v) => v.toFixed(1)}
        loading={weather.isLoading}
        footer={<KpiFooter>Jakarta</KpiFooter>}
      />
      <KpiCard
        icon={Wind}
        label="Angin"
        value={primaryWeather?.wind_speed_kmh ?? null}
        unit="km/h"
        format={(v) => v.toFixed(0)}
        loading={weather.isLoading}
        footer={<KpiFooter>Jakarta</KpiFooter>}
      />
      <KpiCard
        icon={CloudRain}
        label="Hujan 1 Jam"
        value={peakRain?.rainfall_1h_mm ?? null}
        unit="mm"
        accent={peakRain ? INTENSITY_COLOR[peakRain.intensity] : "#38BDF8"}
        format={(v) => v.toFixed(1)}
        loading={rainfall.isLoading}
        footer={
          peakRain && (
            <KpiFooter>
              {locMap.get(peakRain.location_id) ?? "—"} · puncak
            </KpiFooter>
          )
        }
      />
      <KpiCard
        icon={RadioTower}
        label="Sumber Data"
        value={onlineSources}
        accent="#22C55E"
        loading={sources.isLoading}
        footer={
          totalSources !== null && (
            <KpiFooter>
              {onlineSources}/{totalSources} online
            </KpiFooter>
          )
        }
      />
    </div>
  );
}

function KpiFooter({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-slate-500">{children}</div>;
}
