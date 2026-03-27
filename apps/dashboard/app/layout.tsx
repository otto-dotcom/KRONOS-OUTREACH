import type { Metadata } from "next";
import { Inter, Press_Start_2P, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "KRONOS // COMMAND CENTER",
  description: "Campaign dashboard for KRONOS Automations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable} ${cinzel.variable}`}>
      <body className="scanlines pixel-grid">{children}</body>
    </html>
  );
}
