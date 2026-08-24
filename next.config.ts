import type { NextConfig } from "next";

import { BASE_PATH } from "./src/lib/basePath";

// GitHub Pages serves this repo from https://<user>.github.io/stellarDomain/,
// so every URL needs that prefix. In CI, `actions/configure-pages` generates its
// own next.config.js and sets basePath there; declaring it here keeps local
// builds identical to production. Both read the same constant as the
// withBasePath() helper, so Next's assets and hand-written content paths can
// never disagree — which is what broke the images on Pages once before.
const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
