import { Map } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Situational Map" };

export default function MapPage() {
  return (
    <PagePlaceholder
      title="Situational Map"
      description="Peta situasional Indonesia dengan visualisasi gempa, cuaca, curah hujan, dan informasi risiko terkait."
      step="Step 8"
      icon={Map}
    />
  );
}
