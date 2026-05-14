"use client";
import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/lib/RestaurantContext';
import { Check, CreditCard, QrCode, UploadCloud, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function BillingPage() {
  const { restaurant, refreshRestaurant } = useRestaurant();
  const [isLoading, setIsLoading] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

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

  const handleUpgrade = async (plan: 'pro' | 'premium', price: number, useDiscount: boolean = false) => {
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
                useDiscount
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


  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <Toaster />
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Billing & Subscription</h1>
        <p className="mt-1 text-gray-500">Manage your subscription plan and view billing history.</p>
      </div>

      {/* Current Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${currentPlan === 'free' ? 'bg-gray-100 text-gray-700' : currentPlan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {currentPlan}
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

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col relative overflow-hidden">
          {currentPlan === 'free' && <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400"></div>}
          <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-extrabold text-gray-900">Free</span>
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">Perfect to get started and test the waters.</p>
          <ul className="space-y-4 flex-1 mb-8">
            {['Up to 20 dishes', 'Basic QR Code', 'Standard Support'].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                <Check className="w-5 h-5 text-green-500 shrink-0" /> {feature}
              </li>
            ))}
          </ul>
          <button disabled className="w-full py-3 rounded-xl font-bold text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed">
            {currentPlan === 'free' ? 'Current Plan' : 'Free Forever'}
          </button>
        </div>

        {/* Pro */}
        <div className="bg-white rounded-3xl p-8 border-2 border-blue-500 shadow-xl flex flex-col relative overflow-hidden transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-extrabold text-gray-900">₹999</span>
            <span className="text-gray-500 font-medium">/mo</span>
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">Everything you need to run your digital menu.</p>
          <ul className="space-y-4 flex-1 mb-8">
            {['Unlimited dishes', 'Real-time updates', 'WhatsApp ordering', 'Priority Support'].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> {feature}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => handleUpgrade('pro', 999)}
            disabled={isLoading || currentPlan === 'pro'}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${currentPlan === 'pro' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
          >
            {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Premium */}
        <div className="bg-gray-900 rounded-3xl p-8 shadow-xl flex flex-col relative overflow-hidden text-white">
          <h3 className="text-xl font-bold text-gray-100 mb-2">Premium</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-extrabold text-white">₹9,999</span>
            <span className="text-gray-400 font-medium">/yr</span>
          </div>
          <p className="text-sm text-gray-400 mb-6 font-medium">For serious restaurants needing full branding.</p>
          <ul className="space-y-4 flex-1 mb-8">
            {['Everything in Pro', 'Custom Domain', 'Advanced Analytics', 'Dedicated Account Manager'].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300 font-medium">
                <Check className="w-5 h-5 text-purple-400 shrink-0" /> {feature}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => handleUpgrade('premium', 9999)}
            disabled={isLoading || currentPlan === 'premium'}
            className={`w-full py-3 rounded-xl font-bold text-gray-900 transition-all ${currentPlan === 'premium' ? 'bg-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]'}`}
          >
            {currentPlan === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
          </button>
        </div>
      </div>

      {/* Manual UPI Option */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Prefer Direct Bank Transfer?</h3>
          <p className="text-sm text-gray-500 mt-1">For local Jammu clients, pay via UPI QR and upload a screenshot.</p>
        </div>
        <button 
          onClick={() => setShowUpiModal(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md whitespace-nowrap"
        >
          <QrCode className="w-5 h-5" />
          Pay via UPI QR
        </button>
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

      {/* UPI Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Pay via UPI</h3>
              <button onClick={() => setShowUpiModal(false)} className="text-gray-400 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-48 h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 overflow-hidden">
                <QrCode className="w-20 h-20 text-gray-400" />
                {/* Replace with actual QR Code image */}
              </div>
              <p className="text-gray-900 font-bold text-lg mb-1">Scan to Pay</p>
              <p className="text-gray-500 text-sm mb-6">UPI ID: admin@okhdfcbank</p>

              <div className="w-full">
                <label className="block text-left text-sm font-bold text-gray-700 mb-2">Upload Transaction Screenshot</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-600">Click to browse or drag file here</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  toast.success('Screenshot uploaded! We will verify and update your plan shortly.');
                  setShowUpiModal(false);
                }}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Submit for Verification
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>
    </div>
  );
}
