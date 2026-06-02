import { supabase } from '@/lib/supabase';
import MenuClient from './MenuClient';

// Ensure the page gets revalidated/dynamic rendering depending on use case.
export const dynamic = 'force-dynamic';

export default async function DigitalMenu({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { tableId?: string; table?: string };
}) {
  // Fetch Restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 bg-white">
        Restaurant not found.
      </div>
    );
  }

  let restaurantIdToFetch = restaurant.id;
  let tableNo: string | undefined = searchParams.table;

  if (searchParams.tableId) {
    const { data: tableRecord } = await supabase
      .from('tables')
      .select('restaurant_id, table_no')
      .eq('id', searchParams.tableId)
      .single();

    if (tableRecord) {
      restaurantIdToFetch = tableRecord.restaurant_id;
      tableNo = tableRecord.table_no;
    }
  }

  // Fetch Dishes
  const { data: dishesData, error: dishesError } = await supabase
    .from('dishes')
    .select('*')
    .eq('restaurant_id', restaurantIdToFetch);

  if (dishesError) {
    console.error('Error fetching dishes:', dishesError);
  }
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

  // Fire-and-forget scan count increment only when scanning a table QR code (table parameter present)
  if (tableNo) {
    supabase.rpc('increment_scans', { row_id: restaurant.id }).then();
  }

  return (
    <MenuClient 
      params={params} 
      initialRestaurant={restaurant} 
      initialDishes={initialDishes} 
      initialCategories={initialCategories} 
      tableNo={tableNo}
    />
  );
}
