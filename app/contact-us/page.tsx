import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Mail, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
};

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-[#07080B] py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[#07080B]/55 backdrop-blur-[90px] pointer-events-none z-0"></div>

      {/* Vibrant Ambient Glows */}
      <div className="absolute top-[-5%] right-[5%] w-[550px] h-[550px] rounded-full bg-orange-500/15 blur-[110px] pointer-events-none mix-blend-screen z-0"></div>
      <div className="absolute top-[25%] left-[-10%] w-[650px] h-[650px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none mix-blend-screen z-0"></div>

      <div className="max-w-3xl mx-auto bg-white/[0.03] backdrop-blur-md p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/10 relative z-10 w-full">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Contact Us</h1>
          <p className="text-gray-400 font-medium">We're here to help you supercharge your restaurant.</p>
        </div>

        <div className="grid gap-6">
          <div className="flex items-start gap-4 p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all duration-300">
            <div className="bg-white/5 p-3 rounded-full border border-white/10 text-orange-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">Registered Office</h3>
              <p className="text-gray-300 font-medium text-sm leading-relaxed">RESTDIGI<br />Srinagar, Jammu & Kashmir<br />India - 190010</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all duration-300">
            <div className="bg-white/5 p-3 rounded-full border border-white/10 text-orange-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">Email Support</h3>
              <a href="mailto:support@restdigi.online" className="text-orange-400 hover:text-orange-300 hover:underline font-bold text-sm">support@restdigi.online</a>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all duration-300">
            <div className="bg-white/5 p-3 rounded-full border border-white/10 text-orange-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">Operating Hours</h3>
              <p className="text-gray-300 font-medium text-sm">Mon-Sat, 10:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
