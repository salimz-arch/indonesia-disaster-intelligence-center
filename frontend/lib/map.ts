import type { Map as MLMap, StyleSpecification } from "maplibre-gl";

import type { Earthquake, MagnitudeCategory } from "@/types/api";

/** CARTO Dark Matter GL — label terang & tajam (primary). */
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

interface VectorLikeSource {
  type: string;
  tiles?: string[];
}

/**
 * Muat GL style + probe SATU tile vector aktual dari URL pattern style
 * (bukan asumsi): style.json bisa 200 sementara tile-nya diblokir jaringan.
 * Lolos probe → GL vector (label terang). Gagal → null (ladder lanjut).
 */
async function loadGlStyle(): Promise<StyleSpecification | null> {
  try {
    const res = await fetch(MAP_STYLE_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const style = (await res.json()) as StyleSpecification & {
      sources: Record<string, VectorLikeSource>;
    };

    const vectorSource = Object.values(style.sources ?? {}).find(
      (s) =>
        s?.type === "vector" && Array.isArray(s.tiles) && s.tiles.length > 0,
    );
    if (!vectorSource?.tiles) return null;

    const sampleTile = vectorSource.tiles[0]
      .replace("{z}", "4")
      .replace("{x}", "8")
      .replace("{y}", "5");
    if (!(await probeUrl(sampleTile))) return null;

    return style;
  } catch {
    return null;
  }
}

/** CARTO raster dark — label tertanam di tile, tanpa dependency vector. */
export function buildCartoRasterStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      "carto-raster": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors © CARTO",
      },
    },
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": "#07111F" },
      },
      { id: "carto-dark-tiles", type: "raster", source: "carto-raster" },
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
 * carto-gl (vector, label terang) → carto-raster → osm → minimal.
 * Hasil di-cache per page load.
 */
export async function loadMapStyle(): Promise<{
  style: StyleSpecification;
  name: string;
}> {
  if (_styleCache) return _styleCache;

  let result: { style: StyleSpecification; name: string };

  const gl = await loadGlStyle();
  if (gl) {
    result = { style: gl, name: "carto-gl" };
  } else if (
    await probeUrl("https://a.basemaps.cartocdn.com/dark_all/4/8/5.png")
  ) {
    result = { style: buildCartoRasterStyle(), name: "carto-raster" };
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
