"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Loader2, Search, Share2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to determine text contrast
const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return 'dark';
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor = hexcolor[0] + hexcolor[0] + hexcolor[1] + hexcolor[1] + hexcolor[2] + hexcolor[2];
  }
  const r = parseInt(hexcolor.substring(0, 2), 16) || 0;
  const g = parseInt(hexcolor.substring(2, 2), 16) || 0;
  const b = parseInt(hexcolor.substring(4, 2), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'dark' : 'light';
};

export default function DigitalMenu({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Deep Detail Modal State
  const [selectedDish, setSelectedDish] = useState<any>(null);

  // Size Selector State
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});

  const getDishPrice = (item: any) => {
    if (item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0) {
      const prices = Object.values(item.sizes);
      const selectedIndex = selectedSizes[item.id] || 0;
      const price = prices[selectedIndex] ?? prices[0] ?? 0;
      return Number(price).toFixed(2);
    }
    return Number(item.price ?? 0).toFixed(2);
  };

  // Dynamic SEO: Update Title and Meta Description
  useEffect(() => {
    if (restaurant && activeCategory) {
      document.title = `${activeCategory} at ${restaurant.name} | Order Online`;
      const metaDescription = document.querySelector('meta[name="description"]');
      const descText = `Explore our delicious ${activeCategory} menu at ${restaurant.name}. View prices, details, and order online via WhatsApp!`;
      if (metaDescription) {
        metaDescription.setAttribute('content', descText);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = descText;
        document.head.appendChild(meta);
      }
    }
  }, [activeCategory, restaurant]);

  useEffect(() => {
    let ownerId: string | null = null;
    let restaurantId: number | null = null;

    const updateCategories = (dishList: any[]) => {
      const uniqueCategories = Array.from(new Set(dishList.map(d => d.category || 'Uncategorized'))) as string[];
      uniqueCategories.sort((a, b) => a.localeCompare(b));
      setCategories(uniqueCategories);
      setActiveCategory(prev => {
        if (!prev && uniqueCategories.length > 0) return uniqueCategories[0];
        if (prev && !uniqueCategories.includes(prev) && uniqueCategories.length > 0) return uniqueCategories[0];
        return prev;
      });
    };

    const fetchMenu = async () => {
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', params.slug)
        .single();
        
      if (restData) {
        ownerId = restData.owner_id;
        restaurantId = restData.id;
        setRestaurant(restData);
        
        const { data: dishesData } = await supabase
          .from('dishes')
          .select('*')
          .eq('owner_id', restData.owner_id)
          .order('view_count', { ascending: false });

        if (dishesData) {
          const processedDishes = dishesData.map((d) => ({
            ...d,
            isBestSeller: (d.view_count || 0) > 60,
            view_count: d.view_count || 0
          }));
          
          setDishes(processedDishes);
          updateCategories(processedDishes);
        }
      }
      setIsLoading(false);
    };
    
    fetchMenu();

    // Native Postgres Realtime Subscriptions
    const realtimeChannel = supabase.channel(`public-data-${params.slug}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dishes' },
        (payload) => {
          setDishes(prev => {
            if (ownerId && payload.new.owner_id !== ownerId) return prev;
            const newDish = {
              ...payload.new,
              isBestSeller: (payload.new.view_count || 0) > 60,
              view_count: payload.new.view_count || 0
            };
            const newDishes = [newDish, ...prev];
            updateCategories(newDishes);
            return newDishes;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dishes' },
        (payload) => {
          setDishes(prev => {
            if (ownerId && payload.new.owner_id !== ownerId) return prev;
            const newDishes = prev.map(d => 
              d.id === payload.new.id ? {
                ...payload.new,
                isBestSeller: (payload.new.view_count || 0) > 60,
                view_count: payload.new.view_count || 0
              } : d
            );
            updateCategories(newDishes);
            
            // Sync modal if open
            setSelectedDish((currentModal: any) => {
              if (currentModal?.id === payload.new.id) {
                return payload.new.is_available ? newDishes.find(d => d.id === payload.new.id) : null;
              }
              return currentModal;
            });
            return newDishes;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'dishes' },
        (payload) => {
          setDishes(prev => {
            const newDishes = prev.filter(d => d.id !== payload.old.id);
            updateCategories(newDishes);
            
            // Close modal if deleted
            setSelectedDish((currentModal: any) => {
              if (currentModal?.id === payload.old.id) return null;
              return currentModal;
            });
            return newDishes;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'restaurants' },
        (payload) => {
          setRestaurant((prev: any) => {
            if (prev?.id === payload.new.id) {
              return { ...prev, ...payload.new };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [params.slug]);

  const handleDishClick = async (dish: any) => {
    if (!dish.is_available) return;
    
    setSelectedDish(dish);
    
    setDishes(prev => prev.map(d => 
      d.id === dish.id ? { ...d, view_count: d.view_count + 1 } : d
    ));
    
    const { error } = await supabase.rpc('increment_view_count', { dish_id: dish.id });
    if (error) {
       await supabase.from('dishes').update({ view_count: dish.view_count + 1 }).eq('id', dish.id);
    }
  };

  const handleWhatsAppShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const msg = `Check out the digital menu for ${restaurant?.name || 'this restaurant'}! Order delicious food here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const searchedDishes = dishes.filter(dish => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return dish.name.toLowerCase().startsWith(query);
  });

  const groupedDishes = searchedDishes.reduce((acc: any, dish: any) => {
    const cat = dish.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24 font-sans relative selection:bg-gray-200">
      {restaurant && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Restaurant",
                "name": restaurant.name,
                "image": restaurant.logo_url || undefined,
                "telephone": restaurant.whatsapp_number,
                "menu": typeof window !== 'undefined' ? window.location.href : '',
              },
              {
                "@context": "https://schema.org",
                "@type": "Menu",
                "name": `Digital Menu for ${restaurant.name}`,
                "hasMenuSection": Object.keys(groupedDishes).map(category => ({
                  "@type": "MenuSection",
                  "name": category,
                  "hasMenuItem": groupedDishes[category].map((dish: any) => ({
                    "@type": "MenuItem",
                    "name": dish.name,
                    "description": dish.description || undefined,
                    "image": dish.image_url || undefined,
                    "offers": {
                      "@type": "Offer",
                      "price": dish.price,
                      "priceCurrency": "INR"
                    }
                  }))
                }))
              }
            ])
          }}
        />
      )}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .theme-ring:focus { 
          outline: none !important; 
          box-shadow: 0 0 0 2px ${restaurant?.theme_color || '#000000'} !important; 
          border-color: transparent !important; 
        }
      `}</style>
      
      {/* Combined Top Header (Theme Background) */}
      <div className="pt-10 pb-12 px-4 flex flex-col items-center justify-center transition-colors duration-500 rounded-b-[40px] shadow-sm relative z-10" style={{ backgroundColor: restaurant?.theme_color || '#000000' }}>
        
        {/* Description */}
        {restaurant?.description && (
          <p className="text-xs sm:text-sm italic max-w-md text-center leading-relaxed mb-4 animate-fade-in" style={{ color: getContrastYIQ(restaurant?.theme_color || '#000000') === 'dark' ? '#4B5563' : '#E5E7EB' }}>
            {restaurant?.description}
          </p>
        )}

        {/* Address */}
        {restaurant?.address && (
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium mb-6 animate-fade-in" style={{ color: getContrastYIQ(restaurant?.theme_color || '#000000') === 'dark' ? '#4B5563' : '#E5E7EB' }}>
            <MapPin className="w-4 h-4" />
            <span>{restaurant?.address}</span>
          </div>
        )}

        {/* Logo */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-lg border-4 border-white flex items-center justify-center overflow-hidden mb-4 mt-2">
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl sm:text-5xl font-bold" style={{ color: restaurant?.theme_color || '#000000' }}>
              {restaurant?.name?.charAt(0) || 'L'}
            </span>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1" style={{ color: getContrastYIQ(restaurant?.theme_color || '#000000') === 'dark' ? '#111827' : '#FFFFFF' }}>
          {restaurant?.name || 'Restaurant Name'}
        </h1>
        <p className="text-sm sm:text-base font-medium" style={{ color: getContrastYIQ(restaurant?.theme_color || '#000000') === 'dark' ? '#4B5563' : '#E5E7EB' }}>Digital Menu</p>
      </div>

      {/* Special Offers Section */}
      {dishes.filter(d => d.is_special_offer && d.is_available).length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8 mt-12 pt-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-orange-500">✨</span> Offers for You
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
            {dishes.filter(d => d.is_special_offer && d.is_available).map(item => (
              <motion.div
                key={`offer-${item.id}`}
                onClick={() => handleDishClick(item)}
                className="min-w-[260px] max-w-[260px] bg-white rounded-3xl p-3 flex gap-3 shadow-sm border border-orange-100 relative overflow-visible snap-center cursor-pointer hover:shadow-md transition-all shrink-0"
              >
                <div className="w-20 h-20 rounded-2xl bg-gray-100 shrink-0 overflow-hidden relative">
                  <img src={item.image_url || `https://placehold.co/400x400/e2e8f0/94a3b8?text=${encodeURIComponent(item.name.charAt(0))}`} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                  <h3 className="text-base font-bold text-gray-900 truncate">{item.name}</h3>
                  <span className="text-sm font-black text-gray-900 mt-1 block">
                    ₹{getDishPrice(item)}
                  </span>
                </div>
                {item.offer_tag && (
                  <div 
                    className="absolute z-[50] -bottom-[10px] -right-[8px] -rotate-[3deg] whitespace-nowrap font-black text-[10px] sm:text-xs text-white px-3 py-1.5 shadow-xl border-2 border-white"
                    style={{
                      backgroundColor: restaurant?.theme_color || '#f97316',
                      borderRadius: '12px 4px 12px 4px'
                    }}
                  >
                    {item.offer_tag}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-6 mt-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-black transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-14 pr-10 py-4 sm:py-5 text-sm sm:text-base bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 theme-ring transition-all shadow-sm font-medium"
            placeholder="Search for a dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Jump Bar */}
      {categories.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8 mt-2 sticky top-0 z-40 bg-gray-50/95 backdrop-blur-md py-3 shadow-sm border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide snap-x">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  const el = document.getElementById(`category-${cat}`);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 snap-start focus:outline-none shadow-sm ${
                  activeCategory === cat
                    ? 'text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                style={activeCategory === cat ? { backgroundColor: restaurant?.theme_color || '#000000' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu List by Categories */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12">
        {Object.keys(groupedDishes).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium sm:text-lg">No dishes found matching your search.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const categoryDishes = groupedDishes[cat];
            if (!categoryDishes || categoryDishes.length === 0) return null;
            
            return (
              <div key={cat} id={`category-${cat}`} className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 sticky top-[5rem] sm:top-[5.5rem] bg-gray-50/95 backdrop-blur-sm py-2 z-30">
                  {cat}
                </h2>
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
                  {categoryDishes.map((item: any, index: number) => (
                  <motion.div 
                    layoutId={`dish-${item.id}`}
                    key={item.id} 
                    onClick={() => handleDishClick(item)}
                    className={`bg-white rounded-3xl p-4 sm:p-5 flex flex-row gap-4 items-center relative group cursor-pointer hover:shadow-md transition-shadow shadow-sm border border-gray-100 ${!item.is_available ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    {/* Image */}
                    <motion.div layoutId={`dish-image-${item.id}`} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-100 shrink-0 overflow-hidden relative">
                      <img 
                        src={item.image_url || `https://placehold.co/400x400/e2e8f0/94a3b8?text=${encodeURIComponent(item.name.charAt(0))}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                      <motion.h3 layoutId={`dish-title-${item.id}`} className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        {item.name}
                      </motion.h3>
                      {item.description && (
                        <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      
                      {item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0 ? (
                        <div className="mt-3">
                          <motion.span layoutId={`dish-price-${item.id}`} className="text-base sm:text-lg font-black text-gray-900 block mb-2">
                            ₹{getDishPrice(item)}
                          </motion.span>
                          <div className="flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                            {Object.entries(item.sizes).map(([label, _price], i: number) => {
                              const isSelected = (selectedSizes[item.id] || 0) === i;
                              return (
                                <button
                                  key={i}
                                  onClick={() => setSelectedSizes({ ...selectedSizes, [item.id]: i })}
                                  className={`px-3 py-1.5 text-[11px] uppercase tracking-wide font-bold rounded-xl transition-all ${isSelected ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <motion.span layoutId={`dish-price-${item.id}`} className="text-base sm:text-lg font-black text-gray-900 mt-2 block">
                          ₹{getDishPrice(item)}
                        </motion.span>
                      )}
                    </div>

                    {item.is_special_offer && item.offer_tag && item.is_available && (
                      <div className="absolute top-0 right-0 rounded-bl-3xl rounded-tr-3xl bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 shadow-sm flex items-center gap-1 tracking-wider z-10 uppercase">
                        {item.offer_tag}
                      </div>
                    )}
                    {item.isBestSeller && !item.is_special_offer && item.is_available && (
                      <div className="absolute top-0 right-0 rounded-bl-3xl rounded-tr-3xl bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 shadow-sm flex items-center gap-1 tracking-wider z-10 uppercase">
                        Bestseller
                      </div>
                    )}
                    {!item.is_available && (
                      <div className="absolute top-0 right-0 rounded-bl-3xl rounded-tr-3xl bg-gray-700 text-white text-[10px] font-black px-3 py-1.5 shadow-sm flex items-center gap-1 tracking-wider z-10 uppercase">
                        Out of stock
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Floating WhatsApp Share Button */}
      <button 
        onClick={handleWhatsAppShare}
        className="fixed bottom-14 right-4 sm:right-8 bg-[#25D366] text-white px-5 h-14 rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-transform z-40 font-bold"
      >
        <Share2 className="w-5 h-5" />
        <span className="text-sm tracking-wide">Share Menu</span>
      </button>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 inset-x-0 h-10 bg-[#FDFBF7]/90 backdrop-blur-sm border-t border-gray-200 flex items-center justify-center z-30">
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <div className="w-4 h-4 bg-gray-400 rounded flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4H5a2 2 0 0 0-2 2v3" />
              <path d="M16 4h3a2 2 0 0 1 2 2v3" />
              <path d="M8 20H5a2 2 0 0 1-2-2v-3" />
              <path d="M16 20h3a2 2 0 0 0 2-2v-3" />
              <path d="M7 14a5 5 0 0 1 10 0" />
              <path d="M6 14h12" />
              <path d="M12 9V7" />
            </svg>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Powered by QR-Crave
          </p>
        </div>
      </div>
      {/* Deep Detail Organic Full-Screen Expansion (Retained) */}
      <AnimatePresence>
        {selectedDish && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDish(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-6">
              <motion.div
                layoutId={`dish-${selectedDish.id}`}
                className="bg-white w-full h-[85vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-[2rem] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl pointer-events-auto"
              >
                <button 
                  onClick={() => setSelectedDish(null)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/50 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div layoutId={`dish-image-${selectedDish.id}`} className="relative h-64 sm:h-80 w-full bg-gray-100 shrink-0">
                  <img 
                    src={selectedDish.image_url || `https://placehold.co/600x400/e2e8f0/94a3b8?text=${encodeURIComponent(selectedDish.name)}`}
                    alt={selectedDish.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                </motion.div>

                <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <motion.h2 layoutId={`dish-title-${selectedDish.id}`} className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                      {selectedDish.name}
                    </motion.h2>
                    <motion.span layoutId={`dish-price-${selectedDish.id}`} className="text-2xl sm:text-3xl font-black text-gray-900 shrink-0">
                      ₹{getDishPrice(selectedDish)}
                    </motion.span>
                  </div>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8"
                  >
                    {selectedDish.description || "Prepared with fresh ingredients and our secret house spices."}
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 sm:p-6 border-t border-gray-100 bg-white shrink-0"
                >
                  <button 
                    onClick={() => {
                      const msg = `Hi! I'm checking whether this item is available for home delivery: ${selectedDish.name} (₹${getDishPrice(selectedDish)})`;
                      window.open(`https://wa.me/${restaurant?.whatsapp_number?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Order on WhatsApp
                  </button>
                </motion.div>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
