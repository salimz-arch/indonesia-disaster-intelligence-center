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

import type { WeatherCondition } from "@/types/api";

const MAP: Record<WeatherCondition, { icon: LucideIcon; color: string }> = {
  clear: { icon: Sun, color: "#F59E0B" },
  partly_cloudy: { icon: CloudSun, color: "#F59E0B" },
  cloudy: { icon: Cloud, color: "#94A3B8" },
  fog: { icon: CloudFog, color: "#94A3B8" },
  drizzle: { icon: CloudDrizzle, color: "#38BDF8" },
  rain: { icon: CloudRain, color: "#38BDF8" },
  heavy_rain: { icon: CloudRain, color: "#F97316" },
  thunderstorm: { icon: CloudLightning, color: "#F43F5E" },
  extreme: { icon: CloudHail, color: "#F43F5E" },
  unknown: { icon: Cloud, color: "#64748B" },
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
  const { icon: Icon, color } = MAP[condition];
  return <Icon size={size} color={color} className={className} aria-hidden />;
}

export function weatherColor(condition: WeatherCondition): string {
  return MAP[condition].color;
}
