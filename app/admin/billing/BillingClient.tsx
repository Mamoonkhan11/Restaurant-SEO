"use client";
import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/lib/RestaurantContext';
import { Check, X, AlertCircle, Smartphone, QrCode, ArrowLeft, Copy, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function BillingPage() {
  const { restaurant, refreshRestaurant } = useRestaurant();
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoAgainModal, setPromoAgainModal] = useState(false);

  // UPI Fallback Payment States
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiPlan, setUpiPlan] = useState<'basic' | 'pro' | 'premium' | null>(null);
  const [upiPrice, setUpiPrice] = useState<number>(0);
  const [upiIsAnnual, setUpiIsAnnual] = useState(true);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [upiStep, setUpiStep] = useState<'select_app' | 'confirm_payment'>('select_app');
  const [utrNumber, setUtrNumber] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const getUpiLink = () => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || "";
    const payeeName = "MAMOON - RESTDIGI";
    const amount = upiPrice;
    const note = "RestDigi " + (upiPlan || '').toUpperCase() + " Plan Upgrade for " + (restaurant?.name || 'Restaurant');
    return "upi://pay?pa=" + upiId + "&pn=" + encodeURIComponent(payeeName) + "&am=" + amount + "&tn=" + encodeURIComponent(note) + "&cu=INR";
  };

  const handleConfirmUpiPayment = async () => {
    if (!upiPlan || isLoading) return;

    const utr = utrNumber.trim();
    if (!utr) {
      toast.error('Please enter the 12-digit UPI Transaction Ref/UTR number to activate your plan.');
      return;
    }

    // Strict UPI UTR validation
    const firstDigit = parseInt(utr[0], 10);
    const julianDay = parseInt(utr.substring(1, 4), 10);
    const isRepetitive = /^(\d)\1{11}$/.test(utr);
    const isSequential = utr === "123456789012" || utr === "234567890123" || utr === "987654321098" || utr === "876543210987" || utr === "123456789100";

    if (
      !/^\d{12}$/.test(utr) ||
      isRepetitive ||
      isSequential ||
      firstDigit < 3 ||
      firstDigit > 7 ||
      julianDay < 1 ||
      julianDay > 366
    ) {
      toast.error('Invalid Transaction Reference/UTR. Please enter the valid 12-digit UTR number from your payment confirmation screen.');
      return;
    }

    setIsLoading(true);
    try {
      // Query supabase payments table to check if UTR was already used
      const { data: duplicatePayments, error: searchError } = await supabase
        .from('payments')
        .select('description')
        .ilike('description', `%UTR: %${utr}%`);

      if (searchError) throw searchError;

      if (duplicatePayments && duplicatePayments.length > 0) {
        toast.error('This transaction reference (UTR) has already been submitted. Duplicate UTR is not allowed.');
        setIsLoading(false);
        return;
      }
      const newExpiry = new Date();
      if (upiIsAnnual) {
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      } else {
        newExpiry.setDate(newExpiry.getDate() + 30);
      }

      // Update restaurant details
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({
          plan_type: upiPlan,
          subscription_status: 'active',
          expiry_date: newExpiry.toISOString()
        })
        .eq('id', restaurant?.id);

      if (restaurantError) throw restaurantError;

      // Insert billing payment record
      const utrStr = " UTR: " + utrNumber.trim();
      const { error: paymentError } = await supabase.from('payments').insert({
        restaurant_id: restaurant?.id,
        amount: upiPrice,
        plan_tier: upiPlan,
        billing_cycle: upiIsAnnual ? 'yearly' : 'monthly',
        status: 'success',
        payment_gateway: 'upi',
        description: "UPI Payment for " + upiPlan.toUpperCase() + " Plan (" + (upiIsAnnual ? 'Yearly' : 'Monthly') + ") via UPI App." + utrStr,
        created_at: new Date().toISOString()
      });

      if (paymentError) throw paymentError;

      toast.success("Successfully activated your " + upiPlan.toUpperCase() + " Plan via UPI!");

      //  Fire-and-forget: send confirmation email to owner
      fetch('/api/send-transaction-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant?.id,
          plan: upiPlan,
          amount: upiPrice,
          billingCycle: upiIsAnnual ? 'yearly' : 'monthly',
          expiryDate: newExpiry.toISOString(),
          type: 'paid'
        })
      }).catch((err) => console.error('[BillingClient] UPI email failed:', err));

      // Reset states
      setIsUpiModalOpen(false);
      setUpiPlan(null);
      setUpiPrice(0);
      setUpiIsAnnual(true);
      setSelectedUpiApp(null);
      setUpiStep('select_app');
      setUtrNumber('');

      // Refresh restaurant metadata and payments list
      await refreshRestaurant();
      await fetchPayments();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to confirm payment and activate plan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelUpiPayment = () => {
    setIsUpiModalOpen(false);
    setUpiPlan(null);
    setUpiPrice(0);
    setUpiIsAnnual(true);
    setSelectedUpiApp(null);
    setUpiStep('select_app');
    setUtrNumber('');
    toast.error('Payment failed or cancelled.');
  };

  const handleCloseUpiModal = () => {
    if (upiStep === 'select_app') {
      setIsUpiModalOpen(false);
      setUpiPlan(null);
      setUpiPrice(0);
      setUpiIsAnnual(true);
      setSelectedUpiApp(null);
      setUtrNumber('');
    } else {
      handleCancelUpiPayment();
    }
  };

  const handleUpgrade = async (plan: 'basic' | 'pro' | 'premium', price: number, isAnnual: boolean) => {
    setIsLoading(true);

    const isRazorpayConfigured = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'rzp_test_YOUR_KEY_HERE';

    if (!isRazorpayConfigured) {
      setUpiPlan(plan);
      setUpiPrice(price);
      setUpiIsAnnual(isAnnual);
      setUpiStep('select_app');
      setSelectedUpiApp(null);
      setUtrNumber('');
      setIsUpiModalOpen(true);
      setIsLoading(false);
      return;
    }

    const res = await loadRazorpay();

    if (!res) {
      toast.error('Card/Netbanking gateway is currently unavailable. Opening secure UPI payment...');
      setUpiPlan(plan);
      setUpiPrice(price);
      setUpiIsAnnual(isAnnual);
      setUpiStep('select_app');
      setSelectedUpiApp(null);
      setUtrNumber('');
      setIsUpiModalOpen(true);
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

      if (!orderData.id) {
        console.warn('Razorpay order creation failed, falling back to UPI payment...');
        toast.error('Card/Netbanking gateway is currently unavailable. Opening secure UPI payment...');
        setUpiPlan(plan);
        setUpiPrice(price);
        setUpiIsAnnual(isAnnual);
        setUpiStep('select_app');
        setSelectedUpiApp(null);
        setUtrNumber('');
        setIsUpiModalOpen(true);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE",
        amount: orderData.amount,
        currency: orderData.currency,
        name: restaurant?.name || "RESTDIGI",
        description: plan.toUpperCase() + " Plan Subscription",
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
      console.warn('Failed to initiate Razorpay payment, falling back to UPI...');
      toast.error('Card/Netbanking gateway is currently unavailable. Opening secure UPI payment...');
      setUpiPlan(plan);
      setUpiPrice(price);
      setUpiIsAnnual(isAnnual);
      setUpiStep('select_app');
      setSelectedUpiApp(null);
      setUtrNumber('');
      setIsUpiModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartFreeTrial = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 14); // 14 days trial

      const { error } = await supabase
        .from('restaurants')
        .update({
          plan_type: 'pro',
          subscription_status: 'active',
          expiry_date: newExpiry.toISOString()
        })
        .eq('id', restaurant?.id);

      if (error) throw error;

      // Insert billing payment record
      await supabase.from('payments').insert({
        restaurant_id: restaurant?.id,
        amount: 0,
        plan_tier: 'pro',
        billing_cycle: 'yearly',
        status: 'success',
        payment_gateway: 'system_promo',
        transaction_id: '14dayfreetrial',
        description: 'Automated 14-Day Pro Live-KOT Free Pilot',
        created_at: new Date().toISOString()
      });

      toast.success('Successfully activated your 14-Day Free Trial of Pro Live-KOT Plan!');

      // Fire-and-forget: send trial activation confirmation email
      fetch('/api/send-transaction-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant?.id,
          plan: 'pro',
          amount: 0,
          billingCycle: 'trial',
          expiryDate: newExpiry.toISOString(),
          type: 'trial'
        })
      }).catch((err) => console.error('[BillingClient] Trial email failed:', err));

      await refreshRestaurant();
      await fetchPayments();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to activate free trial: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (promoCode.trim().toUpperCase() !== '14FREETRIAL') {
      toast.error('Invalid promo code. Please try again.');
      return;
    }

    const hasUsedPromo = payments.some(
      p => p.payment_gateway === 'system_promo' && p.description?.includes('14FREETRIAL')
    );
    if (hasUsedPromo) {
      setPromoAgainModal(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 14); // 14 days trial

      const { error } = await supabase
        .from('restaurants')
        .update({
          plan_type: 'pro',
          subscription_status: 'active',
          expiry_date: newExpiry.toISOString()
        })
        .eq('id', restaurant?.id);

      if (error) throw error;

      // Insert billing payment record
      await supabase.from('payments').insert({
        restaurant_id: restaurant?.id,
        amount: 0,
        plan_tier: 'pro',
        billing_cycle: 'yearly',
        status: 'success',
        payment_gateway: 'system_promo',
        transaction_id: '14dayfreetrial',
        description: '14-Day Free Trial activated via Promo Code: 14FREETRIAL',
        created_at: new Date().toISOString()
      });

      toast.success('Successfully activated your 14-Day Free Trial of Pro Live-KOT Plan!');

      // 📧 Fire-and-forget: send promo code confirmation email
      fetch('/api/send-transaction-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant?.id,
          plan: 'pro',
          amount: 0,
          billingCycle: 'trial',
          expiryDate: newExpiry.toISOString(),
          type: 'promo'
        })
      }).catch((err) => console.error('[BillingClient] Promo email failed:', err));

      setPromoCode('');
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
      banner: '14-Day Free Trial Available',
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
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network Plan',
      price: 'Custom Pricing',
      period: '/ Contact Us',
      savings: null,
      description: 'Fully tailored multi-outlet setup limits and direct enterprise priority support for major local restaurant chains.',
      features: [
        { name: 'Unlimited Menu Items across Multiple Outlets', included: true },
        { name: 'Unlimited Digital Tables & Multi-Location Dashboards', included: true },
        { name: 'Custom Third-Party POS API Integrations', included: true },
        { name: 'Dedicated Infrastructure Hosting Setup', included: true },
        { name: 'Top Selling Dish Analytics', included: true },
        { name: 'Total QR Scans Metric Counter', included: true },
        { name: 'Menu Item View Performance Graphs', included: true },
        { name: 'Enterprise-Grade Priority Support', included: true }
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
      return 'Activate Basic Dine-In';
    }
    if (planId === 'pro') {
      const hasUsedTrial = payments.length > 0;
      return (currentPlan === 'free' && !hasUsedTrial) ? 'Start 14-Day Free Trial' : 'Upgrade to Pro Live-KOT';
    }
    if (planId === 'premium') {
      return 'Upgrade to Premium';
    }
    if (planId === 'enterprise') {
      return 'Contact Sales Team';
    }
    return 'Upgrade';
  };

  const mailtoUrl = `mailto:support@restdigi.online?subject=${encodeURIComponent(
    `Enterprise Network Plan Inquiry - ${restaurant?.name || ''}`
  )}&body=${encodeURIComponent(
    `Hi RESTDIGI Team,\n\nI'm interested in the Enterprise Network Plan for my restaurant "${restaurant?.name || ''}" (ID: ${restaurant?.id || ''}). Please contact me with details.`
  )}`;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-white">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#121318',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '800',
            fontFamily: 'sans-serif',
            padding: '12px 24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#121318',
            },
          },
          error: {
            iconTheme: {
              primary: '#ea580c',
              secondary: '#121318',
            },
          },
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-gray-400 font-medium">Manage your subscription plan, pricing options, and view payment history.</p>
      </div>

      {/* Current Status Card */}
      <div className="bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Current Plan</p>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${currentPlan === 'free'
              ? 'bg-white/5 text-gray-300 border border-white/10'
              : currentPlan === 'basic'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : currentPlan === 'pro'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : currentPlan === 'premium'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
              {currentPlan} plan
            </span>
            {currentPlan !== 'free' && (
              <span className={`text-sm font-semibold ${isExpired ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
              </span>
            )}
          </div>
        </div>

        {isExpired && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Your subscription has expired. Your menu is currently hidden from customers.</span>
          </div>
        )}
      </div>

      {/* Promo Code Entry */}
      <div className="bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex-1 animate-fade-in">
          <h3 className="text-lg font-black text-white">Have a Promo Code?</h3>
          <p className="text-sm text-gray-400 font-medium mt-1">Enter your promo code below to unlock exclusive plans and offers.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <input
            type="text"
            placeholder="PROMOCODE"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-extrabold tracking-widest text-white uppercase placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors w-48 sm:w-56"
          />
          <button
            onClick={handleApplyPromoCode}
            disabled={isLoading || !promoCode.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Yearly Billing Banner */}
      <div className="flex flex-col items-center justify-center space-y-2 py-4">
        <span className="text-xs font-extrabold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 animate-fade-in">
          Yearly Subscriptions
        </span>
        <p className="text-sm font-medium text-gray-400 animate-fade-in">
          All RestDigi subscription plans are billed annually.
        </p>
      </div>

      {/* 4-Tier Grid Subscription Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isCurrentExpiring = currentPlan === plan.id && daysRemaining <= 5;
          return (
            <div
              id={plan.id}
              key={plan.id}
              className={`rounded-3xl p-8 border flex flex-col relative overflow-hidden transition-all duration-300 ${plan.highlight
                ? 'bg-white/[0.05] border-orange-500 ring-2 ring-orange-500 shadow-lg md:-translate-y-2'
                : 'bg-white/[0.03] backdrop-blur-md border-white/10 shadow-sm hover:border-orange-500/20 hover:shadow-[0_8px_30px_rgba(234,88,12,0.06)]'
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
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  {typeof plan.price === 'number' ? (
                    <>
                      <span className="text-4xl font-extrabold text-white">₹{plan.price}</span>
                      <span className="text-gray-400 font-medium text-sm">{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-xl font-extrabold text-white leading-tight">{plan.price}</span>
                  )}
                </div>

                {isAnnual && plan.savings ? (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {plan.savings}
                    </span>
                  </div>
                ) : (
                  <div className="mb-4 h-[22px]" />
                )}

                <p className="text-sm text-gray-400 mb-6 font-medium leading-relaxed">{plan.description}</p>

                <ul className="space-y-4 flex-1 mb-8">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2.5 text-sm font-medium transition-all ${feature.included
                        ? 'text-gray-200'
                        : 'text-rose-400/50 line-through text-gray-500'
                        }`}
                    >
                      {feature.included ? (
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.id === 'pro') {
                      const hasUsedTrial = payments.length > 0;
                      if (currentPlan === 'free' && !hasUsedTrial) {
                        handleStartFreeTrial();
                      } else {
                        handleUpgrade('pro', plan.price as number, isAnnual);
                      }
                    } else if (plan.id === 'enterprise') {
                      window.location.href = mailtoUrl;
                    } else {
                      handleUpgrade(plan.id as 'basic' | 'pro' | 'premium', plan.price as number, isAnnual);
                    }
                  }}
                  disabled={isLoading || (isCurrent && !isCurrentExpiring)}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${(isCurrent && !isCurrentExpiring)
                    ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                    : plan.highlight
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white shadow-sm'
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
      <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01]">
          <h3 className="text-lg font-bold text-white">Billing History</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            No past invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-200 capitalize">
                      {payment.plan_tier}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      ₹{payment.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 capitalize">
                      {payment.payment_gateway || 'Online'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white">
          <div className="bg-[#121318] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-white/10 text-center transform scale-100 transition-all animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Cancel Your Subscription?</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Are you sure you want to proceed? Your operational features will be instantly downgraded to our free plan metrics.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isLoading}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? "Cancelling..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already Redeemed Promo Code Modal */}
      {promoAgainModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-white">
          <div className="bg-[#121318] rounded-2xl max-w-sm w-full p-7 shadow-2xl border border-white/10 text-center animate-fade-in-up">
            {/* Glowing Orange alert icon */}
            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <AlertCircle className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Already Redeemed</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              This promo code has already been used by your restaurant. The 14-day free trial can only be claimed once per account.
            </p>
            <button
              onClick={() => setPromoAgainModal(false)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer font-sans"
            >
              Understand
            </button>
          </div>
        </div>
      )}
      {/* UPI Fallback Modal */}
      {isUpiModalOpen && (
        <div
          onClick={handleCloseUpiModal}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-white overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121318] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/10 relative transform scale-100 transition-all animate-fade-in-up my-8"
          >

            {/* Close Button */}
            <button
              onClick={handleCloseUpiModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                <Smartphone className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-black text-white">UPI Payment</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Complete your subscription upgrade securely via UPI transfer.
              </p>
            </div>

            {/* Plan Info Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected Plan</p>
                <p className="text-sm font-extrabold text-white mt-0.5 capitalize">
                  {upiPlan === 'basic' ? 'Basic Dine-In' : upiPlan === 'pro' ? 'Pro Live-KOT' : 'Premium Houseboat'} Plan
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Due</p>
                <p className="text-base font-black text-orange-400 mt-0.5">₹{upiPrice}</p>
              </div>
            </div>

            {upiStep === 'select_app' ? (
              <div className="space-y-6">
                {isMobileDevice ? (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                      Click below to pay using any UPI app:
                    </p>
                    <button
                      onClick={() => {
                        window.location.href = getUpiLink();
                        setUpiStep('confirm_payment');
                      }}
                      className="w-full py-4 px-4 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 text-center font-bold text-sm transition-all flex items-center justify-center gap-3 active:scale-98 text-orange-400"
                    >
                      <Smartphone className="w-5 h-5 text-orange-400" />
                      <span>Pay via UPI App</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center bg-white/[0.01] border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">
                      Scan QR Code to Pay
                    </p>
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-inner mb-4 border-2 border-white/10">
                      <QRCodeSVG
                        value={getUpiLink()}
                        size={170}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      Scan this QR code using any UPI app on your smartphone to make the payment.
                    </p>
                    <button
                      onClick={() => setUpiStep('confirm_payment')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-md active:scale-95 mt-4"
                    >
                      Continue to Verification
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Back button */}
                <button
                  onClick={() => setUpiStep('select_app')}
                  className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-500 font-extrabold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Payment Info
                </button>

                {/* Display Payment Reference Info */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-bold">UPI ID:</span>
                    <span className="flex items-center gap-1.5 font-bold text-gray-300 font-sans">
                      {process.env.NEXT_PUBLIC_UPI_ID || ""}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(process.env.NEXT_PUBLIC_UPI_ID || "");
                          toast.success('UPI ID copied!');
                        }}
                        className="text-gray-500 hover:text-white p-0.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-bold">Amount:</span>
                    <span className="flex items-center gap-1.5 font-bold text-gray-300">
                      ₹{upiPrice}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(upiPrice.toString());
                          toast.success('Amount copied!');
                        }}
                        className="text-gray-500 hover:text-white p-0.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-gray-500 font-bold shrink-0 mt-0.5">Remark/Note:</span>
                    <span className="flex items-center gap-1.5 font-bold text-gray-300 text-right leading-tight break-all max-w-[200px]">
                      {"RestDigi " + (upiPlan || '').toUpperCase() + " Plan Upgrade for " + (restaurant?.name || 'Restaurant')}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("RestDigi " + (upiPlan || '').toUpperCase() + " Plan Upgrade for " + (restaurant?.name || 'Restaurant'));
                          toast.success('Remark copied!');
                        }}
                        className="text-gray-500 hover:text-white p-0.5 transition-colors shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                </div>

                {/* UTR Input Block */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    12-Digit Transaction Ref / UTR Number
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 12-digit UTR"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-extrabold tracking-widest text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors text-center"
                  />
                  <p className="text-[10px] text-gray-500 text-center leading-normal">
                    Please paste the 12-digit transaction ID or UTR number from your payment receipt to activate your plan.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleConfirmUpiPayment}
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Activating Subscription...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm Payment & Activate</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelUpiPayment}
                    className="w-full py-3 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white font-bold text-sm transition-all text-center"
                  >
                    Cancel & Return
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
