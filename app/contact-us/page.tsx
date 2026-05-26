import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Mail, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
};

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center text-sm font-bold text-orange-600 hover:text-orange-800 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Contact Us</h1>
          <p className="text-gray-500 font-medium">We're here to help you supercharge your restaurant.</p>
        </div>

        <div className="grid gap-8">
          <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Registered Address</h3>
              <p className="text-gray-600 font-medium">RESTDIGI<br />Srinagar, Jammu & Kashmir<br />India - 190001</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Email Support</h3>
              <a href="mailto:support@vionys.com" className="text-orange-600 hover:underline font-medium">support@vionys.com</a>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Operating Hours</h3>
              <p className="text-gray-600 font-medium">Mon-Sat, 10:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
