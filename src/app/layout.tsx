import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, JetBrains_Mono, Playfair_Display, Instrument_Sans } from "next/font/google";
import { ThemeScript } from "@/shared/ui/ThemeScript";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DuoSign — Text to Sign Language",
  description: "Translate English text into ASL gloss tokens and animate a 3D avatar in real time.",
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
      className={`${dmSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${playfair.variable} ${instrumentSans.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
