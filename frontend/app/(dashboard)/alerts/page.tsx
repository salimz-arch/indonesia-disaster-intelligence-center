import { Bell } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <PagePlaceholder
      title="Alerts"
      description="Daftar peringatan dan kejadian prioritas yang memerlukan perhatian atau pemantauan lebih lanjut."
      step="Step 15"
      icon={Bell}
    />
  );
}
