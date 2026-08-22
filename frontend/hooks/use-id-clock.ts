"use client";

import { useEffect, useState } from "react";

/** Jam berdetak per detik di zona waktu Indonesia. "" saat SSR → bebas hydration mismatch. */
export function useIdClock(timeZone = "Asia/Jakarta"): string {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return time;
}
