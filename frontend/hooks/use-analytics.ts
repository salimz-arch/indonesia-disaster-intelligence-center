"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type {
  EarthquakeAnalytics,
  RainfallAnalytics,
  WeatherAnalytics,
} from "@/types/api";

export function useAnalyticsEarthquakes(days: number) {
  return useQuery({
    queryKey: ["analytics", "earthquakes", days],
    queryFn: () =>
      apiGet<EarthquakeAnalytics>(`/analytics/earthquakes?days=${days}`),
    staleTime: 5 * 60_000,
  });
}
export function useAnalyticsRainfall(days: number) {
  return useQuery({
    queryKey: ["analytics", "rainfall", days],
    queryFn: () =>
      apiGet<RainfallAnalytics>(`/analytics/rainfall?days=${days}`),
    staleTime: 5 * 60_000,
  });
}
export function useAnalyticsWeather(days: number) {
  return useQuery({
    queryKey: ["analytics", "weather", days],
    queryFn: () => apiGet<WeatherAnalytics>(`/analytics/weather?days=${days}`),
    staleTime: 5 * 60_000,
  });
}
