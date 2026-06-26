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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin');
      }
    };
    checkUser();
  }, [router]);

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
    <div className="min-h-screen bg-[#07080B] flex flex-col justify-between relative overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[#07080B]/55 backdrop-blur-[90px] pointer-events-none z-0"></div>

      {/* Vibrant Ambient Glows */}
      <div className="absolute top-[-5%] right-[5%] w-[550px] h-[550px] rounded-full bg-orange-500/15 blur-[110px] pointer-events-none mix-blend-screen z-0"></div>
      <div className="absolute top-[25%] left-[-10%] w-[650px] h-[650px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none mix-blend-screen z-0"></div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Toaster />

        <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/10 p-8 sm:p-12 animate-fade-in-up">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/restdigi-logo.png" 
                className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" 
                alt="RESTDIGI Logo" 
              />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isSubmitted ? 'Check your email' : 'Admin Portal'}
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">
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
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all font-bold text-white placeholder-gray-500"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-[#EA580C] text-white py-4 rounded-2xl font-black hover:bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {isLoading ? 'Checking...' : 'Send Login Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 animate-fade-in-up text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-orange-400 animate-pulse">
                  <Mail className="w-8 h-8" />
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Click the magic link inside the email to log in automatically. If you don't see it, check your spam folder.
              </p>
              <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMagicLink()}
                  className="text-sm font-black text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Resending...' : 'Resend Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-sm font-bold text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
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
