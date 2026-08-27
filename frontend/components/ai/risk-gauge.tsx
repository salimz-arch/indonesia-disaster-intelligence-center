"use client";

import { motion } from "framer-motion";

import { RISK_COLOR, RISK_LABEL } from "@/lib/risk";
import type { RiskLevel } from "@/types/api";

/** Gauge setengah lingkaran — skor & level Internal Monitoring Score. */
export function RiskGauge({
  score,
  level,
}: {
  score: number;
  level: RiskLevel;
}) {
  const color = RISK_COLOR[level];
  // Setengah lingkaran: -90° (kiri) → +90° (kanan)
  const angle = -90 + (score / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 60,
    cy = 60,
    r = 46;
  const nx = cx + r * Math.sin(rad);
  const ny = cy - r * Math.cos(rad);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 120 72"
        className="w-40"
        role="img"
        aria-label={`Risk score ${score} dari 100 — level ${RISK_LABEL[level]}`}
      >
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#203B56"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Arc progres */}
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: score / 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Jarum */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        <circle cx={cx} cy={cy} r="4" fill={color} />
      </svg>
      <div className="-mt-4 text-center">
        <div
          className="font-mono text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </div>
        <div
          className="mt-0.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
          style={{
            color,
            borderColor: `${color}55`,
            backgroundColor: `${color}14`,
          }}
        >
          {RISK_LABEL[level]}
        </div>
      </div>
    </div>
  );
}
