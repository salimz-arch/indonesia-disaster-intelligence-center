"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";

import { CardSkeleton } from "@/components/common/states";
import {} from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number | null;
  unit?: string;
  accent?: string;
  loading?: boolean;
  error?: string | null;
  format?: (v: number) => string;
  footer?: React.ReactNode;
}

/**
 * KPI card §15 — count-up animation (§26).
 * Mobile-safe: grid item root wajib min-w-0 agar track grid tidak dipaksa
 * melebar oleh min-content label/nilai.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  accent = "#22D3EE",
  loading,
  error,
  format,
  footer,
}: KpiCardProps) {
  const spring = useSpring(0, { stiffness: 90, damping: 22 });
  const display = useTransform(spring, (v) =>
    format ? format(v) : Math.round(v).toLocaleString("id-ID"),
  );

  useEffect(() => {
    if (value !== null) spring.set(value);
  }, [value, spring]);

  if (loading) return <CardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-w-0 w-full max-w-full rounded-2xl border border-idic-border bg-idic-card p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ color: accent, backgroundColor: `${accent}14` }}
        >
          <Icon size={18} aria-hidden />
        </span>
        {/* min-w-0 + wrap: di kartu sempit label patah ke 2 baris, tidak mendorong lebar */}
        <span className="min-w-0 text-right text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:text-[11px] sm:tracking-widest">
          {label}
        </span>
      </div>

      <div className="mt-3 flex min-w-0 items-baseline gap-1.5">
        {value === null ? (
          <span className="font-mono text-3xl text-slate-600">—</span>
        ) : (
          <motion.span className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
            {display}
          </motion.span>
        )}
        {unit && (
          <span className="shrink-0 text-sm text-slate-400">{unit}</span>
        )}
      </div>

      {error && <div className="mt-1 text-[11px] text-idic-red">{error}</div>}

      {footer && <div className="mt-3 min-w-0">{footer}</div>}
    </motion.div>
  );
}
