import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Email content matrix matching the 8 emails
const emailMatrix = [
  {
    subject: "Is paper management leaking your restaurant profits? ",
    body: `Are you still using paper order pads and manual kitchen tickets? Handwritten KOT entries are slow, error-prone, and one of the biggest reasons for leaks in restaurant profits. Orders get lost, billing errors happen, and food preparation slows down.<br><br>With <strong>RESTDIGI</strong>, you can transition seamlessly to a cloud-native digital system. Keep track of all orders in real-time, streamline your kitchen routing, and ensure that every single item served is accurately recorded and billed. Protect your hard-earned margins from day one!`,
    ctaText: "Go to Billing & Upgrade"
  },
  {
    subject: "Empower your waitstaff & eliminate service friction ",
    body: `Service speed and accuracy are everything when it comes to guest satisfaction. If your waitstaff is running back and forth to write kitchen orders, tables are waiting longer than they should.<br><br>The <strong>RESTDIGI Waiter Panel</strong> eliminates this friction. Your staff can scan tables, enter orders directly on a mobile interface, and instantly route KOTs directly to kitchen display screens. Say goodbye to manual mistakes, misheard orders, and table service delays!`,
    ctaText: "Empower Your Waitstaff Now"
  },
  {
    subject: "Boost your average billing value by 25% automatically ",
    body: `Every restaurant owner wants to increase their average order value, but waitstaff often forget to upsell when they are busy. The psychological impact of automated upselling is huge.<br><br>The <strong>RESTDIGI Interactive Menu</strong> does the work for you. It intelligently prompts your customers with smart add-ons—such as extra cheese, dynamic beverage pairings, or delicious desserts—right when they order. Boost your billing value automatically without depending on manual staff suggestions!`,
    ctaText: "Boost Billing Value Today"
  },
  {
    subject: "Unlock the RESTDIGI Starter Plan: Perfect for Single Outlets ",
    body: `Are you looking to streamline operations for a single cafe or restaurant outlet? The <strong>RESTDIGI Starter Plan</strong> is designed specifically for you.<br><br>Get access to our core digital menu, table order tracking, and essential operations tools at an extremely affordable rate. It is the perfect launchpad to automate your daily tasks without breaking the bank. Discover how standard automation can elevate your growing outlet!`,
    ctaText: "Explore Starter Plan Tiers"
  },
  {
    subject: "Inside the Kitchen: Speed up your preparation loops ",
    body: `A chaotic kitchen slows down table turnover and impacts your revenue. Chefs need a structured way to view and prioritize incoming orders.<br><br>The <strong>RESTDIGI Kitchen Display Layout</strong> streamlines kitchen operations. It features color-coded timers, auto-sorting of orders based on cooking time, and clear notifications for modifications or special requests. Empower your kitchen team to speed up prep loops and serve guests faster than ever!`,
    ctaText: "Optimize Your Kitchen Loops"
  },
  {
    subject: "Track your sales revenue live from anywhere in the world ",
    body: `Managing a restaurant shouldn't mean being chained to the billing counter. You need a way to track operations and revenue remotely.<br><br>The <strong>RESTDIGI Owner & Admin Dashboard</strong> gives you real-time visibility from anywhere in the world. Monitor live sales, track peak traffic hours, analyze item popularity, and review automated demand predictions. Make data-driven decisions that grow your restaurant's bottom line!`,
    ctaText: "Access Real-time Analytics"
  },
  {
    subject: "Scale to Premium: Multiple Outlets & Advanced Inventory Systems ",
    body: `Ready to scale up? Whether you run a growing chain or a large dining establishment, you need advanced tools to manage complexity.<br><br>Our <strong>RESTDIGI Pro & Premium Multi-Outlet Tiers</strong> are built for scale. Manage your centralized menu catalog, sync live inventory data across franchises, track supply chain performance, and oversee consolidated business reports from a single dashboard. Scale your operations efficiently with centralized power!`,
    ctaText: "Scale to Pro & Premium Tiers"
  },
  {
    subject: "Ready to dominate your local food market? Pick your perfect plan ",
    body: `The right technology can set your restaurant apart from competitors. From automated upselling to real-time sales analytics, RESTDIGI is built to help you grow.<br><br>Compare our pricing tiers and pick the perfect plan tailored to your restaurant's size and needs. Start saving time, reducing order errors, and boosting your revenue today. Let's build your success story together!`,
    ctaText: "Pick Your Perfect Plan"
  }
];

function getEmailHtml(id, name, subject, contentBody, ctaText) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #FFF8F6;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2A2A2A;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FFF8F6;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #F5F5F5;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(211, 47, 47, 0.03);
    }
    .header {
      background-color: #ffffff;
      padding: 30px 40px 20px 40px;
      border-bottom: 1px solid #F5F5F5;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #D32F2F;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px;
      line-height: 1.6;
      font-size: 16px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #D32F2F;
    }
    .main-text {
      margin-bottom: 30px;
      color: #4A4A4A;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0;
    }
    .cta-button {
      background-color: #D32F2F;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 4px 10px rgba(211, 47, 47, 0.25);
      transition: all 0.2s ease-in-out;
    }
    .footer {
      background-color: #FFF8F6;
      padding: 30px 40px;
      text-align: center;
      font-size: 13px;
      color: #7A7A7A;
      border-top: 1px solid #F5F5F5;
    }
    .footer a {
      color: #D32F2F;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="https://www.restdigi.online" class="logo">REST<span style="color: #FF9100;">DIGI</span></a>
      </div>
      <div class="content">
        <div class="greeting">Hi ${name},</div>
        <div class="main-text">
          ${contentBody}
        </div>
        <div class="cta-container">
          <a href="https://www.restdigi.online/admin/billing" class="cta-button">${ctaText}</a>
        </div>
      </div>
      <div class="footer">
        <p>You are receiving this because you agreed to RESTDIGI terms of service.<br>
        RESTDIGI Growth Team • <a href="https://www.restdigi.online">www.restdigi.online</a> • <a href="https://www.restdigi.online/api/unsubscribe?id=${id}">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function handleCron(req) {
  try {
    // 1. Strict Authorization Check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch target owners / restaurants where terms_accepted === true
    const { data: restaurants, error: dbError } = await supabase
      .from('restaurants')
      .select('id, email, name, email_sequence_step, unsubscribed')
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

    // 3. Process dispatch loop iteratively
    for (const restaurant of targets) {
      try {
        const currentStep = restaurant.email_sequence_step || 0;
        const contentIndex = currentStep % 8;
        const emailData = emailMatrix[contentIndex];

        const htmlContent = getEmailHtml(
          restaurant.id,
          restaurant.name || 'Restaurant Partner',
          emailData.subject,
          emailData.body,
          emailData.ctaText
        );

        // Send request to Brevo REST API endpoint
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': process.env.BREVO_API_KEY || ''
          },
          body: JSON.stringify({
            sender: { name: "RESTDIGI Growth Team", email: "noreply@restdigi.online" },
            to: [{ email: restaurant.email, name: restaurant.name || "Restaurant Partner" }],
            subject: emailData.subject,
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Brevo API error (${response.status}): ${errorMsg}`);
        }

        // 4. Update the database on successful dispatch
        const { error: updateError } = await supabase
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
      message: 'Marketing emails processed.',
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
