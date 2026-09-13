import path from "node:path";
import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const raizDoProjeto = path.join(__dirname);

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});

const nextConfig: NextConfig = {
  // Evita o Next inferir a raiz em /home/supero por causa de outros lockfiles.
  outputFileTracingRoot: raizDoProjeto,
  turbopack: {
    root: raizDoProjeto,
  },
  async rewrites() {
    const regras: Awaited<ReturnType<NonNullable<NextConfig["rewrites"]>>> = [
      {
        source: "/__/auth/:path*",
        destination: "https://rolemoto-bc47f.firebaseapp.com/__/auth/:path*",
      },
    ];

    if (process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST) {
      regras.push({
        source: "/v0/:path*",
        destination: "http://127.0.0.1:9199/v0/:path*",
      });
    }

    return regras;
  },
};

export default withSerwist(nextConfig);
