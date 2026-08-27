"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useRealtimeStore } from "@/stores/realtime-store";
import type { Earthquake } from "@/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const STREAM_URL = `${BASE_URL}/api/v1/stream`;

/** Batas backoff — 1s → 2s → 4s → … → 30s (§29). */
const BACKOFF_CAP_MS = 30_000;

/**
 * Koneksi SSE tunggal untuk seluruh app (dipasang di RealtimeProvider).
 * - onopen → LIVE + resync (invalidasi semua query keluarga realtime)
 * - onerror → close + reconnect exponential backoff (manual, terkontrol)
 * - event → update store + invalidasi query terkait (map/list/KPI ikut segar)
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const setConnection = useRealtimeStore((s) => s.setConnection);
  const setLastEventAt = useRealtimeStore((s) => s.setLastEventAt);
  const pushEarthquakes = useRealtimeStore((s) => s.pushEarthquakes);

  useEffect(() => {
    let es: EventSource | null = null;
    let stopped = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const resync = () => {
      void queryClient.invalidateQueries({ queryKey: ["earthquakes"] });
      void queryClient.invalidateQueries({ queryKey: ["weather"] });
      void queryClient.invalidateQueries({ queryKey: ["rainfall"] });
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
    };

    const connect = () => {
      if (stopped) return;
      es = new EventSource(STREAM_URL);

      es.onopen = () => {
        retry = 0;
        setConnection("live");
        resync(); // tangkap data yang terlewat saat disconnect
      };

      es.onerror = () => {
        es?.close();
        setConnection("reconnecting");
        const delay = Math.min(BACKOFF_CAP_MS, 1000 * 2 ** retry);
        retry += 1;
        timer = setTimeout(connect, delay);
      };

      const onHeartbeat = () => setLastEventAt(new Date().toISOString());

      const onEarthquake = (e: Event) => {
        try {
          const payload = JSON.parse((e as MessageEvent<string>).data) as {
            events: Earthquake[];
          };
          if (payload.events?.length) {
            pushEarthquakes(payload.events);
            void queryClient.invalidateQueries({ queryKey: ["earthquakes"] });
          }
        } catch {
          // payload rusak — abaikan, refetch tetap jalan via siklus polling
        }
        setLastEventAt(new Date().toISOString());
      };

      const onWeather = () => {
        void queryClient.invalidateQueries({ queryKey: ["weather"] });
        void queryClient.invalidateQueries({ queryKey: ["rainfall"] });
        setLastEventAt(new Date().toISOString());
      };

      const onSource = () => {
        void queryClient.invalidateQueries({ queryKey: ["sources"] });
        setLastEventAt(new Date().toISOString());
      };

      es.addEventListener("heartbeat", onHeartbeat);
      es.addEventListener("earthquake.new", onEarthquake);
      es.addEventListener("weather.update", onWeather);
      es.addEventListener("source.status", onSource);
    };

    connect();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      es?.close();
    };
  }, [queryClient, setConnection, setLastEventAt, pushEarthquakes]);
}
