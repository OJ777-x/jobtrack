import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Most pages in this app are personalized per signed-in user (dashboards,
  // the customer portal), so we use normal per-request rendering rather than
  // Next's newer Cache Components feature, which needs extra Suspense
  // boundaries around anything dynamic.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
