import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Heltog SocialFlow",
  description: "Live Better, Support Smarter — WhatsApp automation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla adds
          cz-shortcut-listen) mutate <body> before React hydrates. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
