import { describe, expect, it } from "vitest";

import { rainfallIntensityClient } from "@/lib/rainfall-client";
import {
  ALERT_SEVERITY_LABEL,
  CATEGORY_COLOR,
  INTENSITY_COLOR,
  isAlertActive,
  SEVERITY_COLOR,
} from "@/lib/severity";
import { WEATHER_CONDITION_META, weatherColor } from "@/lib/weather-colors";
import type {
  MagnitudeCategory,
  RainfallIntensity,
  WeatherCondition,
} from "@/types/api";

describe("rainfallIntensityClient — boundary persis (mirror backend)", () => {
  it.each([
    [0, "none"],
    [0.5, "light"],
    [1, "light"],
    [1.1, "moderate"],
    [5, "moderate"],
    [5.1, "heavy"],
    [10, "heavy"],
    [10.1, "very_heavy"],
    [20, "very_heavy"],
    [20.1, "extreme"],
  ] as [number, RainfallIntensity][])("%s mm/jam → %s", (mm, expected) => {
    expect(rainfallIntensityClient(mm)).toBe(expected);
  });
});

describe("peta warna — lengkap untuk semua nilai union", () => {
  it("CATEGORY_COLOR mencakup semua MagnitudeCategory", () => {
    const categories: MagnitudeCategory[] = [
      "low",
      "moderate",
      "significant",
      "strong",
      "major",
      "severe",
    ];
    for (const c of categories) expect(CATEGORY_COLOR[c]).toMatch(/^#/);
  });

  it("INTENSITY_COLOR mencakup semua RainfallIntensity", () => {
    const keys: RainfallIntensity[] = [
      "none",
      "light",
      "moderate",
      "heavy",
      "very_heavy",
      "extreme",
    ];
    for (const k of keys) expect(INTENSITY_COLOR[k]).toMatch(/^#/);
  });

  it("SEVERITY & ALERT label tidak kosong", () => {
    expect(SEVERITY_COLOR.critical).toBe("#EF4444");
    expect(ALERT_SEVERITY_LABEL.critical).toBe("CRITICAL");
  });
});

describe("WEATHER_CONDITION_META — palet terpusat", () => {
  it("semua kondisi punya label & warna valid", () => {
    const codes: WeatherCondition[] = [
      "clear",
      "partly_cloudy",
      "cloudy",
      "fog",
      "drizzle",
      "rain",
      "heavy_rain",
      "thunderstorm",
      "extreme",
      "unknown",
    ];
    for (const c of codes) {
      expect(WEATHER_CONDITION_META[c].label).toBeTruthy();
      expect(WEATHER_CONDITION_META[c].color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("warna sesuai spesifikasi user", () => {
    expect(WEATHER_CONDITION_META.clear.color).toBe("#F2A51A");
    expect(WEATHER_CONDITION_META.rain.color).toBe("#347FAF");
    expect(WEATHER_CONDITION_META.thunderstorm.color).toBe("#7479A8");
  });

  it("fallback kode tak dikenal", () => {
    expect(weatherColor("bogus")).toBe(WEATHER_CONDITION_META.unknown.color);
  });
});

describe("isAlertActive", () => {
  it("null expires = aktif selamanya", () => {
    expect(isAlertActive({ expires_at: null })).toBe(true);
  });

  it("masa depan = aktif, lewat = tidak", () => {
    const future = new Date(Date.now() + 3600_000).toISOString();
    const past = new Date(Date.now() - 3600_000).toISOString();
    expect(isAlertActive({ expires_at: future })).toBe(true);
    expect(isAlertActive({ expires_at: past })).toBe(false);
  });
});
