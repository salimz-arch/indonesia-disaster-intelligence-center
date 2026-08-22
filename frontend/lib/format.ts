/** ═══ Presentation-layer formatting — UTC (DB) → WIB/WITA/WIT (§13-14) ═══ */

const TZ_LABELS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

export function tzLabel(timeZone: string): string {
  return TZ_LABELS[timeZone] ?? "";
}

/** "14:30:15 WIB" — pakai timeZone eksplisit, deterministik untuk user non-Indonesia. */
export function formatTime(iso: string, timeZone = "Asia/Jakarta"): string {
  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return `${t} ${tzLabel(timeZone)}`;
}

/** "21 Agu 2026, 14:30 WIB" */
export function formatDateTime(iso: string, timeZone = "Asia/Jakarta"): string {
  const d = new Intl.DateTimeFormat("id-ID", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return `${d}, ${t} ${tzLabel(timeZone)}`;
}

/** "8 mnt lalu" / "3 jam lalu" — hanya di client (Date.now). */
export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export function formatMagnitude(m: number): string {
  return `M ${m.toFixed(1)}`;
}

export function formatNumber(n: number, maxFractionDigits = 1): string {
  return n.toLocaleString("id-ID", {
    maximumFractionDigits: maxFractionDigits,
  });
}

/** "18 km" / "140 km" */
export function formatDepth(km: number): string {
  return `${Math.round(km)} km`;
}
