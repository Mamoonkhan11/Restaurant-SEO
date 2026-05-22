import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Restdigi — Instant Digital Menus & Smart Restaurant POS",
    template: "%s | restdigi",
  },
  description: "Restdigi is a lightning-fast digital menu and smart restaurant POS platform that lets customers scan, view, and order instantly from their tables.",
  metadataBase: new URL("https://restdigi.com"),
  icons: {
    icon: "/favicon.ico",
  },
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
