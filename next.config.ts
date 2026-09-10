import path from "node:path";
import type { NextConfig } from "next";

const raizDoProjeto = path.join(__dirname);

const nextConfig: NextConfig = {
  // Evita o Next inferir a raiz em /home/supero por causa de outros lockfiles.
  outputFileTracingRoot: raizDoProjeto,
  turbopack: {
    root: raizDoProjeto,
  },
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST) {
      return [];
    }
    return [
      {
        source: "/v0/:path*",
        destination: "http://127.0.0.1:9199/v0/:path*",
      },
    ];
  },
};

export default nextConfig;
