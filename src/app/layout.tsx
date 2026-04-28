import type { Metadata } from "next";
import { Inter, Inter_Tight, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Body font — gövde metinleri, paragraflar, arayüz
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display font — başlıklar, hero, büyük metinler (modern sans)
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

// Serif font — şiirsel başlıklar, "Conversation Mode" anlatısı
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

// Mono font — sayılar, veri, debug, kod
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "humanOS — Hayatı tasarla, biyolojini anla",
  description:
    "humanOS, biyolojini anlayıp hayatını bilinçle tasarlamak için kurulan bir longevity ve yüksek performans platformudur. İçinde nefes al, dışında inşa et.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${interTight.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-humanos-bg text-humanos-text font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
