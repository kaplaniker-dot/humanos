import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

// Body font — gövde metinleri, paragraflar, arayüz
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display font — başlıklar, hero, büyük metinler
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "humanOS — High-Performance Coaching Platform",
  description:
    "humanOS is a science-backed coaching platform designed for people who want to engineer their energy, focus, and longevity. Track, understand, transform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
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