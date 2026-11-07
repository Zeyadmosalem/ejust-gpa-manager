/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the MVP is local-first and needs no server.
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@ejust-gpa/engine"],
  images: { unoptimized: true },
};
export default nextConfig;
