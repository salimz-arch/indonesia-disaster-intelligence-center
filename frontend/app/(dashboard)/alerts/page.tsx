"use client";
import { Clock, History, Siren } from "lucide-react";
import { Disclaimer } from "@/components/common/disclaimer";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/common/states";
import { PageHeader } from "@/components/common/page-header";
import { useActiveAlerts, useAlertHistory } from "@/hooks/use-alerts";
import { formatDateTime, timeAgo } from "@/lib/format";
import {
  ALERT_SEVERITY_COLOR,
  ALERT_SEVERITY_LABEL,
  isAlertActive,
} from "@/lib/severity";

export default function AlertsPage() {
  const active = useActiveAlerts();
  const history = useAlertHistory(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts & Notifications"
        description="Peringatan otomatis dari data monitoring — gempa signifikan & curah hujan ekstrem"
      />

      <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Siren size={14} className="text-idic-red" aria-hidden /> Active
          Alerts
          {active.data && (
            <span className="ml-1 rounded-full bg-idic-bg-2 px-2 py-0.5 text-[10px] text-slate-400">
              {active.data.data.total}
            </span>
          )}
        </h2>
        {active.isLoading && <ListSkeleton rows={2} />}
        {active.isError && (
          <ErrorState
            message={
              active.error instanceof Error
                ? active.error.message
                : "Gagal memuat"
            }
            onRetry={() => active.refetch()}
          />
        )}
        {active.data && active.data.data.items.length === 0 && (
          <EmptyState
            title="Tidak ada alert aktif"
            description="Alert dibuat otomatis saat gempa M≥5.0, berpotensi tsunami, atau intensitas hujan sangat lebat terdeteksi."
          />
        )}
        {active.data && active.data.data.items.length > 0 && (
          <ul className="space-y-3">
            {active.data.data.items.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border p-4"
                style={{
                  borderColor: `${ALERT_SEVERITY_COLOR[a.severity]}44`,
                  backgroundColor: `${ALERT_SEVERITY_COLOR[a.severity]}0A`,
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest"
                    style={{
                      color: ALERT_SEVERITY_COLOR[a.severity],
                      borderColor: `${ALERT_SEVERITY_COLOR[a.severity]}55`,
                      backgroundColor: `${ALERT_SEVERITY_COLOR[a.severity]}14`,
                    }}
                  >
                    {ALERT_SEVERITY_LABEL[a.severity]}
                  </span>
                  <span className="min-w-0 text-sm font-semibold text-slate-100">
                    {a.title}
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                    <Clock size={11} aria-hidden /> {timeAgo(a.triggered_at)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {a.message}
                </p>
                <p className="mt-2 text-[10px] text-slate-500">
                  {formatDateTime(a.triggered_at)} · Sumber: {a.source}
                  {a.expires_at &&
                    ` · berlaku hingga ${formatDateTime(a.expires_at)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <History size={14} className="text-idic-cyan" aria-hidden /> History —
          50 terakhir
        </h2>
        {history.isLoading && <ListSkeleton rows={4} />}
        {history.isError && (
          <ErrorState
            message={
              history.error instanceof Error
                ? history.error.message
                : "Gagal memuat"
            }
            onRetry={() => history.refetch()}
          />
        )}
        {history.data && history.data.data.items.length === 0 && (
          <EmptyState title="Belum ada riwayat alert" />
        )}
        {history.data && history.data.data.items.length > 0 && (
          <ul className="divide-y divide-idic-border/50">
            {history.data.data.items.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-2.5">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ALERT_SEVERITY_COLOR[a.severity] }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-200">
                      {a.title}
                    </span>
                    <span
                      className="shrink-0 text-[9px] font-bold tracking-wide"
                      style={{ color: ALERT_SEVERITY_COLOR[a.severity] }}
                    >
                      {ALERT_SEVERITY_LABEL[a.severity]}
                    </span>
                    {!isAlertActive(a) && (
                      <span className="shrink-0 rounded bg-idic-bg-2 px-1.5 py-0.5 text-[9px] text-slate-500">
                        EXPIRED
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {formatDateTime(a.triggered_at)} · {a.source}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-slate-600">
                  {timeAgo(a.triggered_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Disclaimer />
    </div>
  );
}
