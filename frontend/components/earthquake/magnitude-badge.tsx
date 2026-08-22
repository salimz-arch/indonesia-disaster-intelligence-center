import { CATEGORY_COLOR } from "@/lib/severity";
import type { MagnitudeCategory } from "@/types/api";

/** Badge M x.x — warna dari kategori visual internal backend. */
export function MagnitudeBadge({
  magnitude,
  category,
}: {
  magnitude: number;
  category: MagnitudeCategory;
}) {
  const color = CATEGORY_COLOR[category];
  return (
    <span
      className="shrink-0 rounded-md border px-2 py-0.5 font-mono text-xs font-bold tabular-nums"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
      }}
    >
      M {magnitude.toFixed(1)}
    </span>
  );
}
