import type {
  MagnitudeCategory,
  RainfallIntensity,
  Severity,
} from "@/types/api";

/** Warna hex — dipakai badge, map marker (Step 8), dan ECharts (Step 14). */
export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#22D3EE",
  moderate: "#38BDF8",
  high: "#F97316",
  critical: "#EF4444",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "LOW",
  moderate: "MODERATE",
  high: "HIGH",
  critical: "CRITICAL",
};

export const CATEGORY_COLOR: Record<MagnitudeCategory, string> = {
  low: "#22D3EE",
  moderate: "#38BDF8",
  significant: "#F59E0B",
  strong: "#F97316",
  major: "#EF4444",
  severe: "#F43F5E",
};

export const CATEGORY_LABEL: Record<MagnitudeCategory, string> = {
  low: "LOW",
  moderate: "MODERATE",
  significant: "SIGNIFICANT",
  strong: "STRONG",
  major: "MAJOR",
  severe: "SEVERE",
};

export const INTENSITY_COLOR: Record<RainfallIntensity, string> = {
  none: "#64748B",
  light: "#38BDF8",
  moderate: "#22D3EE",
  heavy: "#F59E0B",
  very_heavy: "#F97316",
  extreme: "#F43F5E",
};

export const INTENSITY_LABEL: Record<RainfallIntensity, string> = {
  none: "NONE",
  light: "LIGHT",
  moderate: "MODERATE",
  heavy: "HEAVY",
  very_heavy: "VERY HEAVY",
  extreme: "EXTREME",
};
