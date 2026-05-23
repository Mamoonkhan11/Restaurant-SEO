import Link from 'next/link';
import { QrCode, ChevronRight, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-orange-200">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-8 h-8 object-contain" alt="RESTDIGI Logo" />
              <span className="font-extrabold text-xl tracking-tight text-gray-900">REST<span className="text-orange-600">DIGI</span></span>
            </div>
            <div className="flex items-center gap-4">
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
            Launch Your Digital Menu Free
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/menu/sweet-bliss-bakery"
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

      {/* Footer (Razorpay Legal Links) */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">

            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-8 h-8 object-contain" alt="RESTDIGI Logo" />
              <span className="font-extrabold text-xl tracking-tight text-white">REST<span className="text-orange-500">DIGI</span></span>
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

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p className="mb-2">Address: Srinagar, J&K, India</p>
            <p>&copy; {new Date().getFullYear()} RESTDIGI. All rights reserved. Built for modern restaurants.</p>
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
      `}</style>
    </div>
  );
}
