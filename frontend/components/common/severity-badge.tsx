import { SEVERITY_COLOR, SEVERITY_LABEL } from "@/lib/severity";
import type { Severity } from "@/types/api";

/** Severity dengan warna + ikon dot + TEKS — tidak mengandalkan warna saja (§27). */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLOR[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
