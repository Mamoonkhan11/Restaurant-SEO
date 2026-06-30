"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName || !businessName || !email || !whatsappNumber) return;

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
          emailRedirectTo: `${window.location.origin}/login`,
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
          slug: targetSlug,
          whatsapp_number: whatsappNumber.trim()
        });

        if (dbError) {
          throw new Error(dbError.message);
        }

        // Trigger welcome email in the background without blocking the UI flow
        fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: trimmedEmail,
            name: trimmedFullName,
            restaurantName: trimmedBusinessName,
          }),
        }).catch((err) => {
          console.error("Error triggering welcome email notification:", err);
        });

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
          
          <div className="flex justify-center mb-8">
            <img 
              src="/restdigi-logo.png" 
              className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" 
              alt="RESTDIGI Logo" 
            />
          </div>

          {!isSubmitted ? (
            <div>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h1>
                <p className="text-gray-400 font-medium">Join the future of digital menus.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all font-bold text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Business Name"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all font-bold text-white placeholder-gray-500"
                  />
                </div>

                 <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all font-bold text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="WhatsApp Number (e.g. +919876543210)"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all font-bold text-white placeholder-gray-500"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#EA580C] text-white py-4 rounded-2xl font-black hover:bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Account'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
                    By registering, you agree to our <a href="/terms-and-conditions" target="_blank" className="underline hover:text-gray-300">Terms & Conditions</a> and consent to receive automated operational and marketing emails from RESTDIGI.
                  </p>
                </div>
              </form>

              <p className="text-center text-sm text-gray-400 mt-8 font-medium">
                Already have an account? <button onClick={() => router.push('/login')} className="text-orange-400 font-bold hover:underline focus:outline-none cursor-pointer">Sign in</button>
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Check your email</h1>
                <p className="text-gray-400 text-sm mt-2 font-medium">
                  We've sent a secure verification link to <strong className="text-white">{email}</strong>.
                </p>
              </div>

              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-orange-400 animate-pulse">
                    <Mail className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Click the verification link inside the email to confirm your account and log in automatically. If you don't see it, check your spam folder.
                </p>
                <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleRegister()}
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
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="mt-2 text-sm font-bold text-gray-400 hover:text-gray-300 transition-colors border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
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
