import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/picu-qbank",
  images: { unoptimized: true },
};

export default nextConfig;
