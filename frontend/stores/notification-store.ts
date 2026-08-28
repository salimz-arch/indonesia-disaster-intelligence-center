import { create } from "zustand";
import type { AlertItem } from "@/types/api";

const MAX_NOTIFICATIONS = 50;
const LAST_READ_KEY = "idic-notif-last-read";
const BROWSER_ENABLED_KEY = "idic-browser-notif";

function getLastRead(): number {
  if (typeof window === "undefined") return Date.now();
  return Number(localStorage.getItem(LAST_READ_KEY) ?? 0);
}
function loadBrowserEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BROWSER_ENABLED_KEY) === "true";
}

interface NotificationState {
  notifications: AlertItem[];
  unreadIds: number[];
  seeded: boolean;
  browserEnabled: boolean;
  addAlert: (alert: AlertItem) => void;
  seedNotifications: (alerts: AlertItem[]) => void;
  markAllRead: () => void;
  setBrowserEnabled: (v: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadIds: [],
  seeded: false,
  browserEnabled: loadBrowserEnabled(),
  addAlert: (alert) =>
    set((s) => {
      if (s.notifications.some((n) => n.id === alert.id)) return s;
      return {
        notifications: [alert, ...s.notifications].slice(0, MAX_NOTIFICATIONS),
        unreadIds: s.unreadIds.includes(alert.id)
          ? s.unreadIds
          : [...s.unreadIds, alert.id],
      };
    }),
  seedNotifications: (alerts) =>
    set((s) => {
      if (s.seeded) return s;
      const lastRead = getLastRead();
      const unread = alerts
        .filter((a) => new Date(a.triggered_at).getTime() > lastRead)
        .map((a) => a.id);
      return {
        notifications: alerts.slice(0, MAX_NOTIFICATIONS),
        unreadIds: unread,
        seeded: true,
      };
    }),
  markAllRead: () => {
    if (typeof window !== "undefined")
      localStorage.setItem(LAST_READ_KEY, String(Date.now()));
    set({ unreadIds: [] });
  },
  setBrowserEnabled: (v) => {
    if (typeof window !== "undefined")
      localStorage.setItem(BROWSER_ENABLED_KEY, String(v));
    set({ browserEnabled: v });
  },
}));
