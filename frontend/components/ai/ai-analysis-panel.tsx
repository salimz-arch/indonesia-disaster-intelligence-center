"use client";

import { useMutation } from "@tanstack/react-query";
import { Bot, Loader2, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { RiskGauge } from "@/components/ai/risk-gauge";
import { formatDateTime } from "@/lib/format";
import type { AIAnalysis, ApiEnvelope } from "@/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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
    <section className="min-w-0 rounded-2xl border border-idic-border bg-idic-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
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

      {!analysis && !mutation.isPending && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Bot size={32} className="text-slate-600" aria-hidden />
          <p className="max-w-md text-sm text-slate-400">
            Generate analisis situasi bencana Indonesia berdasarkan data gempa,
            cuaca, dan curah hujan 24 jam terakhir.
          </p>
          {error && <p className="text-xs text-idic-red">{error}</p>}
          <button
            type="button"
            onClick={() => mutation.mutate(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-idic-cyan/40 bg-idic-cyan/10 px-4 py-2 text-sm font-semibold text-idic-cyan transition-colors hover:bg-idic-cyan/20"
          >
            <Sparkles size={14} aria-hidden /> Generate Analysis
          </button>
        </div>
      )}

      {mutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2
            size={28}
            className="animate-spin text-idic-cyan"
            aria-hidden
          />
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Menganalisis data…
          </p>
        </div>
      )}

      {analysis && !mutation.isPending && (
        <>
          <div className="grid gap-6 sm:grid-cols-[auto,1fr]">
            <RiskGauge
              score={analysis.risk_score}
              level={analysis.risk_level}
            />

            <div className="min-w-0 space-y-4">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Current Situation
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  {analysis.current_situation}
                </p>
              </div>

              {analysis.main_factors.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Main Factors
                  </h3>
                  <ul className="mt-1.5 space-y-1">
                    {analysis.main_factors.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-idic-amber"
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
                        className="rounded-md border border-idic-orange/40 bg-idic-orange/10 px-2 py-0.5 text-xs text-idic-orange"
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
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  {analysis.recommended_monitoring}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-idic-border/50 pt-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
              <span>
                Provider: {analysis.provider}
                {analysis.model ? ` (${analysis.model})` : ""}
              </span>
              <span>
                Data: {analysis.data_coverage.earthquakes_24h} gempa ·{" "}
                {analysis.data_coverage.weather_locations} kota ·{" "}
                {analysis.data_coverage.window_hours} jam
              </span>
            </div>
            <button
              type="button"
              onClick={() => mutation.mutate(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-idic-border px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-idic-cyan/50 hover:text-idic-cyan"
            >
              <RefreshCw size={12} aria-hidden /> Analisis Ulang
            </button>
          </div>

          <p className="mt-3 flex items-start gap-2 rounded-xl border border-idic-amber/25 bg-idic-amber/5 p-3 text-[11px] leading-relaxed text-slate-400">
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
              BMKG/bnpb. AI-generated analysis — verify critical information
              with official authorities.
            </span>
          </p>
        </>
      )}
    </section>
  );
}
