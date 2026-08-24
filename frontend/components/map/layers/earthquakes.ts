import type {
  GeoJSONSource,
  Map as MLMap,
  MapGeoJSONFeature,
} from "maplibre-gl";

import {
  earthquakePopupHtml,
  type QuakePopupData,
} from "@/components/map/popup";
import {
  EQ_LAYERS,
  EQ_SOURCE,
  asLayerSpec,
  asSourceSpec,
  type QuakeFeatureCollection,
} from "@/lib/map";
import { CATEGORY_COLOR } from "@/lib/severity";
import type { MagnitudeCategory } from "@/types/api";

/**
 * HANYA import type dari maplibre-gl di file ini (dihapus saat compile)
 * → aman untuk SSR. Runtime class (Popup) di-inject dari caller.
 */
type MaplibreModule = typeof import("maplibre-gl");

const toPaint = (v: unknown) => v as never;

const magColor = (): unknown[] => [
  "step",
  ["get", "magnitude"],
  CATEGORY_COLOR.low,
  3.0,
  CATEGORY_COLOR.moderate,
  4.0,
  CATEGORY_COLOR.significant,
  5.0,
  CATEGORY_COLOR.strong,
  6.0,
  CATEGORY_COLOR.major,
  7.0,
  CATEGORY_COLOR.severe,
];

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

/** Type guard Point — fix TS2352 (geometry union memuat GeometryCollection). */
function pointCoordinates(feature: MapGeoJSONFeature): [number, number] {
  const geom = feature.geometry;
  if (geom && geom.type === "Point") {
    return geom.coordinates as [number, number];
  }
  return [0, 0];
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

  map.addLayer(
    asLayerSpec({
      id: EQ_LAYERS.clusterCount,
      type: "symbol",
      source: EQ_SOURCE,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Regular"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#F8FAFC",
        "text-halo-color": "#07111F",
        "text-halo-width": 1.2,
      },
    }),
  );

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
        "circle-radius": 8,
        "circle-color": magColor(),
        "circle-opacity": 0.45,
        "circle-blur": 0.35,
      },
    }),
  );

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

/** Interaksi: popup detail, cluster expand, cursor pointer. ml di-inject (SSR-safe). */
export function attachEarthquakeInteractions(
  map: MLMap,
  ml: MaplibreModule,
): void {
  map.on("click", EQ_LAYERS.point, (e) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const coords = pointCoordinates(feature);

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
      maxWidth: "min(260px, 72vw)",
    })
      .setLngLat(coords)
      .setHTML(earthquakePopupHtml(data))
      .addTo(map);
  });

  map.on("click", EQ_LAYERS.cluster, (e) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const coords = pointCoordinates(feature);
    const source = map.getSource(EQ_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;
    void source
      .getClusterExpansionZoom(Number(props.cluster_id))
      .then((zoom: number) => {
        map.easeTo({ center: coords, zoom: Math.min(zoom + 0.2, 10) });
      })
      .catch(() => undefined);
  });

  for (const layerId of [EQ_LAYERS.point, EQ_LAYERS.cluster]) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}
