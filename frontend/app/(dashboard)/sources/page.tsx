import { Database, ExternalLink, ShieldCheck } from "lucide-react";

import { Disclaimer } from "@/components/common/disclaimer";
import { PageHeader } from "@/components/common/page-header";
import { SystemStatusCard } from "@/components/common/system-status-card";

export const metadata = { title: "Data Sources" };

const ATTRIBUTIONS = [
  {
    name: "BMKG TEWS",
    url: "https://data.bmkg.go.id",
    desc: "Gempa bumi realtime Indonesia — data resmi Badan Meteorologi, Klimatologi, dan Geofisika.",
  },
  {
    name: "USGS FDSN",
    url: "https://earthquake.usgs.gov",
    desc: "Seismic event feed internasional — digunakan untuk kepadatan data & backfill historis.",
  },
  {
    name: "Open-Meteo",
    url: "https://open-meteo.com",
    desc: "Cuaca current & presipitasi hourly per lokasi — model global, API publik.",
  },
  {
    name: "RainViewer",
    url: "https://rainviewer.com",
    desc: "Mosaik radar hujan global — digunakan untuk layer radar pada peta.",
  },
];

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Data Sources"
        description="Transparansi penuh: status, latency, dan sumber dari setiap data yang ditampilkan platform."
      />

      <SystemStatusCard />

      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Database size={14} aria-hidden /> Attribution
        </h2>
        <ul className="mt-4 space-y-3">
          {ATTRIBUTIONS.map((a) => (
            <li
              key={a.name}
              className="rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-3"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-idic-cyan hover:underline"
              >
                {a.name} <ExternalLink size={12} aria-hidden />
              </a>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {a.desc}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-idic-border bg-idic-card p-5">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-idic-green"
          aria-hidden
        />
        <p className="text-xs leading-relaxed text-slate-400">
          Status tiap sumber diperbarui otomatis oleh data collector:{" "}
          <span className="text-idic-green">online</span> = fetch terakhir
          sukses, <span className="text-idic-amber">degraded</span> = fetch
          terakhir gagal (retry otomatis di siklus berikutnya),{" "}
          <span className="text-slate-400">standby</span> = modul belum aktif
          (mis. AI pada Step 13). Latency dihitung dari durasi fetch aktual.
          Sumber AI provider akan tercatat saat modul AI aktif.
        </p>
      </section>

      <Disclaimer />
    </div>
  );
}
