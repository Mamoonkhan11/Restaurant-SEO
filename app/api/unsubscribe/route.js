import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse(
        `<html>
          <head>
            <title>Invalid Unsubscribe Request</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background: #FFF8F6; color: #333; }
              .card { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; border: 1px solid #F5F5F5; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            </style>
          </head>
          <body>
            <div class="card">
              <h2 style="color: #D32F2F;">Invalid Request</h2>
              <p>No restaurant identifier was provided. If you clicked a link from your email, please try copying the complete URL.</p>
            </div>
          </body>
        </html>`,
        { headers: { 'content-type': 'text/html' }, status: 400 }
      );
    }

    // Update restaurant unsubscribed column to true
    const { error } = await supabase
      .from('restaurants')
      .update({ unsubscribed: true })
      .eq('id', id);

    if (error) {
      console.error('Failed to unsubscribe restaurant:', error);
      return new NextResponse(
        `<html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background: #FFF8F6; }
              .card { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; border: 1px solid #F5F5F5; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2 style="color: #D32F2F;">Error</h2>
              <p>We could not process your unsubscribe request at this time: ${error.message}</p>
            </div>
          </body>
        </html>`,
        { headers: { 'content-type': 'text/html' }, status: 500 }
      );
    }

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed Successfully</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
          body {
            margin: 0;
            padding: 0;
            background-color: #FFF8F6;
            font-family: 'Outfit', sans-serif;
            color: #2A2A2A;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            max-width: 500px;
            width: 90%;
            background-color: #ffffff;
            border: 1px solid #F5F5F5;
            border-radius: 24px;
            padding: 48px 32px;
            box-shadow: 0 10px 30px rgba(211, 47, 47, 0.05);
            text-align: center;
          }
          .icon {
            width: 64px;
            height: 64px;
            background-color: #FFF8F6;
            color: #FF9100;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px auto;
            font-size: 32px;
          }
          h1 {
            color: #D32F2F;
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 16px 0;
          }
          p {
            font-size: 16px;
            color: #5A5A5A;
            line-height: 1.6;
            margin: 0 0 32px 0;
          }
          .btn {
            background-color: #D32F2F;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            display: inline-block;
            box-shadow: 0 4px 10px rgba(211, 47, 47, 0.2);
            transition: all 0.2s ease;
          }
          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 14px rgba(211, 47, 47, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✉️</div>
          <h1>Unsubscribed Successfully</h1>
          <p>You have been removed from our marketing newsletter. You will no longer receive sequence updates or promotional offers. Operational emails regarding your billing status and orders will still be delivered.</p>
          <a href="https://www.restdigi.online" class="btn">Return to RESTDIGI</a>
        </div>
      </body>
      </html>`,
      { headers: { 'content-type': 'text/html' } }
    );
  } catch (error) {
    console.error('Unhandled error in unsubscribe route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
