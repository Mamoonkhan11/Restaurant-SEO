import { Metadata } from 'next';
import React from 'react';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

import { supabase } from '@/lib/supabase';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch actual restaurant details from Supabase
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, address')
    .eq('slug', params.slug)
    .single();

  const fallbackName = params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const restaurantName = restaurant?.name || fallbackName;
  const location = restaurant?.address || 'Srinagar';

  const seoTitle = `${restaurantName} Menu - Best Food in ${location}, Srinagar`;
  const seoDescription = `Explore our delicious menu at ${restaurantName}. View our best sellers, pricing, and order directly! Located in ${location}, Srinagar. Built with RESTDIGI.`;

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `https://restdigi.com/menu/${params.slug}`,
      siteName: 'RESTDIGI',
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
      title: seoTitle,
      description: seoDescription,
      images: [`https://placehold.co/1200x630/f8fafc/475569?text=${encodeURIComponent(restaurantName)}+Menu`],
    },
  };
}

export default function MenuLayout({ children }: Props) {
  // The layout simply renders the page content
  return <>{children}</>;
}
