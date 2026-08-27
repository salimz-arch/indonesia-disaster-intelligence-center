import { RealtimeToast } from "@/components/alerts/realtime-toast";
import { AppShell } from "@/components/layout/app-shell";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeProvider>
      <AppShell>
        {children}
        <RealtimeToast />
      </AppShell>
    </RealtimeProvider>
  );
}
