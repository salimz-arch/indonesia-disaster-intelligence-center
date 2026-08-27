"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { MagnitudeBadge } from "@/components/earthquake/magnitude-badge";
import { formatTime, timeAgo } from "@/lib/format";
import { useRealtimeStore } from "@/stores/realtime-store";
import type { Earthquake } from "@/types/api";

/** Toast slide-in untuk gempa baru signifikan (M≥4.5 / tsunami) — §26.
 *  Notification center penuh menyusul di Step 15. */
export function RealtimeToast() {
  const recent = useRealtimeStore((s) => s.recentEarthquakes);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [visible, setVisible] = useState<Earthquake | null>(null);

  const next = recent.find(
    (eq) =>
      (eq.magnitude >= 4.5 || eq.potential_tsunami) && !dismissed.has(eq.id),
  );

  useEffect(() => {
    if (next && next.id !== visible?.id) {
      setVisible(next);
    }
  }, [next, visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(visible.id));
      setVisible(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 48 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-label="Gempa baru terdeteksi"
          className="fixed bottom-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-idic-orange/50 bg-idic-card/95 p-4 shadow-xl backdrop-blur-md lg:bottom-24 lg:right-6"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-idic-orange">
              Gempa Baru Terdeteksi
            </span>
            <button
              type="button"
              onClick={() => {
                setDismissed((prev) => new Set(prev).add(visible.id));
                setVisible(null);
              }}
              aria-label="Tutup notifikasi"
              className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300"
            >
              <X size={14} aria-hidden />
            </button>
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-2">
            <MagnitudeBadge
              magnitude={visible.magnitude}
              category={visible.category}
            />
            {visible.potential_tsunami && (
              <span className="shrink-0 rounded border border-idic-red/50 bg-idic-red/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-idic-red">
                TSUNAMI
              </span>
            )}
          </div>

          <p className="mt-2 line-clamp-2 break-words text-sm text-slate-300">
            {visible.location_text ??
              `${visible.latitude.toFixed(2)}, ${visible.longitude.toFixed(2)}`}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {formatTime(visible.event_time)} · {timeAgo(visible.event_time)} ·{" "}
            {visible.provider}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
