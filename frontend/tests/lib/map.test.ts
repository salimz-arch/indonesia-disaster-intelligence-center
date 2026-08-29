import { describe, expect, it } from "vitest";

import { earthquakesToGeoJSON, hasRecentEvents } from "@/lib/map";
import type { Earthquake } from "@/types/api";

function _eq(overrides: Partial<Earthquake>): Earthquake {
  return {
    id: 1,
    provider: "t",
    source_id: "s1",
    magnitude: 4.5,
    depth_km: 20,
    latitude: -2.5,
    longitude: 118.0,
    location_text: "Test",
    region: null,
    event_time: new Date(Date.now() - 30 * 60_000).toISOString(),
    potential_tsunami: false,
    category: "significant",
    severity: "high",
    ...overrides,
  };
}

describe("earthquakesToGeoJSON", () => {
  it("koordinat GeoJSON = [lon, lat] — BUKAN [lat, lon]", () => {
    const geo = earthquakesToGeoJSON([_eq({ longitude: 118, latitude: -2.5 })]);
    expect(geo.features[0].geometry.coordinates).toEqual([118, -2.5]);
  });

  it("recent = event < 60 menit; lama = false", () => {
    const geo = earthquakesToGeoJSON([
      _eq({
        id: 1,
        event_time: new Date(Date.now() - 30 * 60_000).toISOString(),
      }),
      _eq({
        id: 2,
        event_time: new Date(Date.now() - 120 * 60_000).toISOString(),
      }),
    ]);
    expect(geo.features[0].properties.recent).toBe(true);
    expect(geo.features[1].properties.recent).toBe(false);
  });

  it("phase offset dalam [0,1) untuk event recent", () => {
    const geo = earthquakesToGeoJSON([_eq({})]);
    const p = geo.features[0].properties.phase;
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThan(1);
  });
});

describe("hasRecentEvents", () => {
  it("false saat kosong / semua lama, true bila ada recent", () => {
    expect(hasRecentEvents(earthquakesToGeoJSON([]))).toBe(false);

    const old = earthquakesToGeoJSON([
      _eq({ event_time: new Date(Date.now() - 5 * 3600_000).toISOString() }),
    ]);
    expect(hasRecentEvents(old)).toBe(false);

    const fresh = earthquakesToGeoJSON([_eq({})]);
    expect(hasRecentEvents(fresh)).toBe(true);
  });
});
