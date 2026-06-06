/**
 * AdminSidebar — gemela de PlayerSidebar pero con paleta y secciones admin.
 *
 * Diseño: misma estructura, pero el "T" del logo va con fondo rojizo
 * (visual marker de "estás en zona de admin").
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  User,
  ScrollText,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/partidos", label: "Partidos", icon: Calendar },
  { href: "/admin/grupos", label: "Grupos", icon: Users },
  { href: "/admin/usuarios", label: "Usuarios", icon: User },
  { href: "/admin/eliminatorias", label: "Eliminatorias", icon: Trophy },
  { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
];

interface AdminSidebarProps {
  signOutSlot: React.ReactNode;
}

export function AdminSidebar({ signOutSlot }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col sticky top-0 h-screen">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/admin" className="inline-flex items-center gap-2 group">
          <div className="size-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            T
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight leading-none">
              TecScore
            </span>
            <span className="text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold">
              Admin
            </span>
          </div>
        </Link>
      </div>

      <nav className="px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-2 pt-2 border-t border-border">{signOutSlot}</div>
      </nav>
    </aside>
  );
}
