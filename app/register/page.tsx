"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generates a URL-friendly slug from the business name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !businessName || !email) return;

    setIsLoading(true);

    // Generate a highly secure random 16-character password in the background
    const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login',
          data: {
            full_name: fullName,
            business_name: businessName
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

      if (authData.user) {
        // 2. Provision the restaurant profile in the database
        const { error: dbError } = await supabase.from('restaurants').insert({
          owner_id: authData.user.id,
          email: authData.user.email,
          name: businessName,
          slug: businessName.toLowerCase().replace(/ /g, '-')
        });

        if (dbError) {
          throw new Error(dbError.message);
        }

        // Only show success if BOTH auth and database succeed
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-md">

        {!isSubmitted ? (
          <div className="animate-fade-in-up">
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
                  className="w-full px-5 py-4 bg-transparent border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Business Name"
                  className="w-full px-5 py-4 bg-transparent border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Work Email"
                  className="w-full px-5 py-4 bg-transparent border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Account'}
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8 font-medium">
              Already have an account? <button onClick={() => router.push('/login')} className="text-black font-bold hover:underline focus:outline-none">Sign in</button>
            </p>
          </div>
        ) : (
          <div className="text-center animate-fade-in-up bg-gray-50 border border-gray-100 p-10 rounded-[2rem]">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">Check your inbox</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              Confirm your email. We sent a verification link to <br /><strong className="text-gray-900">{email}</strong>.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
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
