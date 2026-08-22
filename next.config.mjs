/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export for Hostinger (no Node server). Produces an `out/` folder of
  // plain HTML/JS you upload to public_html. trailingSlash makes each route a
  // folder with index.html so Apache serves /whatsapp/ on a hard refresh.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
