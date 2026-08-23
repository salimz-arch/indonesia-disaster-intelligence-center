"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";

import {
  addEarthquakeLayers,
  attachEarthquakeInteractions,
  hasRecentEvents,
  setEarthquakeData,
  startRippleAnimation,
} from "@/components/map/layers/earthquakes";
import {
  addRadarLayers,
  removeRadarLayers,
  startRadarAnimation,
} from "@/components/map/layers/radar";
import { MapControls, MapLegend } from "@/components/map/map-controls";
import { useEarthquakes } from "@/hooks/use-earthquakes";
import { useRadar } from "@/hooks/use-radar";
import {
  DEFAULT_ZOOM,
  EQ_SOURCE,
  INDONESIA_BBOX,
  INDONESIA_CENTER,
  INDONESIA_MAX_BOUNDS,
  MAP_STYLE_URL,
  earthquakesToGeoJSON,
} from "@/lib/map";
import { cn } from "@/lib/utils";

type MaplibreModule = typeof import("maplibre-gl");

/**
 * Peta monitoring interaktif — self-contained (fetch data sendiri),
 * dipakai oleh Overview (compact) dan halaman /map (full).
 */
export function EarthquakeMap({
  variant = "full",
}: {
  variant?: "compact" | "full";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const maplibreRef = useRef<MaplibreModule | null>(null);
  const stopRippleRef = useRef<(() => void) | null>(null);
  const stopRadarRef = useRef<(() => void) | null>(null);
  const radarLayerCountRef = useRef(0);

  const [mapReady, setMapReady] = useState(false);
  const [hours, setHours] = useState(24);
  const [radarOn, setRadarOn] = useState(false);
  const [radarFrame, setRadarFrame] = useState<number | null>(null);

  // ── Data ──
  const quakes = useEarthquakes(hours, 200);
  const radar = useRadar(radarOn);

  const earthquakes = useMemo(
    () => quakes.data?.data.items ?? [],
    [quakes.data],
  );
  const radarData = radar.data?.data ?? null;

  // ── Init map (sekali) — maplibre di-import dinamis (lazy chunk + SSR-safe) ──
  useEffect(() => {
    let cancelled = false;
    let map: MLMap | null = null;

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      map = new maplibre.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: INDONESIA_CENTER,
        zoom: DEFAULT_ZOOM,
        maxBounds: INDONESIA_MAX_BOUNDS,
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }));
      map.fitBounds(INDONESIA_BBOX, { padding: 32, duration: 0 });

      // Tile/style error (jaringan) — log ringan, jangan crash UI
      map.on("error", (e) => {
        console.warn("[map]", e.error?.message ?? "map error");
      });

      map.on("load", () => {
        if (cancelled) return;
        maplibreRef.current = maplibre;
        mapRef.current = map;
        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      stopRippleRef.current?.();
      stopRippleRef.current = null;
      stopRadarRef.current?.();
      stopRadarRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Layer gempa + update data + kelola ripple ──
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const geo = earthquakesToGeoJSON(earthquakes);

    if (!map.getSource(EQ_SOURCE)) {
      addEarthquakeLayers(map, geo);
      attachEarthquakeInteractions(map, () => maplibreRef.current);
    } else {
      setEarthquakeData(map, geo);
    }

    // Ripple hanya bila ada event < 60 menit — loop mati kalau tidak perlu
    stopRippleRef.current?.();
    stopRippleRef.current = null;
    if (hasRecentEvents(geo)) {
      stopRippleRef.current = startRippleAnimation(map);
    }
  }, [mapReady, earthquakes]);

  // ── Layer radar + animasi frame ──
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    // Bersihkan state radar lama (toggle off ATAU frames baru dari refetch)
    stopRadarRef.current?.();
    stopRadarRef.current = null;
    if (radarLayerCountRef.current > 0) {
      removeRadarLayers(map, radarLayerCountRef.current);
      radarLayerCountRef.current = 0;
    }
    setRadarFrame(null);

    if (radarOn && radarData && radarData.frames.length > 0) {
      radarLayerCountRef.current = addRadarLayers(
        map,
        radarData.host,
        radarData.frames,
      );
      stopRadarRef.current = startRadarAnimation(
        map,
        radarData.frames.length,
        setRadarFrame,
      );
    }
  }, [mapReady, radarOn, radarData]);

  const frameLabel = useMemo(() => {
    if (!radarOn || radarFrame === null || !radarData) return null;
    const frame = radarData.frames[radarFrame];
    if (!frame) return null;
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(frame.time * 1000));
    return { time: `${time} WIB`, nowcast: frame.kind === "nowcast" };
  }, [radarOn, radarFrame, radarData]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-idic-border bg-idic-bg-2",
        variant === "compact"
          ? "h-[360px] sm:h-[420px]"
          : "h-full min-h-[440px]",
      )}
    >
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Peta monitoring bencana Indonesia"
      />

      <MapControls
        hours={hours}
        onHoursChange={setHours}
        radarOn={radarOn}
        onRadarToggle={() => setRadarOn((v) => !v)}
        radarLoading={radarOn && radar.isLoading}
        radarError={radar.isError}
        frameLabel={frameLabel}
        quakesLoading={quakes.isLoading}
        quakesError={quakes.isError}
        onRetryQuakes={() => void quakes.refetch()}
      />

      <MapLegend />
    </div>
  );
}
