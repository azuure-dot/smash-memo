import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { InstallPrompt } from "@/components/install-prompt";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { SITE } from "@/lib/site-config";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  // Absolute base for the link-preview image (opengraph-image.png) shown by Discord, WhatsApp, X…
  metadataBase: new URL(SITE.url),
  openGraph: { siteName: "Smash Mémo", type: "website" },
  twitter: { card: "summary_large_image" },
  title: { default: "Smash Mémo", template: "%s · Smash Mémo" },
  description: "Matchup notes for Super Smash Bros. Ultimate and Melee, synced across your devices.",
  applicationName: "Smash Mémo",
  appleWebApp: { capable: true, title: "Smash Mémo", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0910",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        {children}
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
