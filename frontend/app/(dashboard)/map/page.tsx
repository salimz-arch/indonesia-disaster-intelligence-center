import { EarthquakeMap } from "@/components/map/earthquake-map";

export const metadata = { title: "Map" };

/** Full-height map — tanpa PageHeader agar peta mendapat ruang maksimal. */
export default function MapPage() {
  return (
    <div className="h-[calc(100dvh-215px)] min-h-[440px] lg:h-[calc(100dvh-150px)]">
      <EarthquakeMap variant="full" />
    </div>
  );
}
