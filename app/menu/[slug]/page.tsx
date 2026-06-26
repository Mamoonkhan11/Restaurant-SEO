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

  // Check Expiry & Subscription Status
  const now = new Date();
  const expiryDate = restaurant.expiry_date ? new Date(restaurant.expiry_date) : null;
  let currentStatus = restaurant.subscription_status || 'inactive';

  if (expiryDate && now > expiryDate) {
    if (currentStatus !== 'inactive') {
      // Update database status to inactive
      await supabase
        .from('restaurants')
        .update({ subscription_status: 'inactive' })
        .eq('id', restaurant.id);
      currentStatus = 'inactive';
    }

    if (currentStatus === 'inactive') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
          <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/20 animate-fade-in-up">
            <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
              RestDigi Digital Menu Maintenance
            </h1>
            <p className="text-gray-500 font-semibold leading-relaxed text-sm">
              Please inform your waiter to take your order manually.
            </p>
          </div>
        </div>
      );
    }
  }

  let restaurantIdToFetch = restaurant.id;
  let tableNo: string | undefined = undefined;

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
