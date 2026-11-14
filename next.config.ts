import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local Wi-Fi development preview on the laptop's LAN IP.
  // This only relaxes Next.js development-origin checks, not application auth.
  allowedDevOrigins: ["192.168.1.243"],
};

export default nextConfig;
