import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy',
};

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#07080B] py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[#07080B]/55 backdrop-blur-[90px] pointer-events-none z-0"></div>

      {/* Vibrant Ambient Glows */}
      <div className="absolute top-[-5%] right-[5%] w-[550px] h-[550px] rounded-full bg-orange-500/15 blur-[110px] pointer-events-none mix-blend-screen z-0"></div>
      <div className="absolute top-[25%] left-[-10%] w-[650px] h-[650px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none mix-blend-screen z-0"></div>

      <div className="max-w-3xl mx-auto bg-white/[0.03] backdrop-blur-md p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/10 relative z-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Cancellation & Refund Policy</h1>
          <p className="text-sm text-gray-400">Last Updated: June 2026</p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-white mb-3">1. SaaS Subscription Cancellation</h2>
            <p>
              RESTDIGI services are billed exclusively on an **Annual Plan model** to secure system stability and prevent service cuts. Merchants can turn off automated renewals from their billing dashboard at any time. Once turned off, your subscription remains active until the end of your current paid year, and no future renewal charges will occur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">2. Strictly Non-Refundable Policy</h2>
            <p>
              Since RESTDIGI immediately unlocks database quotas, real-time audio alerts, custom settings configurations, and SEO mapping resources upon subscription activation, **all annual plan payments are strictly non-refundable**. We do not offer partial refunds or credits for unused months within your subscription year.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">3. Dine-In Guest Order Cancellations</h2>
            <p>
              The decision to cancel, void, or refund food and beverage payments placed by your guests (Diners) rests 100% with the restaurant's management. Guests can cancel items through their menu interface **only** when the order status is marked as **Pending**. Once accepted by the kitchen into preparation, orders are locked and cancellations must be handled manually by your waitstaff.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
