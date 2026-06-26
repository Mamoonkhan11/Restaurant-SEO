import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last Updated: May 2026</p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-white mb-3">1. Data Collected from Diners (Customers)</h2>
            <p>
              To preserve zero-friction speed, Diners do not need to create accounts or download applications. We only process operational tokens required to fulfill table-ordering: specific item cart selections, dynamic table numbers, and timestamps. No persistent personal social metrics or chat data are monitored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">2. Data Collected from Merchants (Restaurants)</h2>
            <p>
              We collect standard administrative variables necessary to operate the SaaS platform: corporate business names, profile logos uploaded via secure cloud storage buckets, contact details, pricing records, and regional location coordinates required to run the automated Local SEO ranking enhancement model.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">3. Third-Party Data Disclosures</h2>
            <p>
              RESTDIGI does not share, lease, sell, or disclose food menu metrics, transaction histories, or location logs to external monetization brokers or advertising channels. All platform telemetry is handled directly through encrypted database layers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
