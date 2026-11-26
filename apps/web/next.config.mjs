// Set BASE_PATH when the site is served from a sub-path, e.g. "/ejust-gpa-manager" on GitHub Pages.
const basePath = process.env.BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the app is local-first and needs no server.
  output: "export",
  trailingSlash: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  transpilePackages: ["@ejust-gpa/engine"],
  images: { unoptimized: true },
};
export default nextConfig;
