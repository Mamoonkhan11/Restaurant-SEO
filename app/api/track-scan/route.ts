import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/track-scan
 * Increments total_scans for a restaurant using the service role key.
 * Called server-side on every QR menu page load.
 * Body: { restaurantId: string }
 */
export async function POST(req: Request) {
  try {
    const { restaurantId } = await req.json();

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error } = await supabaseAdmin.rpc('increment_scans', { row_id: restaurantId });

    if (error) {
      console.error('[track-scan] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[track-scan] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
