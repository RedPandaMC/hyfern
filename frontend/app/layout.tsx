import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Bitter, Noto_Sans_Symbols_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
  weight: ["700", "600"],
});

const notoSymbols2 = Noto_Sans_Symbols_2({
  variable: "--font-noto-symbols-2",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "HyFern - Minecraft Server Management",
  description: "Modern Minecraft server management panel with real-time monitoring, console access, and advanced configuration tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} ${bitter.variable} ${notoSymbols2.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
