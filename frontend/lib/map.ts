import type { Map as MLMap, StyleSpecification } from "maplibre-gl";

import type { Earthquake, MagnitudeCategory } from "@/types/api";

/** CARTO Dark Matter GL — label terang & tajam (primary, jika vector tile reachable). */
export const MAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Probe resource dengan timeout. */
async function probeUrl(url: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/**
 * Esri World Dark Gray — gratis, TANPA API key, dark theme, semua zoom level.
 * Dua source: base (garis/area) + reference (label terang).
 * URL tile Esri: {z}/{y}/{x} — y SEBELUM x.
 */
export function buildEsriDarkStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      "esri-dark-base": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 16,
        attribution: "© Esri, © OpenStreetMap contributors",
      },
      "esri-dark-labels": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 16,
        attribution: "",
      },
    },
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": "#07111F" },
      },
      { id: "esri-base", type: "raster", source: "esri-dark-base" },
      { id: "esri-labels", type: "raster", source: "esri-dark-labels" },
    ],
  };
}

/** OSM dim — fallback universal. */
export function buildFallbackStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      "osm-dark": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": "#07111F" },
      },
      {
        id: "osm-dark-tiles",
        type: "raster",
        source: "osm-dark",
        paint: {
          "raster-saturation": -1,
          "raster-brightness-max": 0.55,
          "raster-contrast": 0.15,
          "raster-opacity": 0.9,
        },
      },
    ],
  };
}

/** Minimal — semua tile CDN diblokir: dark bg + marker saja. */
export function buildMinimalStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {},
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": "#0D1B2A" },
      },
    ],
  };
}

let _styleCache: { style: StyleSpecification; name: string } | null = null;

/**
 * Ladder basemap berbasis PROBE aktual:
 * carto-gl (vector) → esri-dark (raster, no API key) → osm → minimal.
 */
export async function loadMapStyle(): Promise<{
  style: StyleSpecification;
  name: string;
}> {
  if (_styleCache) return _styleCache;

  let result: { style: StyleSpecification; name: string };

  if (
    await probeUrl(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/4/5/8",
    )
  ) {
    result = { style: buildEsriDarkStyle(), name: "esri-dark" };
  } else if (await probeUrl("https://tile.openstreetmap.org/4/8/5.png")) {
    result = { style: buildFallbackStyle(), name: "osm-fallback" };
  } else {
    result = { style: buildMinimalStyle(), name: "minimal" };
  }

  console.log("[map] basemap dipilih:", result.name);
  _styleCache = result;
  return result;
}

export const INDONESIA_CENTER: [number, number] = [117.5, -2.3];
export const INDONESIA_BBOX: [[number, number], [number, number]] = [
  [94.5, -11.2],
  [141.5, 6.5],
];
export const DEFAULT_ZOOM = 4.1;

/** Event lebih baru dari ini (menit) → ripple aktif (§7). */
export const RIPPLE_WINDOW_MINUTES = 60;

export const EQ_SOURCE = "idic-earthquakes";
export const EQ_LAYERS = {
  cluster: "idic-eq-cluster",
  clusterCount: "idic-eq-cluster-count",
  ripple: "idic-eq-ripple",
  point: "idic-eq-point",
} as const;

// ── GeoJSON internal ──

export interface QuakeProperties {
  id: number;
  magnitude: number;
  depth_km: number;
  location_text: string | null;
  event_time: string;
  provider: string;
  category: MagnitudeCategory;
  potential_tsunami: boolean;
  recent: boolean;
  phase: number;
}

export interface QuakeFeature {
  type: "Feature";
  id: number;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: QuakeProperties;
}

export interface QuakeFeatureCollection {
  type: "FeatureCollection";
  features: QuakeFeature[];
}

export function earthquakesToGeoJSON(
  earthquakes: Earthquake[],
  now = Date.now(),
): QuakeFeatureCollection {
  return {
    type: "FeatureCollection",
    features: earthquakes.map((eq) => {
      const ts = new Date(eq.event_time).getTime();
      const recent = now - ts <= RIPPLE_WINDOW_MINUTES * 60_000;
      return {
        type: "Feature" as const,
        id: eq.id,
        geometry: {
          type: "Point" as const,
          coordinates: [eq.longitude, eq.latitude],
        },
        properties: {
          id: eq.id,
          magnitude: eq.magnitude,
          depth_km: eq.depth_km,
          location_text: eq.location_text,
          event_time: eq.event_time,
          provider: eq.provider,
          category: eq.category,
          potential_tsunami: eq.potential_tsunami,
          recent,
          phase: recent ? (ts / 2000) % 1 : 0,
        },
      };
    }),
  };
}

export function hasRecentEvents(geo: QuakeFeatureCollection): boolean {
  return geo.features.some((f) => f.properties.recent);
}

// ── Cast helpers ──

type AnyLayer = Parameters<MLMap["addLayer"]>[0];
type AnySource = Parameters<MLMap["addSource"]>[1];

export function asLayerSpec(spec: Record<string, unknown>): AnyLayer {
  return spec as unknown as AnyLayer;
}

export function asSourceSpec(spec: Record<string, unknown>): AnySource {
  return spec as unknown as AnySource;
}
