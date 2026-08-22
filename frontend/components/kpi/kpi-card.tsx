"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";

import { CardSkeleton } from "@/components/common/states";

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

/** KPI card §15 — count-up animation via framer-motion spring (§26). */
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
      className="rounded-2xl border border-idic-border bg-idic-card p-5"
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ color: accent, backgroundColor: `${accent}14` }}
        >
          <Icon size={18} aria-hidden />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        {value === null ? (
          <span className="font-mono text-3xl text-slate-600">—</span>
        ) : (
          <motion.span className="font-mono text-3xl font-semibold tabular-nums">
            {display}
          </motion.span>
        )}
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>

      {error && <div className="mt-1 text-[11px] text-idic-red">{error}</div>}

      {footer && <div className="mt-3">{footer}</div>}
    </motion.div>
  );
}
