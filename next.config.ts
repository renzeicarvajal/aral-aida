import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/tap"], // Note: if this was custom, keep your original loaders
        as: "*.css",
      },
    },
  },
};

export default nextConfig;