"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Database,
  HeartPulse,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import { RiskGauge } from "@/components/ai/risk-gauge";
import { formatDateTime } from "@/lib/format";
import type { AIAnalysis, ApiEnvelope } from "@/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const FEATURES = [
  {
    icon: Database,
    title: "Data Terpadu",
    subtitle: "Gempa · Cuaca · Hujan",
    color: "#22D3EE",
  },
  {
    icon: HeartPulse,
    title: "Penilaian Risiko",
    subtitle: "Akurat · Terkini · Terpadu",
    color: "#22C55E",
  },
  {
    icon: MapPin,
    title: "Prioritas Wilayah",
    subtitle: "Fokus · Efektif · Responsif",
    color: "#F97316",
  },
];

export function AiAnalysisPanel() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (force: boolean) => {
      const res = await fetch(
        `${BASE_URL}/api/v1/ai/analyze${force ? "?force=true" : ""}`,
        { method: "POST" },
      );
      const body = (await res.json()) as ApiEnvelope<AIAnalysis>;
      if (!body.success || !body.data) {
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      return body.data;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Gagal analisis"),
  });

  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border border-idic-border bg-idic-card p-5">
      {/* Glow dekoratif */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-idic-cyan/5 blur-3xl"
        aria-hidden
      />

      {/* Header */}
      <div className="relative mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Sparkles size={14} className="text-idic-cyan" aria-hidden />
          AI Situation Analysis
        </h2>
        {analysis && (
          <span className="text-[10px] text-slate-500">
            {formatDateTime(analysis.generated_at)}
          </span>
        )}
      </div>

      {/* ═══ STATE AWAL ═══ */}
      {!analysis && !mutation.isPending && (
        <div className="relative flex flex-col items-center gap-5 py-8 text-center">
          {/* ── Ikon Globe + EKG ── */}
          <div className="relative">
            {/* Ring luar berdenyut */}
            <div
              className="absolute -inset-3 animate-ping rounded-full border border-idic-cyan/20 [animation-duration:3s]"
              aria-hidden
            />
            <div
              className="absolute -inset-6 rounded-full border border-idic-cyan/10"
              aria-hidden
            />
            <svg
              viewBox="0 0 64 64"
              className="relative h-20 w-20 text-idic-cyan"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {/* Globe */}
              <circle cx="32" cy="32" r="26" className="opacity-60" />
              {/* Garis lintang */}
              <ellipse cx="32" cy="32" rx="26" ry="10" className="opacity-40" />
              <ellipse cx="32" cy="32" rx="12" ry="26" className="opacity-40" />
              {/* EKG heartbeat di tengah */}
              <path
                d="M14 32h8l3-8 4 16 4-12 3 4h14"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-idic-cyan"
              >
                <animate
                  attributeName="stroke-dasharray"
                  values="0,100;100,0;0,100"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>

          {/* Judul + deskripsi */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-100">
              Analisis Situasi Bencana Indonesia
            </h3>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500">
              Menggabungkan data gempa, cuaca, dan curah hujan 24 jam terakhir
              menjadi satu gambaran risiko terpadu dengan prioritas wilayah.
            </p>
          </div>

          {error && (
            <p className="max-w-md break-words rounded-lg border border-idic-red/40 bg-idic-red/10 px-3 py-2 text-xs text-idic-red">
              {error}
            </p>
          )}

          {/* Tombol generate */}
          <button
            type="button"
            onClick={() => mutation.mutate(false)}
            disabled={mutation.isPending}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl
              border border-idic-cyan/40 bg-gradient-to-r from-idic-cyan/15 to-idic-blue/10
              px-6 py-2.5 text-sm font-semibold text-idic-cyan transition-all duration-300
              hover:border-idic-cyan/60 hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]
              active:scale-[0.98] disabled:opacity-50"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden
            />
            <Sparkles
              size={15}
              className="transition-transform duration-300 group-hover:rotate-12"
              aria-hidden
            />
            Generate Analysis
          </button>

          {/* ── 3 kartu fitur ── */}
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-idic-border/60 bg-idic-bg-2/50 p-4"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ color: f.color, backgroundColor: `${f.color}14` }}
                >
                  <f.icon size={16} aria-hidden />
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {f.title}
                </span>
                <span className="text-[10px] text-slate-500">{f.subtitle}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {mutation.isPending && (
        <div className="relative flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <div
              className="absolute inset-0 animate-ping rounded-full bg-idic-cyan/20 blur-lg"
              aria-hidden
            />
            <Loader2
              size={30}
              className="relative animate-spin text-idic-cyan"
              aria-hidden
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-idic-cyan/80">
            Menganalisis Data
            <span className="animate-pulse">…</span>
          </p>
          <p className="text-[10px] text-slate-600">
            Gempa · Cuaca · Curah Hujan · Risk Engine
          </p>
        </div>
      )}

      {/* ═══ HASIL ═══ */}
      {analysis && !mutation.isPending && (
        <>
          <div className="relative grid gap-6 sm:grid-cols-[auto,1fr]">
            <RiskGauge
              score={analysis.risk_score}
              level={analysis.risk_level}
            />

            <div className="min-w-0 space-y-4">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Current Situation
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                  {analysis.current_situation}
                </p>
              </div>

              {analysis.main_factors.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Main Factors
                  </h3>
                  <ul className="mt-1.5 space-y-1.5">
                    {analysis.main_factors.map((f, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm leading-relaxed text-slate-300"
                      >
                        <span
                          className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-idic-amber shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                          aria-hidden
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.areas_of_concern.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Areas of Concern
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {analysis.areas_of_concern.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-idic-orange/40 bg-idic-orange/10 px-2 py-0.5 text-xs font-medium text-idic-orange transition-colors hover:bg-idic-orange/20"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Recommended Monitoring
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                  {analysis.recommended_monitoring}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-idic-border/50 pt-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
              <span>
                Provider: {analysis.provider}
                {analysis.model ? ` (${analysis.model})` : ""}
              </span>
              <span className="text-idic-border">|</span>
              <span>
                {analysis.data_coverage.earthquakes_24h} gempa ·{" "}
                {analysis.data_coverage.weather_locations} kota ·{" "}
                {analysis.data_coverage.window_hours} jam
              </span>
            </div>
            <button
              type="button"
              onClick={() => mutation.mutate(true)}
              disabled={mutation.isPending}
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-idic-border
                px-3 py-1.5 text-xs font-medium text-slate-400 transition-all duration-200
                hover:border-idic-cyan/50 hover:text-idic-cyan hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]
                active:scale-[0.97] disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className="transition-transform duration-500 group-hover:rotate-180"
                aria-hidden
              />
              Analisis Ulang
            </button>
          </div>

          {/* Fallback notice */}
          {analysis.fallback_used && analysis.provider_error && (
            <p className="relative mt-3 flex items-start gap-2 rounded-xl border border-idic-amber/30 bg-idic-amber/5 p-3 text-[11px] leading-relaxed text-slate-400">
              <TriangleAlert
                size={14}
                className="mt-0.5 shrink-0 text-idic-amber"
                aria-hidden
              />
              <span>
                Provider utama gagal — analisis dijatuhkan ke rule-based.
                Alasan:{" "}
                <span className="break-words">{analysis.provider_error}</span>
              </span>
            </p>
          )}

          {/* Disclaimer — wajib (§18) */}
          <p className="relative mt-3 flex items-start gap-2 rounded-xl border border-idic-amber/25 bg-idic-amber/5 p-3 text-[11px] leading-relaxed text-slate-400">
            <ShieldAlert
              size={14}
              className="mt-0.5 shrink-0 text-idic-amber"
              aria-hidden
            />
            <span>
              <strong className="text-slate-300">
                Internal Monitoring Score
              </strong>{" "}
              — bukan prediksi bencana dan bukan peringatan resmi.{" "}
              {analysis.limitations} Verifikasi informasi penting kepada
              BMKG/BNPB. AI-generated analysis — verify critical information
              with official authorities.
            </span>
          </p>
        </>
      )}
    </section>
  );
}
