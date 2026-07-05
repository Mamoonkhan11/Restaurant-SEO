import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ShortIdRedirectPage({ params }) {
  const { slug, shortId } = params;

  if (!slug || !shortId) {
    redirect('/');
  }

  let fullUuid = null;

  try {
    // Fetch restaurant by slug and its list of tables
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('id, tables(id, table_no)')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[ShortIdRedirect] Error fetching restaurant:', error);
    }

    if (restaurant && Array.isArray(restaurant.tables)) {
      const targetShort = shortId.toLowerCase().trim();
      const matchedTable = restaurant.tables.find(
        (t) => t.id && t.id.toLowerCase().startsWith(targetShort)
      );

      if (matchedTable) {
        fullUuid = matchedTable.id;
      }
    }
  } catch (err) {
    console.error('[ShortIdRedirect] Unhandled error:', err);
  }

  // Redirect user to digital menu with tableId attached
  if (fullUuid) {
    redirect(`/menu/${slug}?tableId=${fullUuid}`);
  } else {
    redirect(`/menu/${slug}`);
  }
}
