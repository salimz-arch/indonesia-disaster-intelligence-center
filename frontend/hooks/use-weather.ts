"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type {
  ListData,
  LocationItem,
  RainfallObservation,
  WeatherObservation,
} from "@/types/api";

export function useLatestWeather() {
  return useQuery({
    queryKey: ["weather", "latest"],
    queryFn: () => apiGet<ListData<WeatherObservation>>("/weather"),
    refetchInterval: 5 * 60_000,
  });
}

export function useLatestRainfall() {
  return useQuery({
    queryKey: ["rainfall", "latest"],
    queryFn: () => apiGet<ListData<RainfallObservation>>("/rainfall"),
    refetchInterval: 5 * 60_000,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => apiGet<ListData<LocationItem>>("/locations"),
    staleTime: 10 * 60_000, // lokasi jarang berubah
  });
}
