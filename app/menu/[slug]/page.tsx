"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Loader2, Search, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DigitalMenu({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Deep Detail Modal State
  const [selectedDish, setSelectedDish] = useState<any>(null);

  useEffect(() => {
    let broadcastSubscription: any;

    const fetchMenu = async () => {
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', params.slug)
        .single();
        
      if (restData) {
        setRestaurant(restData);
        
        const { data: dishesData } = await supabase
          .from('dishes')
          .select('*')
          .eq('owner_id', restData.owner_id)
          .order('view_count', { ascending: false });

        if (dishesData) {
          const processedDishes = dishesData.map((d, index) => ({
            ...d,
            isBestSeller: (d.view_count || 0) > 60,
            view_count: d.view_count || 0
          }));
          
          setDishes(processedDishes);

          const uniqueCategories = Array.from(new Set(processedDishes.map(d => d.category || 'Uncategorized'))) as string[];
          uniqueCategories.sort((a, b) => a.localeCompare(b));
          setCategories(uniqueCategories);
          if (uniqueCategories.length > 0 && !activeCategory) {
            setActiveCategory(uniqueCategories[0]);
          }

          // Sync open modal if the item was updated (e.g. out of stock)
          setSelectedDish((prev: any) => {
            if (!prev) return null;
            const updated = processedDishes.find(d => d.id === prev.id);
            if (!updated || !updated.is_available) return null;
            return updated;
          });
        }

        // Setup explicit real-time broadcast subscription for instant updates
        if (!broadcastSubscription) {
          broadcastSubscription = supabase
            .channel(`menu-updates-${params.slug}`)
            .on('broadcast', { event: 'refresh-menu' }, () => {
              console.log('Real-time update received! Refreshing menu...');
              fetchMenu();
            })
            .subscribe();
        }
      }
      setIsLoading(false);
    };
    
    fetchMenu();

    return () => {
      if (broadcastSubscription) supabase.removeChannel(broadcastSubscription);
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
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .theme-ring:focus { 
          outline: none !important; 
          box-shadow: 0 0 0 2px ${restaurant?.theme_color || '#000000'} !important; 
          border-color: transparent !important; 
        }
      `}</style>
      
      {/* Top Section: Theme Header */}
      <div className="h-40 sm:h-48 relative transition-colors duration-500" style={{ backgroundColor: restaurant?.theme_color || '#000000' }}>
        {/* Central Circular Logo overlapping the bottom */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl sm:text-5xl font-bold transition-colors duration-500" style={{ color: restaurant?.theme_color || '#000000' }}>
                {restaurant?.name?.charAt(0) || 'L'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-16 pb-6 text-center px-4 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {restaurant?.name || 'Restaurant Name'}
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mt-1 font-medium">Digital Menu</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto px-4 mb-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 theme-ring transition-all shadow-sm font-medium"
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
        <div className="max-w-xl mx-auto px-4 mb-6 sticky top-0 z-40 bg-gray-50/95 backdrop-blur-md py-3 shadow-sm border-b border-gray-200">
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
      <div className="max-w-xl mx-auto px-4 space-y-10">
        {Object.keys(groupedDishes).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No dishes found matching your search.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const categoryDishes = groupedDishes[cat];
            if (!categoryDishes || categoryDishes.length === 0) return null;
            
            return (
              <div key={cat} id={`category-${cat}`} className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 sticky top-[4.5rem] bg-gray-50/95 backdrop-blur-sm py-2 z-30">
                  {cat}
                </h2>
                <div className="space-y-4">
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
                      <motion.span layoutId={`dish-price-${item.id}`} className="text-base sm:text-lg font-black text-gray-900 mt-2 block">
                        ₹{item.price?.toFixed(2)}
                      </motion.span>
                    </div>

                    {item.isBestSeller && item.is_available && (
                      <div className="absolute top-0 right-0 rounded-bl-3xl rounded-tr-3xl bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 shadow-sm flex items-center gap-1 tracking-wider z-10 uppercase">
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
                      ₹{selectedDish.price?.toFixed(2)}
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
                      const num = restaurant?.whatsapp_number || restaurant?.whatsapp || '';
                      const msg = `Hi! I'm checking whether this item is available for home delivery: ${selectedDish.name} (₹${selectedDish.price?.toFixed(2)})`;
                      window.open(`https://wa.me/${num.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
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
