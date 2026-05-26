"use client";
import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Loader2, Search, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MenuHeader = React.memo(({ restaurant, menuBlocked }: { restaurant: any, menuBlocked: boolean }) => (
  <div className="pt-8 pb-6 px-4 flex flex-col items-center justify-center bg-[#F9FAFB] relative z-10">
    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full border border-gray-100 flex items-center justify-center overflow-hidden mb-3 relative shadow-sm">
      {restaurant?.logo_url ? (
        <img 
          src={restaurant.logo_url} 
          alt="Logo" 
          className="w-full h-full object-cover" 
          key={restaurant.logo_url} 
        />
      ) : (
        <span className="text-3xl font-black text-[#111827]">
          {restaurant?.name?.charAt(0) || 'L'}
        </span>
      )}
    </div>
    <h1 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight text-center">
      {restaurant?.name || 'Restaurant Name'}
    </h1>
    <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mt-1 text-center">
      Digital Menu
    </p>
  </div>
));
MenuHeader.displayName = 'MenuHeader';



export default function MenuClient({
  params,
  initialRestaurant,
  initialDishes,
  initialCategories,
  tableNo: propTableNo
}: {
  params: { slug: string },
  initialRestaurant: any,
  initialDishes: any[],
  initialCategories: string[],
  tableNo?: string
}) {
  const searchParams = useSearchParams();
  const tableNo = propTableNo || searchParams.get('table');
  const [restaurant, setRestaurant] = useState<any>(initialRestaurant);
  const [dishes, setDishes] = useState<any[]>(initialDishes);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategories.length > 0 ? initialCategories[0] : '');
  const [hasTappedCategory, setHasTappedCategory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Deep Detail Modal State
  const [selectedDish, setSelectedDish] = useState<any>(null);

  // Size Selector State
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});

  // KOT Order Status Lifecycle State
  const [orderStatus, setOrderStatus] = useState<'idle' | 'pending' | 'preparing' | 'served' | 'cancelled'>('idle');
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>([]);
  const [showTracking, setShowTracking] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[]>([]);
  const [originalItemsCache, setOriginalItemsCache] = useState<Record<string, any[]>>({});

  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [dishQuantity, setDishQuantity] = useState(1);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
    if (restaurant) {
      const businessName = restaurant.name || 'Restaurant';
      if (hasTappedCategory && activeCategory) {
        document.title = `${activeCategory} at ${businessName} | Order Online`;
      } else {
        document.title = `${businessName} | Order Online`;
      }

      const categoryDesc = hasTappedCategory && activeCategory ? `${activeCategory} menu at ` : '';
      const descText = `Explore our delicious ${categoryDesc}${businessName}. View prices, details, and order instantly from your browser!`;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', descText);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = descText;
        document.head.appendChild(meta);
      }
    }
  }, [activeCategory, restaurant, hasTappedCategory]);

  // Restore active orders and original items cache from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIds = localStorage.getItem(`active_order_ids_${params.slug}`);
      if (savedIds) {
        try {
          const parsed = JSON.parse(savedIds);
          if (Array.isArray(parsed)) {
            setActiveOrderIds(parsed);
            if (parsed.length > 0) {
              setShowTracking(true);
            }
          }
        } catch (e) {
          const savedSingle = localStorage.getItem(`active_order_id_${params.slug}`);
          if (savedSingle) {
            setActiveOrderIds([savedSingle]);
            setShowTracking(true);
          }
        }
      } else {
        const savedSingle = localStorage.getItem(`active_order_id_${params.slug}`);
        if (savedSingle) {
          setActiveOrderIds([savedSingle]);
          setShowTracking(true);
        }
      }

      const savedCache = localStorage.getItem(`original_items_cache_${params.slug}`);
      if (savedCache) {
        try {
          setOriginalItemsCache(JSON.parse(savedCache));
        } catch (e) {
          console.warn("Failed to parse original items cache", e);
        }
      }
    }
  }, [params.slug]);

  // Realtime KOT Orders & Items Group Listener
  useEffect(() => {
    if (activeOrderIds.length === 0) {
      setTrackedOrders([]);
      return;
    }

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', initialRestaurant.id)
        .in('id', activeOrderIds);
      if (data && !error) {
        setTrackedOrders(data);
        const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (sorted.length > 0) {
          setOrderStatus(sorted[0].status);
        }
      }
    };
    fetchOrders();

    const subscription = supabase
      .channel(`customer-orders-group-${params.slug}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${initialRestaurant.id}` },
        (payload) => {
          if (payload.new && activeOrderIds.includes(payload.new.id)) {
            console.log("🟢 Realtime update for tracked order:", payload.new);
            setTrackedOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
            setOrderStatus(payload.new.status);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.old && activeOrderIds.includes(payload.old.id)) {
            console.log("🔴 Realtime delete for tracked order:", payload.old.id);
            setTrackedOrders(prev => prev.filter(o => o.id !== payload.old.id));
            setActiveOrderIds(prev => {
              const updated = prev.filter(id => id !== payload.old.id);
              if (typeof window !== 'undefined') {
                localStorage.setItem(`active_order_ids_${params.slug}`, JSON.stringify(updated));
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeOrderIds, params.slug]);

  // Auto-Reset Timer when all orders are served or cancelled
  useEffect(() => {
    if (trackedOrders.length > 0) {
      const allResolved = trackedOrders.every(o => o.status === 'served' || o.status === 'cancelled');
      if (allResolved) {
        const timer = setTimeout(() => {
          setOrderStatus('idle');
          setActiveOrderIds([]);
          setTrackedOrders([]);
          setOriginalItemsCache({});
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`active_order_ids_${params.slug}`);
            localStorage.removeItem(`active_order_id_${params.slug}`);
            localStorage.removeItem(`original_items_cache_${params.slug}`);
          }
          setSelectedDish(null);
          setShowTracking(false);
          setIsCartOpen(false);
        }, 12000);
        return () => clearTimeout(timer);
      }
    }
  }, [trackedOrders, params.slug]);

  useEffect(() => {
    const ownerId = initialRestaurant?.owner_id;
    const restaurantId = initialRestaurant?.id;

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

    // Native Postgres Realtime Subscriptions
    const realtimeChannel = supabase.channel(`public-data-${params.slug}`)
      .on(
        'broadcast',
        { event: 'refresh-menu' },
        async () => {
          console.log('Received menu update broadcast event!');

          // 1. Fetch latest restaurant details to update immediately (logo, brand name, color, etc.)
          const { data: freshRestaurant } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', params.slug)
            .single();
          if (freshRestaurant) {
            setRestaurant(freshRestaurant);
          }

          // 2. Fetch latest dishes to keep client fully in sync
          const { data: freshDishes } = await supabase
            .from('dishes')
            .select('*')
            .eq('restaurant_id', freshRestaurant?.id || restaurant.id)
            .order('category', { ascending: true })
            .order('name', { ascending: true });
          if (freshDishes) {
            setDishes(freshDishes.map(d => ({
              ...d,
              isBestSeller: (d.view_count || 0) > 60,
              view_count: d.view_count || 0
            })));
            updateCategories(freshDishes);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dishes', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          setDishes(prev => {
            if (payload.new.restaurant_id !== restaurantId) return prev;
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
        { event: 'UPDATE', schema: 'public', table: 'dishes', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          setDishes(prev => {
            if (payload.new.restaurant_id !== restaurantId) return prev;
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
        { event: 'UPDATE', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurantId}` },
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
    setDishQuantity(1);

    setDishes(prev => prev.map(d =>
      d.id === dish.id ? { ...d, view_count: d.view_count + 1 } : d
    ));

    const { error } = await supabase.rpc('increment_view_count', { dish_id: dish.id });
    if (error) {
      await supabase.from('dishes').update({ view_count: dish.view_count + 1 }).eq('id', dish.id);
    }
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

  const isExpiredWithGrace = () => {
    if (!restaurant?.expiry_date) return false;
    const expiry = new Date(restaurant.expiry_date);
    const graceEnd = new Date(expiry.getTime() + 2 * 24 * 60 * 60 * 1000);
    return new Date() > graceEnd;
  };

  const menuBlocked = isExpiredWithGrace();

  return (
    <div className="min-h-screen flex flex-col bg-white pb-24 font-sans relative selection:bg-gray-200">
      {restaurant && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Restaurant",
                "name": restaurant?.name || 'Restaurant',
                "image": restaurant?.logo_url || undefined,
                "telephone": undefined,
                "menu": typeof window !== 'undefined' ? window.location.href : '',
              },
              {
                "@context": "https://schema.org",
                "@type": "Menu",
                "name": `Digital Menu for ${restaurant?.name || 'Restaurant'}`,
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
          box-shadow: 0 0 0 2px #000000 !important; 
          border-color: transparent !important; 
        }
        /* Prevent mobile copy/selection overlay for a native app feel */
        body {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        /* Allow selection only on inputs */
        input, textarea {
          -webkit-user-select: auto;
          user-select: auto;
          }
      `}</style>

      {/* Minimal Top Header */}
      <MenuHeader restaurant={restaurant} menuBlocked={menuBlocked} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        {menuBlocked ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-16 text-center animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Unavailable</h2>
            <p className="text-gray-500 font-medium">This menu is temporarily unavailable. Please contact the restaurant owner.</p>
          </div>
        ) : (
          <>
            {/* Special Offers Section */}
            {dishes.filter(d => d.is_special_offer && d.is_available && d.restaurant_id === initialRestaurant.id).length > 0 && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8 mt-12 pt-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-500">✨</span> Offers for You
                </h2>
                <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
                  {dishes.filter(d => d.is_special_offer && d.is_available && d.restaurant_id === initialRestaurant.id).map(item => (
                    <motion.div
                      key={`offer-${item.id}`}
                      onClick={() => handleDishClick(item)}
                      className="min-w-[260px] max-w-[260px] bg-white rounded-3xl p-3 flex gap-3 shadow-sm border border-orange-100 relative overflow-visible snap-center cursor-pointer hover:shadow-md transition-all shrink-0"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 shrink-0 overflow-hidden relative border border-orange-50/50 flex items-center justify-center">
                        {item.image_url ? (
                          <Image src={item.image_url} fill sizes="80px" alt={item.name} className="object-cover" />
                        ) : (
                          <span className="text-xl font-black text-orange-400 uppercase select-none">{item.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900 truncate">{item.name}</h3>
                          {/* Secure Strict Conditional Badge Rendering */}
                          {item.special_tag && item.special_tag.trim() !== "" && (
                            <span className="bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                              {item.special_tag}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-black text-gray-900 mt-1 block">
                          ₹{getDishPrice(item)}
                        </span>
                      </div>
                      {item.offer_tag && item.restaurant_id === initialRestaurant.id && (
                        <div
                          className="absolute z-[50] -bottom-[10px] -right-[8px] -rotate-[3deg] whitespace-nowrap font-black text-[10px] sm:text-xs text-white px-3 py-1.5 shadow-xl border-2 border-white"
                          style={{
                            backgroundColor: '#f97316',
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
              <div className="sticky top-0 z-50 w-full bg-[#F9FAFB] border-b border-gray-200 shadow-sm">
                <div className="max-w-3xl mx-auto py-3 flex gap-2 overflow-x-auto scrollbar-hide snap-x scroll-pl-4 sm:scroll-pl-6 pl-4 sm:pl-6 pr-4 sm:pr-6">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setHasTappedCategory(true);
                        const el = document.getElementById(`category-${cat}`);
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.scrollY - 80;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }}
                      className={`whitespace-nowrap shrink-0 px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 snap-start focus:outline-none shadow-sm ${activeCategory === cat
                          ? 'text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      style={activeCategory === cat ? { backgroundColor: '#000000' } : {}}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu List by Categories */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12">
              {dishes.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium sm:text-lg">No items available</p>
                </div>
              ) : Object.keys(groupedDishes).length === 0 ? (
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
                    <div key={cat} id={`category-${cat}`} className="scroll-mt-24 pt-4">
                      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6">
                        {cat}
                      </h2>
                      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
                        {categoryDishes.map((item: any, index: number) => {
                          const sizeKey = item.sizes && Object.keys(item.sizes).length > 0
                            ? Object.keys(item.sizes)[selectedSizes[item.id] || 0]
                            : 'Standard';

                          const cartItem = cart.find(c => c.dish_id === item.id && c.size === sizeKey);
                          const quantity = cartItem ? cartItem.quantity : 0;
                          const isVeg = item.category?.toLowerCase().includes('non-veg') || item.category?.toLowerCase().includes('chicken') || item.category?.toLowerCase().includes('meat') ? false : true;

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                handleDishClick(item);
                              }}
                              className={`bg-white rounded-2xl p-3 sm:p-4 flex flex-row gap-4 items-center relative group shadow-sm border border-gray-100 transition-all duration-200 ${!item.is_available ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-gray-200 hover:shadow-md'}`}
                            >
                              {/* Image */}
                              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shrink-0 overflow-hidden relative border border-gray-100 flex items-center justify-center">
                                {item.image_url ? (
                                  <Image
                                    src={item.image_url}
                                    fill
                                    sizes="(max-width: 640px) 96px, 112px"
                                    alt={item.name}
                                    className="object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-2xl font-black text-gray-400 uppercase select-none">{item.name.charAt(0)}</span>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-3 h-3 border ${isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-sm shrink-0`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                  </div>
                                  <h3 className="text-base sm:text-lg font-bold text-[#111827] truncate">
                                    {item.name}
                                  </h3>
                                  {/* Secure Strict Conditional Badge Rendering */}
                                  {item.special_tag && item.special_tag.trim() !== "" && (
                                    <span className="bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      {item.special_tag}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5 line-clamp-2 leading-relaxed">
                                    {item.description}
                                  </p>
                                )}

                                {item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                                    {Object.entries(item.sizes).map(([label, _price], i: number) => {
                                      const isSelected = (selectedSizes[item.id] || 0) === i;
                                      return (
                                        <button
                                          key={i}
                                          onClick={(e) => { e.stopPropagation(); setSelectedSizes({ ...selectedSizes, [item.id]: i }); }}
                                          className={`px-2 py-1 text-[10px] uppercase tracking-wide font-bold rounded-lg transition-all ${isSelected ? 'bg-[#111827] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-base sm:text-lg font-black text-[#111827] tabular-nums">
                                    ₹{getDishPrice(item)}
                                  </span>

                                  {/* Add to Cart logic */}
                                  {item.is_available && (
                                    <div className="shrink-0 ml-4">
                                      {quantity > 0 ? (
                                        <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 px-1 py-1 rounded-full shadow-sm animate-fade-in">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCart(prev => {
                                                const newCart = [...prev];
                                                const idx = newCart.findIndex(c => c.dish_id === item.id && c.size === sizeKey);
                                                if (idx >= 0) {
                                                  newCart[idx].quantity -= 1;
                                                  if (newCart[idx].quantity <= 0) newCart.splice(idx, 1);
                                                }
                                                return newCart;
                                              });
                                            }}
                                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-full font-bold active:scale-95 transition-transform hover:bg-gray-50"
                                          >
                                            -
                                          </button>
                                          <span className="font-bold text-gray-900 text-sm w-4 text-center">{quantity}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (quantity < 10) {
                                                setCart(prev => {
                                                  const newCart = [...prev];
                                                  const idx = newCart.findIndex(c => c.dish_id === item.id && c.size === sizeKey);
                                                  if (idx >= 0) newCart[idx].quantity += 1;
                                                  return newCart;
                                                });
                                              }
                                            }}
                                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-full font-bold active:scale-95 transition-transform hover:bg-gray-50"
                                          >
                                            +
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCart(prev => [...prev, {
                                              dish_id: item.id,
                                              name: item.name,
                                              price: Number(getDishPrice(item)),
                                              quantity: 1,
                                              size: sizeKey,
                                              img: item.image_url
                                            }]);
                                          }}
                                          className="bg-[#F9FAFB] hover:bg-gray-100 text-[#111827] border border-gray-200 px-5 py-1.5 rounded-full font-bold text-sm transition-colors active:scale-95 shadow-sm"
                                        >
                                          ADD
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {item.is_special_offer && item.offer_tag && item.is_available && item.restaurant_id === initialRestaurant.id && (
                                <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-xl bg-[#111827] text-white text-[10px] font-black px-2.5 py-1 shadow-sm tracking-wider z-10 uppercase">
                                  {item.offer_tag}
                                </div>
                              )}
                              {!item.is_available && (
                                <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-xl bg-gray-500 text-white text-[10px] font-black px-2.5 py-1 shadow-sm tracking-wider z-10 uppercase">
                                  Out of stock
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Powered By Footer — always at page bottom */}
      <footer className="w-full text-center py-6 mt-auto shrink-0">
        <p className="text-[10px] tracking-widest font-black uppercase text-gray-400">Powered By</p>
        <img src="/restdigi-logo.png" alt="RESTDIGI" className="h-6 mx-auto mt-1 opacity-70 object-contain" />
      </footer>

      {/* Sticky Bottom Bar for Cart */}
      {cartItemCount > 0 && !showTracking && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up sm:max-w-md sm:mx-auto">
          <div className="bg-[#111827] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-800">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-gray-300 uppercase tracking-widest">{cartItemCount} Items Added</span>
              <span className="font-black text-xl tabular-nums">₹{cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => {
                setShowTracking(false);
                setIsCartOpen(true);
              }}
              className="bg-white text-[#111827] px-6 py-3 rounded-xl font-black shadow-md hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            >
              View Cart & Order 🛒
            </button>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      <div className="fixed right-4 sm:right-8 flex flex-col gap-3 z-40 bottom-28">
        {activeOrderIds.length > 0 && !isCartOpen && (
          <button
            onClick={() => {
              setShowTracking(true);
              setIsCartOpen(true);
            }}
            className="bg-[#111827] text-white px-5 h-14 rounded-full shadow-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-transform font-bold cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm tracking-wide">Track Order</span>
          </button>
        )}
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
                className="relative bg-white w-full h-[85vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-[2rem] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl pointer-events-auto"
              >
                <button
                  onClick={() => setSelectedDish(null)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/50 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div layoutId={`dish-image-${selectedDish.id}`} className="relative h-64 sm:h-80 w-full bg-gradient-to-br from-gray-50 to-gray-100 shrink-0 flex items-center justify-center border-b border-gray-100">
                  {selectedDish.image_url ? (
                    <>
                      <Image
                        src={selectedDish.image_url}
                        fill
                        sizes="(max-width: 640px) 100vw, 512px"
                        alt={selectedDish.name}
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    </>
                  ) : (
                    <span className="text-6xl font-black text-gray-300 uppercase select-none">{selectedDish.name.charAt(0)}</span>
                  )}
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
                  {(() => {
                    const price = Number(getDishPrice(selectedDish));
                    const sizeKey = selectedDish.sizes && Object.keys(selectedDish.sizes).length > 0
                      ? Object.keys(selectedDish.sizes)[selectedSizes[selectedDish.id] || 0]
                      : 'Standard';

                    return (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100">
                          <button
                            onClick={() => setDishQuantity(Math.max(1, dishQuantity - 1))}
                            className="w-12 h-12 flex items-center justify-center bg-white rounded-xl font-bold text-xl text-gray-900 shadow-sm border border-gray-200"
                          >
                            -
                          </button>
                          <span className="font-black text-xl w-12 text-center text-black">{dishQuantity}</span>
                          <button
                            onClick={() => setDishQuantity(Math.min(10, dishQuantity + 1))}
                            className="w-12 h-12 flex items-center justify-center bg-white rounded-xl font-bold text-xl text-gray-900 shadow-sm border border-gray-200"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setCart(prev => {
                              const existing = prev.findIndex(item => item.dish_id === selectedDish.id && item.size === sizeKey);
                              if (existing >= 0) {
                                const newCart = [...prev];
                                newCart[existing].quantity = Math.min(10, newCart[existing].quantity + dishQuantity);
                                return newCart;
                              }
                              return [...prev, {
                                dish_id: selectedDish.id,
                                name: selectedDish.name,
                                price: price,
                                quantity: dishQuantity,
                                size: sizeKey,
                                img: selectedDish.image_url
                              }];
                            });
                            setSelectedDish(null);
                          }}
                          className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-[1.02] flex items-center justify-between px-6 shadow-lg"
                        >
                          <span>Add to Cart</span>
                          <span>₹{(price * dishQuantity).toFixed(2)}</span>
                        </button>
                      </div>
                    );
                  })()}
                </motion.div>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[70] bg-white rounded-t-[2rem] shadow-2xl flex flex-col max-h-[90vh] sm:max-w-md sm:mx-auto"
            >
              <button
                onClick={() => setIsCartOpen(false)}
                className="absolute top-4 right-4 z-[80] w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-900 shadow-sm transition-all animate-fade-in"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-4 flex justify-center shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              <div className="px-6 pb-4 border-b border-gray-100 shrink-0">
                <h2 className="text-2xl font-black text-gray-900">Your Order</h2>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                {showTracking && activeOrderIds.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-bold text-xs uppercase text-gray-400 tracking-wider">Active Track Queue</span>
                      {trackedOrders.length > 0 && (
                        <span className="text-xs font-black bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full animate-pulse">
                          {trackedOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length} Active KOT
                        </span>
                      )}
                    </div>

                    {trackedOrders.map((order, orderIdx) => {
                      const orderItems = originalItemsCache[order.id] || order.items || [];
                      const isOrderCancelled = order.status === 'cancelled';
                      const isOrderServed = order.status === 'served';
                      const isOrderPreparing = order.status === 'preparing';
                      const isOrderPending = order.status === 'pending';

                      return (
                        <div
                          key={order.id}
                          className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-200 ${isOrderPending ? 'border-amber-200 bg-amber-50/10' :
                              isOrderPreparing ? 'border-orange-200 bg-orange-50/10' :
                                isOrderServed ? 'border-emerald-200 bg-emerald-50/10' :
                                  'border-gray-200 bg-gray-50/30'
                            }`}
                        >
                          {/* Card Top Border Accent */}
                          <div className={`absolute top-0 left-0 w-full h-1 ${isOrderPending ? 'bg-amber-400' :
                              isOrderPreparing ? 'bg-orange-500' :
                                isOrderServed ? 'bg-emerald-500' :
                                  'bg-gray-400'
                            }`} />

                          {/* Card Header */}
                          <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                            <div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">
                                Order #{orderIdx + 1}
                              </span>
                              <span className="text-sm font-black text-gray-900 leading-none">
                                {tableNo ? `Table ${tableNo}` : 'WhatsApp Order'}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {isOrderPending && <span className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending</span>}
                              {isOrderPreparing && <span className="flex items-center gap-1 text-[11px] font-black text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Preparing</span>}
                              {isOrderServed && <span className="flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Served</span>}
                              {isOrderCancelled && <span className="flex items-center gap-1 text-[11px] font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Cancelled</span>}
                            </div>
                          </div>

                          {/* Card Body (Items) */}
                          <div className="space-y-4">
                            <AnimatePresence initial={false}>
                              {orderItems.map((item: any, itemIdx: number) => {
                                const dishDetail = dishes.find(d => d.id === item.dish_id);
                                const imgUrl = dishDetail?.image_url;

                                const originalQty = item.quantity;
                                const dbItem = order.items?.find((i: any) => i.dish_id === item.dish_id && i.size === item.size);
                                const activeQty = isOrderCancelled ? 0 : (dbItem ? dbItem.quantity : 0);
                                const cancelledQty = originalQty - activeQty;

                                return (
                                  <div key={itemIdx} className="flex flex-col gap-2">
                                    {/* Active Item Block */}
                                    {activeQty > 0 && (
                                      <motion.div
                                        key={`active-${item.dish_id}-${item.size || 'Standard'}`}
                                        initial={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                        className="flex gap-3 items-center"
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100 flex items-center justify-center">
                                          {imgUrl ? (
                                            <Image src={imgUrl} fill sizes="40px" alt={item.name} className="object-cover" />
                                          ) : (
                                            <span className="text-xs font-black text-gray-400 uppercase select-none">{item.name.charAt(0)}</span>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-sm text-gray-900 truncate">{item.name}</h4>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs font-black text-gray-500">Qty: {activeQty}</span>
                                            {item.size && item.size !== 'Standard' && (
                                              <span className="text-[9px] bg-gray-50 text-gray-500 px-1 py-0.5 rounded border border-gray-100 font-bold uppercase tracking-wider">{item.size}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-sm text-gray-900 tabular-nums">₹{(item.price * activeQty).toFixed(2)}</span>
                                          {isOrderPending && (
                                            <button
                                              onClick={async () => {
                                                if (confirm(`Cancel "${item.name}" from your order?`)) {
                                                  const updatedItems = order.items.filter(
                                                    (i: any) => !(i.dish_id === item.dish_id && i.size === item.size)
                                                  );
                                                  const newTotal = updatedItems.reduce(
                                                    (sum: number, curr: any) => sum + (curr.price * curr.quantity),
                                                    0
                                                  );

                                                  if (updatedItems.length === 0) {
                                                    await supabase
                                                      .from('orders')
                                                      .update({ status: 'cancelled', items: [], total_amount: 0 })
                                                      .eq('id', order.id);
                                                  } else {
                                                    await supabase
                                                      .from('orders')
                                                      .update({ items: updatedItems, total_amount: newTotal })
                                                      .eq('id', order.id);
                                                  }
                                                }
                                              }}
                                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                              title="Cancel item"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* Cancelled Item Block (Reflected on right side!) */}
                                    {cancelledQty > 0 && (
                                      <motion.div
                                        key={`cancelled-${item.dish_id}-${item.size || 'Standard'}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex gap-3 items-center opacity-60 line-through text-gray-400"
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100 flex items-center justify-center grayscale">
                                          {imgUrl ? (
                                            <Image src={imgUrl} fill sizes="40px" alt={item.name} className="object-cover" />
                                          ) : (
                                            <span className="text-xs font-black text-gray-400 uppercase select-none">{item.name.charAt(0)}</span>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-sm text-gray-400 truncate">{item.name}</h4>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs font-medium text-gray-400">Qty: {cancelledQty}</span>
                                            {item.size && item.size !== 'Standard' && (
                                              <span className="text-[9px] bg-gray-50 text-gray-400 px-1 py-0.5 rounded border border-gray-100 font-bold uppercase tracking-wider">{item.size}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                                            Cancelled
                                          </span>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              })}
                            </AnimatePresence>
                          </div>

                          {/* Card Footer (Order Total) */}
                          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center mt-1">
                            <span className="font-bold text-xs text-gray-400 uppercase tracking-wide">KOT Total</span>
                            <span className="font-black text-base text-gray-900 tabular-nums">
                              ₹{Number(order.total_amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => {
                        setShowTracking(false);
                        setIsCartOpen(false);
                      }}
                      className="w-full bg-[#111827] hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer text-sm text-center mt-2"
                    >
                      Order More Items
                    </button>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-bold text-lg text-gray-900">Cart is empty</p>
                    <p className="text-sm">Add some delicious dishes!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
                          {item.img && <Image src={item.img} fill sizes="64px" alt={item.name} className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-black text-gray-900">₹{item.price}</span>
                            {item.size !== 'Standard' && <span className="text-xs text-gray-500">{item.size}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100 shrink-0">
                          <button onClick={() => {
                            setCart(prev => {
                              const newCart = [...prev];
                              newCart[idx].quantity -= 1;
                              if (newCart[idx].quantity <= 0) newCart.splice(idx, 1);
                              return newCart;
                            });
                          }} className="w-7 h-7 flex items-center justify-center font-bold bg-white rounded shadow-sm text-gray-600">-</button>
                          <span className="font-bold w-4 text-center text-sm text-black">{item.quantity}</span>
                          <button onClick={() => {
                            setCart(prev => {
                              const newCart = [...prev];
                              newCart[idx].quantity = Math.min(10, newCart[idx].quantity + 1);
                              return newCart;
                            });
                          }} className="w-7 h-7 flex items-center justify-center font-bold bg-white rounded shadow-sm text-gray-600">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!showTracking && cart.length > 0 && (
                <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-500">Total Amount</span>
                    <span className="font-black text-2xl text-gray-900">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!tableNo) {
                        const itemsList = cart.map(i => `${i.quantity}x ${i.name}`).join('%0A');
                        const msg = `Hi! I would like to order:%0A${itemsList}%0ATotal: ₹${cartTotal.toFixed(2)}%0ACould you let me know if delivery is available?`;
                        const whatsappNum = (restaurant?.whatsapp_number || '').replace(/[^0-9]/g, '');
                        if (whatsappNum) {
                          window.open(`https://wa.me/${whatsappNum}?text=${msg}`, '_blank');
                        } else {
                          alert('WhatsApp ordering is not configured for this restaurant.');
                        }
                        return;
                      }

                      setOrderStatus('pending');
                      const payload = {
                        restaurant_id: restaurant.id,
                        table_no: tableNo,
                        status: 'pending',
                        items: cart.map(item => ({
                          dish_id: item.dish_id,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                          size: item.size
                        })),
                        total_amount: cartTotal
                      };

                      const { data, error } = await supabase.from('orders').insert(payload).select().single();
                      if (error) {
                        setOrderStatus('idle');
                        alert('Failed to place order. Please try again.');
                      } else {
                        // Append to activeOrderIds list
                        setActiveOrderIds(prev => {
                          const updated = [...prev, data.id];
                          if (typeof window !== 'undefined') {
                            localStorage.setItem(`active_order_ids_${params.slug}`, JSON.stringify(updated));
                          }
                          return updated;
                        });

                        // Cache original items list for change comparisons
                        setOriginalItemsCache(prev => {
                          const updated = { ...prev, [data.id]: payload.items };
                          if (typeof window !== 'undefined') {
                            localStorage.setItem(`original_items_cache_${params.slug}`, JSON.stringify(updated));
                          }
                          return updated;
                        });

                        setOrderStatus('pending');
                        setShowTracking(true);
                        setCart([]); // Clear cart on success
                      }
                    }}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg text-white cursor-pointer ${tableNo ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#25D366] hover:bg-[#1ebd5a]'}`}
                  >
                    {tableNo ? 'Place KOT Order' : 'Order on WhatsApp'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
