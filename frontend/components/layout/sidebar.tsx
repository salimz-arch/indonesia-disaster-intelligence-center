"use client";

import {
  BarChart3,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  CloudRain,
  CloudSun,
  Database,
  LayoutDashboard,
  Map,
  Settings,
  Siren,
  Activity,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "Monitoring",
    items: [
      { href: "/earthquake", label: "Earthquake", icon: Activity },
      { href: "/weather", label: "Weather", icon: CloudSun },
      { href: "/rainfall", label: "Rainfall", icon: CloudRain },
      { href: "/disaster", label: "Disaster", icon: Siren },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/peta", label: "Map", icon: Map },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/alerts", label: "Alerts", icon: Bell },
      { href: "/sources", label: "Data Sources", icon: Database },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-idic-border bg-idic-bg-2 transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* ── Header ── */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-idic-border",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        {collapsed ? (
          <span className="text-xl" aria-hidden>
            🇮🇩
          </span>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 text-xl" aria-hidden>
              🇮🇩
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-widest">
                {APP_SHORT}
              </div>
              <div className="text-[10px] text-slate-500">
                Disaster Intelligence
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tombol bulat — pojok kanan atas, sedikit keluar sidebar ── */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-4 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-idic-border bg-idic-bg-2 text-slate-400 shadow-lg transition-all hover:border-idic-cyan/50 hover:text-idic-cyan"
      >
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-label={item.label}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-idic-cyan/10 text-idic-cyan"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                      )}
                    >
                      <Icon size={16} className="shrink-0" aria-hidden />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
