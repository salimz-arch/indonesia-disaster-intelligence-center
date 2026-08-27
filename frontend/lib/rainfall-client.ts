import type { RainfallIntensity } from "@/types/api";

/** Mirror dari backend rainfall_intensity() — klasifikasi visual internal. */
export function rainfallIntensityClient(mmPerHour: number): RainfallIntensity {
  if (mmPerHour <= 0) return "none";
  if (mmPerHour <= 1) return "light";
  if (mmPerHour <= 5) return "moderate";
  if (mmPerHour <= 10) return "heavy";
  if (mmPerHour <= 20) return "very_heavy";
  return "extreme";
}
