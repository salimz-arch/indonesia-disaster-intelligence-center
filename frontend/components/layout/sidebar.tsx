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

import { APP_SHORT, APP_TAGLINE } from "@/lib/constants";
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
        "hidden shrink-0 flex-col border-r border-idic-border bg-idic-bg-2 transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-idic-border px-4">
        <span className="text-xl" aria-hidden>
          🇮🇩
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-widest">{APP_SHORT}</div>
            <div className="truncate text-[10px] text-slate-500">
              {APP_TAGLINE}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
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

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex h-12 items-center justify-center border-t border-idic-border text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
      >
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>
    </aside>
  );
}
