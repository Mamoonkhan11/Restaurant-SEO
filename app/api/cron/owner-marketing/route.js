import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const emailMatrix = [
  {
    subject: "Is paper management leaking your restaurant profits?",
    body: `I was reviewing some restaurant metrics today and wanted to ask: are you still using paper order pads and manual kitchen tickets? I've seen so many owners lose a significant chunk of their margins due to simple paper leaks—lost tickets, manual billing errors, or delays in cooking.<br><br>We built RESTDIGI to fix exactly this. By moving to our digital framework, everything updates in real-time, preventing order leaks and keeping your preparation loops fast.`,
    ctaText: "Open Your RestDigi Dashboard"
  },
  {
    subject: "Empower your waitstaff & eliminate service friction",
    body: `I wanted to check in on how your waitstaff manages table orders during peak hours. If they have to write down orders on paper and run to the kitchen, it naturally creates a bottleneck.<br><br>Our Waiter Panel lets your staff scan tables, enter orders on their phones, and route them instantly to the kitchen display. It eliminates manual ordering mistakes and ensures diners are served faster.`,
    ctaText: "Activate Waiter Panel"
  },
  {
    subject: "Boost your average billing value by 25% automatically",
    body: `Let's talk about upselling. When your staff is busy running around, they often forget to suggest add-ons like extra cheese, desserts, or beverage pairings.<br><br>With the RESTDIGI interactive menu, the system does this automatically. It intelligently prompts customers with smart pairings and toppings at the exact moment they are ordering. Owners who use this feature see an average billing increase of 25% without changing anything else.`,
    ctaText: "Boost Your Billing Value Today"
  },
  {
    subject: "Unlock the RESTDIGI Starter Plan: Perfect for Single Outlets",
    body: `If you are running a single cafe or outlet, I highly recommend our Starter Plan. It's built specifically to automate basic operations without any unnecessary complexity or high costs.<br><br>You get the core digital menu, table scanning, and basic order tracking. It's the most cost-effective way to transition away from paper and speed up your service.`,
    ctaText: "Explore Starter Plan Tiers"
  },
  {
    subject: "Inside the Kitchen: Speed up your preparation loops",
    body: `Have you looked at how orders are handled inside your kitchen? A chaotic kitchen means slower table turnovers and lower overall sales.<br><br>The RESTDIGI Kitchen Display Layout sorts incoming orders automatically based on preparation time, with color-coded timers. This helps your chefs prioritize cooking easily. Speeding up preparation loops translates directly to more tables served per hour.`,
    ctaText: "Optimize Your Kitchen Loops"
  },
  {
    subject: "Track your sales revenue live from anywhere in the world",
    body: `As an owner, you shouldn't have to be physically present at the restaurant just to know how the day's sales are going.<br><br>Our Admin Dashboard gives you live revenue tracking, peak traffic counters, and item popularity analytics from any device. You can track exactly what's selling and how much you're making in real-time, whether you're at home or traveling.`,
    ctaText: "Access Real-time Analytics"
  },
  {
    subject: "Scale to Premium: Multiple Outlets & Advanced Inventory Systems",
    body: `If you are looking to scale your business to multiple locations, you will need central control. Centralizing menus, pricing, and stock can quickly become a headache.<br><br>Our Pro and Premium plans offer centralized catalog management, real-time franchise data sync, and advanced supply chain oversight. You can control menus across all your outlets from one screen.`,
    ctaText: "Scale to Pro & Premium Tiers"
  },
  {
    subject: "Ready to dominate your local food market? Pick your perfect plan",
    body: `We have spent a lot of time engineering RESTDIGI to help local restaurants run more efficiently and grow their revenue. Whether you need simple digital ordering or advanced multi-outlet tracking, we have a plan that fits.<br><br>Take a moment to pick the plan that matches your current size. If you have any questions or need help picking, just hit reply and let me know.`,
    ctaText: "Pick Your Perfect Plan"
  }
];

function getEmailHtml(id, digital_signature, subject, contentBody, ctaText) {
  return `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #111111; line-height: 1.6; max-width: 600px; padding: 20px 0;">
  <p>Hi ${digital_signature},</p>
  <p>${contentBody}</p>
  <p>Upgrade your plan here: <a href="https://www.restdigi.online/admin/billing" style="color: #D32F2F; font-weight: bold; text-decoration: underline;">${ctaText}</a></p>
  <p>Best regards,<br>Mamoon<br>Founder, RESTDIGI</p>
  <p style="font-size: 11px; color: #888888; margin-top: 30px;">To opt out of future updates, click <a href="https://www.restdigi.online/api/unsubscribe?id=${id}" style="color: #888888; text-decoration: underline;">here</a>.</p>
 </div>`;
}

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
      .select('id, email, name, digital_signature, email_sequence_step, unsubscribed')
      .eq('terms_accepted', true);

    if (dbError) {
      console.error('Error fetching restaurants for marketing cron:', dbError);
      return NextResponse.json({ error: 'Database query failed', details: dbError.message }, { status: 500 });
    }

    const targets = (restaurants || []).filter(r => r.email && !r.unsubscribed);

    if (targets.length === 0) {
      return NextResponse.json({ message: 'No eligible recipients found.', processed: 0 });
    }

    const results = [];

    for (const restaurant of targets) {
      try {
        const currentStep = restaurant.email_sequence_step || 0;
        const contentIndex = currentStep % 8;
        const emailData = emailMatrix[contentIndex];

        const htmlContent = getEmailHtml(
          restaurant.id,
          restaurant.digital_signature || restaurant.name || 'Restaurant Partner',
          emailData.subject,
          emailData.body,
          emailData.ctaText
        );

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': process.env.BREVO_API_KEY || ''
          },
          body: JSON.stringify({
            sender: { name: "Mamoon from Restdigi", email: "noreply@restdigi.online" },
            to: [{ email: restaurant.email, name: restaurant.digital_signature || restaurant.name || "Restaurant Partner" }],
            subject: emailData.subject,
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Brevo API error (${response.status}): ${errorMsg}`);
        }

        const { error: updateError } = await supabaseAdmin
          .from('restaurants')
          .update({ email_sequence_step: currentStep + 1 })
          .eq('id', restaurant.id);

        if (updateError) {
          throw new Error(`Supabase sequence increment failed: ${updateError.message}`);
        }

        results.push({
          id: restaurant.id,
          email: restaurant.email,
          status: 'success',
          stepSent: currentStep,
          nextStep: currentStep + 1
        });
      } catch (err) {
        console.error(`Failed to process restaurant ${restaurant.id} (${restaurant.email}):`, err.message);
        results.push({
          id: restaurant.id,
          email: restaurant.email,
          status: 'failed',
          error: err.message
        });
      }
    }

    return NextResponse.json({
      message: 'RestDigi Emails Sent Successfully',
      totalProcessed: targets.length,
      successCount: results.filter(r => r.status === 'success').length,
      failedCount: results.filter(r => r.status === 'failed').length,
      details: results
    });

  } catch (error) {
    console.error('Unhandled error during marketing email cron execution:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  return handleCron(req);
}

export async function POST(req) {
  return handleCron(req);
}
