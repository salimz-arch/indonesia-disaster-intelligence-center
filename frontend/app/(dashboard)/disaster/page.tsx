import { Siren } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Disaster Intelligence" };

export default function DisasterPage() {
  return (
    <PagePlaceholder
      title="Disaster Intelligence"
      description="Ringkasan kejadian bencana, tingkat keparahan, dan informasi intelijen situasional untuk mendukung pemantauan risiko."
      step="Step 15"
      icon={Siren}
    />
  );
}
