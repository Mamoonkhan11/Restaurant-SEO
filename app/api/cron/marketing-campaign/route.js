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

    const { data: restaurants, error: dbError } = await supabaseAdmin
      .from('restaurants')
      .select('digital_signature, email, name, terms_accepted, unsubscribed');

    if (dbError) {
      console.error('Error fetching restaurants for marketing campaign cron:', dbError);
      return NextResponse.json({ error: 'Database query failed', details: dbError.message }, { status: 500 });
    }

    const targets = (restaurants || []).filter(r => {
      if (!r.email || r.unsubscribed === true) return false;
      const isTermsAccepted = r.terms_accepted === true;
      const hasValidOwner = r.digital_signature && r.digital_signature.trim() !== '';
      return isTermsAccepted || hasValidOwner;
    });

    if (targets.length === 0) {
      return NextResponse.json({ success: true, dispatched_count: 0, message: 'No eligible recipients found.' });
    }

    const results = [];

    for (const restaurant of targets) {
      try {
        const ownerName = restaurant.digital_signature || 'Restaurant Partner';
        const brandName = restaurant.name || 'Your Restaurant';
        const recipientEmail = restaurant.email;

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #FFF8F6;
      color: #111111;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background-color: #ffffff;
      border: 1px solid #F5F5F5;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #D32F2F;
      margin-bottom: 24px;
      letter-spacing: 1px;
    }
    .logo span {
      color: #FF9100;
    }
    .greeting {
      font-size: 18px;
      font-weight: bold;
      color: #111111;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #555555;
      margin-bottom: 20px;
    }
    .pillars {
      margin: 24px 0;
      padding-left: 0;
      list-style-type: none;
    }
    .pillar-item {
      margin-bottom: 16px;
      padding-left: 24px;
      position: relative;
      font-size: 14px;
      color: #333333;
    }
    .pillar-item::before {
      content: "•";
      position: absolute;
      left: 0;
      top: 2px;
    }
    .pillar-title {
      font-weight: bold;
      color: #111111;
    }
    .cta-wrapper {
      margin: 32px 0 16px 0;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background-color: #ea580c;
      color: #ffffff !important;
      text-decoration: none !important;
      font-weight: bold;
      font-size: 16px;
      padding: 14px 28px;
      border-radius: 9999px;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
    }
    .footer {
      font-size: 11px;
      color: #888888;
      margin-top: 30px;
      text-align: center;
      border-top: 1px solid #F5F5F5;
      padding-top: 20px;
    }
    .footer a {
      color: #888888;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">REST<span>DIGI</span></div>
      <div class="greeting">Hi ${ownerName},</div>
      <p class="text">
        Running a busy kitchen at <strong>${brandName}</strong> shouldn't mean dealing with angry customers and misplaced order receipts. If order leaks and slow table turnovers are hurting your margins, it is time for a digital change.
      </p>
      
      <ul class="pillars">
        <li class="pillar-item">
          <span class="pillar-title">Smart QR Menu Framework:</span> Eliminates table-waiting times completely by letting guests scan, view, and place orders directly from their browsers in under 1 second.
        </li>
        <li class="pillar-item">
          <span class="pillar-title">Live KOT Automation Matrix:</span> Routes digital receipts directly to kitchen screens, eliminating paper loss, confusion, and preparation chaos.
        </li>
        <li class="pillar-item">
          <span class="pillar-title">Live Telemetry Analytics Hub:</span> Provides live sales tracking and automatic weekly dish popularity metrics straight to your dashboard.
        </li>
      </ul>

      <p class="text">
        To support our early restaurant partners, the first 5 registered merchants get our premium operational tier completely <strong>1 Month FREE</strong>.
      </p>

      <div class="cta-wrapper">
        <a href="https://www.restdigi.online" class="cta-button">Claim Your Free Digital Menu</a>
      </div>

      <div class="footer">
        © 2026 RestDigi Team. All rights reserved.<br>
        If you want to unsubscribe, click <a href="https://www.restdigi.online/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}">here</a>.
      </div>
    </div>
  </div>
</body>
</html>`;

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': process.env.BREVO_API_KEY || ''
          },
          body: JSON.stringify({
            sender: { name: "RestDigi Support", email: "noreply@restdigi.online" },
            to: [{ email: recipientEmail, name: ownerName }],
            subject: "Is your restaurant leaking revenue? Stop manual order delays today",
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Brevo API error (${response.status}): ${errorMsg}`);
        }

        results.push({ email: recipientEmail, status: 'dispatched' });
      } catch (err) {
        console.error(`Error dispatching marketing email to ${restaurant.email}:`, err.message);
        results.push({ email: restaurant.email, status: 'failed', error: err.message });
      }
    }

    const dispatchedCount = results.filter(r => r.status === 'dispatched').length;

    return NextResponse.json({
      success: true,
      dispatched_count: dispatchedCount,
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
