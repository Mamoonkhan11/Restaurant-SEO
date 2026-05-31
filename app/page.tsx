"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { QrCode, ChevronRight, TrendingUp } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/admin');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/admin');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-orange-200">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 lg:py-5">
            <div className="flex items-center py-1 sm:py-2">
              <img
                src="/restdigi-logo.png"
                className="h-10 sm:h-12 lg:h-16 w-auto object-contain transition-transform hover:scale-105"
                alt="RESTDIGI Logo"
              />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/admin"
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Admin Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-bold bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-sm font-bold mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>
          RESTDIGI — The Future of Dining
        </div>

        <h1 className="max-w-4xl text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Stop Making Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Customers Wait</span> to Order.
        </h1>

        <p className="max-w-3xl text-lg sm:text-xl text-gray-500 mb-10 font-medium animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Don't let long queues and short staff kill your restaurant's sales. With RESTDIGI, customers simply Scan, View, and Place Orders Instantly right from their tables. No apps. No waiting. Just pure speed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all bg-orange-600 rounded-full hover:bg-orange-700 hover:shadow-lg hover:-translate-y-1 group"
          >
            Launch Your Digital Menu
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/menu/restdigi"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-700 transition-all bg-white border-2 border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300"
          >
            View Demo Menu
          </Link>
        </div>
      </main>

      {/* Frictionless 3-Step Dining Journey */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frictionless 3-Step Dining Journey</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Give your customers a fast, zero-wait self-ordering experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Scan */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300 relative">
              <div className="absolute top-6 right-6 text-6xl font-black text-orange-100 select-none">01</div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 relative z-10">
                <QrCode className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">Scan</h3>
              <p className="text-gray-500 leading-relaxed relative z-10">
                Customer scans the crisp, custom table-specific QR frame on arrival.
              </p>
            </div>

            {/* Step 2: View */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300 relative">
              <div className="absolute top-6 right-6 text-6xl font-black text-blue-100 select-none">02</div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 relative z-10">
                <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">View</h3>
              <p className="text-gray-500 leading-relaxed relative z-10">
                A lightning-fast digital menu renders on any mobile browser in under 1 second.
              </p>
            </div>

            {/* Step 3: Order Instantly */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300 relative">
              <div className="absolute top-6 right-6 text-6xl font-black text-orange-100 select-none">03</div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 relative z-10">
                <svg className="w-7 h-7 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5-5L20 17" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">Order Instantly</h3>
              <p className="text-gray-500 leading-relaxed relative z-10">
                Multi-item cart selection with quantities lets them send orders straight to the live KOT dashboard without chasing waiters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Growth Features */}
      <section className="bg-slate-50 py-24 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Premium Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">Engineered for Restaurant Success</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Unlock next-level performance and automation designed to scale your operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Automated Local SEO Boost */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Automated Local SEO Boost</h3>
              <p className="text-gray-500 leading-relaxed">
                RESTDIGI dynamically optimizes your restaurant’s online presence, pushing your physical location to the top of local Google search maps and discoverability indexes automatically.
              </p>
            </div>

            {/* Live KOT Automation Matrix */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Live KOT Automation Matrix</h3>
              <p className="text-gray-500 leading-relaxed">
                High-volume programmatic looping chime alerts keep your kitchen instantly updated on incoming table modifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="text-xs font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-100">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4" style={{ color: '#111111' }}>Frequently Asked Questions</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Got questions? We've got answers. Explore our support topics below.</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Q1 */}
            <details className="group border border-slate-100 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4" style={{ color: '#111111' }}>What exactly is RestDigi, and how does it work?</span>
                <span className="text-orange-600 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-50 pt-4">
                RestDigi is a cloud-native restaurant operating framework. You simply generate a customized QR code for your tables. Customers scan the QR to view your interactive digital menu and place orders instantly. The order is routed straight to your kitchen display system—eliminating manual paper tracking completely.
              </div>
            </details>

            {/* Q2 */}
            <details className="group border border-slate-100 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4" style={{ color: '#111111' }}>Do my customers need to download any mobile application to scan the menu?</span>
                <span className="text-orange-600 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-50 pt-4">
                No apps are required! Customers can simply scan the table QR code using their default smartphone camera or any standard scanner app, and your full high-speed menu will open instantly inside their mobile web browser.
              </div>
            </details>

            {/* Q3 */}
            <details className="group border border-slate-100 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4" style={{ color: '#111111' }}>What is the "Free Basic Tier for First Comers" offer?</span>
                <span className="text-orange-600 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-50 pt-4">
                To support local restaurant communities, we are running an exclusive Early Bird launch frame. The first 5 users/outlets to register on RestDigi will get our core operational infrastructure (including the dynamic digital QR menu and basic telemetry analytics) completely FREE for a lifetime—zero monthly hosting fees, zero catches.
              </div>
            </details>

            {/* Q4 */}
            <details className="group border border-slate-100 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4" style={{ color: '#111111' }}>How does the successful referral commission system work?</span>
                <span className="text-orange-600 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-50 pt-4">
                We love growing with our community! If you refer another cafe or restaurant owner to RestDigi, you earn a premium cash payout or software credits as soon as your referred user upgrades and makes their first successful purchase of our Pro, Premium or Enterprise tier plans.
              </div>
            </details>

            {/* Q5 */}
            <details className="group border border-slate-100 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4" style={{ color: '#111111' }}>How long does it take to set up my entire restaurant menu live?</span>
                <span className="text-orange-600 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-50 pt-4">
                Under 10 minutes. After completing your quick registration panel, add item, add prices, and hit publish. Your custom tables QR code sheet will be generated automatically for immediate printing.
              </div>
            </details>

            {/* Q6 */}
            <details className="group border border-slate-100 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4" style={{ color: '#111111' }}>Can I track my restaurant sales data when I am away or at home?</span>
                <span className="text-orange-600 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-50 pt-4">
                Yes! RestDigi is a 100% cloud-synced system. You can open your customized live owner dashboard from any smartphone, laptop, or tablet in the world to track real-time tables and menu , total scan counts, and your top-performing menu items.
              </div>
            </details>

            {/* Q7 */}
            <details className="group border border-slate-100 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4" style={{ color: '#111111' }}>Is there a contract, or can I cancel my subscription anytime?</span>
                <span className="text-orange-600 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-50 pt-4">
                There are absolutely no locked contracts or hidden liabilities. You can scale your tiers, downgrade to our base assets, or cancel your active premium subscriptions inside your admin control panel whenever you wish with a single click.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Footer (Razorpay Legal Links) */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">

            <div className="flex items-center">
              <img src="/restdigi-logo.png" className="h-12 lg:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" alt="RESTDIGI Logo" />
            </div>

            {/* Legal Links required by Razorpay */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              <Link href="/terms-and-conditions" className="text-sm font-medium hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/privacy-policy" className="text-sm font-medium hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="text-sm font-medium hover:text-white transition-colors">
                Cancellation & Refund
              </Link>
              <Link href="/contact-us" className="text-sm font-medium hover:text-white transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-400">
            <p className="mb-4 max-w-2xl mx-auto">
              * By signing up for RESTDIGI, you agree to our <a href="/terms-and-conditions" className="underline hover:text-white">Terms & Conditions</a>
            </p>
            <p className="mb-2 text-sm text-gray-500">Address: Srinagar, J&K, India</p>
            <p className="text-gray-500">&copy; {new Date().getFullYear()} RESTDIGI. All rights reserved. Built for modern restaurants.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in-up { 
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
          opacity: 0;
        }
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </div>
  );
}
