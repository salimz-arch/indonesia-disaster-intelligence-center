import type { Map as MLMap, StyleSpecification } from "maplibre-gl";
import type { Earthquake, MagnitudeCategory } from "@/types/api";

/** CARTO Dark Matter (GL) — primary. Attribution ©OSM ©CARTO dari metadata. */
export const MAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Fallback: raster OSM yang di-dim (grayscale + gelap) — cocok tema dark. */
export function buildFallbackStyle(): StyleSpecification {
  return {
    version: 8,
    // Glyphs tetap disertakan untuk symbol layer (cluster count).
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
          "raster-saturation": -1, // grayscale
          "raster-brightness-max": 0.55, // dim → dark theme
          "raster-contrast": 0.15,
          "raster-opacity": 0.9,
        },
      },
    ],
  };
}

/**
 * Muat style basemap dengan fallback:
 * 1. fetch CARTO dark GL → 2. gagal → fallback raster OSM dim → 3. gagal → style minimal.
 * Map TIDAK PERNAH blank karena style gagal.
 */
export async function loadMapStyle(): Promise<{
  style: StyleSpecification;
  name: string;
}> {
  try {
    const res = await fetch(MAP_STYLE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const style = (await res.json()) as StyleSpecification;
    return { style, name: "carto-dark" };
  } catch {
    return { style: buildFallbackStyle(), name: "osm-fallback" };
  }
}

export const INDONESIA_CENTER: [number, number] = [117.5, -2.3];
export const INDONESIA_BBOX: [[number, number], [number, number]] = [
  [94.5, -11.2],
  [141.5, 6.5],
];
/** Batas pan — longgar agar nyaman, user tetap terorientasi ke Indonesia. */
export const INDONESIA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [85.0, -20.0],
  [152.0, 15.0],
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

// ── GeoJSON internal (struktural — tanpa import @types/geojson) ──

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
  /** Offset fase 0..1 → ripple tiap event berdenyut dengan jeda berbeda */
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

// ── Cast helpers: layer/source spec JSON → tipe maplibre yang ketat ──

type AnyLayer = Parameters<MLMap["addLayer"]>[0];
type AnySource = Parameters<MLMap["addSource"]>[1];

export function asLayerSpec(spec: Record<string, unknown>): AnyLayer {
  return spec as unknown as AnyLayer;
}

export function asSourceSpec(spec: Record<string, unknown>): AnySource {
  return spec as unknown as AnySource;
}
