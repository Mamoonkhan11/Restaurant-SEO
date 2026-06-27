"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Save, Loader2, UploadCloud, Lock } from 'lucide-react';
import { supabase, uploadDishImage, logAdminAction, broadcastMenuUpdate } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useSubscription } from '@/lib/useSubscription';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { canCustomBrand, planType } = useSubscription();
  const [formData, setFormData] = useState({
    name: '',
    planType: 'free',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [restaurantId, setRestaurantId] = useState<number | string | null>(null);
  const [hasWarnedNameChange, setHasWarnedNameChange] = useState(false);
  const originalName = useRef('');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();
        
      if (restaurant && !error) {
        setRestaurantId(restaurant.id);
        const fetchedName = restaurant.name || '';
        originalName.current = fetchedName;
        setFormData({
          name: fetchedName,
          planType: restaurant.plan_type || 'free',
        });
        setLogoPreview(restaurant.logo_url || null);
      }
      setIsLoadingSettings(false);
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Not authenticated');
      setIsSaving(false);
      return;
    }


    let finalLogoUrl = logoPreview;

    try {
      // 1. Upload Logo if a new file was selected
      if (logoFile) {
        finalLogoUrl = await uploadDishImage(logoFile, 'restaurant-logos'); 
      }

      // 2. Auto-Slug Generation & Validation
      const generatedSlug = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      if (!generatedSlug) {
        toast.error('Business name cannot be empty.');
        setIsSaving(false);
        return;
      }

      // Check for Slug Conflicts (excluding current user's restaurant)
      const { data: existingSlugData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', generatedSlug)
        .neq('owner_id', session.user.id);

      if (existingSlugData && existingSlugData.length > 0) {
        toast.error('This business name is already taken. Please try adding your city or a unique identifier.', { duration: 5000 });
        setIsSaving(false);
        return;
      }

      // 3. Update the Restaurant Profile in the database
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name: formData.name,
          slug: generatedSlug,
          logo_url: finalLogoUrl
        })
        .eq('owner_id', session.user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      
      await logAdminAction('SETTINGS_CHANGE', 'Restaurant profile updated');
      
      if (data) {
        setRestaurantId(data.id);
        // Broadcast change so live menu updates instantly (colors, logo, etc.)
        await broadcastMenuUpdate(generatedSlug);
      }

      toast.success('Settings saved successfully!', { style: { background: '#000', color: '#fff' }});
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`, { style: { background: '#000', color: '#fff' }, duration: 5000 });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080B] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 relative min-h-screen text-white">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Restaurant Settings</h1>
          <p className="mt-1 text-sm text-gray-400 font-medium">Manage your brand identity and public profile.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Form */}
          <form onSubmit={handleSave} className="bg-white/[0.03] backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-lg space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Business Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => {
                  setFormData({...formData, name: e.target.value});
                  if (!hasWarnedNameChange && e.target.value !== originalName.current && originalName.current !== '') {
                    toast('Warning: Changing your Business Name alters your URL link. Previously printed QR codes will become invalid!', { 
                      icon: '⚠️', 
                      duration: 6000,
                      style: { border: '1px solid #f59e0b', padding: '16px', color: '#92400e', background: '#fffbeb', fontWeight: 'bold' }
                    });
                    setHasWarnedNameChange(true);
                  }
                }}
                className="w-full px-5 py-4 bg-white/[0.02] border border-white/10 rounded-2xl focus:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all font-medium text-white" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Restaurant Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-white/20 transition-colors cursor-pointer shrink-0">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="text-sm text-gray-400">
                  <p className="font-bold text-white">Upload a logo</p>
                  <p>Recommended size: 256x256px. PNG or JPG.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button type="submit" disabled={isSaving} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Mini Preview */}
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl flex justify-center lg:sticky lg:top-8">
            <div className="w-[300px] h-[600px] bg-[#07080B] rounded-[40px] shadow-2xl overflow-hidden border-[10px] border-[#1c1d24] relative flex flex-col">
              {/* Notches */}
              <div className="absolute top-0 inset-x-0 h-6 bg-[#1c1d24] rounded-b-3xl w-40 mx-auto z-20"></div>

              {/* Phone Background Radial Glows */}
              <div className="absolute top-[-10%] right-[-10%] w-[180px] h-[180px] rounded-full bg-orange-600/15 blur-[25px] pointer-events-none z-0"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-[180px] h-[180px] rounded-full bg-amber-500/15 blur-[25px] pointer-events-none z-0"></div>

              {/* App Header */}
              <div className="h-44 relative bg-transparent shrink-0 flex flex-col justify-end items-center pb-4 z-10">
                <div className="w-20 h-20 bg-white/5 rounded-full p-1 border border-white/10 flex items-center justify-center overflow-hidden mb-2 relative shadow-sm">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-transparent rounded-full flex items-center justify-center font-black text-3xl text-white">
                      {formData.name ? formData.name.charAt(0) : '?'}
                    </div>
                  )}
                </div>
                <h3 className="font-black text-lg text-white leading-tight">{formData.name || 'Your Restaurant'}</h3>
                <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-white font-extrabold text-[8px] tracking-wider border border-white/10 uppercase shadow-sm">
                  Table 1
                </span>
              </div>

              {/* Content Mockup */}
              <div className="p-4 flex-1 overflow-y-auto relative z-10 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 flex items-center p-3 gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 shrink-0"></div>
                    <div className="flex-1 space-y-2 text-left">
                      <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
                      <div className="h-1.5 w-1/2 bg-white/10 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
