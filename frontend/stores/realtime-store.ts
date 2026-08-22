import { create } from "zustand";

export type ConnectionState =
  | "connecting"
  | "live"
  | "degraded"
  | "reconnecting"
  | "offline";

interface RealtimeState {
  connection: ConnectionState;
  setConnection: (connection: ConnectionState) => void;
}

/** Store realtime — Step 12 mengisi event SSE di sini. */
export const useRealtimeStore = create<RealtimeState>((set) => ({
  connection: "connecting",
  setConnection: (connection) => set({ connection }),
}));
