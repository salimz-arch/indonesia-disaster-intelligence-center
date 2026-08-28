"use client";
import { Bell, BellRing, Check, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { ALERT_SEVERITY_COLOR, ALERT_SEVERITY_LABEL } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import type { AlertItem, ListData } from "@/types/api";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadIds = useNotificationStore((s) => s.unreadIds);
  const seeded = useNotificationStore((s) => s.seeded);
  const seedNotifications = useNotificationStore((s) => s.seedNotifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const browserEnabled = useNotificationStore((s) => s.browserEnabled);
  const setBrowserEnabled = useNotificationStore((s) => s.setBrowserEnabled);

  useEffect(() => {
    if (seeded) return;
    void apiGet<ListData<AlertItem>>("/alerts")
      .then((r) => seedNotifications(r.data.items))
      .catch(() => seedNotifications([]));
  }, [seeded, seedNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = unreadIds.length;
  const browserSupported =
    typeof window !== "undefined" && "Notification" in window;

  async function requestPermission() {
    if (!browserSupported) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") setBrowserEnabled(true);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifikasi${unread > 0 ? ` — ${unread} belum dibaca` : ""}`}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
      >
        {unread > 0 ? (
          <BellRing size={17} className="text-idic-amber" aria-hidden />
        ) : (
          <Bell size={17} aria-hidden />
        )}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-idic-red px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-idic-border bg-idic-bg-2 shadow-2xl">
          <div className="flex items-center justify-between border-b border-idic-border px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-idic-cyan hover:underline"
              >
                <Check size={11} aria-hidden /> Tandai dibaca
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">
                Belum ada notifikasi
              </p>
            ) : (
              <ul className="divide-y divide-idic-border/50">
                {notifications.slice(0, 10).map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-3",
                      unreadIds.includes(n.id) && "bg-white/[0.03]",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: ALERT_SEVERITY_COLOR[n.severity],
                        }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="shrink-0 text-[9px] font-bold tracking-wide"
                            style={{ color: ALERT_SEVERITY_COLOR[n.severity] }}
                          >
                            {ALERT_SEVERITY_LABEL[n.severity]}
                          </span>
                          {unreadIds.includes(n.id) && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-idic-cyan"
                              aria-label="baru"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-200">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-600">
                          {timeAgoSafe(n.triggered_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2 border-t border-idic-border px-4 py-3">
            {browserSupported && Notification.permission !== "granted" && (
              <button
                type="button"
                onClick={requestPermission}
                className="flex w-full items-center gap-2 rounded-lg border border-idic-border px-3 py-2 text-xs text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan"
              >
                <MonitorSmartphone size={13} aria-hidden /> Aktifkan Notifikasi
                Browser
              </button>
            )}
            {browserSupported && Notification.permission === "granted" && (
              <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <MonitorSmartphone size={13} aria-hidden /> Notifikasi Browser
                  (CRITICAL saja)
                </span>
                <input
                  type="checkbox"
                  checked={browserEnabled}
                  onChange={(e) => setBrowserEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 accent-idic-cyan"
                />
              </label>
            )}
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-idic-cyan hover:underline"
            >
              Lihat Semua Alert →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgoSafe(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}
