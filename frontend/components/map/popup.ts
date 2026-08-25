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

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESC[c]);
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:5px 14px 5px 0;color:#64748B;font-size:11px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:5px 14px;color:#F8FAFC;font-size:12px;">${value}</td>
  </tr>`;
}

export function earthquakePopupHtml(d: QuakePopupData): string {
  const color = CATEGORY_COLOR[d.category];
  const loc =
    d.location_text ?? `${d.latitude.toFixed(2)}, ${d.longitude.toFixed(2)}`;
  const tsunami = d.potential_tsunami
    ? `<span style="font-size:8px;font-weight:700;color:#F43F5E;border:1px solid #F43F5E55;background:#F43F5E14;padding:2px 6px;border-radius:4px;">TSUNAMI</span>`
    : "";

  return `
  <div style="
    min-width:min(240px,68vw);max-width:100%;
    background:#13263A;color:#F8FAFC;
    border:1px solid #2A4A6B;border-radius:10px;
    padding:0;font-family:var(--font-geist-sans),system-ui,sans-serif;
    overflow:hidden;
  ">
    <div style="padding:10px 14px;border-bottom:1px solid #1E3550;">
      <div style="font-size:9px;font-weight:700;letter-spacing:.2em;color:#64748B;">EARTHQUAKE</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
        <span style="font-size:22px;font-weight:700;color:${color};font-variant-numeric:tabular-nums;">M ${d.magnitude.toFixed(1)}</span>
        <span style="font-size:8px;font-weight:700;letter-spacing:.06em;color:${color};border:1px solid ${color}55;background:${color}14;padding:2px 6px;border-radius:4px;">${CATEGORY_LABEL[d.category]}</span>
        ${tsunami}
      </div>
    </div>
    <table style="border-collapse:collapse;width:100%;">
      ${row("Depth", `${Math.round(d.depth_km)} km`)}
      ${row("Location", esc(loc))}
      ${row("Time", esc(formatDateTime(d.event_time)))}
    </table>
    <div style="padding:5px 14px;border-top:1px solid #1E3550;font-size:9px;color:#475569;">
      Source: ${esc(d.provider)} · IDIC
    </div>
  </div>`;
}
