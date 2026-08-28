"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notification-store";
import { useRealtimeStore } from "@/stores/realtime-store";
import type { AlertItem, Earthquake } from "@/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const STREAM_URL = `${BASE_URL}/api/v1/stream`;
const BACKOFF_CAP_MS = 30_000;

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
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    };

    const connect = () => {
      if (stopped) return;
      es = new EventSource(STREAM_URL);
      es.onopen = () => {
        retry = 0;
        setConnection("live");
        resync();
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
        } catch (err) {
          void err;
        }
        setLastEventAt(new Date().toISOString());
      };
      const onAlert = (e: Event) => {
        try {
          const alert = JSON.parse(
            (e as MessageEvent<string>).data,
          ) as AlertItem;
          useNotificationStore.getState().addAlert(alert);
          void queryClient.invalidateQueries({ queryKey: ["alerts"] });

          const { browserEnabled } = useNotificationStore.getState();
          if (
            alert.severity === "critical" &&
            browserEnabled &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(alert.title, {
              body: alert.message,
              tag: `idic-alert-${alert.id}`,
            });
          }
        } catch (err) {
          void err;
        }
        setLastEventAt(new Date().toISOString());
      };
      const onWeather = () => {
        void queryClient.invalidateQueries({
          queryKey: ["weather", "rainfall"],
        });
        setLastEventAt(new Date().toISOString());
      };
      const onSource = () => {
        void queryClient.invalidateQueries({ queryKey: ["sources"] });
        setLastEventAt(new Date().toISOString());
      };

      es.addEventListener("heartbeat", onHeartbeat);
      es.addEventListener("earthquake.new", onEarthquake);
      es.addEventListener("alert.new", onAlert);
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
