import { CloudRain } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Rainfall" };

export default function RainfallPage() {
  return (
    <PagePlaceholder
      title="Rainfall"
      description="Monitoring curah hujan dan intensitas presipitasi untuk mendukung deteksi potensi risiko hidrometeorologi."
      step="Step 11"
      icon={CloudRain}
    />
  );
}
