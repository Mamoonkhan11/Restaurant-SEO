import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-800 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Terms and Conditions</h1>
          <p className="text-gray-500 font-medium text-sm">Last Updated: May 2026</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Nature of Service</h2>
            <p>
              <strong>RESTDIGI</strong> provides an interactive, cloud-hosted digital menu infrastructure and local SEO amplification system. By utilizing our table-specific QR code matrices, subscribing restaurants ("Merchants") can allow their customers ("Diners") to <strong>Scan, View, and Place Orders Instantly</strong> directly from their mobile browsers to the Merchant's live administrative Kitchen Order Ticket (KOT) dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Elimination of Ordering Intermediaries</h2>
            <p>
              RESTDIGI operates via direct local network socket handshakes and real-time database structures. RESTDIGI does <strong>not</strong> route orders through third-party messaging applications (such as WhatsApp), SMS relays, or external manual agents. All transmission happens natively within the RESTDIGI ecosystem to eliminate waiting times.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Content Accuracy & Pricing</h2>
            <p>
              Merchants retain exclusive 100% control over item descriptions, imagery, variations, availability toggles, and pricing catalogs. RESTDIGI is not responsible for any disputes arising from incorrect pricing inputs, out-of-stock items, or outdated digital menus presented to Diners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Limitation of Operational Liability</h2>
            <p>
              RESTDIGI functions solely as a software utility conduit. We disclaim all liability regarding payment settlement failures between Diners and Merchants, physical preparation delays, kitchen errors, order cancellations, or hardware/internet disconnections at the restaurant premises.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Automated Communications & Nurturing Consent</h2>
            <p>
              By creating an account, accepting these terms, or using the RESTDIGI service, you grant RESTDIGI explicit consent to send you automated operational notifications, platform performance reports, marketing/nurturing emails, sales impact analyses, and promotional tier/upgrade suggestions. You may opt out of promotional messages at any time using the unsubscribe link provided in such emails.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
