"use client";

import { Check, Copy, MousePointerClick, X } from "lucide-react";
import { useState } from "react";

import { SourceTag } from "@/components/common/source-tag";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/severity";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { Earthquake } from "@/types/api";

/** Region tampilan: pakai kolom region bila ada; kalau null derive dari
 *  location_text dengan beberapa heuristic yang lebih robust. */
function deriveRegion(region: string | null, loc: string | null): string {
  if (region) return region;
  if (!loc) return "—";

  const byComma = loc
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (byComma.length > 1) {
    return byComma[byComma.length - 1];
  }

  const byDash = loc
    .split("-")
    .map((s) => s.trim())
    .filter(Boolean);
  if (byDash.length > 1) {
    return byDash[byDash.length - 1];
  }

  const words = loc.split(/\s+/).filter(Boolean);
  const stopWords = new Set([
    "di",
    "laut",
    "darat",
    "timur",
    "barat",
    "utara",
    "selatan",
    "berada",
    "pusat",
    "gempa",
    "sekitar",
    "tenggara",
    "baratlaut",
    "timurlaut",
    "baratdaya",
  ]);

  const meaningfulWords = words.filter((w) => !stopWords.has(w.toLowerCase()));
  if (meaningfulWords.length >= 2) {
    return meaningfulWords.slice(-2).join(" ");
  }

  return words[words.length - 1] || "—";
}

export function EarthquakeDetail({
  event,
  onClose,
}: {
  event: Earthquake | null;
  onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (!event) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/earthquake?id=${event.id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia — abaikan
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Event Detail
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-idic-border text-slate-400 hover:border-idic-red/50 hover:text-idic-red xl:hidden"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>

      {!event && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <MousePointerClick size={24} className="text-slate-600" aria-hidden />
          <p className="text-sm text-slate-500">
            Pilih event dari daftar untuk melihat detail
          </p>
        </div>
      )}

      {event && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="font-mono text-4xl font-bold tabular-nums"
              style={{ color: CATEGORY_COLOR[event.category] }}
            >
              M {event.magnitude.toFixed(1)}
            </span>
            <span
              className="rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider"
              style={{
                color: CATEGORY_COLOR[event.category],
                borderColor: `${CATEGORY_COLOR[event.category]}55`,
                backgroundColor: `${CATEGORY_COLOR[event.category]}14`,
              }}
            >
              {CATEGORY_LABEL[event.category]}
            </span>
            {event.potential_tsunami && (
              <span className="rounded border border-idic-red/50 bg-idic-red/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-idic-red">
                TSUNAMI
              </span>
            )}
          </div>

          <p className="mt-3 break-words text-sm leading-relaxed text-slate-300">
            {event.location_text ?? "Lokasi tidak tersedia"}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-2">
            <Info
              label="Kedalaman"
              value={`${Math.round(event.depth_km)} km`}
            />
            <Info
              label="Koordinat"
              value={`${event.latitude.toFixed(2)}, ${event.longitude.toFixed(2)}`}
            />
            <Info label="Provider" value={event.provider} />
            <Info
              label="Wilayah"
              value={deriveRegion(event.region, event.location_text)}
            />
          </dl>

          <div className="mt-4 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Waktu Kejadian
            </div>
            <div className="mt-1 font-mono text-sm tabular-nums text-slate-200">
              {formatDateTime(event.event_time)}
            </div>
            <div className="text-[11px] text-slate-500">
              {timeAgo(event.event_time)}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <SourceTag source={event.provider} timestamp={event.event_time} />
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-idic-border px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan"
            >
              {copied ? (
                <>
                  <Check size={12} aria-hidden /> Tersalin
                </>
              ) : (
                <>
                  <Copy size={12} aria-hidden /> Salin Link
                </>
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 truncate font-mono text-xs tabular-nums text-slate-200">
        {value}
      </dd>
    </div>
  );
}
