"use client";
import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Link as LinkIcon, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Playfair_Display, Montserrat } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function QRCodePage() {
  const [color, setColor] = useState('#0f172a');
  const [restaurantName, setRestaurantName] = useState('...');
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('name, slug, logo_url, theme_color')
        .eq('owner_id', session.user.id)
        .single();
        
      if (restaurant && !error) {
        setRestaurantName(restaurant.name || 'Your Restaurant');
        setRestaurantSlug(restaurant.slug || '');
        setLogoUrl(restaurant.logo_url || null);
        if (restaurant.theme_color) {
          setColor(restaurant.theme_color);
        }
      }
      setIsLoading(false);
    };

    fetchRestaurantData();
  }, []);

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${restaurantSlug}` : `https://your-domain.com/menu/${restaurantSlug}`;

  const downloadHighResQR = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pngDataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.download = `${restaurantSlug}-table-stand-print.png`;
      downloadLink.href = pngDataUrl;
      downloadLink.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Failed to generate high-resolution image.');
    } finally {
      setIsExporting(false);
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Download QR Code</h1>
          <p className="mt-1 text-gray-500">Export a branded, high-resolution QR code for your tables.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Controls Section (Left Side - 5 columns) */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 sticky top-8">
            
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Configuration</h3>
              <div className="space-y-6">
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Theme Color</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)} 
                      className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                    />
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-700 transition-all" 
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Go to Settings to permanently update your brand color and logo.</p>
                </div>

              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="bg-gray-50 px-4 py-3 rounded-xl flex items-center justify-between mb-6 overflow-hidden">
                <div className="flex items-center gap-2 text-gray-500 truncate mr-4">
                  <LinkIcon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium truncate">{publicUrl}</span>
                </div>
              </div>
              <button 
                onClick={downloadHighResQR} 
                disabled={isExporting}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? 'Generating PNG...' : 'Download QR as PNG'}
              </button>
            </div>
          </div>

          {/* Preview Section (Right Side - 7 columns) */}
          <div className="lg:col-span-7 bg-gray-100 p-8 rounded-3xl flex items-center justify-center relative overflow-hidden min-h-[600px] border border-gray-200 inset-shadow">
            
            {/* The Print Container (Target for html2canvas) */}
            <div 
              ref={printRef}
              className="bg-white w-[400px] h-[600px] relative shadow-2xl flex flex-col justify-between overflow-hidden group transition-transform hover:scale-105 duration-500"
              style={{
                // Subtle sophisticated gradient
                background: 'linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%)'
              }}
            >
              {/* Subtle top accent bar */}
              <div className="h-2 w-full transition-colors duration-300" style={{ backgroundColor: color }}></div>

              {/* Header / Logo Area */}
              <div className="pt-12 px-8 text-center flex flex-col items-center">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={restaurantName} 
                    crossOrigin="anonymous"
                    className="h-20 object-contain drop-shadow-md mb-6" 
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border border-gray-100 shadow-sm flex items-center justify-center mb-6" style={{ color: color }}>
                    <span className={`text-4xl font-bold ${playfair.className}`}>{restaurantName.charAt(0)}</span>
                  </div>
                )}
                
                <h2 className={`text-2xl text-gray-900 leading-snug tracking-wide ${playfair.className}`}>
                  {restaurantName}
                </h2>
              </div>

              {/* Center / QR Code Area */}
              <div className="flex-1 flex flex-col justify-center items-center px-12">
                <div 
                  className="p-6 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] transition-colors duration-300 relative"
                  style={{ border: `1px solid ${color}20` }}
                >
                  <QRCodeSVG 
                    value={publicUrl} 
                    size={200} 
                    fgColor={color} 
                    bgColor="#ffffff"
                    level="H"
                    includeMargin={false}
                    imageSettings={
                      logoUrl ? {
                        src: logoUrl,
                        height: 48,
                        width: 48,
                        excavate: true,
                      } : undefined
                    }
                  />

                  {/* Absolute HTML Image Overlay to fix html2canvas nested SVG bug */}
                  {logoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img 
                        src={logoUrl} 
                        crossOrigin="anonymous" 
                        className="w-[48px] h-[48px] object-contain bg-white rounded-sm" 
                        alt="Center Logo"
                      />
                    </div>
                  )}

                  {/* Small decorative corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-xl m-2 transition-colors duration-300" style={{ borderColor: color }}></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-xl m-2 transition-colors duration-300" style={{ borderColor: color }}></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-xl m-2 transition-colors duration-300" style={{ borderColor: color }}></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-xl m-2 transition-colors duration-300" style={{ borderColor: color }}></div>
                </div>
              </div>

              {/* Footer / CTA Area */}
              <div className="pb-12 px-8 text-center">
                <p className={`text-gray-400 uppercase tracking-[0.2em] text-xs font-semibold mb-3 ${montserrat.className}`}>
                  Contactless Dining
                </p>
                <h3 className={`text-[28px] text-gray-900 leading-none ${playfair.className}`} style={{ color: color }}>
                  Scan for Digital Menu
                </h3>
              </div>

            </div>

            {/* Background Decorative Elements */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/50 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/50 rounded-full blur-3xl pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
