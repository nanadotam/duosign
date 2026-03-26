import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, JetBrains_Mono, Instrument_Serif, Instrument_Sans } from "next/font/google";
import { ThemeScript } from "@/shared/ui/ThemeScript";
import { SettingsProvider } from "@/shared/providers/SettingsProvider";
import { SettingsApplicator } from "@/shared/ui/SettingsApplicator";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://duosign.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "DuoSign — Text to Sign Language",
    template: "%s · DuoSign",
  },
  description:
    "DuoSign translates English text into ASL gloss and animates a 3D avatar signing in real time. Built for the Deaf and hard-of-hearing community.",
  keywords: ["ASL", "sign language", "American Sign Language", "deaf", "accessibility", "gloss", "avatar", "translation"],
  authors: [{ name: "Nana Kwaku Amoako" }],
  creator: "Nana Kwaku Amoako",

  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.svg",
  },

  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "DuoSign",
    title: "DuoSign — Text to Sign Language",
    description:
      "Translate English into ASL gloss and watch a 3D avatar sign it in real time.",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "DuoSign — Text to Sign Language",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "DuoSign — Text to Sign Language",
    description: "Translate English into ASL gloss and watch a 3D avatar sign it in real time.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${instrumentSans.variable}`}
    >
      <head>
        <ThemeScript />
        {/* Preload default avatar so it fetches in parallel with JS bundles */}
        <link rel="preload" href="/avatars/DS-Proto-2.1.vrm" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <SettingsProvider>
          <SettingsApplicator />
          {children}
          <Analytics />
        </SettingsProvider>
      </body>
    </html>
  );
}
