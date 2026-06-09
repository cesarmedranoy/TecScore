import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",  
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
