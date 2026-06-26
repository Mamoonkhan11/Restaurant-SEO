import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
};

export default function TermsAndConditions() {
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
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Terms and Conditions</h1>
          <p className="text-gray-400 font-medium text-sm">Last Updated: May 2026</p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-white mb-3">1. Nature of Service</h2>
            <p>
              <strong className="text-orange-400">RESTDIGI</strong> provides an interactive, cloud-hosted digital menu infrastructure and local SEO amplification system. By utilizing our table-specific QR code matrices, subscribing restaurants ("Merchants") can allow their customers ("Diners") to <strong>Scan, View, and Place Orders Instantly</strong> directly from their mobile browsers to the Merchant's live administrative Kitchen Order Ticket (KOT) dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">2. Elimination of Ordering Intermediaries</h2>
            <p>
              RESTDIGI operates via direct local network socket handshakes and real-time database structures. RESTDIGI does <strong>not</strong> route orders through third-party messaging applications (such as WhatsApp), SMS relays, or external manual agents. All transmission happens natively within the RESTDIGI ecosystem to eliminate waiting times.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">3. Content Accuracy & Pricing</h2>
            <p>
              Merchants retain exclusive 100% control over item descriptions, imagery, variations, availability toggles, and pricing catalogs. RESTDIGI is not responsible for any disputes arising from incorrect pricing inputs, out-of-stock items, or outdated digital menus presented to Diners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">4. Limitation of Operational Liability</h2>
            <p>
              RESTDIGI functions solely as a software utility conduit. We disclaim all liability regarding payment settlement failures between Diners and Merchants, physical preparation delays, kitchen errors, order cancellations, or hardware/internet disconnections at the restaurant premises.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">5. Automated Communications & Nurturing Consent</h2>
            <p>
              By creating an account, accepting these terms, or using the RESTDIGI service, you grant RESTDIGI explicit consent to send you automated operational notifications, platform performance reports, marketing/nurturing emails, sales impact analyses, and promotional tier/upgrade suggestions. You may opt out of promotional messages at any time using the unsubscribe link provided in such emails.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
