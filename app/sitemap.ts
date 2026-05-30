import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.restdigi.online';
  const lastModifiedStr = new Date().toISOString();

  // Base routes according to content mapping requirements
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: lastModifiedStr,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: lastModifiedStr,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: lastModifiedStr,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: lastModifiedStr,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: lastModifiedStr,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: lastModifiedStr,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: lastModifiedStr,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Fetch all active restaurants from Supabase
  try {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('slug')
      .not('slug', 'is', null);

    if (restaurants) {
      const restaurantRoutes = restaurants.map((restaurant) => ({
        url: `${baseUrl}/menu/${restaurant.slug}`,
        lastModified: lastModifiedStr,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));

      return [...routes, ...restaurantRoutes];
    }
  } catch (error) {
    console.error('Error fetching restaurants for sitemap:', error);
  }

  return routes;
}
