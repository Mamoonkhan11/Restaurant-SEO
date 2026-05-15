import Link from 'next/link';
import { QrCode, MessageCircle, RefreshCw, ChevronRight, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-200">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform -rotate-6 shadow-sm">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 4H5a2 2 0 0 0-2 2v3" />
                  <path d="M16 4h3a2 2 0 0 1 2 2v3" />
                  <path d="M8 20H5a2 2 0 0 1-2-2v-3" />
                  <path d="M16 20h3a2 2 0 0 0 2-2v-3" />
                  <path d="M7 14a5 5 0 0 1 10 0" />
                  <path d="M6 14h12" />
                  <path d="M12 9V7" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">QR-<span className="text-blue-600">Crave</span></span>
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          The Future of Dining is Here
        </div>

        <h1 className="max-w-4xl text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          QR-Crave: The Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Digital Menu</span> for Srinagar's Best Restaurant
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-gray-500 mb-10 font-medium animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Ditch the paper menus. Create a stunning, contactless digital menu that your customers can scan, browse, and order from directly via WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 group"
          >
            Get Started Now
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

      {/* Features Section */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Powerful features designed specifically for modern restaurants and cafes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                <QrCode className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">QR Code Menu</h3>
              <p className="text-gray-500 leading-relaxed">
                Generate high-resolution, beautifully branded QR codes for every table. Customers simply scan and browse without downloading any apps.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                <MessageCircle className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">WhatsApp Ordering</h3>
              <p className="text-gray-500 leading-relaxed">
                Receive orders directly on your restaurant's WhatsApp. Perfectly formatted, easy to read, and frictionless for your customers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                <RefreshCw className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Updates</h3>
              <p className="text-gray-500 leading-relaxed">
                86 an item? Need to change a price? Update your admin dashboard and it instantly reflects on all menus. No re-printing required.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
                PRO FEATURE
              </div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                <TrendingUp className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dominate Local Search Results</h3>
              <p className="text-gray-500 leading-relaxed">
                Our menus are built with Schema Markup and Local SEO best practices to ensure your restaurant stays ahead on Google Maps and Search.
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
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center transform -rotate-6">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 4H5a2 2 0 0 0-2 2v3" />
                  <path d="M16 4h3a2 2 0 0 1 2 2v3" />
                  <path d="M8 20H5a2 2 0 0 1-2-2v-3" />
                  <path d="M16 20h3a2 2 0 0 0 2-2v-3" />
                  <path d="M7 14a5 5 0 0 1 10 0" />
                  <path d="M6 14h12" />
                  <path d="M12 9V7" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">QR-<span className="text-gray-400">Crave</span></span>
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
            <p>&copy; {new Date().getFullYear()} QR-Crave. All rights reserved. Built for modern restaurants.</p>
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
