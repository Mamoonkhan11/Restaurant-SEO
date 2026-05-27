"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowRight, KeyRound } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    const { data: restaurants, error: dbError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('email', email)
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
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : 'http://localhost:3000/admin'
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
      toast.success('Login link and code sent! Check your inbox.', {
        style: { background: '#000', color: '#fff' },
        duration: 5000,
        position: 'top-center'
      });
      setStep('otp');
      setCountdown(60);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent, customOtp?: string) => {
    if (e) e.preventDefault();
    const tokenToVerify = customOtp || otp;
    if (tokenToVerify.length !== 6) return toast.error('Please enter a full 6-digit token');
    setIsLoading(true);

    try {
      console.log(" Attempting OTP verification for:", email.trim().toLowerCase());
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: tokenToVerify.trim(),
        type: 'magiclink'
      });

      if (error) {
        console.error(" OTP verification failed:", error.message);
        throw error;
      }

      if (session) {
        console.log(" OTP verification successful! Session established.");
        toast.success('Authentication successful! Routing to dashboard shortly', {
          style: { background: '#000', color: '#fff' },
          duration: 2000,
          position: 'top-center'
        });
        router.push('/admin');
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired activation OTP code.', {
        style: { background: '#000', color: '#fff' },
        duration: 3000,
        position: 'top-center'
      });
    } finally {
      setIsLoading(false);
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

          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <img src="/restdigi-logo.png" className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" alt="RESTDIGI Logo" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {step === 'email' ? 'Admin Portal' : 'Check your email'}
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              {step === 'email'
                ? 'Sign in password-free to manage your menu.'
                : `We've sent a secure login link and 6-digit code to ${email}.`}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in-up">
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
                  {isLoading ? 'Checking...' : 'Send Login Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in-up">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={async (e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    console.log(" OTP entry buffer state change. Current value:", val);
                    if (val.length === 6) {
                      console.log(" OTP reached 6 digits. Launching auto-verification payload...");
                      await handleVerifyOtp(undefined, val);
                    }
                  }}
                  className="w-full px-5 py-4 text-center tracking-[0.5em] font-mono text-2xl font-black font-semibold shadow-inner rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-[#D32F2F] transition-colors bg-[#FFF8F6]"
                  required
                />
              </div>
              <div className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                  Verify & Sign In
                </button>

                <div className="text-center pt-2 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={countdown > 0 || isLoading}
                    onClick={() => handleSendOtp()}
                    className="text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:hover:text-gray-500"
                  >
                    {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                    }}
                    className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </form>
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
