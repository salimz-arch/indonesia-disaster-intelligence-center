import type { RiskLevel } from "@/types/api";

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: "#22C55E",
  moderate: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "LOW",
  moderate: "MODERATE",
  high: "HIGH",
  critical: "CRITICAL",
};
