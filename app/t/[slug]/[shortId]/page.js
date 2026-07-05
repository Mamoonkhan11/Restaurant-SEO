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
    // 1. Query 'tables' table where 'id' starts with shortId
    const { data: tableData } = await supabase
      .from('tables')
      .select('id')
      .ilike('id', `${shortId}%`)
      .limit(1)
      .maybeSingle();

    if (tableData && tableData.id) {
      fullUuid = tableData.id;
    } else {
      // 2. Fallback: Query 'orders' table where 'table_id' starts with shortId
      const { data: orderData } = await supabase
        .from('orders')
        .select('table_id')
        .ilike('table_id', `${shortId}%`)
        .limit(1)
        .maybeSingle();

      if (orderData && orderData.table_id) {
        fullUuid = orderData.table_id;
      }
    }
  } catch (err) {
    console.error('[ShortIdRedirect] Error resolving shortId:', err);
  }

  // 3. Redirect user browser to final long menu link
  if (fullUuid) {
    redirect(`/menu/${slug}?tableId=${fullUuid}`);
  } else {
    redirect(`/menu/${slug}`);
  }
}
