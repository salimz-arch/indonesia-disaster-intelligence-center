"use client";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { isAlertActive } from "@/lib/severity";
import { useNotificationStore } from "@/stores/notification-store";

export function AlertBanner() {
  const notifications = useNotificationStore((s) => s.notifications);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const critical = notifications.find(
    (a) =>
      a.severity === "critical" && isAlertActive(a) && !dismissed.has(a.id),
  );
  if (!critical) return null;

  return (
    <div
      role="alert"
      className="flex shrink-0 items-center gap-3 border-b border-idic-red/40 bg-idic-red/10 px-4 py-2 lg:px-6"
    >
      <AlertTriangle size={16} className="shrink-0 text-idic-red" aria-hidden />
      <div className="min-w-0 flex-1 text-xs">
        <span className="font-bold tracking-widest text-idic-red">
          CRITICAL
        </span>
        <span className="mx-2 text-idic-border">|</span>
        <span className="font-medium text-slate-200">{critical.title}</span>
        {critical.location_text && (
          <span className="ml-2 text-slate-400">
            — {critical.location_text}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed((prev) => new Set(prev).add(critical.id))}
        aria-label="Tutup banner"
        className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
