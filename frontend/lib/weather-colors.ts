/** ═══ Palet warna kondisi cuaca — SATU sumber kebenaran untuk seluruh app ═══
 *  Dipakai: weather-icon, weather-animation, city-card, condition-donut.
 *  Ubah di sini → semua modul ikut.
 */
export const WEATHER_CONDITION_META: Record<
  string,
  { label: string; color: string }
> = {
  clear: { label: "Cerah", color: "#F2A51A" },
  partly_cloudy: { label: "Berawan Sebagian", color: "#9AAAC0" },
  cloudy: { label: "Berawan", color: "#667B91" },
  fog: { label: "Kabut", color: "#8B9DC3" },
  drizzle: { label: "Gerimis", color: "#4BAED8" },
  rain: { label: "Hujan", color: "#347FAF" },
  heavy_rain: { label: "Hujan Lebat", color: "#2C5F8A" },
  thunderstorm: { label: "Badai Petir", color: "#7479A8" },
  extreme: { label: "Ekstrem", color: "#8B4A9E" },
  unknown: { label: "Tidak Diketahui", color: "#475569" },
};

export function weatherColor(code: string): string {
  return (
    WEATHER_CONDITION_META[code]?.color ?? WEATHER_CONDITION_META.unknown.color
  );
}

export function weatherLabel(code: string): string {
  return WEATHER_CONDITION_META[code]?.label ?? code;
}
