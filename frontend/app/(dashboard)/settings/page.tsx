import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Konfigurasi preferensi aplikasi, tampilan, notifikasi, dan pengaturan sistem IDIC."
      step="Step 16"
      icon={Settings}
    />
  );
}
