import { Disclaimer } from "@/components/common/disclaimer";
import { PageHeader } from "@/components/common/page-header";
import { SystemStatusCard } from "@/components/common/system-status-card";
import { EarthquakeActivityCard } from "@/components/earthquake/earthquake-activity-card";
import { OverviewKpis } from "@/components/kpi/overview-kpis";
import { EarthquakeMap } from "@/components/map/earthquake-map";
import { WeatherConditionCard } from "@/components/weather/weather-condition-card";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Real-Time Intelligence for Weather, Earthquake & Disaster Monitoring"
      />

      <OverviewKpis />

      {/* Interactive map (§14) */}
      <EarthquakeMap variant="compact" />

      <div className="grid gap-6 xl:grid-cols-2">
        <WeatherConditionCard />
        <EarthquakeActivityCard />
      </div>

      <SystemStatusCard />
      <Disclaimer />
    </div>
  );
}
