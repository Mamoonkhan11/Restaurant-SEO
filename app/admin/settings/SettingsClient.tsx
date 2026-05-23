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
    whatsapp_number: '',
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
          whatsapp_number: restaurant.whatsapp_number || restaurant.whatsapp || '',
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
          whatsapp_number: formData.whatsapp_number,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 relative min-h-screen">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Restaurant Settings</h1>
          <p className="mt-1 text-gray-500">Manage your brand identity and public profile.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Form */}
          <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Business Name</label>
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
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-gray-900" 
              />
            </div>



            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Restaurant Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:border-gray-400 transition-colors cursor-pointer shrink-0">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p className="font-bold text-gray-700">Upload a logo</p>
                  <p>Recommended size: 256x256px. PNG or JPG.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSaving} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Mini Preview */}
          <div className="bg-gray-100 p-8 rounded-3xl flex justify-center lg:sticky lg:top-8">
            <div className="w-[300px] h-[600px] bg-white rounded-[40px] shadow-2xl overflow-hidden border-[10px] border-gray-900 relative">
              {/* Notches */}
              <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl w-40 mx-auto z-20"></div>
              
              {/* App Header */}
              <div className="h-40 relative transition-colors duration-300 bg-white border-b border-gray-100">
                <div className="absolute bottom-6 inset-x-0 flex justify-center">
                  <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-lg">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center font-bold text-3xl text-gray-400">
                        {formData.name ? formData.name.charAt(0) : '?'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Mockup */}
              <div className="p-6 text-center">
                <h3 className="font-bold text-xl text-gray-900">{formData.name || 'Your Restaurant'}</h3>
                <p className="text-gray-500 text-sm mt-1 mb-6">Digital Menu</p>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center p-3 gap-3">
                      <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0"></div>
                      <div className="flex-1 space-y-2 text-left">
                        <div className="h-3 w-3/4 bg-gray-200 rounded-full"></div>
                        <div className="h-2 w-1/2 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
