import { create } from "zustand";

import type { Earthquake } from "@/types/api";

export type ConnectionState =
  | "connecting"
  | "live"
  | "degraded"
  | "reconnecting"
  | "offline";

interface RealtimeState {
  connection: ConnectionState;
  lastEventAt: string | null;
  /** Gempa terbaru via SSE — newest first, maks 10 (notifikasi penuh di Step 15). */
  recentEarthquakes: Earthquake[];
  setConnection: (connection: ConnectionState) => void;
  setLastEventAt: (ts: string) => void;
  pushEarthquakes: (events: Earthquake[]) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connection: "connecting",
  lastEventAt: null,
  recentEarthquakes: [],
  setConnection: (connection) => set({ connection }),
  setLastEventAt: (lastEventAt) => set({ lastEventAt }),
  pushEarthquakes: (events) =>
    set((state) => ({
      recentEarthquakes: [...events]
        .reverse()
        .concat(state.recentEarthquakes)
        .slice(0, 10),
    })),
}));
