"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  Database,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  Globe,
  Info,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/common/disclaimer";
import { PageHeader } from "@/components/common/page-header";
import { useSystemStatus } from "@/hooks/use-system-status";
import { APP_VERSION } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import { useRealtimeStore } from "@/stores/realtime-store";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const EXPORT_DATASETS = [
  {
    dataset: "earthquakes",
    title: "Earthquakes",
    desc: "Event gempa — waktu WIB",
    hasHours: true,
  },
  {
    dataset: "weather",
    title: "Weather",
    desc: "Observasi terbaru 16 kota pantau",
    hasHours: false,
  },
  {
    dataset: "rainfall",
    title: "Rainfall",
    desc: "Curah hujan terbaru per kota",
    hasHours: false,
  },
] as const;

const HOUR_OPTIONS = [
  { value: 24, label: "24 Jam" },
  { value: 168, label: "7 Hari" },
  { value: 720, label: "30 Hari" },
];

export default function SettingsPage() {
  const { status, health } = useSystemStatus();
  const connection = useRealtimeStore((s) => s.connection);
  const browserEnabled = useNotificationStore((s) => s.browserEnabled);
  const setBrowserEnabled = useNotificationStore((s) => s.setBrowserEnabled);
  const queryClient = useQueryClient();

  const [permState, setPermState] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [cacheMsg, setCacheMsg] = useState<string | null>(null);
  const [cacheErr, setCacheErr] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exportErr, setExportErr] = useState<string | null>(null);
  const [eqHours, setEqHours] = useState(24);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermState(Notification.permission);
    } else {
      setPermState("unsupported");
    }
  }, []);

  async function toggleBrowserNotif() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      setPermState(perm);
      if (perm === "granted") setBrowserEnabled(true);
      return;
    }
    setBrowserEnabled(!browserEnabled);
  }

  const clearCache = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/system/clear-cache`, {
        method: "POST",
      });
      const body = await res.json();
      if (!body.success) {
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      return body.data as { cleared_keys: number };
    },
    onSuccess: async (data) => {
      setCacheErr(null);
      setCacheMsg(`${data.cleared_keys} cache key dihapus — data dimuat ulang`);
      // Refetch semua query aktif → seluruh dashboard segar
      await queryClient.invalidateQueries();
      setTimeout(() => setCacheMsg(null), 4000);
    },
    onError: (err) => {
      setCacheMsg(null);
      setCacheErr(err instanceof Error ? err.message : "Gagal clear cache");
    },
  });

  async function handleExport(dataset: string, fmt: "csv" | "json") {
    const key = `${dataset}:${fmt}`;
    setDownloading(key);
    setExportErr(null);
    try {
      const params = new URLSearchParams({ format: fmt });
      if (dataset === "earthquakes") params.set("hours", String(eqHours));

      const res = await fetch(`${API_URL}/api/v1/export/${dataset}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      // Nama file dari Content-Disposition (diekspos via CORS)
      const cd = res.headers.get("content-disposition");
      const match = cd?.match(/filename="(.+)"/);
      const filename = match?.[1] ?? `idic_${dataset}_${Date.now()}.${fmt}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportErr("Gagal mengekspor — pastikan backend berjalan");
    } finally {
      setDownloading(null);
    }
  }

  const components = health?.components;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Preferensi notifikasi, manajemen data, diagnostik koneksi, dan informasi sistem"
      />

      {/* ── Notifikasi ── */}
      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Bell size={14} className="text-idic-cyan" aria-hidden />
          Notifications
        </h2>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">
              Notifikasi Browser
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Muncul di level sistem operasi hanya untuk alert{" "}
              <span className="font-semibold text-idic-red">CRITICAL</span>{" "}
              (gempa M≥7 / berpotensi tsunami). Tidak pernah spam.
            </p>
            {permState === "denied" && (
              <p className="mt-1 text-[11px] text-idic-amber">
                Permission diblokir browser — ubah via ikon lock di address bar.
              </p>
            )}
            {permState === "unsupported" && (
              <p className="mt-1 text-[11px] text-idic-amber">
                Browser ini tidak mendukung Notification API.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={toggleBrowserNotif}
            role="switch"
            aria-checked={browserEnabled && permState === "granted"}
            aria-label="Toggle notifikasi browser"
            disabled={permState === "unsupported" || permState === "denied"}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-40",
              browserEnabled && permState === "granted"
                ? "border-idic-cyan/60 bg-idic-cyan/30"
                : "border-idic-border bg-idic-bg-2",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 rounded-full transition-transform",
                browserEnabled && permState === "granted"
                  ? "translate-x-[22px] bg-idic-cyan"
                  : "translate-x-0.5 bg-slate-500",
              )}
              style={{ height: 18, width: 18 }}
            />
          </button>
        </div>

        <p className="mt-3 flex items-center gap-2 rounded-lg border border-idic-border/60 bg-idic-bg-2/50 p-3 text-[11px] leading-relaxed text-slate-500">
          <MonitorSmartphone
            size={14}
            className="shrink-0 text-slate-500"
            aria-hidden
          />
          Toast in-app untuk gempa signifikan (M≥4.5) selalu aktif — pengaturan
          ini hanya mengendalikan notifikasi level sistem operasi.
        </p>
      </section>

      {/* ── Data Management: Clear Cache + Export ── */}
      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Database size={14} className="text-idic-cyan" aria-hidden />
          Data Management
        </h2>

        {/* Clear cache */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">Clear Cache</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
              Hapus cache Redis — seluruh data dashboard dimuat ulang langsung
              dari database.
            </p>
            {cacheMsg && (
              <p className="mt-1 text-[11px] font-medium text-idic-green">
                ✓ {cacheMsg}
              </p>
            )}
            {cacheErr && (
              <p className="mt-1 text-[11px] text-idic-red">{cacheErr}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => clearCache.mutate()}
            disabled={clearCache.isPending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-idic-border px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-idic-cyan/50 hover:text-idic-cyan active:scale-[0.97] disabled:opacity-50"
          >
            <RefreshCw
              size={12}
              className={clearCache.isPending ? "animate-spin" : ""}
              aria-hidden
            />
            {clearCache.isPending ? "Membersihkan…" : "Clear Cache"}
          </button>
        </div>

        {/* Export data */}
        <div className="mt-3 space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Export Data
          </p>

          {EXPORT_DATASETS.map((exp) => (
            <div
              key={exp.dataset}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">
                  {exp.title}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{exp.desc}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {exp.hasHours && (
                  <select
                    value={eqHours}
                    onChange={(e) => setEqHours(Number(e.target.value))}
                    aria-label="Rentang waktu export gempa"
                    className="rounded-lg border border-idic-border bg-idic-bg-2 px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-idic-cyan/50"
                  >
                    {HOUR_OPTIONS.map((o) => (
                      <option
                        key={o.value}
                        value={o.value}
                        className="bg-idic-bg-2"
                      >
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}

                <ExportButton
                  dataset={exp.dataset}
                  fmt="csv"
                  icon={<FileSpreadsheet size={12} aria-hidden />}
                  label="CSV"
                  downloading={downloading}
                  onClick={() => handleExport(exp.dataset, "csv")}
                />
                <ExportButton
                  dataset={exp.dataset}
                  fmt="json"
                  icon={<FileJson size={12} aria-hidden />}
                  label="JSON"
                  downloading={downloading}
                  onClick={() => handleExport(exp.dataset, "json")}
                />
              </div>
            </div>
          ))}

          {exportErr && (
            <p className="px-1 text-[11px] text-idic-red">{exportErr}</p>
          )}
          <p className="px-1 text-[10px] leading-relaxed text-slate-600">
            CSV: Excel-friendly (waktu WIB). JSON: struktur lengkap dengan
            metadata export. Earthquakes maks 5000 baris sesuai rentang.
          </p>
        </div>
      </section>

      {/* ── Diagnostik koneksi ── */}
      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Wifi size={14} className="text-idic-cyan" aria-hidden />
          Connection
        </h2>

        <div className="space-y-3">
          <StatusRow
            icon={<Globe size={14} aria-hidden />}
            label="Backend API"
            value={API_URL}
          />
          <StatusRow
            icon={
              status === "offline" ? (
                <WifiOff size={14} className="text-idic-red" aria-hidden />
              ) : (
                <CheckCircle2
                  size={14}
                  className="text-idic-green"
                  aria-hidden
                />
              )
            }
            label="Health Endpoint"
            value={
              status === "offline"
                ? "Tidak terjangkau"
                : `Status: ${health?.status ?? "…"}`
            }
            ok={status !== "offline"}
          />
          <StatusRow
            icon={
              components?.database === "ok" ? (
                <CheckCircle2
                  size={14}
                  className="text-idic-green"
                  aria-hidden
                />
              ) : (
                <XCircle size={14} className="text-idic-red" aria-hidden />
              )
            }
            label="PostgreSQL"
            value={components?.database ?? "…"}
            ok={components?.database === "ok"}
          />
          <StatusRow
            icon={
              components?.cache === "ok" ? (
                <CheckCircle2
                  size={14}
                  className="text-idic-green"
                  aria-hidden
                />
              ) : (
                <XCircle size={14} className="text-idic-red" aria-hidden />
              )
            }
            label="Redis Cache"
            value={components?.cache ?? "…"}
            ok={components?.cache === "ok"}
          />
          <StatusRow
            icon={
              connection === "live" ? (
                <CheckCircle2
                  size={14}
                  className="text-idic-green"
                  aria-hidden
                />
              ) : (
                <WifiOff size={14} className="text-idic-amber" aria-hidden />
              )
            }
            label="Realtime Stream (SSE)"
            value={
              connection === "live"
                ? "Terhubung — live updates aktif"
                : connection === "reconnecting"
                  ? "Menghubungkan ulang…"
                  : connection
            }
            ok={connection === "live"}
          />
        </div>
      </section>

      {/* ── Data & sumber ── */}
      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Database size={14} className="text-idic-cyan" aria-hidden />
          Data & Sources
        </h2>
        <ul className="space-y-2 text-sm">
          {[
            {
              name: "BMKG TEWS",
              url: "https://data.bmkg.go.id",
              desc: "Gempa realtime resmi",
            },
            {
              name: "USGS FDSN",
              url: "https://earthquake.usgs.gov",
              desc: "Feed seismik internasional",
            },
            {
              name: "Open-Meteo",
              url: "https://open-meteo.com",
              desc: "Cuaca & presipitasi",
            },
            {
              name: "RainViewer",
              url: "https://rainviewer.com",
              desc: "Radar hujan",
            },
          ].map((src) => (
            <li
              key={src.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="text-slate-200">{src.name}</span>
                <span className="ml-2 text-[11px] text-slate-500">
                  {src.desc}
                </span>
              </div>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs text-idic-cyan hover:underline"
              >
                <ExternalLink size={11} aria-hidden />
                {new URL(src.url).hostname}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ── About ── */}
      <section className="rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Info size={14} className="text-idic-cyan" aria-hidden />
          About
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <Meta label="Versi" value={`v${APP_VERSION}`} />
          <Meta label="Frontend" value="Next.js 15" />
          <Meta label="Backend" value="FastAPI" />
          <Meta label="Database" value="PostgreSQL" />
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-idic-amber/25 bg-idic-amber/5 p-3 text-[11px] leading-relaxed text-slate-400">
          <ShieldAlert
            size={14}
            className="mt-0.5 shrink-0 text-idic-amber"
            aria-hidden
          />
          <span>
            Semua data monitoring bersifat informatif. Verifikasi informasi
            penting kepada BMKG dan BNPB. Laporan bencana lapangan
            (banjir/longsor/kebakaran) menunggu sumber resmi yang tersedia
            sebagai API publik.
          </span>
        </p>
      </section>

      <Disclaimer />
    </div>
  );
}

function ExportButton({
  dataset,
  fmt,
  icon,
  label,
  downloading,
  onClick,
}: {
  dataset: string;
  fmt: string;
  icon: React.ReactNode;
  label: string;
  downloading: string | null;
  onClick: () => void;
}) {
  const busy = downloading === `${dataset}:${fmt}`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={downloading !== null}
      className="inline-flex items-center gap-1.5 rounded-lg border border-idic-border px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-idic-cyan/50 hover:text-idic-cyan active:scale-[0.97] disabled:opacity-40"
    >
      {icon}
      {busy ? "…" : label}
    </button>
  );
}

function StatusRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0 text-slate-500">{icon}</span>
        <span className="truncate text-sm text-slate-300">{label}</span>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-xs",
          ok === undefined
            ? "text-slate-400"
            : ok
              ? "text-idic-green"
              : "text-idic-red",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-3 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}
