"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRestaurant } from '@/lib/RestaurantContext';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

export default function TermsAcceptancePage() {
  const router = useRouter();
  const { restaurant } = useRestaurant();
  
  const [isAgreed, setIsAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAccept = async () => {
    if (!restaurant) return;
    
    setIsLoading(true);
    
    try {
      // Fetch user's IP Address
      let ipAddress = 'Unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (err) {
        console.warn('Could not fetch IP address', err);
      }

      const userAgent = window.navigator.userAgent;
      const timestamp = new Date().toISOString();

      // Update Supabase Record
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

      setIsSuccess(true);
      
      // Force a full reload to ensure context is updated and middleware allows access
      setTimeout(() => {
        window.location.href = '/admin';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Access Granted</h2>
          <p className="text-gray-500 font-medium">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="bg-white max-w-3xl w-full rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mandatory Terms Acceptance</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Please review and sign to access your dashboard.</p>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Restdigi Platform Agreement</h3>
            
            <p>Welcome to Restdigi. By proceeding, you agree to the following terms which govern your use of our digital menu infrastructure.</p>
            
            <h4 className="text-gray-900 font-bold">1. Food Quality & SEO Ranking</h4>
            <p>
              As a Restaurant Owner, you are strictly responsible for maintaining high food quality and hygiene standards. 
              <strong> User feedback, ratings, and food quality are direct factors in our internal "SEO Ranking" and "Customer Satisfaction Rate" within the Restdigi ecosystem.</strong>
            </p>
            
            <h4 className="text-gray-900 font-bold">2. Quality Standards & Visibility</h4>
            <p>
              To ensure a premium dining experience, Restdigi reserves the right to lower the ranking, reduce the visibility, or suspend the accounts of restaurants with consistently low Customer Satisfaction Rates.
            </p>

            <h4 className="text-gray-900 font-bold">3. Accuracy of Information</h4>
            <p>
              It is your responsibility to provide accurate menu prices, ingredients, and availability. Restdigi holds no legal liability for any disputes or customer grievances arising from incorrect menu descriptions or pricing.
            </p>

            <h4 className="text-gray-900 font-bold">4. Order Fulfillment</h4>
            <p>
              Restdigi is solely a digital display and communication platform. Food preparation, delivery fulfillment, and direct payment collection remain strictly the restaurant's responsibility.
            </p>

            <hr className="my-8 border-gray-200" />

            <h3 className="text-lg font-bold text-gray-900">Privacy Policy</h3>
            
            <h4 className="text-gray-900 font-bold">1. Data Collection</h4>
            <p>
              To preserve zero-friction speed, Diners do not need to create accounts or download applications. We only process operational tokens required to fulfill table-ordering: specific item cart selections, dynamic table numbers, and timestamps. No persistent personal social metrics or chat data are monitored.
            </p>

            <h4 className="text-gray-900 font-bold">2. How We Use Your Data</h4>
            <p>
              We collect standard administrative variables necessary to operate the SaaS platform: corporate business names, profile logos uploaded via secure cloud storage buckets, contact details, pricing records, and regional location coordinates required to run the automated Local SEO ranking enhancement model.
            </p>

            <h4 className="text-gray-900 font-bold">3. Third-Party Data Disclosures</h4>
            <p>
              Restdigi does not share, lease, sell, or disclose food menu metrics, transaction histories, or location logs to external monetization brokers or advertising channels. All platform telemetry is handled directly through encrypted database layers.
            </p>

            <h4 className="text-gray-900 font-bold">4. Cookies</h4>
            <p>
              We use essential cookies strictly for session management and to keep restaurant owners logged into their admin dashboards securely. We do not use invasive tracking cookies across our platform.
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-8 border-t border-gray-100 bg-gray-50 shrink-0 space-y-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              I have read, understood, and agree to the Terms & Conditions and Privacy Policy outlined above.
            </span>
          </label>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Digital Signature</label>
            <input 
              type="text" 
              placeholder="Type your full legal name to sign"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:font-normal"
            />
          </div>

          <button 
            onClick={handleAccept}
            disabled={!isFormValid || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
