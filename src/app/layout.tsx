import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Literata } from "next/font/google";
import { InstallPrompt } from "@/components/install-prompt";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { SITE } from "@/lib/site-config";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// UI labels and buttons.
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// Reading serif for notes and headings.
const literata = Literata({ variable: "--font-literata", subsets: ["latin"], display: "swap" });
// Handwritten accents only (stage marks, reminder title): small doses.
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["500", "700"], display: "swap" });

export const metadata: Metadata = {
  // Absolute base for the link-preview image (opengraph-image.png) shown by Discord, WhatsApp, X…
  metadataBase: new URL(SITE.url),
  openGraph: { siteName: "Smash Memo", type: "website" },
  twitter: { card: "summary_large_image" },
  title: { default: "Smash Memo", template: "%s · Smash Memo" },
  description:
    "Matchup notes for Super Smash Bros. Ultimate, Melee and Rivals of Aether II, synced across your devices.",
  applicationName: "Smash Memo",
  appleWebApp: { capable: true, title: "Smash Memo", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Matches the desk colour of each theme.
  // Defaults by device setting; the theme script overrides them when a theme is chosen manually.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: data-theme is set by the inline script before React hydrates.
    <html lang="en" className={`${geist.variable} ${literata.variable} ${caveat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        {children}
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
