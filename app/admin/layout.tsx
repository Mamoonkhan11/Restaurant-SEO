"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RestaurantProvider, useRestaurant } from '@/lib/RestaurantContext';
import { useSubscription } from '@/lib/useSubscription';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { restaurant, payments, isLoading } = useRestaurant();
  const { isTrial, daysLeft, isExpired, planType } = useSubscription();
  const showExpiredOverlay = isExpired && pathname !== '/admin/billing';
  const isUrgent = daysLeft !== null && daysLeft <= 5;
  const isPromoUser = planType === 'pro' && payments && payments.some(p => p.plan_tier === 'pro' && p.payment_gateway === 'system_promo');
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [isPhoneSaving, setIsPhoneSaving] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    if (pathname === '/admin') {
      setHasSkipped(false);
    }
  }, [pathname]);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
        }
      } catch (err) {
        console.error("Auth hydration error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', paths: ['M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'] },
    { name: 'Menu Management', href: '/admin/menu', paths: ['M12 6v6m0 0v6m0-6h6m-6 0H6'] },
    { name: 'Tables', href: '/admin/tables', paths: ['M4 6h16M4 10h16M4 14h16M4 18h16'] },
    { name: 'Billing', href: '/admin/billing', paths: ['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'] },
    { name: 'Settings', href: '/admin/settings', paths: ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'] },
  ];

  useEffect(() => {
    if (!loading && !isLoading && restaurant) {
      if (restaurant.terms_accepted === false && pathname !== '/admin/setup/terms') {
        router.push('/admin/setup/terms');
      }
    }
  }, [loading, isLoading, restaurant, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (pathname === '/admin/setup/terms') {
    return (
      <div className="min-h-screen bg-[#07080B] flex flex-col justify-center items-center font-sans overflow-y-auto relative text-white">
        {/* Background Radial Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none z-0"></div>
        <div className="relative z-10 w-full flex justify-center py-8">{children}</div>
      </div>
    );
  }

  if (!isLoading && restaurant && restaurant.terms_accepted === false) {
    return null;
  }

  return (
    <div className="h-screen bg-[#07080B] flex flex-col font-sans overflow-hidden relative text-white">
      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none z-0"></div>

      {/* Vibrant Ambient Glows */}
      <div className="absolute top-[-5%] right-[5%] w-[500px] h-[500px] rounded-full bg-orange-500/8 blur-[120px] pointer-events-none mix-blend-screen z-0"></div>
      <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] rounded-full bg-amber-500/6 blur-[120px] pointer-events-none mix-blend-screen z-0"></div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/[0.02] backdrop-blur-xl border-r border-white/10 text-white/90 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-hidden`}>
          {/* Sidebar Glow */}
          <div className="absolute top-1/2 left-[-50px] -translate-y-1/2 w-48 h-96 rounded-full bg-orange-600/10 blur-[60px] pointer-events-none -z-10"></div>
          <div className="w-full flex items-center justify-center py-7 lg:py-10 border-b border-white/10 shrink-0">
            <img
              src="/restdigi-logo.png"
              alt="RESTDIGI Logo"
              className="h-12 lg:h-16 w-auto object-contain max-w-[80%] transition-transform hover:scale-105"
            />
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform ${isActive ? 'bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-[0_4px_12px_rgba(234,88,12,0.25)] scale-[1.02]' : 'text-white/70 hover:bg-white/5 hover:text-white hover:translate-x-1'}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.paths.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d}></path>)}
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 shrink-0">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-white/70 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-none cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-20 px-4 bg-white/[0.02] backdrop-blur-xl border-b border-white/10 flex justify-between items-center md:hidden z-30 shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="text-white hover:text-gray-300 focus:outline-none p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div className="flex items-center justify-center flex-1 mx-2 py-3">
              <img
                src="/restdigi-logo.png"
                alt="RESTDIGI Logo"
                className="h-9 sm:h-10 w-auto object-contain max-w-[120px] sm:max-w-[140px]"
              />
            </div>
            <div className="w-10" />
          </header>

          <div className={`flex-1 overflow-y-auto bg-transparent relative ${showExpiredOverlay ? 'blur-sm pointer-events-none' : ''}`}>
            {isTrial && daysLeft !== null && !isExpired && (
              <div className="bg-amber-500/10 text-amber-200 px-6 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-white/5 z-50 shadow-sm backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-widest text-center flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Free Trial: {daysLeft} Days Left
                </span>
                {isUrgent && (
                  <Link 
                    href="/admin/billing" 
                    className="py-1.5 px-4 text-center text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-sm bg-orange-600 text-white hover:bg-orange-700 transition-all duration-300"
                  >
                    Upgrade Now
                  </Link>
                )}
              </div>
            )}
            <Toaster />
            {children}
          </div>

          {/* Mandatory WhatsApp Number Modal Overlay (Triggered on Dashboard if whatsapp_number is missing and not skipped) */}
          {!isLoading && restaurant && !restaurant.whatsapp_number && pathname === '/admin' && !hasSkipped && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="bg-white/[0.03] backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-md w-full border border-white/10 relative overflow-hidden animate-fade-in-up">
                {/* Close Button / Skip Option */}
                <button 
                  type="button"
                  onClick={() => setHasSkipped(true)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>

                {/* Background Glows inside modal */}
                <div className="absolute top-[-10%] right-[-10%] w-48 h-48 rounded-full bg-orange-600/10 blur-[40px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 rounded-full bg-amber-500/10 blur-[40px] pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                  <div className="w-16 h-16 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight mb-2">WhatsApp Required</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    To continue using RESTDIGI, please provide a valid WhatsApp number. We use this to route live table orders and customer notifications.
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!phoneInput.trim()) {
                    toast.error('Please enter a valid number');
                    return;
                  }
                  setIsPhoneSaving(true);
                  try {
                    const { error } = await supabase
                      .from('restaurants')
                      .update({ whatsapp_number: phoneInput.trim() })
                      .eq('id', restaurant.id);
                    if (error) throw error;
                    toast.success('WhatsApp number saved!');
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to save phone number');
                  } finally {
                    setIsPhoneSaving(false);
                  }
                }} className="space-y-4 relative z-10">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="WhatsApp Number (e.g. +919876543210)"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all font-bold text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setHasSkipped(true)}
                      className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10 text-center cursor-pointer"
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      disabled={isPhoneSaving}
                      className="flex-[2] bg-gradient-to-r from-orange-600 to-red-500 text-white py-4 px-6 rounded-2xl font-bold hover:from-orange-700 hover:to-red-600 transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] flex justify-center items-center gap-2 cursor-pointer"
                    >
                      {isPhoneSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showExpiredOverlay && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <div className="bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-md w-full text-center border border-white/10 animate-fade-in-up">
                <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Subscription Expired</h2>
                <p className="text-gray-400 mb-8 text-sm leading-relaxed">Your Free Trial has Expired. Please upgrade to continue using RESTDIGI and keep your menu online.</p>
                <Link href="/admin/billing" className="block w-full bg-gradient-to-r from-orange-600 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-red-600 transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.4)]">
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RestaurantProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </RestaurantProvider>
  );
}
