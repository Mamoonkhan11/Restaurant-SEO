"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { QrCode, ChevronRight, TrendingUp, Check, X, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);

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

      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frictionless 3-Step Dining Journey</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Give your customers a fast, zero-wait self-ordering experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 01 - Scan */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-6xl font-black bg-gradient-to-br from-slate-200 to-slate-50 bg-clip-text text-transparent select-none">01</div>
              {/* Top Asset Box */}
              <div className="flex-1 flex items-center justify-center py-6 mb-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="flex flex-col items-center">
                  <div className="relative w-[90px] h-[115px] bg-white rounded-lg shadow-md border border-slate-200 p-2.5 flex flex-col items-center justify-between transition-transform group-hover:scale-105 duration-300">
                    <span className="text-[6px] font-extrabold text-orange-600 tracking-wider">RESTDIGI</span>
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-slate-950" />
                    </div>
                    <span className="text-[5px] bg-orange-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">Scan Menu</span>
                  </div>
                  <div className="w-[110px] h-2 bg-slate-300 rounded-full -mt-1 shadow-sm relative z-10"></div>
                </div>
              </div>
              {/* Text Content at base */}
              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Scan</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Customer scans the crisp, custom table-specific QR frame on arrival.
                </p>
              </div>
            </div>

            {/* Card 02 - View */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-6xl font-black bg-gradient-to-br from-slate-200 to-slate-50 bg-clip-text text-transparent select-none">02</div>
              {/* Top Asset Box */}
              <div className="flex-1 flex items-center justify-center py-4 mb-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="w-[140px] h-[240px] bg-slate-950 rounded-2xl p-1.5 mx-auto border-2 border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden relative transition-transform group-hover:scale-105 duration-300">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-800 rounded-full z-20"></div>
                  <div className="flex-1 bg-white rounded-xl p-2 pt-4 flex flex-col gap-2 overflow-hidden select-none text-left">
                    <div className="flex gap-1.5 pb-1 border-b border-slate-50">
                      <div className="w-7 h-3 rounded-full bg-orange-600"></div>
                      <div className="w-7 h-3 rounded-full bg-slate-100"></div>
                      <div className="w-7 h-3 rounded-full bg-slate-100"></div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex gap-1.5 items-center p-1 bg-slate-50 rounded-md border border-slate-100">
                        <div className="w-6 h-6 rounded bg-slate-200 animate-pulse shrink-0"></div>
                        <div className="flex-1 space-y-1">
                          <div className="w-12 h-1.5 bg-slate-300 rounded animate-pulse"></div>
                          <div className="w-8 h-1 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center p-1 bg-slate-50 rounded-md border border-slate-100">
                        <div className="w-6 h-6 rounded bg-slate-200 animate-pulse shrink-0"></div>
                        <div className="flex-1 space-y-1">
                          <div className="w-10 h-1.5 bg-slate-300 rounded animate-pulse"></div>
                          <div className="w-6 h-1 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center p-1 bg-slate-50 rounded-md border border-slate-100">
                        <div className="w-6 h-6 rounded bg-slate-200 animate-pulse shrink-0"></div>
                        <div className="flex-1 space-y-1">
                          <div className="w-14 h-1.5 bg-slate-300 rounded animate-pulse"></div>
                          <div className="w-7 h-1 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Text Content at base */}
              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-3">View</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  A lightning-fast digital menu renders on any mobile browser in under 1 second.
                </p>
              </div>
            </div>

            {/* Card 03 - Order Instantly */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-6xl font-black bg-gradient-to-br from-slate-200 to-slate-50 bg-clip-text text-transparent select-none">03</div>
              {/* Top Asset Box */}
              <div className="flex-1 flex items-center justify-center py-6 mb-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="w-full max-w-[210px] bg-white rounded-xl shadow-md border border-slate-200 p-3 flex flex-col justify-between relative transition-transform group-hover:scale-105 duration-300 text-left">
                  <div>
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 mb-2">
                      <span className="text-[8px] font-bold text-slate-800">Your Basket</span>
                      <span className="text-[7px] text-slate-400 font-semibold">Table 05</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[7px] font-medium text-slate-600">
                        <span>1x Double Cheese Burger</span>
                        <span className="font-bold text-slate-900">₹180</span>
                      </div>
                      <div className="flex justify-between items-center text-[7px] font-medium text-slate-600">
                        <span>2x Mint Mojito</span>
                        <span className="font-bold text-slate-900">₹240</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100">
                    <div className="flex justify-between items-center text-[8px] font-bold text-slate-800 mb-1.5">
                      <span>Total Amount</span>
                      <span>₹420</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg py-1 px-1.5 flex items-center gap-1 justify-center">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                      <span className="text-[7px] text-emerald-700 font-extrabold tracking-tight uppercase">Sent to Kitchen!</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Text Content at base */}
              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Order Instantly</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Multi-item cart selection with quantities lets them send orders straight to the live KOT dashboard without chasing waiters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-24 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="text-xs font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Features Showcase</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">Engineered for Restaurant Success</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Discover how RESTDIGI modernizes your operations and drives customer engagement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            {/* Column 1: Smart QR Menu */}
            <div className="border border-slate-100 rounded-3xl bg-slate-50/50 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div className="flex-1 flex items-center justify-center py-6">
                {/* Mobile Mockup */}
                <div className="relative mx-auto w-[190px] h-[310px] bg-slate-950 rounded-[38px] shadow-lg border-[6px] border-slate-800 overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-800 rounded-full z-20"></div>
                  {/* Screen Content */}
                  <div className="flex-1 bg-white p-2.5 pt-7 flex flex-col font-sans select-none overflow-hidden text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-extrabold text-orange-600 tracking-tight">RestDigi Bistro</span>
                      <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">Table 05</span>
                    </div>

                    <div className="flex gap-1 py-1.5 overflow-x-hidden border-b border-slate-50">
                      <span className="text-[6px] bg-orange-600 text-white px-1.5 py-0.5 rounded-full font-bold">Pizza</span>
                      <span className="text-[6px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">Burgers</span>
                      <span className="text-[6px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">Drinks</span>
                    </div>

                    <div className="mt-1.5 space-y-1.5 flex-1 overflow-hidden">
                      <div className="flex gap-1.5 items-center p-1 bg-slate-50/80 rounded-lg">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-[11px] shrink-0">🍕</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] font-bold text-slate-800 truncate">Spicy Truffle Pizza</div>
                          <div className="text-[6px] text-slate-400 font-medium">Hot honey, mushroom</div>
                        </div>
                        <div className="text-[8px] font-bold text-slate-800 shrink-0">₹399</div>
                      </div>
                      <div className="flex gap-1.5 items-center p-1 bg-slate-50/80 rounded-lg">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-[11px] shrink-0">🍔</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] font-bold text-slate-800 truncate">Loaded Beef Burger</div>
                          <div className="text-[6px] text-slate-400 font-medium">Double cheese, fries</div>
                        </div>
                        <div className="text-[8px] font-bold text-slate-800 shrink-0">₹279</div>
                      </div>
                    </div>

                    <div className="mt-auto bg-orange-600 text-white rounded-lg py-1 px-2 text-[8px] font-bold shadow-sm flex justify-between items-center">
                      <span>3 Items in Cart</span>
                      <span className="flex items-center gap-0.5">Order <ChevronRight className="w-2 h-2" /></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Smart QR Menu</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Seat more guests, display your real-time menu card, and accept instant table orders flawlessly without manual lags.
                </p>
              </div>
            </div>

            {/* Column 2: Kitchen Display Framework */}
            <div className="border border-slate-100 rounded-3xl bg-slate-50/50 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div className="flex-1 flex items-center justify-center py-6">
                {/* Mobile Mockup */}
                <div className="relative mx-auto w-[190px] h-[310px] bg-slate-950 rounded-[38px] shadow-lg border-[6px] border-slate-800 overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-800 rounded-full z-20"></div>
                  {/* Screen Content */}
                  <div className="flex-1 bg-slate-900 p-2.5 pt-7 flex flex-col font-sans select-none overflow-hidden text-left">
                    <div className="bg-slate-900 pb-2 flex justify-between items-center text-[8px] text-slate-300 font-bold border-b border-slate-800 mb-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Kitchen Console
                      </span>
                      <span className="text-[6px] text-slate-450">Active</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                      {/* Ticket 1 */}
                      <div className="bg-slate-850 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center border-b border-slate-800/60 pb-1 mb-1">
                            <span className="text-[8px] font-extrabold text-orange-400">#042</span>
                            <span className="text-[6px] text-slate-400 font-bold">Table 02</span>
                          </div>
                          <ul className="text-[7px] text-slate-300 space-y-0.5 font-medium">
                            <li className="flex justify-between"><span>1x Truffle Pizza</span><span className="text-slate-500">x1</span></li>
                            <li className="flex justify-between"><span>2x Citrus Mojito</span><span className="text-slate-500">x2</span></li>
                          </ul>
                        </div>
                        <div className="mt-1.5 flex justify-between items-center border-t border-slate-800/60 pt-1">
                          <span className="text-[6px] text-slate-400 font-medium">4m ago</span>
                          <span className="text-[6px] bg-amber-500/15 text-amber-400 font-extrabold px-1 py-0.5 rounded leading-none">PREPARING</span>
                        </div>
                      </div>
                      {/* Ticket 2 */}
                      <div className="bg-slate-850 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center border-b border-slate-800/60 pb-1 mb-1">
                            <span className="text-[8px] font-extrabold text-orange-400">#041</span>
                            <span className="text-[6px] text-slate-400 font-bold">Table 11</span>
                          </div>
                          <ul className="text-[7px] text-slate-300 space-y-0.5 font-medium">
                            <li className="flex justify-between"><span>1x Loaded Burger</span><span className="text-slate-500">x1</span></li>
                          </ul>
                        </div>
                        <div className="mt-1.5 flex justify-between items-center border-t border-slate-800/60 pt-1">
                          <span className="text-[6px] text-slate-400 font-medium">9m ago</span>
                          <span className="text-[6px] bg-emerald-500/15 text-emerald-400 font-extrabold px-1 py-0.5 rounded leading-none">READY</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Kitchen Display Engine</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Route structural incoming table receipts directly onto an active terminal display—no misplacement, zero paper chaos.
                </p>
              </div>
            </div>

            {/* Column 3: Live Analytics Telemetry */}
            <div className="border border-slate-100 rounded-3xl bg-slate-50/50 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div className="flex-1 flex items-center justify-center py-6">
                {/* Mobile Mockup */}
                <div className="relative mx-auto w-[190px] h-[310px] bg-slate-950 rounded-[38px] shadow-lg border-[6px] border-slate-800 overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-800 rounded-full z-20"></div>
                  {/* Screen Content */}
                  <div className="flex-1 bg-white p-2.5 pt-7 flex flex-col font-sans select-none overflow-hidden text-left">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Live Revenue</span>
                      <span className="text-[7px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-extrabold">+32.6%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                        <div className="text-[6px] text-slate-400 font-semibold uppercase tracking-tight">Today</div>
                        <div className="text-[9px] font-extrabold text-slate-900 mt-0.5">₹18,640</div>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                        <div className="text-[6px] text-slate-400 font-semibold uppercase tracking-tight">Orders</div>
                        <div className="text-[9px] font-extrabold text-slate-900 mt-0.5">58 Qty</div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end min-h-[100px] relative mt-1">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="telemetryBentoGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 50 L 0 40 L 15 32 L 30 38 L 48 24 L 65 18 L 82 10 L 100 4 L 100 50 Z" fill="url(#telemetryBentoGradient)"></path>
                        <path d="M 0 40 L 15 32 L 30 38 L 48 24 L 65 18 L 82 10 L 100 4" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        <circle cx="100" cy="4" r="2.5" fill="#ea580c" stroke="#ffffff" strokeWidth="1"></circle>
                      </svg>

                      <div className="flex justify-between items-center text-[5px] text-slate-400 pt-1 mt-1 border-t border-slate-100">
                        <span>12:00 PM</span>
                        <span>4:00 PM</span>
                        <span>8:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Live Analytics Engine</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Get real-time operational reports, automated inventory tracking logs, and weekly top-selling telemetry points.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engineered for Restaurant Success Section */}
      <section className="bg-slate-50 py-24 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Premium Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">Engineered for Restaurant Success</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Unlock next-level performance and automation designed to scale your operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: SEO Boost */}
            <div className="flex flex-col items-center text-center md:text-left md:items-start p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden relative group">
              {/* Centering layout wrapper */}
              <div className="w-full flex justify-center items-center mb-6">
                {/* Mobile Mockup */}
                <div className="relative mx-auto w-[190px] h-[310px] bg-slate-950 rounded-[38px] shadow-lg border-[6px] border-slate-800 overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-800 rounded-full z-20"></div>
                  {/* Screen Content */}
                  <div className="flex-1 bg-white p-2.5 pt-7 flex flex-col font-sans select-none overflow-hidden text-left justify-between">
                    <div className="flex flex-col gap-2">
                      {/* Google Logo & Search Box */}
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-extrabold text-blue-600">G</span>
                        <div className="flex-1 h-3.5 bg-slate-100 rounded-full flex items-center px-1.5 justify-between">
                          <span className="text-[6px] text-slate-400 font-medium">restaurants near me</span>
                          <span className="text-[6px] text-slate-350">🔍</span>
                        </div>
                      </div>
                      {/* Search Result Card */}
                      <div className="flex flex-col gap-1.5 relative z-10 border border-slate-100 p-1.5 rounded-xl bg-slate-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[8px] font-bold text-slate-900 flex items-center gap-0.5">
                              RestDigi Cafe
                              <span className="text-[6px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-extrabold leading-none">#1 Rank</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-[6px] text-amber-500 font-bold mt-0.5">
                              5.0 ★★★★★ <span className="text-slate-450 font-medium">(242)</span>
                            </div>
                          </div>
                          {/* Local Maps Pin drops over search card */}
                          <div className="text-sm -mt-0.5 text-red-500 animate-bounce">📍</div>
                        </div>
                        <div className="text-[5px] text-slate-400 font-medium">
                          Open now • 15 min away
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          <span className="text-[5px] bg-white text-slate-650 font-bold px-1.5 py-0.5 rounded-full border border-slate-200">Directions</span>
                          <span className="text-[5px] bg-white text-slate-650 font-bold px-1.5 py-0.5 rounded-full border border-slate-200">Call Now</span>
                        </div>
                      </div>
                    </div>
                    {/* Simulated Map View at the bottom */}
                    <div className="h-[120px] bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden flex items-center justify-center">
                      {/* Simulated map lines */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute w-[2px] h-full bg-slate-500 left-12"></div>
                        <div className="absolute w-[2px] h-full bg-slate-500 left-28"></div>
                        <div className="absolute h-[2px] w-full bg-slate-500 top-10"></div>
                        <div className="absolute h-[2px] w-full bg-slate-500 top-20"></div>
                      </div>
                      <div className="absolute text-xl animate-bounce">📍</div>
                      <div className="absolute bottom-1 right-1 bg-white/90 text-[5px] px-1 rounded font-bold border border-slate-200">Map View</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 mb-3 leading-snug">Automated Local SEO Boost</h3>
                <p className="text-gray-500 leading-relaxed text-sm sm:text-base font-medium">
                  RESTDIGI dynamically optimizes your restaurant’s online presence, pushing your physical location to the top of local Google search maps and discoverability indexes automatically.
                </p>
              </div>
            </div>

            {/* Card 2: KOT Automation Matrix */}
            <div className="flex flex-col items-center text-center md:text-left md:items-start p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden relative group">
              {/* Centering layout wrapper */}
              <div className="w-full flex justify-center items-center mb-6">
                {/* Mobile Mockup */}
                <div className="relative mx-auto w-[190px] h-[310px] bg-slate-950 rounded-[38px] shadow-lg border-[6px] border-slate-800 overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-800 rounded-full z-20"></div>
                  {/* Screen Content */}
                  <div className="flex-1 bg-slate-900 p-2.5 pt-7 flex flex-col font-sans select-none overflow-hidden text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800 font-bold mb-2">
                      <span className="text-[8px] text-slate-300">Terminal 01</span>
                      <span className="text-slate-500 text-[6px] animate-pulse">Syncing...</span>
                    </div>
                    {/* Table Row Workflows */}
                    <div className="space-y-2 flex-1">
                      {/* Row 1 */}
                      <div className="flex justify-between items-center p-1.5 bg-slate-850 rounded border border-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[8px] text-orange-400">Truffle Pizza</span>
                          <span className="text-[6px] text-slate-400">Table 4 • Qty: 1</span>
                        </div>
                        <span className="text-[6px] bg-amber-500/25 text-amber-400 font-extrabold px-1.5 py-0.5 rounded leading-none">Preparing</span>
                      </div>
                      {/* Row 2 */}
                      <div className="flex justify-between items-center p-1.5 bg-slate-850 rounded border border-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[8px] text-orange-400">Citrus Mojito</span>
                          <span className="text-[6px] text-slate-400">Table 9 • Qty: 2</span>
                        </div>
                        <span className="text-[6px] bg-emerald-500/25 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded leading-none">Ready</span>
                      </div>
                      {/* Row 3 */}
                      <div className="flex justify-between items-center p-1.5 bg-slate-850 rounded border border-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[8px] text-orange-400">Beef Burger</span>
                          <span className="text-[6px] text-slate-400">Table 1 • Qty: 1</span>
                        </div>
                        <span className="text-[6px] bg-amber-500/25 text-amber-400 font-extrabold px-1.5 py-0.5 rounded leading-none">Preparing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 mb-3 leading-snug">Live KOT Automation Matrix</h3>
                <p className="text-gray-500 leading-relaxed text-sm sm:text-base font-medium">
                  High-volume programmatic looping chime alerts keep your kitchen instantly updated on incoming table modifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-50 py-24 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12 animate-fade-in-up">
            <span className="text-xs font-bold tracking-wider text-orange-600 uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Pricing Plans</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">Choose Your Perfect Plan</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Get started with our free basic trial, or upgrade to unlock advanced operations metrics.</p>
          </div>

          {/* Premium Sliding Billing Cycle Toggle */}
          <div className="flex flex-col items-center justify-center space-y-3 py-4 mb-12">
            <div className="relative bg-gray-100 p-1 rounded-full grid grid-cols-2 w-72 border border-gray-200 shadow-inner">
              <div
                className="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-out"
                style={{
                  left: isAnnual ? 'calc(50% + 1px)' : '4px',
                  width: 'calc(50% - 5px)',
                }}
              />
              <button
                onClick={() => setIsAnnual(false)}
                className={`relative z-10 py-2 text-sm font-bold rounded-full transition-colors duration-200 flex justify-center items-center ${!isAnnual ? 'text-gray-950' : 'text-gray-400 hover:text-gray-700'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`relative z-10 py-2 text-sm font-bold rounded-full transition-colors duration-200 flex justify-center items-center gap-1.5 ${isAnnual ? 'text-gray-950' : 'text-gray-400 hover:text-gray-700'
                  }`}
              >
                Annually
                <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95">
                  Save
                </span>
              </button>
            </div>
            {isAnnual && (
              <p className="text-xs font-semibold text-emerald-600 animate-fade-in">
                Smart choice! Saving up to 16% on annual packages.
              </p>
            )}
          </div>

          {/* Comparison Matrix Table */}
          <div className="w-full overflow-x-auto border border-slate-200/60 rounded-3xl bg-white shadow-sm">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-6 text-xl font-extrabold text-slate-900 w-[28%] align-top">
                    <div className="flex flex-col justify-between h-full">
                      <span>Pricing Matrix</span>
                      <span className="text-xs text-slate-400 font-medium mt-2">Compare plans side-by-side</span>
                    </div>
                  </th>

                  {/* Basic Plan Header */}
                  <th className="p-6 w-[18%] align-top relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200"></div>
                    <div className="font-bold text-slate-800 text-lg">Basic</div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2">
                      ₹{isAnnual ? 1499 : 149}
                      <span className="text-xs text-slate-400 font-medium">/{isAnnual ? 'yr' : 'mo'}</span>
                    </div>
                    {isAnnual && (
                      <span className="inline-block text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold mt-1">
                        Save ~16%
                      </span>
                    )}
                    <div className="text-[9px] text-orange-600 font-bold mt-2 leading-tight uppercase bg-orange-50/50 p-1.5 rounded border border-orange-100/50">
                      1 Month Free basic tier!
                    </div>
                  </th>

                  {/* Pro Plan Header */}
                  <th className="p-6 w-[18%] align-top relative bg-orange-50/10 border-x border-orange-100/50">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-lg">Pro</span>
                      <span className="text-[8px] bg-orange-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Popular</span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2">
                      ₹{isAnnual ? 7899 : 699}
                      <span className="text-xs text-slate-400 font-medium">/{isAnnual ? 'yr' : 'mo'}</span>
                    </div>
                    {isAnnual && (
                      <span className="inline-block text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold mt-1">
                        Save ~6%
                      </span>
                    )}
                  </th>

                  {/* Premium Plan Header */}
                  <th className="p-6 w-[18%] align-top relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200"></div>
                    <div className="font-bold text-slate-800 text-lg">Premium</div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2">
                      ₹{isAnnual ? 10499 : 999}
                      <span className="text-xs text-slate-400 font-medium">/{isAnnual ? 'yr' : 'mo'}</span>
                    </div>
                    {isAnnual && (
                      <span className="inline-block text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold mt-1">
                        Save ~12%
                      </span>
                    )}
                  </th>

                  {/* Enterprise Plan Header */}
                  <th className="p-6 w-[18%] align-top relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900"></div>
                    <div className="font-bold text-slate-800 text-lg">Enterprise</div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2">Custom</div>
                    <span className="inline-block text-[9px] text-slate-400 font-medium mt-1">Tailored Limits</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">

                {/* Row 1: Item & Menu Limits */}
                <tr className="even:bg-slate-50/40">
                  <td className="p-5 font-semibold text-slate-700">Item & Menu Limits</td>
                  <td className="p-5 text-slate-600">Up to 12 Menu Items</td>
                  <td className="p-5 text-slate-800 font-semibold bg-orange-50/5 border-x border-orange-100/30">Up to 20 Menu Items</td>
                  <td className="p-5 text-slate-600">Up to 23 Menu Items</td>
                  <td className="p-5 text-slate-600 font-medium">Custom / Scalable</td>
                </tr>

                {/* Row 2: Tables allocation boundaries */}
                <tr className="even:bg-slate-50/40">
                  <td className="p-5 font-semibold text-slate-700">Tables Allocation</td>
                  <td className="p-5 text-slate-600">Up to 5 Tables</td>
                  <td className="p-5 text-slate-800 font-semibold bg-orange-50/5 border-x border-orange-100/30">Up to 15 Tables</td>
                  <td className="p-5 text-slate-600">Up to 17 Tables</td>
                  <td className="p-5 text-slate-600 font-medium">Custom Tables</td>
                </tr>

                {/* Row 3: Live Sales Counter telemetry loops */}
                <tr className="even:bg-slate-50/40">
                  <td className="p-5 font-semibold text-slate-700">Live Sales Counter</td>
                  <td className="p-5">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5 bg-orange-50/5 border-x border-orange-100/30">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                </tr>

                {/* Row 4: Weekly Top Dish telemetry trackers */}
                <tr className="even:bg-slate-50/40">
                  <td className="p-5 font-semibold text-slate-700">Weekly Top Dish Analytics</td>
                  <td className="p-5">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5 bg-orange-50/5 border-x border-orange-100/30">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                </tr>

                {/* Row 5: Detailed Item View Analytics graphs */}
                <tr className="even:bg-slate-50/40">
                  <td className="p-5 font-semibold text-slate-700">Detailed Item View Analytics</td>
                  <td className="p-5">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5 bg-orange-50/5 border-x border-orange-100/30">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                </tr>

                {/* Row 6: SEO Ranking Optimization */}
                <tr className="even:bg-slate-50/40">
                  <td className="p-5 font-semibold text-slate-700">Automated Local SEO Boost</td>
                  <td className="p-5">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5 bg-orange-50/5 border-x border-orange-100/30">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                </tr>

                {/* Row 7: Direct 24/7 Priority Support */}
                <tr className="even:bg-slate-50/40">
                  <td className="p-5 font-semibold text-slate-700">Direct 24/7 Priority Support</td>
                  <td className="p-5">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5 bg-orange-50/5 border-x border-orange-100/30">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5">
                    <X className="w-5 h-5 text-rose-400" />
                  </td>
                  <td className="p-5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </td>
                </tr>

                {/* Action Buttons Row */}
                <tr>
                  <td className="p-5"></td>
                  <td className="p-5">
                    <Link
                      href="/register"
                      className="block w-full py-2.5 px-4 text-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm"
                    >
                      Get Started
                    </Link>
                  </td>
                  <td className="p-5 bg-orange-50/10 border-x border-orange-100/40">
                    <Link
                      href="/register"
                      className="block w-full py-2.5 px-4 text-center text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      Get Started
                    </Link>
                  </td>
                  <td className="p-5">
                    <Link
                      href="/register"
                      className="block w-full py-2.5 px-4 text-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm"
                    >
                      Get Started
                    </Link>
                  </td>
                  <td className="p-5">
                    <a
                      href="mailto:support@restdigi.online?subject=Enterprise%20Plan%20Inquiry"
                      className="block w-full py-2.5 px-4 text-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm"
                    >
                      Contact Sales
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white py-24 border-t border-gray-100">
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
                To support local restaurant communities, we are running an exclusive Early Bird launch frame. The first 5 users/outlets to register on RestDigi will get our core operational infrastructure (including the dynamic digital QR menu and basic telemetry analytics) completely FREE for one month—zero monthly hosting fees, zero catches.
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
                We love growing with our community! If you refer another cafe or restaurant owner to RestDigi, you earn a premium cash payout or software credits as soon as your referred user upgrades and makes their first successful purchase of our Pro, Premium or Enterprise tier plans. For commission information, you can contact <a href="mailto:support@restdigi.online" className="text-orange-600 hover:text-orange-700 underline font-semibold">support@restdigi.online</a>.
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
                Yes! RestDigi is a 100% cloud-synced system. You can open your customized live owner dashboard from any smartphone, laptop, or tablet in the world to track real-time tables and menu, total scan counts, and your top-performing menu items.
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

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 pt-12 border-t border-slate-100">

            {/* Column 1 (Branding Node) */}
            <div className="space-y-4">
              <img
                src="/restdigi-logo.png"
                className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105"
                alt="RESTDIGI Logo"
              />
              <p className="text-slate-500 text-sm leading-relaxed">
                Modernizing local dining ecosystems with high-speed digital tools.
              </p>
              <div className="text-xs text-slate-400">
                &copy; 2026 RestDigi. All rights reserved.
              </div>
            </div>

            {/* Column 2 (Product Assets) */}
            <div className="space-y-4">
              <h3 className="text-slate-900 font-bold text-sm tracking-wider uppercase">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Pricing Tiers
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    FAQ Section
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 (Legal Framework Documents) */}
            <div className="space-y-4">
              <h3 className="text-slate-900 font-bold text-sm tracking-wider uppercase">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy-policy" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Cancellation & Refund
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4 (Social Footprint Connect) */}
            <div className="space-y-4">
              <h3 className="text-slate-900 font-bold text-sm tracking-wider uppercase">
                Social
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="https://twitter.com/restdigii" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Twitter (X)
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/restdigii" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://youtube.com/restdigii" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    YouTube
                  </a>
                </li>
              </ul>
            </div>

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
