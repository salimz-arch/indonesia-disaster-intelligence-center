import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";

import {
  earthquakePopupHtml,
  type QuakePopupData,
} from "@/components/map/popup";

//import { formatDateTime } from "@/lib/format";

import {
  EQ_LAYERS,
  EQ_SOURCE,
  asLayerSpec,
  asSourceSpec,
  type QuakeFeatureCollection,
} from "@/lib/map";

import { CATEGORY_COLOR } from "@/lib/severity";
import type { MagnitudeCategory } from "@/types/api";

type MaplibreModule = typeof import("maplibre-gl");

/** Paint value cast — signature maplibre bervariasi antar versi. */
const toPaint = (v: unknown) => v as never;

/** Warna marker per magnitude — data-driven step (§6). */
const magColor = (): unknown[] => [
  "step",
  ["get", "magnitude"],
  CATEGORY_COLOR.low, // < 3.0
  3.0,
  CATEGORY_COLOR.moderate, // 3.0–3.9
  4.0,
  CATEGORY_COLOR.significant, // 4.0–4.9
  5.0,
  CATEGORY_COLOR.strong, // 5.0–5.9
  6.0,
  CATEGORY_COLOR.major, // 6.0–6.9
  7.0,
  CATEGORY_COLOR.severe, // >= 7.0
];

/** Radius dasar marker (§6: M2 kecil … M7+ besar). */
const magBaseRadius = (): unknown[] => [
  "interpolate",
  ["linear"],
  ["get", "magnitude"],
  2.0,
  5,
  4.0,
  8,
  5.0,
  11,
  6.0,
  15,
  7.5,
  19,
];

/** Pertumbuhan radius ripple per magnitude. */
const magRippleGrowth = (): unknown[] => [
  "interpolate",
  ["linear"],
  ["get", "magnitude"],
  2.0,
  9,
  4.0,
  16,
  5.0,
  22,
  6.0,
  32,
  7.5,
  44,
];

/**
 * Cek apakah GeoJSON memiliki minimal satu event gempa < 60 menit.
 * Dipakai untuk menentukan apakah ripple animation perlu dijalankan.
 */
export function hasRecentEvents(data: QuakeFeatureCollection): boolean {
  return data.features.some((feature) => feature.properties?.recent === true);
}

export function addEarthquakeLayers(
  map: MLMap,
  data: QuakeFeatureCollection,
): void {
  map.addSource(
    EQ_SOURCE,
    asSourceSpec({
      type: "geojson",
      data,
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 5,
    }),
  );

  // Cluster circle (bawah)
  map.addLayer(
    asLayerSpec({
      id: EQ_LAYERS.cluster,
      type: "circle",
      source: EQ_SOURCE,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(34, 211, 238, 0.22)",
        "circle-stroke-color": "rgba(34, 211, 238, 0.65)",
        "circle-stroke-width": 1,
        "circle-radius": ["step", ["get", "point_count"], 15, 10, 21, 25, 27],
      },
    }),
  );

  // Cluster count
  map.addLayer(
    asLayerSpec({
      id: EQ_LAYERS.clusterCount,
      type: "symbol",
      source: EQ_SOURCE,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Bold", "Open Sans Regular"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#F8FAFC",
        "text-halo-color": "#07111F",
        "text-halo-width": 1.2,
      },
    }),
  );

  // Ripple (di bawah marker) — hanya event < 60 menit
  map.addLayer(
    asLayerSpec({
      id: EQ_LAYERS.ripple,
      type: "circle",
      source: EQ_SOURCE,
      filter: [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "recent"], true],
      ],
      paint: {
        "circle-radius": 8, // dianimasikan per frame
        "circle-color": magColor(),
        "circle-opacity": 0.45, // dianimasikan per frame
        "circle-blur": 0.35,
      },
    }),
  );

  // Marker utama (atas)
  map.addLayer(
    asLayerSpec({
      id: EQ_LAYERS.point,
      type: "circle",
      source: EQ_SOURCE,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": magBaseRadius(),
        "circle-color": magColor(),
        "circle-opacity": 0.95,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#0A1626",
      },
    }),
  );
}

export function setEarthquakeData(
  map: MLMap,
  data: QuakeFeatureCollection,
): void {
  const source = map.getSource(EQ_SOURCE) as GeoJSONSource | undefined;

  if (!source) return;

  source.setData(data as unknown as Parameters<GeoJSONSource["setData"]>[0]);
}

/**
 * Ripple animation (§7): muncul → membesar → memudar → repeat.
 * Halus: cycle 2.4s, blur ringan, opacity maks 0.5.
 * Phase offset per event → tidak berdenyut serentak.
 */
export function startRippleAnimation(map: MLMap): () => void {
  const CYCLE_MS = 2400;
  let raf = 0;

  const frame = (t: number) => {
    const pulse = (t % CYCLE_MS) / CYCLE_MS;
    const phase: unknown[] = ["%", ["+", pulse, ["get", "phase"]], 1];

    try {
      map.setPaintProperty(
        EQ_LAYERS.ripple,
        "circle-radius",
        toPaint(["+", magBaseRadius(), ["*", magRippleGrowth(), phase]]),
      );

      map.setPaintProperty(
        EQ_LAYERS.ripple,
        "circle-opacity",
        toPaint(["*", 0.5, ["-", 1, phase]]),
      );
    } catch {
      // race saat data berganti — lewati frame ini
    }

    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  return () => cancelAnimationFrame(raf);
}

/** Interaksi: popup detail, cluster expand, cursor pointer. */
export function attachEarthquakeInteractions(
  map: MLMap,
  getMaplibre: () => MaplibreModule | null,
): void {
  // Marker click → popup (§6)
  map.on("click", EQ_LAYERS.point, (e) => {
    const feature = e.features?.[0];
    const ml = getMaplibre();

    if (!feature || !ml) return;

    const props = (feature.properties ?? {}) as Record<string, unknown>;

    const coords = (
      feature.geometry as unknown as { coordinates: [number, number] }
    ).coordinates;

    const data: QuakePopupData = {
      magnitude: Number(props.magnitude),
      depth_km: Number(props.depth_km),
      location_text:
        props.location_text != null ? String(props.location_text) : null,
      event_time: String(props.event_time),
      provider: String(props.provider ?? "unknown"),
      category: String(props.category ?? "low") as MagnitudeCategory,
      potential_tsunami: props.potential_tsunami === true,
      latitude: coords[1],
      longitude: coords[0],
    };

    new ml.Popup({
      offset: 16,
      closeButton: true,
      closeOnClick: true,
      maxWidth: "280px",
    })
      .setLngLat(coords)
      .setHTML(earthquakePopupHtml(data))
      .addTo(map);
  });

  // Cluster click → zoom expand
  map.on("click", EQ_LAYERS.cluster, (e) => {
    const feature = e.features?.[0];

    if (!feature) return;

    const props = (feature.properties ?? {}) as Record<string, unknown>;

    const coords = (
      feature.geometry as unknown as { coordinates: [number, number] }
    ).coordinates;

    const source = map.getSource(EQ_SOURCE) as GeoJSONSource | undefined;

    if (!source) return;

    void source
      .getClusterExpansionZoom(Number(props.cluster_id))
      .then((zoom: number) => {
        map.easeTo({
          center: coords,
          zoom: Math.min(zoom + 0.2, 10),
        });
      })
      .catch(() => undefined);
  });

  // Cursor pointer pada hover
  for (const layerId of [EQ_LAYERS.point, EQ_LAYERS.cluster]) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}
