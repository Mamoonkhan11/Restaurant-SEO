import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const {
      restaurantId,
      plan,
      amount,
      billingCycle,
      expiryDate,
      type // 'trial' | 'promo' | 'paid'
    } = await req.json();

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    // Fetch owner email + name from DB using service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: restaurant, error: dbError } = await supabaseAdmin
      .from('restaurants')
      .select('email, name, digital_signature')
      .eq('id', restaurantId)
      .single();

    if (dbError || !restaurant?.email) {
      console.error('Could not fetch restaurant for email:', dbError);
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const ownerName = restaurant.digital_signature || restaurant.name || 'Restaurant Partner';
    const brandName = restaurant.name || 'Your Restaurant';
    const recipientEmail = restaurant.email;

    // Formatted expiry date
    const expiryFormatted = expiryDate
      ? new Date(expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'N/A';

    // Build plan label
    const planLabel = plan
      ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan`
      : 'Pro Plan';

    // Build cycle label
    const cycleLabel =
      type === 'trial' || type === 'promo'
        ? '14-Day Free Trial'
        : billingCycle === 'yearly'
          ? 'Yearly'
          : 'Monthly';

    // Amount label
    const amountLabel =
      amount === 0 || !amount ? '₹0 (Free)' : `₹${Number(amount).toLocaleString('en-IN')}`;

    // Subject
    const subject =
      type === 'paid'
        ? `Payment Confirmed — ${planLabel} Activated!`
        : `Your 14-Day Pro Trial is Active!`;

    // Intro sentence
    const introLine =
      type === 'paid'
        ? `Your payment has been received and your <strong>${planLabel}</strong> is now live on <strong>${brandName}</strong>.`
        : `Your <strong>14-Day Free Trial of the Pro Live-KOT Plan</strong> has been successfully activated for <strong>${brandName}</strong>.`;

    const htmlContent = `
<div style="font-family: Arial, sans-serif; font-size: 15px; color: #111111; line-height: 1.7; max-width: 600px; padding: 20px 0;">
  <p>Hi ${ownerName},</p>

  <p>${introLine}</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9f9f9; border-radius: 8px; overflow: hidden;">
    <tr style="background: #111111; color: #ffffff;">
      <th style="padding: 10px 16px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Detail</th>
      <th style="padding: 10px 16px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Info</th>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 16px; font-weight: bold; color: #555555;">Plan</td>
      <td style="padding: 12px 16px;">${planLabel}</td>
    </tr>
    <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 16px; font-weight: bold; color: #555555;">Billing Cycle</td>
      <td style="padding: 12px 16px;">${cycleLabel}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 16px; font-weight: bold; color: #555555;">Amount</td>
      <td style="padding: 12px 16px;">${amountLabel}</td>
    </tr>
    <tr style="background: #f3f4f6;">
      <td style="padding: 12px 16px; font-weight: bold; color: #555555;">${type === 'trial' || type === 'promo' ? 'Trial Ends On' : 'Plan Valid Until'}</td>
      <td style="padding: 12px 16px; font-weight: bold; color: #D32F2F;">${expiryFormatted}</td>
    </tr>
  </table>

  <p>Your kitchen dashboard, QR ordering system, and live KOT are all running. Head to your dashboard to manage everything:</p>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://www.restdigi.online/admin" style="background: #D32F2F; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
      Open Your Dashboard
    </a>
  </p>

  <p>If you need any help or have questions, reach us at <a href="mailto:support@restdigi.online" style="color: #D32F2F; font-weight: bold; text-decoration: underline;">support@restdigi.online</a> — we're always here.</p>

  <p style="margin-top: 28px;">
    Cheers,<br>
    Mamoon<br>
    Founder &amp; CEO, RestDigi
  </p>
</div>`;

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || ''
      },
      body: JSON.stringify({
        sender: { name: 'Mamoon from RestDigi', email: 'noreply@restdigi.online' },
        to: [{ email: recipientEmail, name: ownerName }],
        subject,
        htmlContent
      })
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      throw new Error(`Brevo API error (${brevoRes.status}): ${errText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[send-transaction-email] Error:', error.message);
    return NextResponse.json({ error: 'Failed to send email', details: error.message }, { status: 500 });
  }
}
