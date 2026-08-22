import { BarChart3 } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PagePlaceholder
      title="Analytics"
      description="Analisis tren, distribusi, dan indikator kejadian bencana untuk mendukung pengambilan keputusan berbasis data."
      step="Step 14"
      icon={BarChart3}
    />
  );
}
