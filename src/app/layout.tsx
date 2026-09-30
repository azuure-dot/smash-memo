import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Smash Notes", template: "%s · Smash Notes" },
  description: "Matchup notes for Super Smash Bros. Ultimate and Melee, synced across your devices.",
  applicationName: "Smash Notes",
  appleWebApp: { capable: true, title: "Smash Notes", statusBarStyle: "black-translucent" },
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
      </body>
    </html>
  );
}
