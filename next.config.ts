import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el badge "N" de dev en la esquina inferior izquierda.
  devIndicators: false,

  images: {
    // Permitir avatares de Google (lh3, lh4, lh5, lh6)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
