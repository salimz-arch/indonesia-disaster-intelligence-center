import { Database } from "lucide-react";

import { formatDateTime, timeAgo } from "@/lib/format";

/** Transparansi sumber data: provider + timestamp + umur data (§40). */
export function SourceTag({
  source,
  timestamp,
  timeZone = "Asia/Jakarta",
}: {
  source?: string;
  timestamp?: string;
  timeZone?: string;
}) {
  if (!source && !timestamp) return null;
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-500">
      {source && (
        <span className="inline-flex items-center gap-1">
          <Database size={11} aria-hidden />
          {source}
        </span>
      )}
      {timestamp && (
        <span title={formatDateTime(timestamp, timeZone)}>
          {source && <span>·</span>} {timeAgo(timestamp)}
        </span>
      )}
    </div>
  );
}
