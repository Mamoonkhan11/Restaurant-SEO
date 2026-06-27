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
          <p className="text-gray-400 font-medium text-sm">Last Updated: June 2026</p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-white mb-3">1. Nature of Service</h2>
            <p>
              <strong className="text-orange-400">RESTDIGI</strong> provides a direct, cloud-hosted digital menu infrastructure and local SEO amplification system. Subscribing restaurants ("Merchants") can deploy table-specific QR codes, allowing their customers ("Diners") to view menus, configure carts, and route orders directly to the Merchant's live administrative Kitchen Order Ticket (KOT) dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">2. Direct Order Delivery Architecture</h2>
            <p>
              RESTDIGI operations run entirely on direct cloud database structures. RESTDIGI does **not** rely on third-party messaging software (such as WhatsApp), SMS relays, or external manual agents. All order transmissions are native to the KOT ecosystem to guarantee immediate delivery and zero wait time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">3. Annual Plan Model & Reason</h2>
            <p>
              RESTDIGI services are structured exclusively as **Annual Subscription Plans** (Basic, Pro, Premium, Enterprise). We do not offer monthly plans. 
              <strong> Reason:</strong> We bill annually to ensure uninterrupted database operations, guarantee continuous menu hosting uptime for diners, and provide dedicated support resources without the constant risk of monthly billing/card failures disrupting your restaurant's service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">4. Merchant Operational Responsibilities</h2>
            <p>
              Merchants retain 100% control over item configurations, pricing, and active table listings. The Merchant is responsible for updating dish availability and ensuring KOT orders match physical kitchen capabilities. RESTDIGI holds no liability for order errors, customer disputes, table mix-ups, or card settlement issues between Merchants and Diners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">5. Google Review Redirections</h2>
            <p>
              For Pro-tier and higher Merchants, the platform provides automated customer Google Review redirection. Merchants agree to configure valid and accurate Google review URLs inside their settings. RESTDIGI is not responsible for reviews published on Google or account flags from Google's platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">6. Nurturing Communications</h2>
            <p>
              By agreeing to these terms, you grant RESTDIGI explicit consent to send automated operational emails, KOT summary reports, marketing/nurturing guides, and sales analysis suggestions. You can opt out of promotional communications at any time via the unsubscribe links.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
