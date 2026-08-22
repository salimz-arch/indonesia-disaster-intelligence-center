import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/stores/realtime-store";

const CONFIG: Record<
  ConnectionState,
  { label: string; classes: string; dot: string; pulse: boolean }
> = {
  live: {
    label: "LIVE",
    classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    pulse: true,
  },
  degraded: {
    label: "DEGRADED",
    classes: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    pulse: false,
  },
  reconnecting: {
    label: "RECONNECTING…",
    classes: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    pulse: true,
  },
  offline: {
    label: "OFFLINE",
    classes: "border-red-500/40 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
    pulse: false,
  },
  connecting: {
    label: "CONNECTING…",
    classes: "border-slate-500/40 bg-slate-500/10 text-slate-400",
    dot: "bg-slate-400",
    pulse: false,
  },
};

/** Indikator koneksi §16 — ikon/animasi + TEKS (§27). */
export function LiveBadge({ status }: { status: ConnectionState }) {
  const cfg = CONFIG[status];
  return (
    <div
      role="status"
      aria-label={`Connection status: ${cfg.label}`}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:gap-2 sm:px-3 sm:text-xs sm:tracking-wide",
        cfg.classes,
      )}
    >
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              cfg.dot,
            )}
          />
        )}
        <span
          className={cn("relative inline-flex h-2 w-2 rounded-full", cfg.dot)}
        />
      </span>
      {cfg.label}
    </div>
  );
}
