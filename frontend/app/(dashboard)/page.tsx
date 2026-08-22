"use client";

import { SystemStatusCard } from "@/components/common/system-status-card";
import { PageHeader } from "@/components/common/page-header";

const MODULES = [
  { label: "KPI Dashboard & Weather", step: "Step 7" },
  { label: "Interactive Map", step: "Step 8" },
  { label: "Earthquake Module", step: "Step 9" },
  { label: "Weather Module", step: "Step 10" },
  { label: "Rainfall & Radar", step: "Step 11" },
  { label: "Realtime SSE", step: "Step 12" },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Real-time intelligence for weather, earthquake & disaster monitoring"
      />

      <SystemStatusCard />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MODULES.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-idic-border bg-idic-card/50 p-4"
          >
            <div className="text-sm">{m.label}</div>
            <div className="mt-1 text-[11px] text-slate-500">{m.step}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
