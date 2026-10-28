import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Evita que Next infiera como raíz un package-lock.json de un directorio superior.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
