import type { Map as MLMap } from "maplibre-gl";

import { EQ_LAYERS, asLayerSpec, asSourceSpec } from "@/lib/map";
import type { RadarFrame } from "@/types/api";

export const RADAR_PREFIX = "idic-radar";
const FRAME_INTERVAL_MS = 500;

/** Tile URL RainViewer: size 256, color scheme 2 (universal), smooth+snow 1_1. */
function tileUrl(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}

/**
 * Pre-add semua frame sebagai layer raster (hidden) — animasi hanya
 * toggle visibility → transisi mulus tanpa refetch/flicker.
 * Disisipkan DI BAWAH layer gempa agar marker tetap terbaca.
 */
export function addRadarLayers(
  map: MLMap,
  host: string,
  frames: RadarFrame[],
): number {
  const before = map.getLayer(EQ_LAYERS.cluster)
    ? EQ_LAYERS.cluster
    : undefined;

  frames.forEach((frame, i) => {
    const id = `${RADAR_PREFIX}-${i}`;
    if (map.getLayer(id) || map.getSource(id)) return;
    map.addSource(
      id,
      asSourceSpec({
        type: "raster",
        tiles: [tileUrl(host, frame.path)],
        tileSize: 256,
        attribution: "Radar © RainViewer",
      }),
    );
    map.addLayer(
      asLayerSpec({
        id,
        type: "raster",
        source: id,
        layout: { visibility: "none" },
        paint: { "raster-opacity": 0.55, "raster-fade-duration": 0 },
      }),
      before,
    );
  });
  return frames.length;
}

export function removeRadarLayers(map: MLMap, count: number): void {
  for (let i = 0; i < count; i++) {
    const id = `${RADAR_PREFIX}-${i}`;
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  }
}

/** Loop animasi frame (§11): frame1 → frame2 → … → frame1. */
export function startRadarAnimation(
  map: MLMap,
  frameCount: number,
  onFrame?: (index: number) => void,
): () => void {
  let current = -1;

  const show = (index: number) => {
    for (let i = 0; i < frameCount; i++) {
      const id = `${RADAR_PREFIX}-${i}`;
      if (!map.getLayer(id)) continue;
      map.setLayoutProperty(id, "visibility", i === index ? "visible" : "none");
    }
    current = index;
    onFrame?.(index);
  };

  show(0);
  const timer = window.setInterval(() => {
    show((current + 1) % frameCount);
  }, FRAME_INTERVAL_MS);

  return () => window.clearInterval(timer);
}
