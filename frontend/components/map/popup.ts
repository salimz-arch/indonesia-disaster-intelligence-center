import { formatDateTime } from "@/lib/format";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/severity";
import type { MagnitudeCategory } from "@/types/api";

export interface QuakePopupData {
  magnitude: number;
  depth_km: number;
  location_text: string | null;
  event_time: string;
  provider: string;
  category: MagnitudeCategory;
  potential_tsunami: boolean;
  latitude: number;
  longitude: number;
}

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Semua string dari API di-escape — tidak ada injeksi HTML dari data eksternal. */
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESC[c]);
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:2px 12px 2px 0;color:#94A3B8;font-size:11px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:2px 0;color:#F8FAFC;font-size:12px;">${value}</td>
  </tr>`;
}

/** Popup detail gempa (§6) — tema dark IDIC via CSS override di globals.css. */
export function earthquakePopupHtml(d: QuakePopupData): string {
  const color = CATEGORY_COLOR[d.category];
  const location =
    d.location_text ?? `${d.latitude.toFixed(2)}, ${d.longitude.toFixed(2)}`;

  return `
  <div style="min-width:min(230px,64vw);max-width:100%;background:#13263A;color:#F8FAFC;border-radius:8px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:.18em;color:#94A3B8;">EARTHQUAKE</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
      <span style="font-size:24px;font-weight:700;color:${color};font-variant-numeric:tabular-nums;">M ${d.magnitude.toFixed(1)}</span>
      <span style="font-size:9px;font-weight:700;letter-spacing:.08em;color:${color};border:1px solid ${color}66;background:${color}1A;padding:2px 6px;border-radius:4px;">${CATEGORY_LABEL[d.category]}</span>
      ${d.potential_tsunami ? '<span style="font-size:9px;font-weight:700;letter-spacing:.08em;color:#F43F5E;border:1px solid #F43F5E66;background:#F43F5E1A;padding:2px 6px;border-radius:4px;">TSUNAMI</span>' : ""}
    </div>
    <table style="margin-top:10px;border-collapse:collapse;">
      ${row("Depth", `${Math.round(d.depth_km)} km`)}
      ${row("Location", esc(location))}
      ${row("Time", esc(formatDateTime(d.event_time)))}
    </table>
    <div style="margin-top:8px;font-size:10px;color:#64748B;">Source: ${esc(d.provider)}</div>
  </div>`;
}
