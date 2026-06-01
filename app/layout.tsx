import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "RESTDIGI",
    template: "%s",
  },
  description: "RESTDIGI is an advanced restaurant operations framework enabling seamless digital menu infrastructure, instant table-side ordering, and real-time kitchen display synchronization.",
  metadataBase: new URL("https://www.restdigi.online"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon-tab.png",
    shortcut: "/favicon-tab.png",
    apple: "/favicon-tab.png",
  },
};

const schemaObject = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "RestDigi",
  "url": "https://www.restdigi.online",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "description": "Cloud-native restaurant operating framework providing continuous digital QR menus, streamlined kitchen display metrics, and automated ordering automation.",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "lowPrice": "0",
    "highPrice": "999",
    "offerCount": "3",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Basic Tier (For First Comers)",
        "price": "0",
        "priceCurrency": "INR",
        "description": "Free core operational tools including digital QR menu and basic analytics, specially dedicated for early adopters."
      },
      {
        "@type": "Offer",
        "name": "Pro Outlet Plan",
        "price": "699",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "name": "Premium Enterprise Plan",
        "price": "999",
        "priceCurrency": "INR"
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObject) }}
        />
      </body>
    </html>
  );
}
