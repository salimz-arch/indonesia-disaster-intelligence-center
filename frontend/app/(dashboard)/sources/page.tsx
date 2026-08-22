import { Database } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export const metadata = { title: "Data Sources" };

export default function SourcesPage() {
  return (
    <PagePlaceholder
      title="Data Sources"
      description="Status, kesehatan, dan latensi seluruh sumber data yang digunakan oleh platform IDIC."
      step="Step 7"
      icon={Database}
    />
  );
}
