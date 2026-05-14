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
          <p className="text-gray-500 font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Subscription Policy</h2>
            <p>QR-Crave operates on a Software-as-a-Service (SaaS) model. All premium subscriptions (Pro and Premium) are pre-paid and grant access to advanced digital menu features for the duration of the billing cycle (monthly or yearly).</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. 7-Day Satisfaction Guarantee</h2>
            <p>We stand by the quality of our platform. We offer a <strong>7-day Satisfaction Guarantee</strong> for all new subscriptions. If QR-Crave doesn't meet your expectations within the first 7 days of your initial purchase, you may request a full refund.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Non-Refundable Period</h2>
            <p>After the initial 7-day window has passed, the subscription amount becomes strictly non-refundable. We do not provide prorated refunds for partial months or years of service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Cancellation</h2>
            <p>Restaurant owners can cancel their subscription at any time directly from the Admin Dashboard. Canceling your subscription will stop the next billing cycle, and you will retain access to your premium features until the end of your current paid period.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
