import { Metadata } from 'next';
import React from 'react';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Format the slug to a readable restaurant name (e.g., "the-great-burger-joint" -> "The Great Burger Joint")
  const restaurantName = params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: `${restaurantName} - Digital Menu | Restaurant SEO SaaS`,
    description: `Check out the delicious digital menu for ${restaurantName}. View our best sellers, pricing, and more!`,
    openGraph: {
      title: `${restaurantName} - Digital Menu`,
      description: `Check out the delicious digital menu for ${restaurantName}. View our best sellers, pricing, and more!`,
      url: `https://your-saas-domain.com/menu/${params.slug}`,
      siteName: 'Restaurant SEO SaaS',
      images: [
        {
          // Dynamic image placeholder based on restaurant name
          url: `https://placehold.co/1200x630/f8fafc/475569?text=${encodeURIComponent(restaurantName)}+Menu`,
          width: 1200,
          height: 630,
          alt: `${restaurantName} Menu Cover Image`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${restaurantName} - Digital Menu`,
      description: `Check out the delicious digital menu for ${restaurantName}. View our best sellers, pricing, and more!`,
      images: [`https://placehold.co/1200x630/f8fafc/475569?text=${encodeURIComponent(restaurantName)}+Menu`], // Same dynamic image for Twitter
    },
  };
}

export default function MenuLayout({ children }: Props) {
  // The layout simply renders the page content
  return <>{children}</>;
}
