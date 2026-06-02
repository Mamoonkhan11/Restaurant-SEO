import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function handleCron(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const targetTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: leads, error: dbError } = await supabaseAdmin
      .from('marketing_leads')
      .select('id, owner_email, restaurant_name, last_emailed_at, unsubscribed')
      .eq('unsubscribed', false)
      .or(`last_emailed_at.is.null,last_emailed_at.lt.${targetTime}`)
      .limit(20);

    if (dbError) {
      console.error('Error fetching marketing leads:', dbError);
      return NextResponse.json({ error: 'Database query failed', details: dbError.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, targets_dispatched: 0, message: 'No eligible leads found.' });
    }

    let dispatchedCount = 0;
    const results = [];

    for (const lead of leads) {
      try {
        const brandName = lead.restaurant_name || 'Your Restaurant';
        const recipientEmail = lead.owner_email;

        const htmlContent = `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #111111; line-height: 1.6; max-width: 600px; padding: 20px 0;">
  <p>Hey Team ${brandName},</p>
  
  <p>We noticed how manual ordering and lost paper KOTs challenge fast-paced operations. If order leaks and slow table turnovers are hurting your margins, it is time for a digital change.</p>
  
  <p>RestDigi automates your operations in three ways:</p>
  
  <ul>
    <li style="margin-bottom: 12px;"><strong>Automated Smart QR Menus:</strong> Eliminates table-waiting times completely by letting guests scan, view, and place orders directly from their browsers in under 5 seconds.</li>
    <li style="margin-bottom: 12px;"><strong>Instantaneous Kitchen Displays:</strong> Routes digital receipts directly to kitchen screens, eliminating paper loss, confusion, and preparation chaos.</li>
    <li style="margin-bottom: 12px;"><strong>Live Telemetry Analytics:</strong> Provides live sales tracking and automatic weekly dish popularity metrics straight to your dashboard, making it easy to track your weekly top items.</li>
  </ul>
  
  <p>Register your restaurant live today to secure a completely <strong>1 Month FREE Early Bird Account</strong>.</p>
  
  <p>Claim your 1 Month Free Account here: <a href="https://www.restdigi.online" style="color: #D32F2F; font-weight: bold; text-decoration: underline;">Claim Your 1 Month Free Account</a></p>
  
  <p style="margin-top: 24px;">
    Best regards,<br>
    RestDigi Growth Team
  </p>
  
  <p style="font-size: 11px; color: #888888; margin-top: 30px; border-top: 1px solid #F5F5F5; padding-top: 20px;">
    If you want to unsubscribe, click <a href="https://www.restdigi.online/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color: #888888; text-decoration: underline;">here</a>.
  </p>
</div>`;

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': process.env.BREVO_API_KEY || ''
          },
          body: JSON.stringify({
            sender: { name: "RESTDIGI SUPPORT", email: "noreply@restdigi.online" },
            to: [{ email: recipientEmail, name: brandName }],
            subject: "Is your restaurant leaking revenue? Stop manual order delays today",
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Brevo API error (${response.status}): ${errorMsg}`);
        }

        const { error: updateError } = await supabaseAdmin
          .from('marketing_leads')
          .update({ last_emailed_at: new Date().toISOString() })
          .eq('id', lead.id);

        if (updateError) {
          throw new Error(`Supabase last_emailed_at update failed: ${updateError.message}`);
        }

        dispatchedCount++;
        results.push({ email: recipientEmail, status: 'dispatched' });
      } catch (err) {
        console.error(`Error dispatching marketing email to ${lead.owner_email}:`, err.message);
        results.push({ email: lead.owner_email, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      targets_dispatched: dispatchedCount,
      details: results
    });

  } catch (error) {
    console.error('Unhandled error during marketing campaign cron execution:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  return handleCron(req);
}

export async function POST(req) {
  return handleCron(req);
}
