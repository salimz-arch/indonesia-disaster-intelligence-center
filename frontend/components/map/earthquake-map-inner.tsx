"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Map as MLMap, NavigationControl } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

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
  earthquakesToGeoJSON,
  loadMapStyle,
} from "@/lib/map";
import { cn } from "@/lib/utils";
import type { RadarFrame } from "@/types/api";

export function EarthquakeMapInner({
  variant = "full",
}: {
  variant?: "compact" | "full";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const stopRippleRef = useRef<(() => void) | null>(null);
  const stopRadarRef = useRef<(() => void) | null>(null);
  const radarLayerCountRef = useRef(0);
  const userInteractedRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [basemap, setBasemap] = useState("carto-gl");
  const [hours, setHours] = useState(24);
  const [radarOn, setRadarOn] = useState(false);
  const [radarFrame, setRadarFrame] = useState<number | null>(null);

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

  // ── Init ──
  useEffect(() => {
    let cancelled = false;
    let map: MLMap | null = null;
    let observer: ResizeObserver | null = null;

    const fitIndonesia = (m: MLMap) => {
      m.fitBounds(INDONESIA_BBOX, { padding: 32, duration: 0, maxZoom: 5.5 });
    };

    void (async () => {
      try {
        const { style, name } = await loadMapStyle();
        if (cancelled || !containerRef.current) return;

        setBasemap(name);

        map = new MLMap({
          container: containerRef.current,
          style,
          center: INDONESIA_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: 1.8,
        });

        map.on("error", (e) => {
          console.warn("[map]", e?.error?.message ?? "map error");
        });

        map.on("dragstart", () => {
          userInteractedRef.current = true;
        });
        map.on("wheel", () => {
          userInteractedRef.current = true;
        });

        map.on("load", () => {
          const m = map;
          if (cancelled || !m) return;

          m.resize();
          fitIndonesia(m);
          m.addControl(
            new NavigationControl({ showCompass: false }),
            "bottom-right",
          );

          mapRef.current = m;
          setMapReady(true);

          // Layout bisa selesai satu frame setelah load — fit ulang di rAF
          requestAnimationFrame(() => {
            if (cancelled || userInteractedRef.current) return;
            m.resize();
            fitIndonesia(m);
          });
        });

        // Container bisa berukuran basi pra-layout → resize + refit kamera
        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          observer = new ResizeObserver(() => {
            map?.resize();
            if (map && !userInteractedRef.current) {
              fitIndonesia(map);
            }
          });
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
    };
  }, []);

  // ── Layer gempa + ripple ──
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const geo = earthquakesToGeoJSON(earthquakes);

    if (!map.getSource(EQ_SOURCE)) {
      addEarthquakeLayers(map, geo);
      attachEarthquakeInteractions(map);
    } else {
      setEarthquakeData(map, geo);
    }

    stopRippleRef.current?.();
    stopRippleRef.current = null;
    if (hasRecentEvents(geo)) {
      stopRippleRef.current = startRippleAnimation(map);
    }
  }, [mapReady, earthquakes]);

  // ── Layer radar + animasi ──
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
    const diffMin = Math.round((frame.time * 1000 - Date.now()) / 60_000);
    let relative: string;
    if (Math.abs(diffMin) <= 10) {
      relative = "TERKINI";
    } else if (diffMin > 0) {
      relative = `+${diffMin} mnt`;
    } else {
      relative = `${diffMin} mnt`;
    }
    return { time: `${time} WIB`, relative, nowcast: frame.kind === "nowcast" };
  }, [radarOn, radarFrame, radarFrames]);

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border border-idic-border bg-idic-bg-2",
        variant === "compact"
          ? "h-[360px] sm:h-[420px]"
          : "h-[calc(100dvh_-_215px)] min-h-[440px] lg:h-[calc(100dvh_-_140px)]",
      )}
    >
      {/* Inline style: position absolute tidak bisa ditimpa .maplibregl-map
          { position: relative } — penyebab container 0-height. */}
      <div
        ref={containerRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
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

      {initError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="max-w-sm rounded-xl border border-idic-red/40 bg-idic-bg-2/95 p-4 text-center">
            <div className="text-xs font-bold tracking-widest text-idic-red">
              MAP INIT FAILED
            </div>
            <p className="mt-2 break-words text-xs text-slate-400">
              {initError}
            </p>
          </div>
        </div>
      )}

      {!initError && basemap === "osm-fallback" && (
        <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-lg border border-idic-border bg-idic-bg-2/90 px-2.5 py-1 text-[10px] text-slate-500">
          basemap fallback: OSM
        </span>
      )}

      {!initError && basemap === "minimal" && (
        <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-lg border border-idic-amber/40 bg-idic-amber/10 px-2.5 py-1 text-[10px] text-idic-amber">
          basemap unavailable — jaringan memblokir tile CDN
        </span>
      )}
    </div>
  );
}
