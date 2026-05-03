"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Loader2 } from 'lucide-react';

const DishImage = ({ src, alt, priority = false }: { src: string, alt: string, priority?: boolean }) => {
  return (
    <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 96px, 112px"
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
    </div>
  );
};

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
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gray-200">
      <style>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fadeInSlideUp 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          {restaurant?.logo_url ? (
            <div className="inline-block mb-4 p-2 bg-white rounded-full shadow-md">
               <img src={restaurant.logo_url} alt="Logo" className="w-20 h-20 rounded-full object-cover" />
            </div>
          ) : (
            <div className="inline-block mb-4 p-3 bg-white rounded-full shadow-sm">
              <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
          )}
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl mb-4" style={{ color: restaurant?.theme_color || '#111827' }}>
            {restaurant?.name || 'Our Menu'}
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            Experience our carefully curated digital menu
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for a dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Sticky Category Navigation */}
        <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-md pt-2 pb-4 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide snap-x pb-2">
            {displayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all duration-300 snap-start focus:outline-none ${
                  activeCategory === cat
                    ? 'text-white shadow-md scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={activeCategory === cat ? { backgroundColor: restaurant?.theme_color || '#111827' } : {}}
              >
                {cat === 'all' ? 'All Menu' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-16 animate-fade-in-up">
          {categories.filter(c => activeCategory === 'all' || activeCategory === c).length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 font-medium">No dishes match your search.</p>
            </div>
          ) : (
            categories.filter(c => activeCategory === 'all' || activeCategory === c).map((category) => {
              const categoryDishes = filteredDishes.filter(d => d.category === category);
              if (categoryDishes.length === 0) return null;

              return (
                <div key={category} id={category} className="scroll-mt-28">
                  <div className="mb-8">
                    <h2 
                      className="text-3xl font-extrabold text-gray-900 border-b-4 inline-block pb-2 tracking-tight"
                      style={{ borderColor: restaurant?.theme_color || '#3b82f6' }}
                    >
                      {category}
                    </h2>
                  </div>
                  <div className="space-y-6">
                    {categoryDishes.map((item, index) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleDishClick(item)}
                        className={`bg-white rounded-2xl shadow-sm transition-all duration-300 border border-gray-100 p-4 sm:p-6 flex flex-row gap-4 relative group ${item.is_available ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'opacity-60 grayscale-[40%] cursor-not-allowed'}`}
                      >
                        {item.isBestSeller && item.is_available && (
                          <div className="absolute -top-3 sm:-top-3.5 -right-2 sm:-right-4 z-10">
                            <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 tracking-wide">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                              BEST SELLER
                            </span>
                          </div>
                        )}
                        {!item.is_available && (
                          <div className="absolute -top-3 sm:-top-3.5 -right-2 sm:-right-4 z-10">
                            <span className="bg-gray-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 tracking-wide">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              SOLD OUT
                            </span>
                          </div>
                        )}

                        <DishImage src={item.image_url || `https://placehold.co/600x400/f8fafc/94a3b8?text=${encodeURIComponent(item.name)}`} alt={item.name} priority={index < 2} />

                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex justify-between items-start sm:block">
                                <h3 className={`text-lg sm:text-xl font-bold truncate transition-colors ${item.is_available ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-600'}`} style={item.is_available ? { color: restaurant?.theme_color } : {}}>
                                  {item.name}
                                </h3>
                                <div className={`text-lg sm:text-xl font-black shrink-0 sm:hidden ${item.is_available ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                  ${item.price?.toFixed(2)}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2.5">
                                {item.view_count > 0 && (
                                  <div className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-md border text-[10px] sm:text-xs font-semibold tracking-wide shadow-sm ${item.is_available ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                    <span>Ordered {(item.view_count * 0.8).toFixed(0)} times</span>
                                  </div>
                                )}
                              </div>

                              <p className="mt-2 sm:mt-3 text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <div className={`text-xl sm:text-2xl font-black shrink-0 hidden sm:block ${item.is_available ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                              ${item.price?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Deep Detail Modal Component */}
      {selectedDish && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl relative animate-slide-up sm:animate-zoom-in max-h-[90vh] flex flex-col">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedDish(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Image */}
            <div className="relative h-64 sm:h-72 w-full bg-gray-100 shrink-0">
              <Image 
                src={selectedDish.image_url || `https://placehold.co/600x400/f8fafc/94a3b8?text=${encodeURIComponent(selectedDish.name)}`}
                alt={selectedDish.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              {selectedDish.isBestSeller && (
                <div className="absolute bottom-4 left-6">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 tracking-wide">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    BEST SELLER
                  </span>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-start gap-4 mb-3">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">{selectedDish.name}</h2>
                <span className="text-3xl font-black text-gray-900 shrink-0" style={{ color: restaurant?.theme_color || '#111827' }}>
                  ${selectedDish.price?.toFixed(2)}
                </span>
              </div>
              
              {/* Formula View Tracker inside Modal */}
              <div className="flex items-center gap-2 mb-6 text-blue-700 bg-blue-50/80 border border-blue-100 px-3 py-2 rounded-xl w-fit shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Ordered {(selectedDish.view_count * 0.8).toFixed(0)} times this week
                </span>
              </div>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8">
                {selectedDish.description || "A delicious signature dish prepared with fresh ingredients and our secret house spices."}
              </p>

              {/* Nutritional Info Mockup */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase mb-1">Calories</span>
                  <span className="text-gray-900 font-black text-sm sm:text-base">~450</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase mb-1">Prep Time</span>
                  <span className="text-gray-900 font-black text-sm sm:text-base">15m</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase mb-1">Spice</span>
                  <span className="text-gray-900 font-black text-sm sm:text-base">Mild</span>
                </div>
              </div>

            </div>

            {/* CTA Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0">
              <button 
                onClick={() => {
                  const num = restaurant?.whatsapp || '';
                  const msg = `Hi! I would like to order: ${selectedDish.name} ($${selectedDish.price?.toFixed(2)})`;
                  window.open(`https://wa.me/${num.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-1"
              >
                <MessageCircle className="w-6 h-6 fill-current" />
                Order on WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
