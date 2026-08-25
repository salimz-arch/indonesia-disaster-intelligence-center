import { EarthquakeMap } from "@/components/map/earthquake-map";

export const metadata = { title: "Map" };

export default function MapPage() {
  return <EarthquakeMap variant="full" />;
}
