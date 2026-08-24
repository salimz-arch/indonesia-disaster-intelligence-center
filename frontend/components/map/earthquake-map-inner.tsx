"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MLMap } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  addEarthquakeLayers,
  attachEarthquakeInteractions,
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
  earthquakesToGeoJSON,
  hasRecentEvents,
  loadMapStyle,
} from "@/lib/map";
import { cn } from "@/lib/utils";
import type { RadarFrame } from "@/types/api";

type MaplibreModule = typeof import("maplibre-gl");

/** Dipakai Overview (compact) & halaman /peta (full). Semua kegagalan tampil eksplisit. */
export function EarthquakeMapInner({
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
  const [initError, setInitError] = useState<string | null>(null);
  const [basemap, setBasemap] = useState<"carto" | "fallback">("carto");
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

  const radarFrames = useMemo<RadarFrame[]>(() => {
    if (!radarData?.frames) return [];
    return [...radarData.frames].sort((a, b) => a.time - b.time);
  }, [radarData]);

  // ── Init map — maplibre dinamis DI DALAM effect (SSR-safe) + error terlihat ──
  useEffect(() => {
    console.log("[map] effect STARTED"); // ← TAMBAHKAN INI UNTUK DIAGNOSTIK
    let cancelled = false;
    let map: MLMap | null = null;
    let observer: ResizeObserver | null = null;

    void (async () => {
      try {
        // 1. maplibre runtime — hanya di browser, tidak pernah di server
        const ml = await import("maplibre-gl");
        // 2. style basemap dengan fallback chain
        const { style, name } = await loadMapStyle();
        if (cancelled || !containerRef.current) return;

        maplibreRef.current = ml;
        setBasemap(name === "carto-dark" ? "carto" : "fallback");

        map = new ml.Map({
          container: containerRef.current,
          style,
          center: INDONESIA_CENTER,
          zoom: DEFAULT_ZOOM,
          maxBounds: INDONESIA_MAX_BOUNDS,
        });
        map.addControl(new ml.NavigationControl({ showCompass: false }));
        map.fitBounds(INDONESIA_BBOX, { padding: 32, duration: 0 });

        map.on("error", (e) => {
          console.warn("[map]", e?.error?.message ?? "map error");
        });

        map.on("load", () => {
          if (cancelled) return;
          // Diagnostik: ukuran canvas + jumlah layer — paste ke saya jika bermasalah
          console.log(
            "[map] loaded — canvas:",
            map?.getCanvas().width,
            "x",
            map?.getCanvas().height,
            "| style layers:",
            map?.getStyle().layers.length,
          );
          mapRef.current = map;
          setMapReady(true);
        });

        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          observer = new ResizeObserver(() => map?.resize());
          observer.observe(containerRef.current);
        }
      } catch (err) {
        console.error("[map] INIT FAILED:", err);
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      stopRippleRef.current?.();
      stopRippleRef.current = null;
      stopRadarRef.current?.();
      stopRadarRef.current = null;
      map?.remove();
      mapRef.current = null;
      maplibreRef.current = null;
    };
  }, []);

  // ── Layer gempa + update data + kelola ripple ──
  useEffect(() => {
    const map = mapRef.current;
    const ml = maplibreRef.current;
    if (!mapReady || !map || !ml) return;

    const geo = earthquakesToGeoJSON(earthquakes);

    if (!map.getSource(EQ_SOURCE)) {
      addEarthquakeLayers(map, geo);
      attachEarthquakeInteractions(map, ml);
    } else {
      setEarthquakeData(map, geo);
    }

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

    stopRadarRef.current?.();
    stopRadarRef.current = null;
    if (radarLayerCountRef.current > 0) {
      removeRadarLayers(map, radarLayerCountRef.current);
      radarLayerCountRef.current = 0;
    }
    setRadarFrame(null);

    if (radarOn && radarData && radarFrames.length > 0) {
      radarLayerCountRef.current = addRadarLayers(
        map,
        radarData.host,
        radarFrames,
      );
      stopRadarRef.current = startRadarAnimation(
        map,
        radarFrames.length,
        setRadarFrame,
      );
    }
  }, [mapReady, radarOn, radarFrames, radarData]);

  const frameLabel = useMemo(() => {
    if (!radarOn || radarFrame === null || radarFrames.length === 0)
      return null;
    const frame = radarFrames[radarFrame];
    if (!frame) return null;
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(frame.time * 1000));
    return { time: `${time} WIB`, nowcast: frame.kind === "nowcast" };
  }, [radarOn, radarFrame, radarFrames]);

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

      {/* Kegagalan init TIDAK lagi bisu — tampil eksplisit */}
      {initError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="max-w-sm rounded-xl border border-idic-red/40 bg-idic-bg-2/95 p-4 text-center">
            <div className="text-xs font-bold tracking-widest text-idic-red">
              MAP INIT FAILED
            </div>
            <p className="mt-2 break-words text-xs leading-relaxed text-slate-400">
              {initError}
            </p>
          </div>
        </div>
      )}

      {basemap === "fallback" && !initError && (
        <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-lg border border-idic-border bg-idic-bg-2/90 px-2.5 py-1 text-[10px] text-slate-500">
          basemap fallback: OSM
        </span>
      )}
    </div>
  );
}
