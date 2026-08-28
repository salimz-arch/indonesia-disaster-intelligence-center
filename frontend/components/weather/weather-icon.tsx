import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { weatherColor } from "@/lib/weather-colors";
import type { WeatherCondition } from "@/types/api";

const ICON_MAP: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  heavy_rain: CloudRain,
  thunderstorm: CloudLightning,
  extreme: CloudHail,
  unknown: Cloud,
};

export function WeatherIcon({
  condition,
  size = 24,
  className,
}: {
  condition: WeatherCondition;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[condition];
  return (
    <Icon
      size={size}
      color={weatherColor(condition)}
      className={className}
      aria-hidden
    />
  );
}

// weatherColor di-reexport agar import lama tetap jalan
export { weatherColor };
