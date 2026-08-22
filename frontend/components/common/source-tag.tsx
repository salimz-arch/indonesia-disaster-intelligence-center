import { Database } from "lucide-react";

import { formatDateTime, timeAgo } from "@/lib/format";

/** Transparansi sumber data §40 — flex-wrap agar tidak mendorong lebar kartu. */
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
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
      {source && (
        <span className="inline-flex min-w-0 items-center gap-1 wrap-break-words">
          <Database size={11} className="shrink-0" aria-hidden />
          {source}
        </span>
      )}
      {timestamp && (
        <span
          className="wrap-break-words"
          title={formatDateTime(timestamp, timeZone)}
        >
          {source && <span>·</span>} {timeAgo(timestamp)}
        </span>
      )}
    </div>
  );
}
