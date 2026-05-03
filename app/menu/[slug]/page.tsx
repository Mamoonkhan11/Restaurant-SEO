"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DigitalMenu({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Deep Detail Modal State
  const [selectedDish, setSelectedDish] = useState<any>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      // 1. Fetch Restaurant Details
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', params.slug)
        .single();
        
      if (restData) {
        setRestaurant(restData);
        
        // 2. Fetch all dishes for this owner
        const { data: dishesData } = await supabase
          .from('dishes')
          .select('*')
          .eq('owner_id', restData.owner_id)
          .order('view_count', { ascending: false });

        if (dishesData && dishesData.length > 0) {
          // Add dynamic isBestSeller flag to top 3 items
          const processedDishes = dishesData.map((d, index) => ({
            ...d,
            isBestSeller: index < 3 && (d.view_count || 0) > 0,
            view_count: d.view_count || 0
          }));
          
          setDishes(processedDishes);

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(processedDishes.map(d => d.category).filter(Boolean)));
          setCategories(uniqueCategories as string[]);
        }
      }
      setIsLoading(false);
    };
    
    fetchMenu();
  }, [params.slug]);

  const handleDishClick = async (dish: any) => {
    if (!dish.is_available) return; // Prevent opening sold out items
    
    setSelectedDish(dish);
    
    // Optimistically increment view_count in UI
    setDishes(prev => prev.map(d => 
      d.id === dish.id ? { ...d, view_count: d.view_count + 1 } : d
    ));
    
    // Increment tracking in Database
    // Uses RPC if available, fallback to update
    const { error } = await supabase.rpc('increment_view_count', { dish_id: dish.id });
    if (error) {
       await supabase.from('dishes').update({ view_count: dish.view_count + 1 }).eq('id', dish.id);
    }
  };

  const filteredDishes = dishes.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayCategories = ['all', ...categories];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-gray-200">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Centered Hero Header */}
      <div className="pt-10 pb-6 px-4 flex flex-col items-center text-center">
        {restaurant?.logo_url ? (
          <img src={restaurant.logo_url} alt="Logo" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md border-2 border-gray-100 mb-4" />
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black text-white flex items-center justify-center font-bold text-4xl shadow-md border-2 border-gray-100 mb-4">
            {restaurant?.name?.charAt(0) || 'R'}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {restaurant?.name || 'Our Menu'}
        </h1>
        {restaurant?.description && (
          <p className="mt-2 text-gray-500 font-medium text-sm max-w-sm mx-auto">{restaurant.description}</p>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-md pt-4 pb-2 px-4 sm:px-6 border-b border-gray-100/50">
          <div className="relative shadow-sm rounded-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for a dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
          </div>
        </div>

        {/* Horizontal Scrolling Pill Filters */}
        <div className="px-4 sm:px-6 mb-10 flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide snap-x pb-2">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 snap-start focus:outline-none shadow-sm border ${
                activeCategory === cat
                  ? 'bg-black text-white border-black scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-black hover:text-white hover:border-black'
              }`}
            >
              {cat === 'all' ? 'All Menu' : cat}
            </button>
          ))}
        </div>

        {/* Menu Sections */}
        <div className="space-y-12 px-4 sm:px-6">
          {categories.filter(c => activeCategory === 'all' || activeCategory === c).length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 font-medium">No dishes match your search.</p>
            </div>
          ) : (
            categories.filter(c => activeCategory === 'all' || activeCategory === c).map((category) => {
              const categoryDishes = filteredDishes.filter(d => d.category === category);
              if (categoryDishes.length === 0) return null;

              return (
                <div key={category} id={category} className="scroll-mt-32">
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                      {category}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categoryDishes.map((item, index) => (
                      <motion.div 
                        layoutId={`dish-${item.id}`}
                        key={item.id} 
                        onClick={() => handleDishClick(item)}
                        className={`bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-3 sm:p-4 flex flex-row gap-4 relative group cursor-pointer overflow-hidden ${!item.is_available ? 'opacity-60 grayscale-[40%] cursor-not-allowed' : ''}`}
                      >
                        {item.isBestSeller && item.is_available && (
                          <div className="absolute top-0 right-0 rounded-bl-xl bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1 shadow-sm flex items-center gap-1 tracking-wide z-10">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            BEST SELLER
                          </div>
                        )}
                        {!item.is_available && (
                          <div className="absolute top-0 right-0 rounded-bl-xl bg-gray-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1 shadow-sm flex items-center gap-1.5 tracking-wide z-10">
                            SOLD OUT
                          </div>
                        )}

                        <motion.div layoutId={`dish-image-${item.id}`} className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100">
                          <Image 
                            src={item.image_url || `https://placehold.co/600x400/f8fafc/94a3b8?text=${encodeURIComponent(item.name)}`}
                            alt={item.name}
                            fill
                            className="object-cover"
                            priority={index < 4}
                          />
                        </motion.div>

                        <div className="flex-1 flex flex-col py-1 min-w-0 justify-center">
                          <motion.h3 layoutId={`dish-title-${item.id}`} className="text-lg font-bold truncate text-gray-900 group-hover:text-black transition-colors">
                            {item.name}
                          </motion.h3>
                          <p className="mt-1 text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                          <div className="mt-auto pt-2 flex items-center justify-between">
                            <motion.span layoutId={`dish-price-${item.id}`} className="text-lg font-black text-gray-900">
                              ${item.price?.toFixed(2)}
                            </motion.span>
                            {item.view_count > 0 && item.is_available && (
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                Hot 🔥
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center pb-8 px-4">
          <p className="text-xs text-gray-400 font-medium">
            Powered by <span className="font-bold text-gray-500">Restaurant SEO</span>
          </p>
        </div>
      </div>

      {/* Deep Detail Organic Full-Screen Expansion */}
      <AnimatePresence>
        {selectedDish && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDish(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm cursor-pointer"
            />

            {/* Expanded Card */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-6">
              <motion.div
                layoutId={`dish-${selectedDish.id}`}
                className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-[2rem] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl pointer-events-auto"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedDish(null)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/50 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Hero Image */}
                <motion.div layoutId={`dish-image-${selectedDish.id}`} className="relative h-72 sm:h-80 w-full bg-gray-100 shrink-0">
                  <Image 
                    src={selectedDish.image_url || `https://placehold.co/600x400/f8fafc/94a3b8?text=${encodeURIComponent(selectedDish.name)}`}
                    alt={selectedDish.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {selectedDish.isBestSeller && (
                    <div className="absolute bottom-6 left-6 z-10">
                      <span className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 tracking-wide">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        BEST SELLER
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Content Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <motion.h2 layoutId={`dish-title-${selectedDish.id}`} className="text-3xl font-black text-gray-900 leading-tight">
                      {selectedDish.name}
                    </motion.h2>
                    <motion.span layoutId={`dish-price-${selectedDish.id}`} className="text-3xl font-black text-gray-900 shrink-0">
                      ${selectedDish.price?.toFixed(2)}
                    </motion.span>
                  </div>
                  
                  {/* Stats Row */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center gap-3 mb-6"
                  >
                    <div className="flex items-center text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      <span className="ml-1.5 text-sm font-bold text-yellow-700">4.9</span>
                    </div>
                    {selectedDish.view_count > 0 && (
                      <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Ordered {(selectedDish.view_count * 0.8).toFixed(0)} times
                        </span>
                      </div>
                    )}
                  </motion.div>

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-600 text-base leading-relaxed mb-8"
                  >
                    {selectedDish.description || "A delicious signature dish prepared with fresh ingredients and our secret house spices."}
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Calories</span>
                      <span className="text-gray-900 font-black text-sm">~450</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Prep Time</span>
                      <span className="text-gray-900 font-black text-sm">15m</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Spice</span>
                      <span className="text-gray-900 font-black text-sm">Mild</span>
                    </div>
                  </motion.div>
                </div>

                {/* Footer Action */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 sm:p-6 border-t border-gray-100 bg-white shrink-0"
                >
                  <button 
                    onClick={() => {
                      const num = restaurant?.whatsapp || '';
                      const msg = `Hi! I would like to order: ${selectedDish.name} ($${selectedDish.price?.toFixed(2)})`;
                      window.open(`https://wa.me/${num.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full bg-black hover:bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
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
