import type { NextConfig } from "next";

// GitHub Pages serves this repo from https://<user>.github.io/stellarDomain/,
// so every URL needs that prefix. `actions/configure-pages` injects basePath in
// CI, but declaring it here too means local builds match production and asset
// paths in content can be resolved with the same value. Override with
// NEXT_PUBLIC_BASE_PATH='' to serve from a domain root.
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === 'production' ? '/stellarDomain' : '');

// Re-export so the same value is readable at runtime by withBasePath() in
// src/lib/content.ts, which prefixes asset URLs written by hand in content.
process.env.NEXT_PUBLIC_BASE_PATH = basePath;

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
