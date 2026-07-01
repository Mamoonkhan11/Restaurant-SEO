import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Trial Expiry Follow-Up Cron
 * Runs daily. Sends two types of emails:
 *   A) "3 days left" warning  — when expiry_date = today+3
 *   B) "Trial expired" notice — when expiry_date was within last 48 hrs
 * Uses last_trial_email_at to avoid duplicate sends.
 */
async function handleCron(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const now = new Date();

    // ── Window A: expiry in next 3 days (between 2 and 4 days from now for a daily cron) ──
    const windowAStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const windowAEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();

    // ── Window B: expired in last 48 hours ──
    const windowBStart = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    // Guard: don't re-email anyone who received a trial email in the last 2 days
    const emailCooldown = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all active/recently-expired restaurants with known expiry
    const { data: restaurants, error: dbError } = await supabaseAdmin
      .from('restaurants')
      .select('id, email, name, digital_signature, expiry_date, subscription_status, last_trial_email_at, unsubscribed')
      .not('expiry_date', 'is', null)
      .eq('unsubscribed', false)
      .or(`last_trial_email_at.is.null,last_trial_email_at.lt.${emailCooldown}`);

    if (dbError) {
      console.error('[trial-expiry cron] DB fetch error:', dbError);
      return NextResponse.json({ error: 'DB query failed', details: dbError.message }, { status: 500 });
    }

    let warningSent = 0;
    let expiredSent = 0;

    for (const r of (restaurants || [])) {
      if (!r.email) continue;

      const expiry = new Date(r.expiry_date);
      const ownerName = r.digital_signature || r.name || 'Restaurant Partner';
      const brandName = r.name || 'Your Restaurant';
      const expiryFormatted = expiry.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      let subject = null;
      let htmlContent = null;
      let scenario = null;

      // ── Scenario A: 3-day warning ──
      if (expiry >= new Date(windowAStart) && expiry <= new Date(windowAEnd)) {
        scenario = 'warning';
        subject = `Your RestDigi trial ends in 3 days — upgrade to keep going`;
        htmlContent = `
<div style="font-family: Arial, sans-serif; font-size: 15px; color: #111111; line-height: 1.7; max-width: 600px; padding: 20px 0;">
  <p>Hi ${ownerName},</p>

  <p>Your <strong>14-Day Free Trial</strong> for <strong>${brandName}</strong> is ending on <strong style="color: #D32F2F;">${expiryFormatted}</strong> — just 3 days away.</p>

  <p>After that, your QR ordering system, Live KOT dashboard, and customer menu will be paused until you upgrade to a paid plan.</p>

  <p>To keep everything running without interruption, upgrade before your trial ends:</p>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://www.restdigi.online/admin/billing" style="background: #D32F2F; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
      Upgrade Now →
    </a>
  </p>

  <p>If you have any questions about which plan is right for you, just reply to this email — I'm happy to help you pick.</p>

  <p style="margin-top: 28px;">
    Cheers,<br>
    Mamoon<br>
    Founder &amp; CEO, RestDigi
  </p>
</div>`;
      }

      // ── Scenario B: expired in the last 48hrs ──
      else if (expiry >= new Date(windowBStart) && expiry <= now) {
        scenario = 'expired';
        subject = `Your RestDigi free trial has ended — here's what you lose without upgrading`;
        htmlContent = `
<div style="font-family: Arial, sans-serif; font-size: 15px; color: #111111; line-height: 1.7; max-width: 600px; padding: 20px 0;">
  <p>Hi ${ownerName},</p>

  <p>Your <strong>14-Day Free Trial</strong> for <strong>${brandName}</strong> ended on <strong>${expiryFormatted}</strong>.</p>

  <p>As of now, the following are paused for your restaurant:</p>
  <ul style="padding-left: 20px; margin: 12px 0;">
    <li>❌ QR ordering for customers</li>
    <li>❌ Live Kitchen Order Ticket (KOT) dashboard</li>
    <li>❌ Digital menu visibility</li>
    <li>❌ Real-time order tracking</li>
  </ul>

  <p>Upgrading takes less than a minute and immediately restores everything. Your menu, tables, and order history are all safely saved — you're not starting over.</p>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://www.restdigi.online/admin/billing" style="background: #D32F2F; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
      Reactivate Your Restaurant →
    </a>
  </p>

  <p>If there's anything holding you back or if you'd like a quick demo call, just reply on support@restdigi.online">support@restdigi.online</a>.</p>

  <p style="margin-top: 28px;">
    Cheers,<br>
    Mamoon<br>
    Founder &amp; CEO, RestDigi
  </p>
</div>`;
      }

      if (!subject || !htmlContent) continue;

      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'api-key': process.env.BREVO_API_KEY || ''
          },
          body: JSON.stringify({
            sender: { name: 'Mamoon from RestDigi', email: 'noreply@restdigi.online' },
            to: [{ email: r.email, name: ownerName }],
            subject,
            htmlContent
          })
        });

        if (!brevoRes.ok) {
          const errText = await brevoRes.text();
          throw new Error(`Brevo error (${brevoRes.status}): ${errText}`);
        }

        // Record send time to avoid re-triggering
        await supabaseAdmin
          .from('restaurants')
          .update({ last_trial_email_at: now.toISOString() })
          .eq('id', r.id);

        if (scenario === 'warning') warningSent++;
        if (scenario === 'expired') expiredSent++;
      } catch (err) {
        console.error(`[trial-expiry cron] Failed for restaurant ${r.id}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      warning_emails_sent: warningSent,
      expiry_emails_sent: expiredSent
    });
  } catch (error) {
    console.error('[trial-expiry cron] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  return handleCron(req);
}

export async function POST(req) {
  return handleCron(req);
}
