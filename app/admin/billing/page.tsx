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
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    if (restaurant) {
      fetchPayments();
    }
  }, [restaurant]);

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
  const daysRemaining = expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 0;
  const isExpired = expiryDate ? new Date() > expiryDate : false;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (plan: 'pro' | 'premium', price: number, isAnnual: boolean, useDiscount: boolean = false) => {
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
        body: JSON.stringify({ plan, price, useDiscount, restaurantId: restaurant.id })
      });
      const orderData = await orderRes.json();

      if (!orderData.id) throw new Error('Order creation failed');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE",
        amount: orderData.amount,
        currency: orderData.currency,
        name: restaurant?.name || "RestoOS",
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
                useDiscount,
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
          name: restaurant?.owner_name || "",
          contact: restaurant?.whatsapp_number || "",
        },
        theme: {
          color: restaurant?.theme_color || "#2563eb",
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
        plan_type: 'basic',
        status: 'success',
        payment_method: 'free_trial'
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

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: isAnnual ? 1499 : 149,
      period: isAnnual ? '/yr' : '/mo',
      savings: isAnnual ? 'Save ~16%' : null,
      description: 'Perfect to get started and test the waters with your digital menu.',
      banner: 'First 5 Registered Businesses Get 1 Month Free! (Basic Tier Features Locked)',
      features: [
        { name: 'Up to 12 Menu Items', included: true },
        { name: 'Up to 5 Digital Tables', included: true },
        { name: 'SEO Ranking Optimization', included: false },
        { name: 'Top Selling Dish Analytics', included: false },
        { name: 'Total QR Scans Metric Counter', included: false },
        { name: 'Menu Item View Performance Graphs', included: false },
        { name: 'Direct 24/7 Support & Assistance', included: false }
      ],
      highlight: false
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: isAnnual ? 7899 : 699,
      period: isAnnual ? '/yr' : '/mo',
      savings: isAnnual ? 'Save ~6%' : null,
      description: 'Everything you need to run and optimize your active digital menu.',
      features: [
        { name: 'Up to 20 Menu Items', included: true },
        { name: 'Up to 15 Digital Tables', included: true },
        { name: 'SEO Ranking Optimization', included: true },
        { name: 'Top Selling Dish Analytics', included: true },
        { name: 'Total QR Scans Metric Counter', included: true },
        { name: 'Menu Item View Performance Graphs', included: false },
        { name: 'Direct 24/7 Support & Assistance', included: false }
      ],
      highlight: true
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: isAnnual ? 10499 : 999,
      period: isAnnual ? '/yr' : '/mo',
      savings: isAnnual ? 'Save ~12%' : null,
      description: 'For growing brands looking for deeper data and direct metrics.',
      features: [
        { name: 'Up to 23 Menu Items', included: true },
        { name: 'Up to 17 Digital Tables', included: true },
        { name: 'SEO Ranking Optimization', included: true },
        { name: 'Top Selling Dish Analytics', included: true },
        { name: 'Total QR Scans Metric Counter', included: true },
        { name: 'Menu Item View Performance Graphs', included: true },
        { name: 'Direct 24/7 Support & Assistance', included: false }
      ],
      highlight: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 'Custom / Contact Us',
      period: '',
      savings: null,
      description: 'Fully tailored setup limits and direct enterprise priority support.',
      features: [
        { name: 'Manual Scalable Items (As per your custom need)', included: true },
        { name: 'Unlimited Digital Tables', included: true },
        { name: 'SEO Ranking Optimization', included: true },
        { name: 'Top Selling Dish Analytics', included: true },
        { name: 'Total QR Scans Metric Counter', included: true },
        { name: 'Menu Item View Performance Graphs', included: true },
        { name: 'Direct 24/7 Support & Assistance', included: true }
      ],
      highlight: false
    }
  ];

  const getCtaLabel = (planId: string) => {
    if (currentPlan === planId) return 'Current Plan';

    if (planId === 'basic') {
      return currentPlan === 'free' ? 'Start Free Month' : 'Switch to Basic';
    }
    if (planId === 'pro') {
      return (currentPlan === 'premium' || currentPlan === 'enterprise') ? 'Switch to Pro' : 'Upgrade to Pro';
    }
    if (planId === 'premium') {
      return currentPlan === 'enterprise' ? 'Switch to Premium' : 'Upgrade to Premium';
    }
    if (planId === 'enterprise') {
      return 'Contact Sales';
    }
    return 'Upgrade';
  };

  const whatsappUrl = `https://wa.me/919999999999?text=${encodeURIComponent(
    `Hi! I'm interested in the Enterprise Plan for my restaurant "${restaurant?.name || ''}" (ID: ${restaurant?.id || ''}). Please contact me with details.`
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
                    ? 'bg-blue-100 text-blue-700'
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

      {/* Premium Sliding Billing Cycle Toggle */}
      <div className="flex flex-col items-center justify-center space-y-3 py-4">
        <div className="relative bg-gray-100 p-1 rounded-full inline-flex border border-gray-200 shadow-inner">
          <div
            className="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-out"
            style={{
              left: isAnnual ? 'calc(50% + 2px)' : '4px',
              width: 'calc(50% - 6px)',
            }}
          />
          <button
            onClick={() => setIsAnnual(false)}
            className={`relative z-10 px-6 py-2 text-sm font-bold rounded-full transition-colors duration-200 ${!isAnnual ? 'text-gray-950' : 'text-gray-400 hover:text-gray-700'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`relative z-10 px-6 py-2 text-sm font-bold rounded-full transition-colors duration-200 flex items-center gap-1.5 ${isAnnual ? 'text-gray-950' : 'text-gray-400 hover:text-gray-700'
              }`}
          >
            Annually
            <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95">
              Save
            </span>
          </button>
        </div>
        {isAnnual && (
          <p className="text-xs font-semibold text-emerald-600 animate-fade-in">
            🎉 Smart choice! Saving up to 16% on annual packages.
          </p>
        )}
      </div>

      {/* 4-Tier Grid Subscription Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-8 border flex flex-col relative overflow-hidden transition-all duration-300 ${plan.highlight
                  ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg md:-translate-y-2'
                  : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              {plan.banner && (
                <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-[9px] font-bold py-2 px-4 text-center tracking-wide uppercase leading-tight z-10">
                  {plan.banner}
                </div>
              )}
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
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
                      handleStartFreeTrial();
                    } else if (plan.id === 'enterprise') {
                      window.open(whatsappUrl, '_blank');
                    } else {
                      handleUpgrade(plan.id as 'pro' | 'premium', plan.price as number, isAnnual);
                    }
                  }}
                  disabled={isLoading || isCurrent}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : plan.highlight
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md'
                    }`}
                >
                  {getCtaLabel(plan.id)}
                </button>
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
                      {payment.plan_type}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{payment.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {payment.payment_method || 'Online'}
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
      `}</style>
    </div>
  );
}
