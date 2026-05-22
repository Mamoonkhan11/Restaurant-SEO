import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mendigi — Instant Digital Menus & Smart Restaurant POS",
  description: "Mendigi is a lightning-fast digital menu and smart restaurant POS platform that lets customers scan, view, and order instantly from their tables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
