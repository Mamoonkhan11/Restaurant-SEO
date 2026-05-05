"use client";
import React, { useState, useEffect } from 'react';
import { Save, Loader2, UploadCloud } from 'lucide-react';
import { supabase, uploadDishImage } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    themeColor: '#000000',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [restaurantId, setRestaurantId] = useState<number | string | null>(null);

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
        setFormData({
          name: restaurant.name || '',
          whatsapp: restaurant.whatsapp || '',
          themeColor: restaurant.theme_color || '#000000',
        });
        setLogoPreview(restaurant.logo_url || null);
      }
      setIsLoading(false);
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

      // 2. Prepare payload for upsert
      const payload: any = {
        name: formData.name,
        whatsapp: formData.whatsapp,
        theme_color: formData.themeColor,
        logo_url: finalLogoUrl,
        owner_id: session.user.id
      };

      if (restaurantId) {
        payload.id = restaurantId;
      } else {
        // Create slug if new restaurant
        payload.slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      // 3. Upsert the Restaurant Profile in the database
      const { data, error } = await supabase
        .from('restaurants')
        .upsert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      
      if (data) {
        setRestaurantId(data.id);
      }

      toast.success('Settings saved successfully!', { style: { background: '#000', color: '#fff' }});
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`, { style: { background: '#000', color: '#fff' }, duration: 5000 });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Restaurant Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Ordering Number</label>
              <input 
                type="text" 
                value={formData.whatsapp} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="+1 234 567 8900"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Brand Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">
                      {formData.name ? formData.name.charAt(0) : '?'}
                    </span>
                  )}
                </div>
                <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  Upload New
                  <input type="file" className="sr-only" onChange={handleLogoUpload} accept="image/*" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Primary Theme Color</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={formData.themeColor} 
                  onChange={e => setFormData({...formData, themeColor: e.target.value})}
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                />
                <span className="font-mono text-gray-500 font-medium uppercase">{formData.themeColor}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70">
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
              <div className="h-48 relative transition-colors duration-300" style={{ backgroundColor: formData.themeColor }}>
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

              {/* Floating WhatsApp Mock */}
              <div className="absolute bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
