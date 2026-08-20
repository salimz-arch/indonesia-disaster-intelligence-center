"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "online" | "offline";

interface HealthEnvelope {
  success: boolean;
  timestamp: string;
  data?: {
    status: string;
    environment: string;
    version: string;
  };
}

export function BackendStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    let cancelled = false;

    fetch(`${base}/api/v1/health`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)),
      )
      .then((json: HealthEnvelope) => {
        if (cancelled) return;
        setStatus("online");
        setDetail(
          `v${json.data?.version ?? "?"} · ${json.data?.environment ?? "?"}`,
        );
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statusColor =
    status === "online"
      ? "text-emerald-400"
      : status === "offline"
        ? "text-red-400"
        : "text-slate-400";

  const statusLabel =
    status === "online"
      ? "● ONLINE"
      : status === "offline"
        ? "● OFFLINE"
        : "● CHECKING…";

  return (
    <div className="rounded-2xl border border-[#203B56] bg-[#13263A]/60 p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Backend API
        </span>
        <span className={`text-sm font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        {status === "online" && `Connected — ${detail}`}
        {status === "offline" &&
          "Cannot reach backend. Pastikan uvicorn berjalan di port 8000."}
        {status === "checking" && "Menghubungi backend…"}
      </p>
    </div>
  );
}
