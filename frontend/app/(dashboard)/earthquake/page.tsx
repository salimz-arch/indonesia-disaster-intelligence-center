import { Activity } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Earthquake" };

export default function EarthquakePage() {
  return (
    <PagePlaceholder
      title="Earthquake Monitoring"
      description="Realtime earthquake list, magnitude filtering, dan detail event dari BMKG & USGS."
      step="Step 9"
      icon={Activity}
    />
  );
}
