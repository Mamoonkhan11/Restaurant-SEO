import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept the dynamic customer menu page /menu/[slug]
  const match = pathname.match(/^\/menu\/([^/]+)$/);
  if (!match) {
    return NextResponse.next();
  }

  const slug = match[1];
  // Skip demo restaurant slug if needed
  if (!slug || slug === 'restdigi' || slug === 'demo-restaurant') {
    return NextResponse.next();
  }

  try {
    // Fetch Restaurant's expiry_date and subscription_status
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, expiry_date, subscription_status')
      .eq('slug', slug)
      .single();

    if (restaurant) {
      const now = new Date();
      const expiryDate = restaurant.expiry_date ? new Date(restaurant.expiry_date) : null;
      let status = restaurant.subscription_status || 'inactive';

      // If the current date is past the expiry_date
      if (expiryDate && now > expiryDate) {
        if (status !== 'inactive') {
          // Update database status to inactive
          await supabase
            .from('restaurants')
            .update({ subscription_status: 'inactive' })
            .eq('id', restaurant.id);
          status = 'inactive';
        }

        if (status === 'inactive') {
          // Block the menu UI completely and display placeholder screen
          return new NextResponse(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Digital Menu Maintenance</title>
              <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
              <style>
                body {
                  font-family: 'Outfit', sans-serif;
                  background-color: #f9fafb;
                  color: #111827;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                  box-sizing: border-box;
                }
                .card {
                  background: white;
                  padding: 40px;
                  border-radius: 24px;
                  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                  border: 1px solid #f3f4f6;
                  max-width: 480px;
                  width: 100%;
                  text-align: center;
                  animation: fadeInUp 0.4s ease-out forwards;
                }
                .icon-wrapper {
                  width: 64px;
                  height: 64px;
                  background-color: #fff7ed;
                  color: #ea580c;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto 24px;
                  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
                }
                h1 {
                  font-size: 24px;
                  font-weight: 800;
                  margin: 0 0 12px;
                  color: #111827;
                  line-height: 1.25;
                  tracking: -0.025em;
                }
                p {
                  font-size: 15px;
                  color: #6b7280;
                  margin: 0;
                  line-height: 1.6;
                  font-weight: 500;
                }
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 32px; height: 32px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h1>RestDigi Digital Menu Maintenance</h1>
                <p>Please inform your waiter to take your order manually.</p>
              </div>
            </body>
            </html>`,
            {
              headers: { 'content-type': 'text/html' },
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('Middleware check error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/menu/:slug*',
};
