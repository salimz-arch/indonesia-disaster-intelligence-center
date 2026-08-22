"use client";

import { useIdClock } from "@/hooks/use-id-clock";
import { useSystemStatus } from "@/hooks/use-system-status";
import { LiveBadge } from "@/components/common/live-badge";
import { APP_SHORT } from "@/lib/constants";

export function Header() {
  const time = useIdClock("Asia/Jakarta");
  const { status } = useSystemStatus();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 px-4 lg:gap-4 lg:px-6">
      {/* Mobile identity */}
      <div className="flex shrink-0 items-center gap-2 lg:hidden">
        <span aria-hidden>🇮🇩</span>
        <span className="text-sm font-bold tracking-widest">{APP_SHORT}</span>
      </div>

      <div className="hidden text-[11px] uppercase tracking-[0.2em] text-slate-500 lg:block">
        Indonesia Disaster Intelligence Center
      </div>

      <div className="flex min-w-0 items-center gap-3 lg:gap-4">
        <LiveBadge status={status} />
        {/* text-xs di mobile agar badge RECONNECTING + jam tetap muat di 375px */}
        <div className="whitespace-nowrap font-mono text-xs tabular-nums text-slate-300 sm:text-sm">
          {time ? `${time} WIB` : "--:--:-- WIB"}
        </div>
      </div>
    </header>
  );
}
