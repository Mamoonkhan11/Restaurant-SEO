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
  // Fetch Restaurant (with dishes joined) and Table in 1 single parallel roundtrip
  const restaurantPromise = supabase
    .from('restaurants')
    .select('*, dishes(*)')
    .eq('slug', params.slug)
    .single();

  const tablePromise = searchParams.tableId
    ? supabase
        .from('tables')
        .select('restaurant_id, table_no')
        .eq('id', searchParams.tableId)
        .single()
    : Promise.resolve({ data: null });

  const [restaurantResult, tableResult] = await Promise.all([
    restaurantPromise,
    tablePromise
  ]);

  const restaurant = restaurantResult.data;
  const tableRecord = tableResult.data;

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
      Promise.resolve(
        supabase
          .from('restaurants')
          .update({ subscription_status: 'inactive' })
          .eq('id', restaurant.id)
      ).catch(() => {});
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

  const tableNo = (searchParams.tableId && tableRecord) ? tableRecord.table_no : undefined;
  const rawDishes: any[] = restaurant.dishes || [];

  let initialDishes: any[] = [];
  let initialCategories: string[] = [];

  if (rawDishes.length > 0) {
    initialDishes = rawDishes.map((d: any) => ({
      ...d,
      isBestSeller: (d.view_count || 0) >= 100,
      view_count: d.view_count || 0
    }));

    const categorySet = new Set<string>();
    for (let i = 0; i < initialDishes.length; i++) {
      categorySet.add(initialDishes[i].category || 'Uncategorized');
    }
    initialCategories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }

  // Non-blocking scan tracking (fire-and-forget in background)
  if (restaurant?.id) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.restdigi.online';
    fetch(`${baseUrl}/api/track-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: restaurant.id }),
      cache: 'no-store',
    }).catch((err) => console.error('[track-scan] Non-blocking background error:', err));
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
