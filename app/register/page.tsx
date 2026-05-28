"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [basicCount, setBasicCount] = useState<number | null>(null);

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

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName || !businessName || !email) return;

    setIsLoading(true);

    const trimmedFullName = fullName.trim();
    const trimmedBusinessName = businessName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const targetSlug = trimmedBusinessName.toLowerCase().replace(/ /g, '-');

    try {
      const [emailCheck, nameCheck, slugCheck] = await Promise.all([
        supabase.from('restaurants').select('id').eq('email', trimmedEmail).limit(1),
        supabase.from('restaurants').select('id').eq('name', trimmedBusinessName).limit(1),
        supabase.from('restaurants').select('id').eq('slug', targetSlug).limit(1)
      ]);

      if (emailCheck.data && emailCheck.data.length > 0) {
        toast.error('User already exists.', {
          style: { background: '#000', color: '#fff' },
          position: 'top-center'
        });
        setIsLoading(false);
        return;
      }

      if ((nameCheck.data && nameCheck.data.length > 0) || (slugCheck.data && slugCheck.data.length > 0)) {
        toast.error('Business name or link already taken. Please try a modified name.', {
          style: { background: '#000', color: '#fff' },
          position: 'top-center'
        });
        setIsLoading(false);
        return;
      }
    } catch (checkErr) {
      console.error('Error during pre-verification:', checkErr);
    }

    const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: randomPassword,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login',
          data: {
            full_name: trimmedFullName,
            business_name: trimmedBusinessName
          }
        }
      });

      if (signUpError) {
        toast.error(signUpError.message, {
          style: { background: '#000', color: '#fff' },
          position: 'top-center'
        });
        setIsLoading(false);
        return;
      }

      if (authData.user && (!authData.user.identities || authData.user.identities.length === 0)) {
        toast.error('User already exists.', {
          style: { background: '#000', color: '#fff' },
          position: 'top-center'
        });
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        const { error: dbError } = await supabase.from('restaurants').insert({
          owner_id: authData.user.id,
          email: authData.user.email,
          name: trimmedBusinessName,
          slug: targetSlug
        });

        if (dbError) {
          throw new Error(dbError.message);
        }

        setIsSubmitted(true);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, {
        style: { background: '#000', color: '#fff' },
        duration: 5000,
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
          
          <div className="flex justify-center mb-8">
            <img src="/restdigi-logo.png" className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" alt="RESTDIGI Logo" />
          </div>

          {!isSubmitted ? (
            <div>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Create Account</h1>
                <p className="text-gray-500 font-medium">Join the future of digital menus.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-5 py-4 bg-transparent border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors font-medium text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Business Name"
                    className="w-full px-5 py-4 bg-transparent border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors font-medium text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full px-5 py-4 bg-transparent border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors font-medium text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Account'}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-gray-500 mt-8 font-medium">
                Already have an account? <button onClick={() => router.push('/login')} className="text-orange-600 font-bold hover:underline focus:outline-none">Sign in</button>
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Check your email</h1>
                <p className="text-gray-500 text-sm mt-2 font-medium">
                  We've sent a secure verification link to <strong className="text-gray-900">{email}</strong>.
                </p>
              </div>

              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 animate-pulse">
                    <Mail className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Click the verification link inside the email to confirm your account and log in automatically. If you don't see it, check your spam folder.
                </p>
                <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleRegister()}
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
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="mt-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Go to Login
                  </button>
                </div>
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
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
      `}</style>
    </div>
  );
}
