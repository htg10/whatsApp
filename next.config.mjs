/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SSR/Node deploy (GitHub → Next.js on Hostinger/Vercel). No static export.
  // If you ever host as static files in public_html instead, re-add:
  //   output: "export", trailingSlash: true, images: { unoptimized: true }
};

export default nextConfig;
