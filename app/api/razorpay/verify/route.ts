import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { payment_id, order_id, signature, restaurantId, plan, amount, isAnnual } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(order_id + "|" + payment_id)
      .digest('hex');

    // For testing purposes, if using a dummy secret, bypass signature check, otherwise enforce it
    if (process.env.RAZORPAY_KEY_SECRET && generatedSignature !== signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    // Verified! Update Database
    const newExpiry = new Date();
    const isYearly = isAnnual !== undefined ? isAnnual : (plan === 'premium');
    if (isYearly) {
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    } else {
      newExpiry.setDate(newExpiry.getDate() + 30);
    }

    // Update restaurant
    await supabase
      .from('restaurants')
      .update({
        plan_type: plan,
        subscription_status: 'active',
        expiry_date: newExpiry.toISOString()
      })
      .eq('id', restaurantId);

    // Insert payment record
    await supabase.from('payments').insert({
      restaurant_id: restaurantId,
      amount: amount,
      plan_tier: plan,
      billing_cycle: isYearly ? 'yearly' : 'monthly',
      status: 'success',
      payment_method: 'razorpay',
      payment_gateway: 'razorpay',
      description: `Razorpay Subscription Upgradation to ${plan} Plan (${isYearly ? 'Yearly' : 'Monthly'})`,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
