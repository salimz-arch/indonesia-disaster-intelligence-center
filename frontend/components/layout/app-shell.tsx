"use client";
import { useState } from "react";
import { AlertBanner } from "@/components/alerts/alert-banner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen w-full bg-idic-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 w-full flex-1 flex-col">
        <Header />
        <AlertBanner />
        <main className="min-w-0 w-full flex-1 px-4 pb-24 pt-4 lg:px-6 lg:pb-6 lg:pt-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
