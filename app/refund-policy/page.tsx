import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Cancellation & Refund Policy</h1>
          <p className="text-sm text-gray-400">Last Updated: May 2026</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Merchant SaaS Subscriptions</h2>
            <p>
              Restdigi operates on clean SaaS pricing tiers (Basic, Pro, Premium, Enterprise) with dynamic Monthly and Annual cycles. 
              As outlined in our introductory campaigns, the first 6 registered businesses receive an absolute <strong>1-Month Free Trial</strong> with Basic tier functionalities. 
              Subscribers can cancel their renewals at any point directly from the account portal before the next billing cycle triggers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. No-Refund Policy for Digital Services</h2>
            <p>
              Because Restdigi instantly unlocks database quotas, limits configurations (up to 12, 20, or 23 items/tables), automated real-time KOT audio channels, and SEO mapping resources immediately upon payment confirmation, <strong>all processed subscription fees are strictly non-refundable</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. End-Diner Order Cancellations</h2>
            <p>
              The decision to process refunds or void transactions for food/beverages placed by a Diner rests entirely with the respective Merchant's management panel. Restdigi provides a digital 'Delete/Cancel' button control on the interface that operates strictly when an order status is marked as <strong>Pending</strong>. Once a Merchant accepts an order into preparation status, the system locks modification rules.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
