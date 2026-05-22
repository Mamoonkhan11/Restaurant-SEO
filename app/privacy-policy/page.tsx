import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last Updated: May 2026</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Data Collected from Diners (Customers)</h2>
            <p>
              To preserve zero-friction speed, Diners do not need to create accounts or download applications. We only process operational tokens required to fulfill table-ordering: specific item cart selections, dynamic table numbers, and timestamps. No persistent personal social metrics or chat data are monitored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Data Collected from Merchants (Restaurants)</h2>
            <p>
              We collect standard administrative variables necessary to operate the SaaS platform: corporate business names, profile logos uploaded via secure cloud storage buckets, contact details, pricing records, and regional location coordinates required to run the automated Local SEO ranking enhancement model.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Third-Party Data Disclosures</h2>
            <p>
              Restdigi does not share, lease, sell, or disclose food menu metrics, transaction histories, or location logs to external monetization brokers or advertising channels. All platform telemetry is handled directly through encrypted database layers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
