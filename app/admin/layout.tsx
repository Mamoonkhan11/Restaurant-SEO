"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RestaurantProvider, useRestaurant } from '@/lib/RestaurantContext';
import { useSubscription } from '@/lib/useSubscription';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { restaurant, payments, isLoading } = useRestaurant();
  const { isTrial, daysLeft, isExpired, planType } = useSubscription();
  const showExpiredOverlay = isExpired && pathname !== '/admin/billing';
  const isUrgent = daysLeft !== null && daysLeft <= 5;
  const isPromoUser = planType === 'basic' && payments && payments.some(p => p.plan_type === 'basic' && (p.payment_method === 'free_trial' || p.payment_method === 'free_trier'));
  const [loading, setLoading] = useState(true);

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
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  if (!isLoading && restaurant && restaurant.terms_accepted === false) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">


      <div className="flex-1 flex overflow-hidden relative">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-gray-900/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] text-gray-300 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="w-full flex items-center justify-center py-7 lg:py-10 border-b border-gray-800/40 shrink-0">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-orange-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
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

          <div className="p-4 border-t border-gray-800 shrink-0">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-20 px-4 bg-white shadow-sm border-b border-gray-200 flex justify-between items-center md:hidden z-30 shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="text-[#111827] hover:text-black focus:outline-none p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
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

          <div className={`flex-1 overflow-y-auto bg-gray-50 relative ${showExpiredOverlay ? 'blur-sm pointer-events-none' : ''}`}>
            {isTrial && daysLeft !== null && !isExpired && (
              <div className="bg-[#FEF3C7] text-[#111827] p-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-amber-200 z-50">
                <span className="text-xs font-extrabold uppercase tracking-widest text-center">Free Trial: {daysLeft} Days Left</span>
                {isUrgent && (
                  <Link 
                    href="/admin/billing" 
                    className="py-1.5 px-3.5 text-center text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm bg-[#111827] text-white hover:bg-black transition-all duration-300 ease-in-out"
                  >
                    Upgrade Now
                  </Link>
                )}
              </div>
            )}
            {children}
          </div>

          {showExpiredOverlay && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40">
              <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-100 animate-fade-in-up">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Subscription Expired</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">Your Free Trial has Expired. Please upgrade to continue using RESTDIGI and keep your menu online.</p>
                <Link href="/admin/billing" className="block w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg">
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
