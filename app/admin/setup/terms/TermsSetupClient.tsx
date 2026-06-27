"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRestaurant } from '@/lib/RestaurantContext';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

export default function TermsAcceptancePage() {
  const router = useRouter();
  const { restaurant, refreshRestaurant } = useRestaurant();

  const [isAgreed, setIsAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAccept = async () => {
    if (!restaurant) return;

    setIsLoading(true);

    try {
      let ipAddress = 'Unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (err) {
        // Ignored
      }

      const userAgent = window.navigator.userAgent;
      const timestamp = new Date().toISOString();

      try {
        await supabase
          .from('profiles')
          .update({ terms_accepted: true })
          .eq('id', restaurant.owner_id);
      } catch (e) {
        // Fallback profile update ignored
      }

      if ((restaurant.plan_type === 'free' || !restaurant.plan_type) && restaurant.subscription_status === 'inactive') {
        let count = 0;
        const { count: restCount, error: restErr } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('plan_type', 'basic');
        if (restErr) {
          console.error("Restaurants count check failed:", restErr);
        }
        count = restCount || 0;

        if (count < 5) {
          const activeUserId = restaurant.owner_id;
          const newExpiry = new Date();
          newExpiry.setDate(newExpiry.getDate() + 30);

          // 1. Update the core business subscription states directly inside 'restaurants'
          const { error: restaurantUpdateError } = await supabase
            .from('restaurants')
            .update({
              plan_type: 'basic',
              subscription_status: 'active',
              expiry_date: newExpiry.toISOString()
            })
            .eq('owner_id', activeUserId); // Matches the unique ID of the restaurant owner

          if (restaurantUpdateError) {
            console.error("Failed to update restaurant to basic plan:", restaurantUpdateError);
          }

          const { data: targetRestaurant } = await supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', activeUserId)
            .single();

          if (targetRestaurant) {
            const targetRestaurantId = targetRestaurant.id;
            const payload = {
              restaurant_id: String(targetRestaurantId),
              amount: parseFloat("0.00"),
              plan_tier: 'basic',
              billing_cycle: 'monthly',
              status: 'success',
              payment_gateway: 'system_promo',
              description: 'Automated 1-Month Early Adopter Promotional Free Activation',
              created_at: new Date().toISOString()
            };

            await supabase.from('payments').insert([payload]);
          }
        }
      }

      const { error } = await supabase
        .from('restaurants')
        .update({
          terms_accepted: true,
          digital_signature: signature,
          terms_accepted_at: timestamp,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      await refreshRestaurant();
      setIsSuccess(true);

      setTimeout(() => {
        router.push('/admin');
      }, 1500);

    } catch (error) {
      console.error('Error accepting terms:', error);
      setIsLoading(false);
      alert('Failed to save acceptance. Please try again.');
    }
  };

  const isFormValid = isAgreed && signature.trim().length > 2;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[#121318] p-8 rounded-3xl shadow-2xl border border-white/10 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in duration-300 text-white">
          <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Access Granted</h2>
          <p className="text-gray-400 font-medium">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 w-full text-white">
      <div className="bg-white/[0.03] backdrop-blur-md max-w-3xl w-full rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-8 border-b border-white/10 bg-white/[0.01] flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Mandatory Terms Acceptance</h1>
            <p className="text-sm text-gray-400 font-medium mt-1">Please review and sign to access your dashboard.</p>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-transparent scrollbar-hide">
          <div className="prose prose-sm max-w-none text-gray-300 space-y-6">
            <h3 className="text-lg font-bold text-white">RESTDIGI Platform Agreement</h3>

            <p>Welcome to RESTDIGI. By proceeding, you agree to the following terms which govern your use of our digital menu infrastructure.</p>

            <h4 className="text-white font-bold">1. Nature of Service & Direct Order Delivery</h4>
            <p>
              RESTDIGI provides an interactive, cloud-hosted digital menu infrastructure and local SEO amplification system. Subscribing restaurants ("Merchants") can allow their guests ("Diners") to Scan, View, and Place Orders directly from mobile browsers to the Merchant's live Kitchen Order Ticket (KOT) dashboard. RESTDIGI does **not** route orders through third-party platforms (like WhatsApp) or SMS relays; all transmission happens natively within our ecosystem to guarantee zero wait time.
            </p>

            <h4 className="text-white font-bold">2. Annual Billing Model & Continuous Uptime</h4>
            <p>
              RESTDIGI services are provisioned strictly on an **Annual Billing Cycle** (billed once per year). We do not offer monthly plans. 
              <strong> Reason:</strong> Annual billing guarantees system stability, continuous menu hosting uptime for your diners, and dedicated database allocations without the constant risk of monthly subscription renewal declines or card expiry failures disrupting your operations.
            </p>

            <h4 className="text-white font-bold">3. Food Quality & Merchant Liability</h4>
            <p>
              As a Merchant, you hold 100% responsibility for food quality, pricing accuracy, catalog items, and kitchen operations. RESTDIGI functions solely as a software conduit and is not liable for customer disputes, order delays, kitchen errors, or transaction settlements.
            </p>

            <h4 className="text-white font-bold">4. Google Review Integration</h4>
            <p>
              For Pro-tier and higher Merchants, the platform provides automated customer Google Review redirection. Merchants agree to configure valid and accurate Google review URLs inside their settings. RESTDIGI is not responsible for reviews published on Google.
            </p>

            <h4 className="text-white font-bold">5. Automated Communications Consent</h4>
            <p>
              By accepting these terms, you grant RESTDIGI consent to send you automated operational notifications, KOT summaries, marketing/nurturing guides, and sales analysis suggestions. You can opt out of promotional emails at any time.
            </p>

            <hr className="my-8 border-white/10" />

            <h3 className="text-lg font-bold text-white">Privacy Policy</h3>

            <h4 className="text-white font-bold">1. Diner Data Processing</h4>
            <p>
              To maintain a zero-friction experience, Diners do not need to register, create accounts, or download applications. We process only minimal, non-identifying operational tokens necessary to fulfill table-ordering (dynamic table numbers, cart selections, and timestamps).
            </p>

            <h4 className="text-white font-bold">2. Merchant Data Collection</h4>
            <p>
              We collect necessary administrative variables: business name, email, profile logo, pricing catalogs, digital signature records, IP address, and browser metadata (for verification and security logging).
            </p>

            <h4 className="text-white font-bold">3. Zero Third-Party Disclosures</h4>
            <p>
              RESTDIGI does not sell, lease, or share food transaction logs, restaurant menu metrics, or owner contact details with third-party advertising companies. All platform telemetry is handled directly through encrypted database layers.
            </p>

            <h4 className="text-white font-bold">4. SaaS Refund & Cancellation Rules</h4>
            <p>
              Since RESTDIGI immediately unlocks database quotas, real-time audio channels, and hosting resources upon billing, **all annual plan payments are strictly non-refundable**. You can disable auto-renewal at any time; your plan will stay active until the end of your paid year.
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-8 border-t border-white/10 bg-white/[0.01] shrink-0 space-y-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-orange-600 focus:ring-orange-500 cursor-pointer"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              I have read, understood, and agree to the Terms & Conditions and Privacy Policy, and consent to receive automated operational messages and marketing/nurturing emails from RESTDIGI.
            </span>
          </label>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Digital Signature</label>
            <input
              type="text"
              placeholder="Type your full legal name to sign"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-5 py-4 bg-white/[0.02] border border-white/10 rounded-2xl focus:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all font-medium text-white placeholder:font-normal placeholder:text-gray-500"
            />
          </div>

          <button
            onClick={handleAccept}
            disabled={!isFormValid || isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-white/5 disabled:text-gray-500 disabled:border-white/5 text-white py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Accept & Enter Dashboard'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
