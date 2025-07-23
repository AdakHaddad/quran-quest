import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable Lightning CSS to avoid platform-specific binary issues
    turbo: {
      rules: {
        '*.css': {
          loaders: ['css-loader'],
          as: '*.css',
        },
      },
    },
  },
  // Ensure proper CSS handling
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
