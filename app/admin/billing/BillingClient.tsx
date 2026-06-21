"use client";
import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/lib/RestaurantContext';
import { Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function BillingPage() {
  const { restaurant, refreshRestaurant } = useRestaurant();
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    if (restaurant) {
      fetchPayments();
    }
  }, [restaurant]);

  useEffect(() => {
    const handleHashHighlight = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('pulse-highlight');
            setTimeout(() => {
              element.classList.remove('pulse-highlight');
            }, 3000);
          }, 200);
        }
      }
    };

    handleHashHighlight();
    window.addEventListener('hashchange', handleHashHighlight);
    return () => window.removeEventListener('hashchange', handleHashHighlight);
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('restaurant_id', restaurant?.id)
        .order('created_at', { ascending: false });

      if (data) setPayments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const currentPlan = restaurant?.plan_type || 'free';
  const expiryDate = restaurant?.expiry_date ? new Date(restaurant.expiry_date) : null;
  const trialEndsAt = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const now = new Date();

  const daysRemaining = currentPlan === 'free' && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 3600 * 24)))
    : (expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))) : 0);

  const isExpired = currentPlan === 'free' && trialEndsAt
    ? now > trialEndsAt
    : (expiryDate ? now > expiryDate : false);

  const isBasicTrial = currentPlan === 'basic' && (
    payments.some(p => p.plan_tier === 'basic' && p.payment_gateway === 'system_promo') ||
    (!payments || !payments.some(p => p.plan_tier === 'basic' && p.payment_gateway === 'razorpay' && p.status === 'success'))
  );

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (plan: 'basic' | 'pro' | 'premium', price: number, isAnnual: boolean) => {
    setIsLoading(true);
    const res = await loadRazorpay();

    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      setIsLoading(false);
      return;
    }

    try {
      // Create Order on Backend
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, price, restaurantId: restaurant.id })
      });
      const orderData = await orderRes.json();

      if (!orderData.id) throw new Error('Order creation failed');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE",
        amount: orderData.amount,
        currency: orderData.currency,
        name: restaurant?.name || "RESTDIGI",
        description: `${plan.toUpperCase()} Plan Subscription`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                restaurantId: restaurant.id,
                plan,
                amount: orderData.amount / 100,
                isAnnual
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success('Successfully upgraded!');
              refreshRestaurant();
              fetchPayments();
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error('Error updating subscription status.');
          }
        },
        prefill: {
          name: restaurant?.digital_signature || "",
          contact: "",
        },
        theme: {
          color: "#ea580c",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err) {
      toast.error('Failed to initiate payment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartFreeTrial = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30); // 30 days trial

      const { error } = await supabase
        .from('restaurants')
        .update({
          plan_type: 'basic',
          subscription_status: 'active',
          expiry_date: newExpiry.toISOString()
        })
        .eq('id', restaurant?.id);

      if (error) throw error;

      // Insert billing payment record
      await supabase.from('payments').insert({
        restaurant_id: restaurant?.id,
        amount: 0,
        plan_tier: 'basic',
        billing_cycle: 'monthly',
        status: 'success',
        payment_gateway: 'system_promo',
        description: 'Automated 1-Month Early Adopter Promotional Free Activation',
        created_at: new Date().toISOString()
      });

      toast.success('Successfully activated your 1-Month Free Trial of Basic Plan!');
      await refreshRestaurant();
      await fetchPayments();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to activate free trial: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          plan_type: 'free',
          subscription_status: 'cancelled',
          expiry_date: null
        })
        .eq('id', restaurant?.id);

      if (error) throw error;

      toast.success('Subscription cancelled successfully.');
      await refreshRestaurant();
      await fetchPayments();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to cancel subscription: ' + err.message);
    } finally {
      setIsLoading(false);
      setIsCancelModalOpen(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic Dine-In Plan',
      price: 19999,
      period: '/yr',
      savings: null,
      description: 'Perfect for local cafes, and fast-food joints looking to fully automate their ordering table-by-table.',
      features: [
        { name: 'Up to 50 Menu Items', included: true },
        { name: 'Up to 10 Digital Tables', included: true },
        { name: '100% Native RestDigi Order Processing (Zero third-party app jumps)', included: true },
        { name: 'Instant Mobile Kitchen Notification Queue', included: true },
        { name: 'Total QR Scans Metric Counter', included: true },
        { name: 'Menu Item View Performance Graphs', included: true },
        { name: 'Direct 24/7 Support & Assistance', included: true }
      ],
      highlight: false
    },
    {
      id: 'pro',
      name: 'Pro Live-KOT Plan',
      price: 39999,
      period: '/yr',
      savings: null,
      description: 'Built for high-volume, premium cafes and busy fine-dining spots to eliminate waiter overhead completely.',
      banner: 'Most Popular',
      features: [
        { name: 'Unlimited Menu Items', included: true },
        { name: 'Up to 30 Digital Tables', included: true },
        { name: '100% Native RestDigi Checkout Pipeline', included: true },
        { name: 'Instant Kitchen Order Ticket (KOT) Desktop Dashboard', included: true },
        { name: 'Automated Sound Alerts for New Orders', included: true },
        { name: 'Automated Google Review & Local SEO Booster', included: true },
        { name: 'Top Selling Dish Analytics', included: true },
        { name: 'Priority 24/7 Support & Assistance', included: true }
      ],
      highlight: true
    },
    {
      id: 'premium',
      name: 'Premium Houseboat & Hotel Plan',
      price: 64999,
      period: '/yr',
      savings: null,
      description: 'Tailor-made for Dal Lake houseboats and hotels to run entirely seamless, app-free in-room room service.',
      features: [
        { name: 'Unlimited Menu Items', included: true },
        { name: 'Up to 60 Digital Rooms / Houseboat Decks', included: true },
        { name: 'In-Room Native QR Order Routing Architecture', included: true },
        { name: 'Floating Delivery Shikara Status Monitor', included: true },
        { name: 'Instant Kitchen Order Ticket (KOT) Dashboard', included: true },
        { name: 'Automated Sound Alerts for New Orders', included: true },
        { name: 'Automated Google Review & Local SEO Booster', included: true },
        { name: 'Top Selling Dish Analytics', included: true },
        { name: 'Dedicated Account Manager Support', included: true }
      ],
      highlight: false
    }
  ];

  const getCtaLabel = (planId: string) => {
    if (currentPlan === planId) {
      if (daysRemaining <= 5) {
        return 'Renew Now';
      }
      return 'Current Plan';
    }

    if (planId === 'basic') {
      const hasUsedTrial = payments.length > 0;
      return (currentPlan === 'free' && !hasUsedTrial) ? 'Start Free Month' : 'Activate Basic Dine-In';
    }
    if (planId === 'pro') {
      return 'Upgrade to Pro Live-KOT';
    }
    if (planId === 'premium') {
      return 'Upgrade to Premium';
    }
    return 'Upgrade';
  };

  const mailtoUrl = `mailto:support@restdigi.online?subject=${encodeURIComponent(
    `Enterprise Plan Inquiry - ${restaurant?.name || ''}`
  )}&body=${encodeURIComponent(
    `Hi RESTDIGI Team,\n\nI'm interested in the Enterprise Plan for my restaurant "${restaurant?.name || ''}" (ID: ${restaurant?.id || ''}). Please contact me with details.`
  )}`;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <Toaster />

      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Billing & Subscription</h1>
        <p className="mt-1 text-gray-500 font-medium">Manage your subscription plan, pricing options, and view payment history.</p>
      </div>

      {/* Current Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${currentPlan === 'free'
              ? 'bg-gray-100 text-gray-700'
              : currentPlan === 'basic'
                ? 'bg-emerald-100 text-emerald-700'
                : currentPlan === 'pro'
                  ? 'bg-orange-100 text-orange-700'
                  : currentPlan === 'premium'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-indigo-100 text-indigo-700'
              }`}>
              {currentPlan} plan
            </span>
            {currentPlan !== 'free' && (
              <span className={`text-sm font-medium ${isExpired ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
              </span>
            )}
          </div>
        </div>

        {isExpired && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Your subscription has expired. Your menu is currently hidden from customers.</span>
          </div>
        )}
      </div>

      {/* Yearly Billing Banner */}
      <div className="flex flex-col items-center justify-center space-y-2 py-4">
        <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 animate-fade-in">
          Yearly Subscriptions
        </span>
        <p className="text-sm font-medium text-gray-500 animate-fade-in">
          All RestDigi subscription plans are billed annually.
        </p>
      </div>

      {/* 3-Tier Grid Subscription Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto gap-8 items-stretch">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isCurrentExpiring = currentPlan === plan.id && daysRemaining <= 5;
          return (
            <div
              id={plan.id}
              key={plan.id}
              className={`bg-white rounded-3xl p-8 border flex flex-col relative overflow-hidden transition-all duration-300 ${plan.highlight
                ? 'border-orange-500 ring-2 ring-orange-500 shadow-lg md:-translate-y-2'
                : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              {plan.banner && (
                <div className="absolute top-0 left-0 right-0 bg-orange-600 text-white text-[9px] font-bold py-2 px-4 text-center tracking-wide uppercase leading-tight z-10">
                  {plan.banner}
                </div>
              )}
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div className={`flex-1 flex flex-col ${plan.banner ? 'pt-6' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  {typeof plan.price === 'number' ? (
                    <>
                      <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                      <span className="text-gray-500 font-medium text-sm">{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-xl font-extrabold text-gray-900 leading-tight">{plan.price}</span>
                  )}
                </div>

                {isAnnual && plan.savings ? (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {plan.savings}
                    </span>
                  </div>
                ) : (
                  <div className="mb-4 h-[22px]" />
                )}

                <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">{plan.description}</p>

                <ul className="space-y-4 flex-1 mb-8">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2.5 text-sm font-medium transition-all ${feature.included
                        ? 'text-gray-700'
                        : 'text-rose-400 line-through text-opacity-50 text-gray-400'
                        }`}
                    >
                      {feature.included ? (
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.id === 'basic') {
                      const hasUsedTrial = payments.length > 0;
                      if (currentPlan === 'free' && !hasUsedTrial) {
                        handleStartFreeTrial();
                      } else {
                        handleUpgrade('basic', plan.price as number, isAnnual);
                      }
                    } else if (plan.id === 'enterprise') {
                      window.location.href = mailtoUrl;
                    } else {
                      handleUpgrade(plan.id as 'basic' | 'pro' | 'premium', plan.price as number, isAnnual);
                    }
                  }}
                  disabled={isLoading || (isCurrent && !isCurrentExpiring)}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${(isCurrent && !isCurrentExpiring)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : plan.highlight
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md'
                    }`}
                >
                  {getCtaLabel(plan.id)}
                </button>

                {isCurrent && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={isLoading}
                    className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm transition-all border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Billing History</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            No past invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700 capitalize">
                      {payment.plan_tier}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{payment.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {payment.payment_gateway || 'Online'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes pulseHighlight {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); border-color: #f97316; }
          50% { transform: scale(1.03); box-shadow: 0 0 0 10px rgba(249, 115, 22, 0.2); border-color: #ea580c; }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
        .pulse-highlight {
          animation: pulseHighlight 1.5s ease-in-out 2;
          z-index: 20;
        }
      `}</style>

      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center transform scale-100 transition-all animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Your Subscription?</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Are you sure you want to proceed? Your operational features will be instantly downgraded to our free plan metrics.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isLoading}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm shadow-rose-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? "Cancelling..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
