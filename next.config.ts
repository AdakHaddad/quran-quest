import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Lightning CSS completely
  experimental: {
    cssChunking: 'loose',
  },
  // Force use of PostCSS instead of Lightning CSS
  webpack: (config, { isServer }) => {
    // Disable Lightning CSS
    if (config.experiments) {
      config.experiments.css = false;
    }
    
    // Ensure CSS is handled by PostCSS
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('css')) {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((useItem) => {
            if (typeof useItem === 'object' && useItem.loader && useItem.loader.includes('css-loader')) {
              // Ensure CSS loader options don't use Lightning CSS
              if (useItem.options) {
                useItem.options.importLoaders = 1;
              }
            }
          });
        }
      }
    });

    return config;
  },
};

export default nextConfig;
