import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "NEXURA | Operational Intelligence Infrastructure",
    template: "%s",
  },
  description: "Secure operational intelligence infrastructure, workflow automation, dashboards, and private AI control systems.",
  category: "technology",
  creator: "NEXURA",
  publisher: "NEXURA",
  icons: {
    icon: "/assets/icons/favicon.svg",
    apple: "/assets/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale().catch(() => "fr");
  const lang = locale === "en" ? "en" : "fr";

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
