import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* 75 is next/image's default. Measured on the 1920x1080 backdrop stills:
       q=75 webp is 135KB against a 577KB source, q=100 is 654KB — above 75 the
       optimizer hands back a file bigger than the JPG it replaced. */
    qualities: [75],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};

export default nextConfig;
