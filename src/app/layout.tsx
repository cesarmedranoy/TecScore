import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TecScore — Predicciones del Mundial",
  description:
    "Predice los partidos del Mundial, gana puntos por acertar, compite con tus amigos en salas privadas y sube en el ranking global.",
};

/**
 * El tema se lee de cookie en cada render (server-side).
 * Esto elimina el "flash" sin necesidad de scripts inline:
 *  - El HTML inicial ya viene con la clase correcta.
 *  - El toggle actualiza la cookie + clase del DOM.
 *  - Sin warning de React por scripts en el árbol de componentes.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("tecscore-theme")?.value;
  const isDark = theme === "dark";

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${
        isDark ? " dark" : ""
      }`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
