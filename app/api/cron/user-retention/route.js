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

    const now = new Date();
    
    // Scenario A: Inactive subscription for 7+ days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inactiveLeads, error: inactiveError } = await supabaseAdmin
      .from('restaurants')
      .select('id, email, name, digital_signature, last_retention_emailed_at, unsubscribed')
      .eq('subscription_status', 'inactive')
      .eq('unsubscribed', false)
      .or(`last_retention_emailed_at.is.null,last_retention_emailed_at.lt.${sevenDaysAgo}`);

    if (inactiveError) {
      console.error('Error fetching inactive subscription leads:', inactiveError);
      return NextResponse.json({ error: 'Database query failed', details: inactiveError.message }, { status: 500 });
    }

    // Scenario B: Active but offline (no seen activity) for 48 hours, retention email not sent in last 5 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: offlineLeads, error: offlineError } = await supabaseAdmin
      .from('restaurants')
      .select('id, email, name, digital_signature, last_seen_at, last_retention_emailed_at, unsubscribed')
      .eq('subscription_status', 'active')
      .eq('unsubscribed', false)
      .lt('last_seen_at', twoDaysAgo)
      .or(`last_retention_emailed_at.is.null,last_retention_emailed_at.lt.${fiveDaysAgo}`);

    if (offlineError) {
      console.error('Error fetching offline leads:', offlineError);
      return NextResponse.json({ error: 'Database query failed', details: offlineError.message }, { status: 500 });
    }

    let inactiveTriggered = 0;
    let offlineTriggered = 0;

    // Process Scenario A (Inactive Alert)
    for (const lead of (inactiveLeads || [])) {
      if (!lead.email) continue;
      try {
        const brandName = lead.name || 'Your Restaurant';
        const recipientEmail = lead.email;
        const htmlContent = `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #111111; line-height: 1.6; max-width: 600px; padding: 20px 0;">
  <p>Hey ${brandName},</p>
  <p>Your RestDigi Digital Menu is currently paused. Because your subscription is inactive, your smart QR codes are disabled, and guests cannot view your digital menu or place orders.</p>
  <p>To restore your digital menu infrastructure immediately and get your kitchen running at full speed again, please reactivate your plan.</p>
  <p>Reactivate your subscription here: <a href="https://www.restdigi.online/dashboard/billing" style="color: #D32F2F; font-weight: bold; text-decoration: underline;">Reactivate Your Subscription</a></p>
  <p>If you have any doubts, questions, or need assistance, feel free to contact us at <a href="mailto:support@restdigi.online" style="color: #D32F2F; text-decoration: underline; font-weight: bold;">support@restdigi.online</a>. We are here to help!</p>
  <p style="margin-top: 24px;">
    Cheers,<br>
    Mamoon<br>
    Founder & CEO
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
            sender: { name: "Mamoon from Restdigi", email: "success@restdigi.online" },
            to: [{ email: recipientEmail, name: brandName }],
            subject: "Your RestDigi Digital Menu is Paused | Reactivate Now",
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Brevo API error (${response.status}): ${errorMsg}`);
        }

        const { error: updateError } = await supabaseAdmin
          .from('restaurants')
          .update({ last_retention_emailed_at: now.toISOString() })
          .eq('id', lead.id);

        if (updateError) {
          throw new Error(`Supabase last_retention_emailed_at update failed: ${updateError.message}`);
        }

        inactiveTriggered++;
      } catch (err) {
        console.error(`Error processing Scenario A for restaurant ${lead.id}:`, err.message);
      }
    }

    // Process Scenario B (Offline Alert)
    for (const lead of (offlineLeads || [])) {
      if (!lead.email) continue;
      try {
        const brandName = lead.name || 'Your Restaurant';
        const ownerName = lead.digital_signature || 'Restaurant Partner';
        const recipientEmail = lead.email;
        const htmlContent = `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #111111; line-height: 1.6; max-width: 600px; padding: 20px 0;">
  <p>Hey ${ownerName},</p>
  <p>We noticed that your kitchen dashboard at ${brandName} has been quiet for over 48 hours. We wanted to check in and see if everything is running smoothly.</p>
  <p>Are you experiencing any hardware lags, or do you need help updating your menu dishes or category allocations? We want to ensure your operations remain completely zero-latency and frictionless.</p>
  <p>If you need any guidance or troubleshooting support, please contact us at <a href="mailto:support@restdigi.online" style="color: #D32F2F; text-decoration: underline; font-weight: bold;">support@restdigi.online</a>.</p>
  <p style="margin-top: 24px;">
    Best regards,<br>
    Mamoon<br>
    Founder & CEO
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
            sender: { name: "Mamoon from Restdigi", email: "success@restdigi.online" },
            to: [{ email: recipientEmail, name: ownerName }],
            subject: "We miss you at the kitchen! | Is everything running smoothly?",
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Brevo API error (${response.status}): ${errorMsg}`);
        }

        const { error: updateError } = await supabaseAdmin
          .from('restaurants')
          .update({ last_retention_emailed_at: now.toISOString() })
          .eq('id', lead.id);

        if (updateError) {
          throw new Error(`Supabase last_retention_emailed_at update failed: ${updateError.message}`);
        }

        offlineTriggered++;
      } catch (err) {
        console.error(`Error processing Scenario B for restaurant ${lead.id}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      inactive_triggered: inactiveTriggered,
      offline_triggered: offlineTriggered
    });

  } catch (error) {
    console.error('Unhandled error during retention email cron execution:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  return handleCron(req);
}

export async function POST(req) {
  return handleCron(req);
}
