"use client";

import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/common/disclaimer";
import { LocationSelector } from "@/components/common/location-selector";
import { PageHeader } from "@/components/common/page-header";
import { SystemStatusCard } from "@/components/common/system-status-card";
import { EarthquakeActivityCard } from "@/components/earthquake/earthquake-activity-card";
import { OverviewKpis } from "@/components/kpi/overview-kpis";
import { EarthquakeMap } from "@/components/map/earthquake-map";
import { WeatherConditionCard } from "@/components/weather/weather-condition-card";
import { useLocations } from "@/hooks/use-weather";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";

export default function OverviewPage() {
  const [locationId, setLocationId] = useState<number | null>(null);
  const { data: locData } = useLocations();

  // Default ke Jakarta saat data lokasi pertama kali dimuat
  useEffect(() => {
    if (locationId === null && locData?.data.items.length) {
      const jakarta = locData.data.items.find((l) => l.name === "Jakarta");
      setLocationId(jakarta?.id ?? locData.data.items[0].id);
    }
  }, [locData, locationId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Overview"
          description="Real-Time Intelligence for Weather, Earthquake & Disaster Monitoring"
        />
        <LocationSelector value={locationId} onChange={setLocationId} />
      </div>

      <OverviewKpis locationId={locationId} />

      <EarthquakeMap variant="compact" />

      <div className="grid gap-6 xl:grid-cols-2">
        <WeatherConditionCard locationId={locationId} />
        <EarthquakeActivityCard />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <WeatherConditionCard locationId={locationId} />
        <EarthquakeActivityCard />
      </div>

      {/* AI Situation Analysis (§18) */}
      <AiAnalysisPanel />

      <SystemStatusCard />
      <Disclaimer />
    </div>
  );
}
