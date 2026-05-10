import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR-Crave",
  description: "Digital Menu platform powered by QR-Crave",
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
