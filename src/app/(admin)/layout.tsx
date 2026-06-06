/**
 * Layout admin.
 * Defense in depth: chequea sesión + rol ADMIN (el proxy ya filtra).
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage, getInitials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const name = session.user.name ?? "Admin";
  const email = session.user.email ?? "";

  return (
    <div className="flex min-h-screen flex-1">
      <AdminSidebar signOutSlot={<SignOutButton />} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {session.user.image && (
                <AvatarImage src={session.user.image} alt={name} />
              )}
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold leading-tight">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <Badge variant="danger" className="ml-2">
              Administrador
            </Badge>
          </div>
        </header>
        <main className="flex-1 px-8 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
