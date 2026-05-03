"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DigitalMenu({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Deep Detail Modal State
  const [selectedDish, setSelectedDish] = useState<any>(null);

  useEffect(() => {
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

        if (dishesData && dishesData.length > 0) {
          const processedDishes = dishesData.map((d, index) => ({
            ...d,
            isBestSeller: index < 3 && (d.view_count || 0) > 0,
            view_count: d.view_count || 0
          }));
          
          setDishes(processedDishes);

          const uniqueCategories = Array.from(new Set(processedDishes.map(d => d.category).filter(Boolean)));
          setCategories(uniqueCategories as string[]);
        }
      }
      setIsLoading(false);
    };
    
    fetchMenu();
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

  const handleWhatsAppClick = () => {
    const num = restaurant?.whatsapp || '';
    const msg = `Hi! I'm looking at your digital menu.`;
    window.open(`https://wa.me/${num.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const displayCategories = ['all', ...categories];
  const filteredDishes = activeCategory === 'all' 
    ? dishes 
    : dishes.filter(d => d.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans relative selection:bg-gray-200">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Top Section: Black Header */}
      <div className="h-40 sm:h-48 bg-black relative">
        {/* Central Circular Logo overlapping the bottom */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl sm:text-5xl font-bold text-black">
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

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="max-w-xl mx-auto px-4 mb-6">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide snap-x pb-2">
            {displayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 snap-start focus:outline-none shadow-sm ${
                  activeCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu List */}
      <div className="max-w-xl mx-auto px-4 space-y-3 sm:space-y-4">
        {filteredDishes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No dishes available.</p>
          </div>
        ) : (
          filteredDishes.map((item, index) => (
            <motion.div 
              layoutId={`dish-${item.id}`}
              key={item.id} 
              onClick={() => handleDishClick(item)}
              className={`bg-gray-100 rounded-2xl p-3 sm:p-4 flex flex-row gap-4 items-center relative group cursor-pointer hover:bg-gray-200 transition-colors ${!item.is_available ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              {/* Square Image Placeholder / Actual Image */}
              <motion.div layoutId={`dish-image-${item.id}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-200 shrink-0 overflow-hidden relative shadow-sm">
                <Image 
                  src={item.image_url || `https://placehold.co/400x400/e2e8f0/94a3b8?text=${encodeURIComponent(item.name.charAt(0))}`}
                  alt={item.name}
                  fill
                  className="object-cover"
                  priority={index < 5}
                />
              </motion.div>

              {/* Skeleton-style 2-3 lines of Info */}
              <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                <motion.h3 layoutId={`dish-title-${item.id}`} className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {item.name}
                </motion.h3>
                {item.description && (
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5 line-clamp-1 sm:line-clamp-2">
                    {item.description}
                  </p>
                )}
                <motion.span layoutId={`dish-price-${item.id}`} className="text-sm sm:text-base font-black text-gray-900 mt-1.5 block">
                  ₹{item.price?.toFixed(2)}
                </motion.span>
              </div>

              {item.isBestSeller && item.is_available && (
                <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-2xl bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 shadow-sm flex items-center gap-1 tracking-wider z-10">
                  HOT
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Floating WhatsApp Button */}
      <button 
        onClick={handleWhatsAppClick}
        className="fixed bottom-14 right-4 sm:right-8 bg-[#25D366] text-white w-14 h-14 rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 inset-x-0 h-10 bg-gray-50/90 backdrop-blur-sm border-t border-gray-200 flex items-center justify-center z-30">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          Powered by RestoOS
        </p>
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
                  <Image 
                    src={selectedDish.image_url || `https://placehold.co/600x400/e2e8f0/94a3b8?text=${encodeURIComponent(selectedDish.name)}`}
                    alt={selectedDish.name}
                    fill
                    className="object-cover"
                    priority
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
                      const num = restaurant?.whatsapp || '';
                      const msg = `Hi! I would like to order: ${selectedDish.name} (₹${selectedDish.price?.toFixed(2)})`;
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
