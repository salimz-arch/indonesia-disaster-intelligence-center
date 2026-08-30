"use client";

import {
  Bell,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe,
  Info,
  MonitorSmartphone,
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
import { useNotificationStore } from "@/stores/notification-store";
import { useRealtimeStore } from "@/stores/realtime-store";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function SettingsPage() {
  const { status, health } = useSystemStatus();
  const connection = useRealtimeStore((s) => s.connection);
  const browserEnabled = useNotificationStore((s) => s.browserEnabled);
  const setBrowserEnabled = useNotificationStore((s) => s.setBrowserEnabled);

  const [permState, setPermState] = useState<
    NotificationPermission | "unsupported"
  >("default");

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

  const components = health?.components;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Preferensi notifikasi, diagnostik koneksi, dan informasi sistem"
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
              (gempa M≥7 / berpotensi tsunami). Tidak pernah spam —
              anti-frekuensi tinggi.
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
            disabled={permState === "unsupported" || permState === "denied"}
            className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-40 ${
              browserEnabled && permState === "granted"
                ? "border-idic-cyan/60 bg-idic-cyan/30"
                : "border-idic-border bg-idic-bg-2"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-transform ${
                browserEnabled && permState === "granted"
                  ? "translate-x-[22px] bg-idic-cyan"
                  : "translate-x-0.5 bg-slate-500"
              }`}
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
        className={`shrink-0 font-mono text-xs ${
          ok === undefined
            ? "text-slate-400"
            : ok
              ? "text-idic-green"
              : "text-idic-red"
        }`}
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
