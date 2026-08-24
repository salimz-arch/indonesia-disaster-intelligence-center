"use client";

import { BarChart3, Home, Map, Settings, Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/peta", label: "Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Siren },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Mobile bottom navigation §38 — full width, tiap item boleh menyusut. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 w-full border-t border-idic-border bg-idic-bg-2/95 backdrop-blur-md lg:hidden"
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px]"
          >
            <Icon size={18} className="shrink-0" aria-hidden />
            <span
              className={cn(
                "w-full truncate text-center",
                active ? "text-idic-cyan" : "text-slate-500",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
