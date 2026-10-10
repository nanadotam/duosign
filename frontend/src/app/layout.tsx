import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, JetBrains_Mono, Instrument_Serif, Instrument_Sans } from "next/font/google";
import { ThemeScript } from "@/shared/ui/ThemeScript";
import { SettingsProvider } from "@/shared/providers/SettingsProvider";
import { SettingsApplicator } from "@/shared/ui/SettingsApplicator";
import Footer from "@/shared/ui/Footer";
import OnboardingGate from "@/shared/ui/OnboardingGate";
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://duosign.nanaamoako.com";

const TITLE = "DuoSign Beta — the internet, in sign language";
const DESCRIPTION =
  "Type or speak English and watch it signed in American Sign Language by avatars that look like the people who use them. Free and open beta, built in Ghana at Ashesi University.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "DuoSign Beta",
  title: {
    default: TITLE,
    template: "%s · DuoSign Beta",
  },
  description: DESCRIPTION,
  keywords: [
    "DuoSign", "sign language", "text to sign language", "American Sign Language", "ASL", "Ghanaian Sign Language",
    "Deaf", "hard of hearing", "accessibility", "sign language avatar", "Ghana", "Ashesi University", "assistive technology",
  ],
  authors: [{ name: "Nana Kwaku Amoako" }],
  creator: "Nana Kwaku Amoako",
  publisher: "DuoSign",
  category: "accessibility",
  alternates: { canonical: "/" },

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
    siteName: "DuoSign Beta",
    locale: "en_GB",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DuoSign Beta: the internet, in sign language. Three signers, Ama, Kofi and Esi, on a deep green background.",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0b2a1a" },
  ],
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
      </head>
      <body className="font-sans antialiased">
        <SettingsProvider>
          <SettingsApplicator />
          <OnboardingGate />
          {children}
          <Footer />
          <Analytics />
        </SettingsProvider>
      </body>
    </html>
  );
}
