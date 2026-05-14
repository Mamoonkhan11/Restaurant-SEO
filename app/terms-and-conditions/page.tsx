import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Terms & Conditions</h1>
          <p className="text-gray-500 font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>Welcome to QR-Crave. By using our digital menu and WhatsApp ordering services, you agree to comply with and be bound by the following terms and conditions of use. Please read them carefully.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Service Usage & Order Fulfillment</h2>
            <p>QR-Crave provides the digital infrastructure to facilitate online menus and WhatsApp ordering. We do not prepare, handle, or deliver food. <strong>Order fulfillment, payment collection at the restaurant, and food preparation are strictly the restaurant's responsibility.</strong></p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Food Quality & SEO Ranking</h2>
            <p>Restaurant Owners are solely responsible for maintaining high food quality and hygiene standards. User feedback, ratings, and overall food quality are direct factors in our internal <strong>"SEO Ranking"</strong> and <strong>"Customer Satisfaction Rate"</strong> within the QR-Crave ecosystem.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Quality Standards & Visibility</h2>
            <p>To ensure a premium experience for diners, QR-Crave reserves the right to lower the ranking, reduce the visibility, or suspend the accounts of restaurants with consistently low Customer Satisfaction Rates or repeated quality complaints.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Accuracy of Information & Liability</h2>
            <p>It is the sole responsibility of the Restaurant Owner to provide accurate information regarding menu prices, dish names, and ingredients. QR-Crave acts merely as a digital display platform and holds <strong>no legal liability or responsibility</strong> for any disputes, customer grievances, or legal claims arising from incorrect pricing, misleading ingredient lists, or inaccurate menu descriptions provided by the restaurant.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Jurisdiction</h2>
            <p>These terms and conditions are governed by and construed in accordance with the laws of India. All legal matters, disputes, or claims arising out of or in connection with the use of QR-Crave are subject exclusively to the courts of <strong>Srinagar, Jammu & Kashmir</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
