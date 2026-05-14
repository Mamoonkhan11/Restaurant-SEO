import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-gray-500 font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Data Collection</h2>
            <p>At QR-Crave, we collect essential information to provide a seamless ordering experience. This includes collecting customer phone numbers (specifically for WhatsApp ordering functionality) and necessary restaurant details from owners during registration.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. How We Use Your Data</h2>
            <p>The data we collect is used strictly to facilitate digital orders, manage restaurant menus, and improve the overall digital menu experience. We do not use your phone number for unsolicited marketing unless you explicitly opt-in.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Local Storage & Third Parties</h2>
            <p>We deeply respect the privacy of our users across J&K and beyond. <strong>QR-Crave does not sell, rent, or trade your personal data to third parties under any circumstances.</strong> Your data is stored securely and locally where applicable.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Cookies</h2>
            <p>We use essential cookies strictly for session management and to keep restaurant owners logged into their admin dashboards securely. We do not use invasive tracking cookies across our platform.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
