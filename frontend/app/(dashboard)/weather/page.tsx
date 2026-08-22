import { CloudSun } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Weather" };

export default function WeatherPage() {
  return (
    <PagePlaceholder
      title="Weather"
      description="Kondisi cuaca terkini dan parameter atmosfer di lokasi pemantauan Indonesia."
      step="Step 10"
      icon={CloudSun}
    />
  );
}
