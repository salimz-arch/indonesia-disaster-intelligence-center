"use client";

import {
  Activity,
  CloudRain,
  CloudSun,
  ExternalLink,
  Siren,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Disclaimer } from "@/components/common/disclaimer";
import { EmptyState } from "@/components/common/states";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/kpi/kpi-card";
import { useEarthquakeStats } from "@/hooks/use-earthquakes";
import { useRainfallList } from "@/hooks/use-rainfall";
import { useLatestWeather, useLocations } from "@/hooks/use-weather";
import { timeAgo } from "@/lib/format";
import { INTENSITY_LABEL } from "@/lib/severity";

type RiskLevel = "low" | "moderate" | "high";

const LEVEL_COLOR: Record<RiskLevel, string> = {
  low: "#22C55E",
  moderate: "#F59E0B",
  high: "#EF4444",
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "RENDAH",
  moderate: "WASPADA",
  high: "TINGGI",
};

interface DerivedEvent {
  type: "seismic" | "hydro" | "weather";
  time: string;
  title: string;
  detail: string;
  severity: RiskLevel;
}

export default function DisasterPage() {
  const eqStats = useEarthquakeStats(24);
  const rainList = useRainfallList();
  const weather = useLatestWeather();
  const locData = useLocations();

  const locMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const loc of locData.data?.data.items ?? []) m.set(loc.id, loc.name);
    return m;
  }, [locData]);

  const s = eqStats.data?.data;
  const rainItems = rainList.data?.data.items ?? [];
  const weatherItems = weather.data?.data.items ?? [];

  const hydroWatch = useMemo(
    () => rainItems.filter((r) => r.rainfall_1h_mm >= 5),
    [rainItems],
  );

  const extremeWx = useMemo(
    () =>
      weatherItems.filter(
        (w) =>
          w.condition_code === "thunderstorm" || w.condition_code === "extreme",
      ),
    [weatherItems],
  );

  const seismicLevel: RiskLevel = useMemo(() => {
    const m = s?.max_magnitude?.magnitude ?? 0;
    if (m >= 6) return "high";
    if (m >= 5) return "moderate";
    return "low";
  }, [s]);

  const hydroLevel: RiskLevel = useMemo(() => {
    const peak = Math.max(0, ...rainItems.map((r) => r.rainfall_1h_mm));
    if (peak > 20) return "high";
    if (peak >= 10) return "moderate";
    return "low";
  }, [rainItems]);

  const wxLevel: RiskLevel = useMemo(
    () =>
      extremeWx.length >= 2
        ? "high"
        : extremeWx.length === 1
          ? "moderate"
          : "low",
    [extremeWx],
  );

  const derivedEvents = useMemo(() => {
    const quakes: DerivedEvent[] = (s?.recent ? [s.recent] : []).map((e) => ({
      type: "seismic" as const,
      time: e.event_time,
      title: `Gempa M${e.magnitude.toFixed(1)}`,
      detail: e.location_text ?? "—",
      severity:
        e.magnitude >= 6 ? "high" : e.magnitude >= 5 ? "moderate" : "low",
    }));
    const rains: DerivedEvent[] = hydroWatch.map((r) => ({
      type: "hydro" as const,
      time: r.observed_at,
      title: `Hujan ${INTENSITY_LABEL[r.intensity].toLowerCase()}`,
      detail: `${locMap.get(r.location_id) ?? "—"} — ${r.rainfall_1h_mm.toFixed(1)} mm/jam`,
      severity: r.rainfall_1h_mm > 20 ? "high" : "moderate",
    }));
    const wx: DerivedEvent[] = extremeWx.map((w) => ({
      type: "weather" as const,
      time: w.observed_at,
      title: w.condition_text,
      detail: locMap.get(w.location_id) ?? "—",
      severity: "moderate",
    }));
    return [...quakes, ...rains, ...wx]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }, [s, hydroWatch, extremeWx, locMap]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disaster Intelligence"
        description="Indikator risiko bencana diturunkan dari data monitoring riil — seismik, hidrologi, dan cuaca"
      />

      {/* KPI indikator */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          icon={Activity}
          label="Seismik 24 Jam"
          value={s?.total ?? null}
          loading={eqStats.isLoading}
          footer={
            <span className="text-[11px] text-slate-400">
              Gempa seluruh magnitudo
            </span>
          }
        />
        <KpiCard
          icon={Zap}
          label="M5+ 24 Jam"
          value={
            s
              ? (s.distribution.strong ?? 0) +
                (s.distribution.major ?? 0) +
                (s.distribution.severe ?? 0)
              : null
          }
          accent="#F59E0B"
          loading={eqStats.isLoading}
          footer={
            <span className="text-[11px] text-slate-400">
              Berpotensi terasa
            </span>
          }
        />
        <KpiCard
          icon={CloudRain}
          label="Lokasi Hujan ≥5mm"
          value={hydroWatch.length}
          accent="#38BDF8"
          loading={rainList.isLoading}
          footer={
            <span className="text-[11px] text-slate-400">
              Indikator potensi banjir
            </span>
          }
        />
        <KpiCard
          icon={CloudSun}
          label="Cuaca Ekstrem"
          value={extremeWx.length}
          accent="#F43F5E"
          loading={weather.isLoading}
          footer={
            <span className="text-[11px] text-slate-400">
              Badai petir / ekstrem
            </span>
          }
        />
      </div>

      {/* Matriks risiko 3 dimensi */}
      <div className="grid gap-3 sm:grid-cols-3">
        <RiskCard
          icon={Waves}
          title="Bahaya Seismik"
          level={seismicLevel}
          detail={
            s?.max_magnitude
              ? `Maks M${s.max_magnitude.magnitude.toFixed(1)} dalam 24 jam`
              : "Tidak ada gempa 24 jam terakhir"
          }
          loading={eqStats.isLoading}
        />
        <RiskCard
          icon={CloudRain}
          title="Risiko Hidrologi"
          level={hydroLevel}
          detail={
            hydroWatch.length > 0
              ? `${hydroWatch.length} lokasi hujan intensitas ≥5 mm/jam`
              : "Intensitas hujan rendah di seluruh lokasi pantau"
          }
          loading={rainList.isLoading}
        />
        <RiskCard
          icon={Wind}
          title="Cuaca Ekstrem"
          level={wxLevel}
          detail={
            extremeWx.length > 0
              ? `Aktif di: ${extremeWx
                  .map((w) => locMap.get(w.location_id))
                  .filter(Boolean)
                  .join(", ")}`
              : "Tidak ada kondisi ekstrem aktif"
          }
          loading={weather.isLoading}
        />
      </div>

      {/* Feed event gabungan (derived) */}
      <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Siren size={14} className="text-idic-red" aria-hidden />
          Event Monitor — gabungan realtime
        </h2>
        <p className="mb-3 text-[11px] text-slate-500">
          Diturunkan otomatis dari data gempa, curah hujan, dan cuaca — bukan
          laporan bencana lapangan.
        </p>

        {eqStats.isLoading && rainList.isLoading && (
          <div className="h-40 animate-pulse rounded-xl bg-idic-bg-2/60" />
        )}

        {derivedEvents.length === 0 &&
          !eqStats.isLoading &&
          !rainList.isLoading &&
          !weather.isLoading && (
            <EmptyState
              title="Tidak ada event signifikan"
              description="Event muncul saat gempa signifikan, hujan intensitas tinggi, atau cuaca ekstrem terdeteksi."
            />
          )}

        {derivedEvents.length > 0 && (
          <ul className="divide-y divide-idic-border/50">
            {derivedEvents.map((e, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: LEVEL_COLOR[e.severity] }}
                  aria-hidden
                />
                <span className="w-20 shrink-0 text-[10px] font-bold tracking-wide text-slate-500">
                  {e.type === "seismic"
                    ? "SEISMIK"
                    : e.type === "hydro"
                      ? "HIDROLOGI"
                      : "CUACA"}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-200">
                    {e.title}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {e.detail}
                  </span>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-500">
                  {timeAgo(e.time)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Event bencana resmi — honest empty state */}
      <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Siren size={14} className="text-slate-500" aria-hidden />
          Laporan Bencana Lapangan
        </h2>
        <EmptyState
          title="Menunggu sumber data resmi"
          description="Laporan banjir, longsor, dan kebakaran hutan membutuhkan feed resmi (BNPB/Pemda) yang belum tersedia sebagai API publik. Kami menampilkan indikator risiko dari data monitoring di atas, bukan data tiruan."
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href="https://www.bnpb.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-idic-border px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan"
          >
            BNPB <ExternalLink size={11} aria-hidden />
          </a>
          <a
            href="https://www.bmkg.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-idic-border px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan"
          >
            BMKG <ExternalLink size={11} aria-hidden />
          </a>
          <Link
            href="/alerts"
            className="inline-flex items-center gap-1.5 rounded-lg border border-idic-border px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan"
          >
            Alert Aktif →
          </Link>
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}

function RiskCard({
  icon: Icon,
  title,
  level,
  detail,
  loading,
}: {
  icon: React.ElementType;
  title: string;
  level: RiskLevel;
  detail: string;
  loading: boolean;
}) {
  const color = LEVEL_COLOR[level];
  return (
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="flex items-center justify-between gap-2">
        {/* ✅ ICON DIUBAH MENJADI BIRU SERAGAM (CYAN) */}
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            color: "#22D3EE",
            backgroundColor: "rgba(34, 211, 238, 0.1)",
          }}
        >
          <Icon size={18} aria-hidden />
        </span>

        {/* ✅ BADGE TETAP BERWARNA SESUAI LEVEL (HIJAU/KUNING/MERAH) */}
        <span
          className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
          style={{
            color,
            borderColor: `${color}55`,
            backgroundColor: `${color}14`,
          }}
        >
          {loading ? "…" : LEVEL_LABEL[level]}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
        {detail}
      </p>

      {/* ✅ BAR LEVEL TETAP BERWARNA SESUAI LEVEL */}
      <div className="mt-3 flex gap-1">
        {(["low", "moderate", "high"] as RiskLevel[]).map((l) => (
          <div
            key={l}
            className="h-1.5 flex-1 rounded-full"
            style={{
              backgroundColor: LEVEL_COLOR[l],
              opacity: l === level && !loading ? 1 : 0.2,
            }}
            aria-hidden
          />
        ))}
      </div>
    </section>
  );
}
