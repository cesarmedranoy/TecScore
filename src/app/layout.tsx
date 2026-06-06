import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
 * Script inline anti-flash: lee la preferencia de tema del localStorage
 * y aplica la clase `dark` ANTES de que React hidrate. Evita el flash
 * blanco que se vería si el usuario tiene tema oscuro guardado.
 */
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem("tecscore-theme");
    if (t === "dark" || (!t && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
