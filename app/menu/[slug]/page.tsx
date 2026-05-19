import { supabase } from '@/lib/supabase';
import MenuClient from './MenuClient';

// Ensure the page gets revalidated/dynamic rendering depending on use case.
export const dynamic = 'force-dynamic';

export default async function DigitalMenu({ params }: { params: { slug: string } }) {
  // Fetch Restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, logo_url, owner_id, plan_type, whatsapp_number, expiry_date, trial_ends_at, slug')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Restaurant not found.
      </div>
    );
  }

  // Fetch Dishes
  const { data: dishesData } = await supabase
    .from('dishes')
    .select('id, name, price, category, image_url, description, is_available, is_special_offer, offer_tag, view_count, sizes')
    .eq('restaurant_id', restaurant.id)
    .order('view_count', { ascending: false });

  console.log('Fetched dishes count:', dishesData?.length || 0);
  console.log('Dishes array:', dishesData);

  let initialDishes: any[] = [];
  let initialCategories: string[] = [];

  if (dishesData) {
    initialDishes = dishesData.map((d) => ({
      ...d,
      isBestSeller: (d.view_count || 0) > 60,
      view_count: d.view_count || 0
    }));

    const uniqueCategories = Array.from(new Set(initialDishes.map(d => d.category || 'Uncategorized'))) as string[];
    uniqueCategories.sort((a, b) => a.localeCompare(b));
    initialCategories = uniqueCategories;
  }

  // Fire-and-forget scan count increment
  supabase.rpc('increment_scans', { row_id: restaurant.id }).then();

  return (
    <MenuClient 
      params={params} 
      initialRestaurant={restaurant} 
      initialDishes={initialDishes} 
      initialCategories={initialCategories} 
    />
  );
}
