import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp SaaS",
  description: "Multi-tenant WhatsApp automation platform",
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
