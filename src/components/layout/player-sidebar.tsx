/**
 * PlayerSidebar — barra lateral fija del área de jugador.
 *
 * Diseño:
 *  - Ancho 240px en md+, columna completa en mobile (TODO Fase 5.x)
 *  - Posición sticky (no se mueve con scroll del contenido)
 *  - Logo arriba, nav items al medio, cerrar sesión abajo
 *
 * Es Client Component porque usePathname() requiere cliente
 * para detectar la ruta activa.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Users,
  Trophy,
  Crown,
  UserPlus,
  Search,
  HelpCircle,
  UserCircle,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Principal", icon: Home },
  { href: "/mis-apuestas", label: "Mis apuestas", icon: TrendingUp },
  { href: "/mis-grupos", label: "Mis grupos", icon: Users },
  { href: "/eliminatorias", label: "Eliminatorias", icon: Trophy },
  { href: "/ranking", label: "Ranking global", icon: Crown },
  { href: "/perfil", label: "Mi perfil", icon: UserCircle },
  { href: "/amigos", label: "Amigos", icon: UserPlus },
  { href: "/chats", label: "Chats", icon: MessageCircle },
  { href: "/buscar", label: "Buscar jugadores", icon: Search },
  { href: "/ayuda", label: "Ayuda", icon: HelpCircle },
];

interface PlayerSidebarProps {
  signOutSlot: React.ReactNode;
}

export function PlayerSidebar({ signOutSlot }: PlayerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/dashboard" className="inline-flex items-center gap-2 group">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            T
          </div>
          <span className="font-bold text-lg tracking-tight">TecScore</span>
        </Link>
      </div>

      {/* Nav + sign-out agrupados arriba — sin gap muerto */}
      <nav className="px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
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
