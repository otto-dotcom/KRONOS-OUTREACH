import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="scanlines pixel-grid">{children}</body>
    </html>
  );
}
