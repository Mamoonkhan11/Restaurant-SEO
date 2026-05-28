"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowRight, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [basicCount, setBasicCount] = useState<number | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin');
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('plan_type', 'basic');
      if (count !== null) {
        setBasicCount(count);
      }
    };
    fetchCount();
  }, []);

  const handleSendMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    const { data: restaurants, error: dbError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .limit(1);

    if (dbError || !restaurants || restaurants.length === 0) {
      toast.error('Invalid credentials. Access denied.', {
        style: { background: '#000', color: '#fff' },
        duration: 3000,
        position: 'top-center'
      });
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/admin`
      }
    });

    setIsLoading(false);

    if (authError) {
      toast.error(authError.message, {
        style: { background: '#000', color: '#fff' },
        duration: 3000,
        position: 'top-center'
      });
    } else {
      toast.success('Magic login link sent! Check your inbox.', {
        style: { background: '#000', color: '#fff' },
        duration: 5000,
        position: 'top-center'
      });
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {basicCount !== null && basicCount < 5 && (
        <div className="bg-[#FEF3C7] text-[#111827] p-3.5 text-center text-xs font-bold uppercase tracking-widest border-b border-amber-200 w-full shrink-0 z-50">
          First 5 Registered Businesses Get 1 Month Free! (Basic Tier)
        </div>
      )}
      <div className="flex-1 flex items-center justify-center p-4">
        <Toaster />

        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 sm:p-12 animate-fade-in-up">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img src="/restdigi-logo.png" className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" alt="RESTDIGI Logo" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isSubmitted ? 'Check your email' : 'Admin Portal'}
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              {isSubmitted
                ? `We've sent a secure login link to ${email}.`
                : 'Sign in password-free to manage your menu.'}
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSendMagicLink} className="space-y-5 animate-fade-in-up">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-gray-900 placeholder-gray-400"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {isLoading ? 'Checking...' : 'Send Login Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 animate-fade-in-up text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 animate-pulse">
                  <Mail className="w-8 h-8" />
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Click the magic link inside the email to log in automatically. If you don't see it, check your spam folder.
              </p>
              <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMagicLink()}
                  className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Resending...' : 'Resend Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Change Email
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in-up { 
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
      `}</style>
    </div>
  );
}
