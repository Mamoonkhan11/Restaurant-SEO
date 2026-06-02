import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, name, restaurantName } = await req.json();

    if (!email || !name || !restaurantName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
      const htmlContent = `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #111111; line-height: 1.6; max-width: 600px; padding: 20px 0;">
  <p>Woohoo! Your digital transformation has officially started. Welcome to the RestDigi family, ${name}!</p>
  
  <p>Your account has been successfully activated on the <strong>Early Bird Tier (One Month FREE for core modules)</strong>.</p>
  
  <p><strong>Quick Start Guide Action Steps:</strong></p>
  <ol style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;"><strong>Step 1:</strong> Log into your Admin Dashboard.</li>
    <li style="margin-bottom: 8px;"><strong>Step 2:</strong> Add your first 5 food items with prices.</li>
    <li style="margin-bottom: 8px;"><strong>Step 3:</strong> Download your custom Table QR Code and print it!</li>
  </ol>
  
  <p style="margin-bottom: 24px;">
    <a href="https://www.restdigi.online/dashboard" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px;">Go to Dashboard Workspace</a>
  </p>
  
  <p>Got stuck somewhere? Reply to this email or contact us at <a href="mailto:support@restdigi.online" style="color: #D32F2F; text-decoration: underline; font-weight: bold;">support@restdigi.online</a>. Let's eliminate order latency together!</p>
  
  <p style="margin-top: 24px;">
    Cheers,<br>
    Mamoon<br>
    Founder and CEO
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
          to: [{ email: email, name: name }],
          subject: `Welcome to the Future of Dining, ${name}! 🎉`,
          htmlContent: htmlContent
        })
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        console.error(`Welcome email failed: Brevo API error (${response.status}): ${errorMsg}`);
      }
    } catch (emailErr) {
      console.error('Welcome email dispatch failed with error:', emailErr.message || emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error inside /api/auth/register route handler:', err.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
