"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { QrCode, ChevronRight, TrendingUp, Check, X, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);

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
    <div className="min-h-screen flex flex-col bg-[#07080B] landing-glow-bg text-zinc-100 font-sans selection:bg-orange-600/30 selection:text-white relative overflow-hidden">

      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-600/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[-20%] w-[800px] h-[800px] rounded-full bg-red-600/5 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-25%] w-[700px] h-[700px] rounded-full bg-orange-500/5 blur-[150px] pointer-events-none"></div>

      {/* Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-[#07080B]/55 backdrop-blur-[90px] pointer-events-none z-0"></div>

      {/* Light Orange Ambient Glows (Vibrant Highlights) */}
      <div className="absolute top-[-5%] right-[5%] w-[550px] h-[550px] rounded-full bg-orange-500/15 blur-[110px] pointer-events-none mix-blend-screen z-0"></div>
      <div className="absolute top-[25%] left-[-10%] w-[650px] h-[650px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none mix-blend-screen z-0"></div>
      <div className="absolute bottom-[20%] right-[-8%] w-[600px] h-[600px] rounded-full bg-orange-500/12 blur-[120px] pointer-events-none mix-blend-screen z-0"></div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#090A0F]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-5">
            <div className="flex items-center py-1 sm:py-2">
              <Image
                src="/restdigi-logo.png"
                alt="RESTDIGI Logo"
                width={160}
                height={48}
                className="h-10 sm:h-12 lg:h-16 w-auto object-contain transition-transform hover:scale-105 brightness-110"
                priority
              />
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/admin"
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Admin Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-bold bg-orange-600 text-white px-5 py-2.5 rounded-full hover:bg-orange-700 transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.4)]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-1 flex items-center justify-center pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">

          {/* Left Column (Content) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] mb-2 select-none">
              Enjoy <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 hover:scale-105 hover:-rotate-1 transition-transform duration-300 cursor-default">Delicious Food</span> in Your <span className="inline-block hover:text-orange-400 hover:scale-105 hover:rotate-1 transition-all duration-300 cursor-default">Healthy Life</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-400 font-medium leading-relaxed max-w-2xl">
              Skip queues and staff shortages. Customers scan QR codes, browse your dynamic digital menu, and order in seconds. No apps, zero waiting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-extrabold text-white transition-all bg-orange-600 rounded-full hover:bg-orange-700 hover:shadow-[0_0_25px_rgba(234,88,12,0.5)] hover:-translate-y-0.5 group"
              >
                Launch Your Digital Menu
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/menu/the-backyard-grill"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-extrabold text-gray-300 transition-all bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white"
              >
                View Demo Menu
              </Link>
            </div>
          </div>

          {/* Right Column (Circular Overlapping Food Plates) */}
          <div className="lg:col-span-5 relative w-full h-[400px] md:h-[500px] flex items-center justify-center select-none mt-8 lg:mt-0">
            {/* Glowing Backdrop Blob */}
            <div className="absolute w-[300px] h-[300px] md:w-[380px] md:h-[380px] rounded-full bg-orange-500/20 blur-[75px] pointer-events-none animate-pulse"></div>
            <div className="absolute w-[200px] h-[200px] rounded-full bg-amber-400/20 blur-[50px] pointer-events-none animate-pulse mix-blend-screen"></div>

            {/* Main Central Plate (Kashmiri Wazwan) */}
            <div className="absolute z-10 w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-full border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 hover:scale-105 group">
              <Image
                src="/kashmiri_wazwan.webp"
                alt="Kashmiri Wazwan Plate"
                fill
                sizes="(max-width: 768px) 240px, 320px"
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 z-20">
                <span className="text-white text-xs font-bold uppercase tracking-wider bg-orange-600 px-3 py-1 rounded-full">Kashmiri Wazwan</span>
              </div>
            </div>

            {/* Top-Left Floating Plate (Chicken Biryani) */}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-full border-2 border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-700 hover:scale-110 hover:-translate-y-2 animate-float-slow group">
              <Image
                src="/chicken_biryani.jpg"
                alt="Chicken Biryani Plate"
                fill
                sizes="(max-width: 768px) 110px, 150px"
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2 z-20">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded-full">Biryani</span>
              </div>
            </div>

            {/* Bottom-Left Floating Plate (Momos) */}
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20 w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-full border-2 border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-700 hover:scale-110 hover:translate-y-2 animate-float-slow group">
              <Image
                src="/momos.jpg"
                alt="Momo Plate"
                fill
                sizes="(max-width: 768px) 110px, 150px"
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2 z-20">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded-full">Momo</span>
              </div>
            </div>

            {/* Bottom-Right Floating Plate (Spaghetti Pasta) */}
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20 w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-full border-2 border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-700 hover:scale-110 hover:translate-y-2 animate-float-mid group">
              <Image
                src="/spaghetti_pasta.png"
                alt="Spaghetti Pasta Plate"
                fill
                sizes="(max-width: 768px) 110px, 150px"
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2 z-20">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded-full">Pasta</span>
              </div>
            </div>

            {/* Top-Right Floating Plate (Vegetable Salad) */}
            <div className="absolute top-8 right-8 md:top-16 md:right-16 z-20 w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-full border-2 border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-700 hover:scale-110 hover:-translate-y-1 animate-float-fast group">
              <Image
                src="/vegetable_salad.png"
                alt="Vegetable Salad Plate"
                fill
                sizes="(max-width: 768px) 110px, 150px"
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2 z-20">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded-full">Salad</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Frictionless 3-Step Dining Journey Section */}
      <section className="bg-transparent py-24 border-t border-white/5 relative z-10 overflow-hidden">
        {/* Section Ambient Glows */}
        <div className="absolute top-[20%] left-[-10%] w-[450px] h-[450px] rounded-full bg-orange-500/10 blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-amber-500/8 blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-orange-500 uppercase bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-500/20">Operations Workflow</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4">Frictionless 3-Step Dining Journey</h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto">Give your customers a fast, zero-wait self-ordering experience they will talk about.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Step 1 - Scan */}
            <div className="p-8 bg-white/[0.03] backdrop-blur-md rounded-3xl border border-white/10 flex flex-col justify-between hover:border-orange-500/30 hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-6xl font-black bg-gradient-to-br from-white/10 to-transparent bg-clip-text text-transparent select-none">01</div>

              {/* Graphic Asset representation */}
              <div className="flex-1 flex items-center justify-center py-8 mb-8 bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/5 relative">
                <div className="relative w-[220px] h-[150px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/qrscreen.png"
                    alt="Scan Table QR Code"
                    fill
                    sizes="220px"
                    className="object-contain bg-white"
                  />
                </div>
              </div>

              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-white mb-2">Scan</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Customers scan a crisp, high-contrast QR code placed directly at their dining tables.
                </p>
              </div>
            </div>

            {/* Step 2 - View (Kashmiri Wazwan Image preview) */}
            <div className="p-8 bg-white/[0.03] backdrop-blur-md rounded-3xl border border-white/10 flex flex-col justify-between hover:border-orange-500/30 hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-6xl font-black bg-gradient-to-br from-white/10 to-transparent bg-clip-text text-transparent select-none">02</div>

              {/* Graphic Asset representation */}
              <div className="flex-1 flex items-center justify-center py-8 mb-8 bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/5 relative">
                <div className="relative w-[220px] h-[150px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/menu_catalog_screen.png"
                    alt="Digital Menu Catalog"
                    fill
                    sizes="220px"
                    className="object-cover brightness-90 hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-white mb-2">View</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  A high-speed interactive digital menu loads immediately in their mobile browser—smooth category filter panels.
                </p>
              </div>
            </div>

            {/* Step 3 - Order Instantly (Chicken Biryani Checkout state) */}
            <div className="p-8 bg-white/[0.03] backdrop-blur-md rounded-3xl border border-white/10 flex flex-col justify-between hover:border-orange-500/30 hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-6xl font-black bg-gradient-to-br from-white/10 to-transparent bg-clip-text text-transparent select-none">03</div>

              {/* Graphic Asset representation */}
              <div className="flex-1 flex items-center justify-center py-8 mb-8 bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/5 relative">
                <div className="relative w-[220px] h-[150px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/kot_status_screen.png"
                    alt="KOT Order Status"
                    fill
                    sizes="220px"
                    className="object-cover brightness-95 hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-white mb-2">Order Instantly</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Add items to cart and check out in seconds. Orders route straight to the kitchen display screen automatically.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Engineered for Restaurant Success Section (Features Showcase) */}
      <section id="features" className="bg-transparent py-24 border-t border-white/5 relative z-10 overflow-hidden">
        {/* Section Ambient Glows */}
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="text-xs font-bold tracking-wider text-orange-500 uppercase bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-500/20">Core Platform Features</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4">Engineered for Restaurant Success</h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto">Discover how RESTDIGI modernizes your daily operations and drives order conversion rates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">

            {/* Feature 1: Smart QR Menu */}
            <div className="border border-white/10 rounded-3xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between group">
              <div className="flex-1 flex items-center justify-center py-6 w-full">
                <div className="relative w-full h-[200px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/smart_qr_menu.jpg"
                    alt="Smart QR Menu Interface"
                    fill
                    sizes="(max-width: 768px) 100vw, 350px"
                    className="object-cover brightness-95 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-white mb-2">Smart QR Menu</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  Boost seat turnover rates, display beautiful visual menu items, and allow self-checkout with zero manual friction.
                </p>
              </div>
            </div>

            {/* Feature 2: Kitchen Display Console */}
            <div className="border border-white/10 rounded-3xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between group">
              <div className="flex-1 flex items-center justify-center py-6 w-full">
                <div className="relative w-full h-[200px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/kitchen_orders_screen.png"
                    alt="Kitchen Display System Console"
                    fill
                    sizes="(max-width: 768px) 100vw, 350px"
                    className="object-cover brightness-95 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-white mb-2">Kitchen Display Engine</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  Incoming orders display directly on kitchen tablets in real-time. Eliminates paper wait sheets and prevents missed items.
                </p>
              </div>
            </div>

            {/* Feature 3: Live Analytics Dashboard */}
            <div className="border border-white/10 rounded-3xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between group">
              <div className="flex-1 flex items-center justify-center py-6">
                {/* Live Analytics Dashboard widget */}
                <div className="w-full h-[200px] bg-slate-950 border border-white/5 rounded-2xl p-5 flex flex-col justify-between text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Live Revenue Trend</span>
                    <span className="text-[8px] text-emerald-500 bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold">+42.8%</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-white">₹24,850</span>
                    <span className="text-[7px] text-gray-400">82 orders placed today</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-end h-[60px] relative mt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="glowChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 50 L 0 45 L 20 30 L 40 38 L 60 20 L 80 15 L 100 8 L 100 50 Z" fill="url(#glowChartGradient)"></path>
                      <path d="M 0 45 L 20 30 L 40 38 L 60 20 L 80 15 L 100 8" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      <circle cx="100" cy="8" r="2.5" fill="#ea580c"></circle>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-white mb-2">Live Analytics Engine</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  Track table performance, item popularity views, revenue margins, and scan traffic from a single secure admin center.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Engineered for Restaurant Success Section (Premium Capabilities) */}
      <section className="bg-transparent py-24 border-t border-white/5 relative z-10 overflow-hidden">
        {/* Section Ambient Glows */}
        <div className="absolute top-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-orange-600/10 blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-orange-500 uppercase bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-500/20">Growth Accelerators</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4 font-black">Engineered for Restaurant Success</h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto">Elevate restaurant visibility and speed with advanced modules built to perform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Card 1: SEO Boost */}
            <div className="flex flex-col items-center text-center md:text-left md:items-start p-8 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300 overflow-hidden relative group">
              <div className="w-full flex justify-center items-center mb-8 relative">
                {/* Simulated Google Listing Card */}
                <div className="w-full max-w-[280px] bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 text-left shadow-2xl">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <span className="text-[11px] font-black text-blue-500">Google</span>
                    <div className="flex-1 h-3.5 bg-white/5 rounded-full flex items-center px-2 justify-between">
                      <span className="text-[6px] text-gray-400">restaurants near me</span>
                      <span className="text-[6px] text-gray-400">🔍</span>
                    </div>
                  </div>

                  <div className="border border-white/5 p-2 rounded-xl bg-white/[0.02]">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-extrabold text-white flex items-center gap-1">
                          Your Restaurant Outlet
                          <span className="text-[6px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-1 py-0.2 rounded font-extrabold">#1 Rank</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-[7px] text-amber-500 font-bold mt-0.5">
                          5.0 ★★★★★ <span className="text-gray-400 font-medium">(256 reviews)</span>
                        </div>
                      </div>
                      <span className="text-xs text-red-500 animate-bounce">📍</span>
                    </div>
                    <div className="text-[6px] text-gray-400 mt-1">Authentic Traditional Wazwan & Biryani Specialities</div>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">Automated Local SEO Boost</h3>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base font-medium">
                  RESTDIGI optimizes your digital menu structure, helping search engine crawlers rank your dishes higher and pushing your location to the top of Google Maps search listings.
                </p>
              </div>
            </div>

            {/* Card 2: KOT Automation Matrix */}
            <div className="flex flex-col items-center text-center md:text-left md:items-start p-8 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300 overflow-hidden relative group">
              <div className="w-full flex justify-center items-center mb-8 relative">
                {/* Active kitchen console card */}
                <div className="w-full max-w-[280px] bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 text-left shadow-2xl">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Sync Matrix Terminal</span>
                    <span className="text-[6px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold">Synced</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 bg-white/[0.02] border border-white/5 rounded flex justify-between items-center">
                      <div>
                        <div className="text-[8px] font-black text-white">1x Chicken Biryani</div>
                        <div className="text-[6px] text-gray-400">Table 05 • Waiter Bypass</div>
                      </div>
                      <span className="text-[6px] bg-orange-950/60 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-extrabold">Preparing</span>
                    </div>

                    <div className="p-2 bg-white/[0.02] border border-white/5 rounded flex justify-between items-center">
                      <div>
                        <div className="text-[8px] font-black text-white">1x Kashmiri Wazwan Rogan Josh</div>
                        <div className="text-[6px] text-gray-400">Table 03 • Waiter Bypass</div>
                      </div>
                      <span className="text-[6px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold">Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">Live KOT Automation Matrix</h3>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base font-medium">
                  High-speed order synchronization pipelines stream table orders straight into KOT tickets. Reduces server overhead, double keying, and time delays.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-transparent py-24 border-t border-white/5 relative z-10 overflow-hidden">
        {/* Section Ambient Glows */}
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[135px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[10%] left-[-15%] w-[550px] h-[550px] rounded-full bg-amber-600/8 blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-wider text-orange-500 uppercase bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-500/20">Pricing Plans</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4">Choose Your Perfect Plan</h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto">Get started with a free trial, or choose our popular plans to unlock advanced operation statistics.</p>
          </div>

          {/* Billing Info */}
          <div className="flex flex-col items-center justify-center space-y-2 mb-12">
            <span className="text-xs font-extrabold text-orange-500 uppercase tracking-widest bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-500/20">
              Yearly Subscriptions
            </span>
            <p className="text-sm font-semibold text-gray-400">
              All RestDigi plans are billed annually for maximum savings.
            </p>
          </div>

          {/* Pricing Table (Dark Theme Integration) */}
          <div className="w-full overflow-x-auto border border-white/10 rounded-3xl bg-[#0B0C10] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="p-6 text-lg font-extrabold text-white w-[30%] align-top">
                    <div className="flex flex-col justify-between h-full">
                      <span>Pricing Matrix</span>
                      <span className="text-xs text-gray-400 font-medium mt-1">Compare plans side-by-side</span>
                    </div>
                  </th>

                  {/* Basic Dine-In Plan Header */}
                  <th className="p-6 w-[17.5%] align-top relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/10"></div>
                    <div className="font-bold text-white text-base">Basic Dine-In</div>
                    <div className="text-2xl font-extrabold text-white mt-2">
                      ₹19,999
                      <span className="text-xs text-gray-400 font-medium">/yr</span>
                    </div>
                    <span className="inline-block text-[9px] text-gray-400 bg-white/5 px-2 py-0.5 rounded font-bold mt-2">
                      Billed Annually
                    </span>
                  </th>

                  {/* Pro Live-KOT Plan Header (Highlighted) */}
                  <th className="p-6 w-[17.5%] align-top relative bg-orange-500/[0.02] border-x border-orange-500/10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-base">Pro Live-KOT</span>
                      <span className="text-[8px] bg-orange-600 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-md shadow-orange-600/20">Popular</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white mt-2">
                      ₹39,999
                      <span className="text-xs text-gray-400 font-medium">/yr</span>
                    </div>
                    <span className="inline-block text-[9px] text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded font-extrabold mt-2">
                      14-Day Free Trial
                    </span>
                  </th>

                  {/* Premium Houseboat & Hotel Plan Header */}
                  <th className="p-6 w-[17.5%] align-top relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/10"></div>
                    <div className="font-bold text-white text-base">Premium Houseboat</div>
                    <div className="text-2xl font-extrabold text-white mt-2">
                      ₹64,999
                      <span className="text-xs text-gray-400 font-medium">/yr</span>
                    </div>
                    <span className="inline-block text-[9px] text-gray-400 bg-white/5 px-2 py-0.5 rounded font-bold mt-2">
                      Billed Annually
                    </span>
                  </th>

                  {/* Enterprise Network Plan Header */}
                  <th className="p-6 w-[17.5%] align-top relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                    <div className="font-bold text-white text-base">Enterprise Network</div>
                    <div className="text-2xl font-extrabold text-white mt-2">Custom</div>
                    <span className="inline-block text-[9px] text-gray-400 bg-white/5 px-2 py-0.5 rounded font-bold mt-2">
                      Contact Sales
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">

                {/* Row 1: Item & Menu Limits */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Item & Menu Limits</td>
                  <td className="p-5 text-gray-400">Up to 50 Menu Items</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">Unlimited Menu Items</td>
                  <td className="p-5 text-gray-400">Unlimited Menu Items</td>
                  <td className="p-5 text-gray-400 font-semibold">Unlimited Multi-Outlet</td>
                </tr>

                {/* Row 2: Tables allocation boundaries */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Tables Allocation</td>
                  <td className="p-5 text-gray-400">Up to 10 Tables</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">Up to 30 Tables</td>
                  <td className="p-5 text-gray-400">Up to 60 Rooms / Decks</td>
                  <td className="p-5 text-gray-400 font-semibold">Unlimited & Dashboards</td>
                </tr>

                {/* Row 3: Native Order Routing */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Native Order Routing</td>
                  <td className="p-5 text-gray-400">100% Native RestDigi</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">100% Native RestDigi</td>
                  <td className="p-5 text-gray-400">100% Native RestDigi</td>
                  <td className="p-5 text-gray-400 font-semibold">Dedicated Infrastructure</td>
                </tr>

                {/* Row 4: Kitchen notification console */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Kitchen Notification</td>
                  <td className="p-5 text-gray-400">Mobile Queue Notification</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">Instant Desktop KOT Console</td>
                  <td className="p-5 text-gray-400">Multi-KOT Room Mapping</td>
                  <td className="p-5 text-gray-400 font-semibold">Custom API POS Link</td>
                </tr>

                {/* Row 5: Analytics metrics */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Analytics Level</td>
                  <td className="p-5 text-gray-400">QR Scans Counter Only</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">Top Selling Dishes & Scans</td>
                  <td className="p-5 text-gray-400">Advanced Room Occupancy</td>
                  <td className="p-5 text-gray-400 font-semibold">Enterprise Consolidated Metrics</td>
                </tr>

                {/* Row 6: Sound Alerts */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Chime Alerts</td>
                  <td className="p-5 text-gray-400">No</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">Automated Sound Alerts</td>
                  <td className="p-5 text-gray-400">Automated Sound Alerts</td>
                  <td className="p-5 text-gray-400 font-semibold">Custom Alert Integrations</td>
                </tr>

                {/* Row 7: Google Review & SEO Booster */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Google SEO Booster</td>
                  <td className="p-5 text-gray-400">No</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">Included</td>
                  <td className="p-5 text-gray-400">Included</td>
                  <td className="p-5 text-gray-400 font-semibold">Included</td>
                </tr>

                {/* Row 8: Support Availability */}
                <tr className="even:bg-white/[0.01]">
                  <td className="p-5 font-semibold text-gray-300">Support Priority</td>
                  <td className="p-5 text-gray-400">Direct 24/7 Support</td>
                  <td className="p-5 text-white font-semibold bg-orange-500/[0.01] border-x border-orange-500/5">Priority 24/7 Support</td>
                  <td className="p-5 text-gray-400">VIP Premium Support</td>
                  <td className="p-5 text-gray-400 font-semibold">Dedicated Account Manager</td>
                </tr>

                {/* Row 9: CTA Action Buttons */}
                <tr>
                  <td className="p-6"></td>

                  {/* Basic CTA */}
                  <td className="p-6">
                    <Link
                      href="/register?plan=basic"
                      className="block text-center text-xs font-bold bg-white/5 text-white hover:bg-white/10 py-3 px-2 rounded-xl transition-colors border border-white/5"
                    >
                      Activate Basic Dine-In
                    </Link>
                  </td>

                  {/* Pro CTA */}
                  <td className="p-6 bg-orange-500/[0.02] border-x border-orange-500/10">
                    <Link
                      href="/register?plan=pro"
                      className="block text-center text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 py-3 px-2 rounded-xl transition-all shadow-lg shadow-orange-600/15"
                    >
                      Try Pro For Free
                    </Link>
                  </td>

                  {/* Premium CTA */}
                  <td className="p-6">
                    <Link
                      href="/register?plan=premium"
                      className="block text-center text-xs font-bold bg-white/5 text-white hover:bg-white/10 py-3 px-2 rounded-xl transition-colors border border-white/5"
                    >
                      Upgrade to Premium
                    </Link>
                  </td>

                  {/* Enterprise CTA */}
                  <td className="p-6">
                    <a
                      href="mailto:support@restdigi.online?subject=RestDigi%20Enterprise%20Plan%20Inquiry&body=Hi%20RestDigi%20Sales%20Team%2C%0A%0AI%20am%20interested%20in%20learning%20more%20about%20the%20Enterprise%20Network%20Plan%20for%20my%20restaurant%20chain.%20Please%20get%20in%20touch.%0A%0ABest%20regards%2C"
                      className="block text-center text-xs font-bold bg-white/5 text-white hover:bg-white/10 py-3 px-2 rounded-xl transition-colors border border-white/5"
                    >
                      Contact Sales Team
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-transparent py-24 border-t border-white/5 relative z-10 overflow-hidden">
        {/* FAQ Section Ambient Glows */}
        <div className="absolute top-[10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-orange-500/12 blur-[130px] pointer-events-none mix-blend-screen z-0"></div>
        <div className="absolute bottom-[5%] right-[-10%] w-[550px] h-[550px] rounded-full bg-amber-500/8 blur-[120px] pointer-events-none mix-blend-screen z-0"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-orange-500 uppercase bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-500/20">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto">Have questions about our operations? Explore our support responses below.</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Q1 */}
            <details className="group border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all duration-200 relative z-10 shadow-lg">
              <summary className="flex justify-between items-center font-bold text-white cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4">What exactly is RestDigi, and how does it work?</span>
                <span className="text-orange-500 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                RestDigi is a cloud-native restaurant operating platform. You generate customized QR codes for tables, and customers scan them to order food directly from mobile browsers. Orders flow straight into kitchen consoles—replacing paper order logs completely.
              </div>
            </details>

            {/* Q2 */}
            <details className="group border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all duration-200 relative z-10 shadow-lg">
              <summary className="flex justify-between items-center font-bold text-white cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4">Do my customers need to download any application?</span>
                <span className="text-orange-500 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                No apps required! Customers scan the QR code with their default smartphone camera and the menu opens in their standard mobile web browser instantly.
              </div>
            </details>

            {/* Q3 */}
            <details className="group border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all duration-200 relative z-10 shadow-lg">
              <summary className="flex justify-between items-center font-bold text-white cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4">Can I update my menu prices and items in real-time?</span>
                <span className="text-orange-500 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                Yes, completely! Any changes you make to pricing, availability, or dish details in your secure admin dashboard update instantly on the digital menu without needing to print new QR codes.
              </div>
            </details>

            {/* Q4 */}
            <details className="group border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all duration-200 relative z-10 shadow-lg">
              <summary className="flex justify-between items-center font-bold text-white cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4">Do I need special hardware to run the kitchen console?</span>
                <span className="text-orange-500 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                No, RestDigi is designed to run on any device with a standard web browser. You can use any tablet, smartphone, laptop, or desktop computer already in your kitchen to monitor incoming orders.
              </div>
            </details>

            {/* Q5 */}
            <details className="group border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-md p-6 hover:border-orange-500/30 hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all duration-200 relative z-10 shadow-lg">
              <summary className="flex justify-between items-center font-bold text-white cursor-pointer list-none select-none">
                <span className="text-base sm:text-lg pr-4">Do you offer plans for multi-location restaurant chains?</span>
                <span className="text-orange-500 transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                Absolutely! Our Enterprise Network Plan is fully customizable for major chains and franchise systems. It features unlimited locations, dedicated hosting configurations, custom third-party POS API integrations, and direct enterprise priority support. Contact sales at support@restdigi.online to discuss custom setups.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-white/[0.01] to-white/[0.03] backdrop-blur-xl border-t border-white/10 relative z-10 overflow-hidden py-16">
        {/* Footer Ambient Glows */}
        <div className="absolute bottom-[-30%] left-[25%] w-[600px] h-[400px] rounded-full bg-orange-500/15 blur-[125px] pointer-events-none mix-blend-screen z-0"></div>
        <div className="absolute top-[-10%] right-[15%] w-[450px] h-[450px] rounded-full bg-amber-500/10 blur-[115px] pointer-events-none mix-blend-screen z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12">

            {/* Column 1 */}
            <div className="space-y-4">
              <Image
                src="/restdigi-logo.png"
                alt="RESTDIGI Logo"
                width={120}
                height={36}
                className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105 brightness-110"
                loading="lazy"
              />
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Modernizing local dining ecosystems with high-speed digital tools and interactive, glassmorphic menus.
              </p>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm tracking-wider uppercase">Product</h3>
              <ul className="space-y-3">
                <li><Link href="#features" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Pricing Tiers</Link></li>
                <li><Link href="#faq" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">FAQ</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm tracking-wider uppercase">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Privacy Policy</Link></li>
                <li><Link href="/terms-and-conditions" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Terms & Conditions</Link></li>
                <li><Link href="/refund-policy" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Cancellation & Refund</Link></li>
                <li><Link href="/contact-us" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Contact Us</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm tracking-wider uppercase">Social</h3>
              <ul className="space-y-3">
                <li><a href="https://twitter.com/restdigii" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Twitter (X)</a></li>
                <li><a href="https://instagram.com/restdigi" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">Instagram</a></li>
                <li><a href="https://www.youtube.com/@RESTDIGI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 hover:translate-x-1.5 inline-block transition-all duration-200 text-sm font-medium">YouTube</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500">
              &copy; 2026 RestDigi. All rights reserved. Crafted for premium digital dining.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Plate Micro-animations */}
      <style>{`
        .landing-glow-bg {
          background-color: #07080B;
          background-image: 
            radial-gradient(circle at 15% 8%, rgba(249, 115, 22, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 85% 22%, rgba(234, 88, 12, 0.04) 0%, transparent 45%),
            radial-gradient(circle at 20% 38%, rgba(220, 38, 38, 0.03) 0%, transparent 40%),
            radial-gradient(circle at 80% 55%, rgba(245, 158, 11, 0.04) 0%, transparent 45%),
            radial-gradient(circle at 15% 72%, rgba(249, 115, 22, 0.03) 0%, transparent 40%),
            radial-gradient(circle at 85% 88%, rgba(234, 88, 12, 0.04) 0%, transparent 45%),
            radial-gradient(circle at 50% 98%, rgba(245, 158, 11, 0.05) 0%, transparent 40%);
          background-attachment: scroll;
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes floatMid {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-3deg); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .animate-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }
        .animate-float-mid {
          animation: floatMid 6s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: floatFast 5s ease-in-out infinite;
        }
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>

    </div>
  );
}
