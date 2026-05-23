"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, ArrowRight, KeyRound } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Guard: If a user is already logged in, redirect them immediately to /admin
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin');
      }
    };
    checkUser();
  }, [router]);

  // Handle Countdown Timer for Resending Code
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

    // Pre-Verification Check: Ensure email is registered
    const { data: restaurants, error: dbError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('email', email)
      .limit(1);

    // If the database query errors or returns an empty array, deny access
    if (dbError || !restaurants || restaurants.length === 0) {
      toast.error('Invalid credentials. Access denied.', {
        style: { background: '#000', color: '#fff' },
        duration: 3000,
        position: 'top-center'
      });
      setIsLoading(false);
      return;
    }

    // Proceed with sending the Magic Link / OTP
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Dynamically routes back to /admin regardless of localhost or production domain
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : 'http://localhost:3000/admin',
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
      toast.success('Magic Link sent! Check your inbox.', {
        style: { background: '#000', color: '#fff' },
        duration: 5000,
        position: 'top-center'
      });
      setEmail(''); // clear the input after sending
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email', // strictly verifies the 6-digit code
    });

    if (error) {
      toast.error('Invalid or expired code. Please try again.', {
        style: { background: '#000', color: '#fff' },
        duration: 3000,
        position: 'top-center'
      });
      setIsLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <Toaster />
      
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 sm:p-12 animate-fade-in-up">
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img src="/restdigi-logo.png" className="h-10 w-auto object-contain transition-transform hover:scale-105" alt="RESTDIGI Logo" />
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
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-gray-900 placeholder-gray-400 text-center"
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
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Ensure numeric only
                placeholder="Enter 6-digit code" 
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-gray-900 placeholder-gray-400 text-center tracking-[0.5em] text-2xl"
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
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={countdown > 0 || isLoading}
                  onClick={() => handleSendOtp()}
                  className="text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:hover:text-gray-500"
                >
                  {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          </form>
        )}

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
