"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Client-Side Middleware / Guard
  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkSession();

    // Listen for auth state changes (like logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    // 30-minute auto-logout timer to securely end the session
    const logoutTimer = setTimeout(async () => {
      await supabase.auth.signOut();
      router.push('/login');
    }, 30 * 60 * 1000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(logoutTimer);
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', paths: ['M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'] },
    { name: 'Menu Management', href: '/admin/menu', paths: ['M12 6v6m0 0v6m0-6h6m-6 0H6'] },
    { name: 'QR Code', href: '/admin/qr', paths: ['M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'] },
    { name: 'Settings', href: '/admin/settings', paths: ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Dark Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-gray-300 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-800 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
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
          <h2 className="text-xl font-bold text-white tracking-tight">QR-<span className="text-blue-500">Crave</span></h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center md:hidden z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 focus:outline-none p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4H5a2 2 0 0 0-2 2v3" />
                <path d="M16 4h3a2 2 0 0 1 2 2v3" />
                <path d="M8 20H5a2 2 0 0 1-2-2v-3" />
                <path d="M16 20h3a2 2 0 0 0 2-2v-3" />
                <path d="M7 14a5 5 0 0 1 10 0" />
                <path d="M6 14h12" />
                <path d="M12 9V7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">QR-<span className="text-blue-600">Crave</span></h2>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}
