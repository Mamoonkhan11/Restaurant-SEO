"use client";
import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Loader2, Search, MapPin, AlertCircle, CheckCircle, Check, Star, Copy, ExternalLink } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
const formatTableNumber = (name?: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (/^table\b/i.test(trimmed)) return trimmed;
  return `Table ${trimmed}`;
};

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const MenuHeader = React.memo(({ restaurant, menuBlocked, tableNo }: { restaurant: any, menuBlocked: boolean, tableNo?: string }) => (
  <div className="pt-8 pb-6 px-4 flex flex-col items-center justify-center bg-transparent relative z-10">
    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/5 rounded-full border border-white/10 flex items-center justify-center overflow-hidden mb-3 relative shadow-sm transition-transform hover:scale-105">
      {restaurant?.logo_url ? (
        <Image
          src={restaurant.logo_url}
          alt="Logo"
          fill
          sizes="(max-width: 768px) 96px, 112px"
          priority
          className="object-cover"
          key={restaurant.logo_url}
        />
      ) : (
        <span className="text-4xl font-black text-white">
          {restaurant?.name?.charAt(0) || 'L'}
        </span>
      )}
    </div>
    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">
      {restaurant?.name || 'Restaurant Name'}
    </h1>
    <span className="mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[10px] tracking-wider uppercase border border-orange-400/20 shadow-[0_0_12px_rgba(234,88,12,0.3)]">
      Digital Menu
    </span>
    {tableNo && (
      <span className="mt-2 px-3 py-1 rounded-full bg-white/5 text-white font-extrabold text-[10px] tracking-wider border border-white/10 uppercase shadow-sm">
        {formatTableNumber(tableNo)}
      </span>
    )}
  </div>
));
MenuHeader.displayName = 'MenuHeader';

const springTransition = { type: "spring" as const, stiffness: 800, damping: 48 };

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
  const tableNo = propTableNo;
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

  // Cancel Items View State
  const [isCancelViewOpen, setIsCancelViewOpen] = useState(false);
  const [selectedCancelItems, setSelectedCancelItems] = useState<{ orderId: string; dishId: string; size: string; name: string; price: number; quantity: number }[]>([]);
  const [cancelSuccessModal, setCancelSuccessModal] = useState(false);
  const [showGoogleReviewModal, setShowGoogleReviewModal] = useState(false);
  const [googleReviewShown, setGoogleReviewShown] = useState(false);
  const [reviewTemplate, setReviewTemplate] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const handleToggleCancelItem = (itemKey: { orderId: string; dishId: string; size: string; name: string; price: number; quantity: number }) => {
    setSelectedCancelItems(prev => {
      const exists = prev.some(i => i.orderId === itemKey.orderId && i.dishId === itemKey.dishId && i.size === itemKey.size);
      if (exists) {
        return prev.filter(i => !(i.orderId === itemKey.orderId && i.dishId === itemKey.dishId && i.size === itemKey.size));
      } else {
        return [...prev, itemKey];
      }
    });
  };

  const handleCancelSelectedItems = async () => {
    if (selectedCancelItems.length === 0) return;

    try {
      // Group selected items by orderId
      const groupedByOrder: Record<string, typeof selectedCancelItems> = {};
      selectedCancelItems.forEach(item => {
        if (!groupedByOrder[item.orderId]) {
          groupedByOrder[item.orderId] = [];
        }
        groupedByOrder[item.orderId].push(item);
      });

      // For each order, perform the update in Supabase
      for (const orderId of Object.keys(groupedByOrder)) {
        const itemsToCancel = groupedByOrder[orderId];
        const dbOrder = trackedOrders.find(o => o.id === orderId);
        if (!dbOrder) continue;

        // Filter out the cancelled items from the dbOrder items list
        const updatedItems = dbOrder.items.filter((i: any) => {
          const itemSize = i.size || 'Standard';
          return !itemsToCancel.some(c => c.dishId === i.dish_id && c.size === itemSize);
        });

        const newTotal = updatedItems.reduce(
          (sum: number, curr: any) => sum + (curr.price * curr.quantity),
          0
        );

        if (updatedItems.length === 0) {
          // Cancel the whole order ticket if all items in it are cancelled
          await supabase
            .from('orders')
            .update({ status: 'cancelled', items: [], total_amount: 0 })
            .eq('id', orderId);
        } else {
          // Update order items list and total amount
          await supabase
            .from('orders')
            .update({ items: updatedItems, total_amount: newTotal })
            .eq('id', orderId);
        }
      }

      // Reset cancellation view state
      setSelectedCancelItems([]);
      setIsCancelViewOpen(false);
      setCancelSuccessModal(true);
    } catch (err) {
      console.error("Error cancelling items:", err);
      toast.error("Failed to cancel items. Please try again.");
    }
  };

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
      const realIds = activeOrderIds.filter(id => !id.startsWith('temp_'));
      if (realIds.length === 0) {
        setTrackedOrders(prev => prev.filter(o => o.id.startsWith('temp_')));
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', initialRestaurant.id)
        .in('id', realIds);
      if (data && !error) {
        setTrackedOrders(prev => {
          const optimisticOrders = prev.filter(o => o.id.startsWith('temp_'));
          const merged = [
            ...optimisticOrders,
            ...data.filter(d => !optimisticOrders.some(o => o.id === d.id))
          ];
          return merged;
        });
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
    if (trackedOrders.length > 0 && !googleReviewShown && restaurant?.google_review_url) {
      const allServedOrCancelled = trackedOrders.every(o => o.status === 'served' || o.status === 'cancelled');
      const hasServed = trackedOrders.some(o => o.status === 'served');
      if (allServedOrCancelled && hasServed) {
        const timer = setTimeout(() => {
          setShowGoogleReviewModal(true);
          setGoogleReviewShown(true);
        }, 3000); // 3 seconds delay after served
        return () => clearTimeout(timer);
      }
    }
    if (trackedOrders.length === 0) {
      setGoogleReviewShown(false);
    }
  }, [trackedOrders, googleReviewShown, restaurant?.google_review_url]);

  // Choose a randomized review template whenever the rating modal is shown
  useEffect(() => {
    if (showGoogleReviewModal) {
      const templates = [
        `The food and experience at ${restaurant?.name || 'this restaurant'} was absolutely amazing! Great service and highly recommended.`,
        `Visited ${restaurant?.name || 'this place'} recently. The food was delicious and the hospitality was top-notch. Must visit!`,
        `Had an outstanding meal here. Incredible service, beautiful presentation, and extremely fresh food. Will definitely be back!`,
        `Excellent dining experience! The flavors were outstanding and the staff was extremely friendly. Highly recommend trying their dishes.`,
        `Truly delicious food and fantastic vibes. ${restaurant?.name || 'This restaurant'} never fails to impress. Highly recommended!`
      ];
      const randomIndex = Math.floor(Math.random() * templates.length);
      setReviewTemplate(templates[randomIndex]);
    }
  }, [showGoogleReviewModal, restaurant?.name]);

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
              isBestSeller: (d.view_count || 0) >= 100,
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
              isBestSeller: (payload.new.view_count || 0) >= 100,
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
                isBestSeller: (payload.new.view_count || 0) >= 100,
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

    setDishes(prev => prev.map(d => {
      if (d.id === dish.id) {
        const newCount = (d.view_count || 0) + 1;
        return {
          ...d,
          view_count: newCount,
          isBestSeller: newCount >= 100
        };
      }
      return d;
    }));

    const { error } = await supabase.rpc('increment_view_count', { dish_id: dish.id });
    if (error) {
      await supabase.from('dishes').update({ view_count: (dish.view_count || 0) + 1 }).eq('id', dish.id);
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
      <div className="min-h-screen bg-[#07080B] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
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
    <div className="min-h-screen flex flex-col bg-[#07080B] text-white pb-24 font-sans relative selection:bg-orange-600/30 overflow-hidden">
      <Toaster />

      {/* Item Cancellation Success Modal */}
      {cancelSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-5">
          <div className="bg-[#121318] rounded-2xl max-w-sm w-full p-7 shadow-2xl border border-white/10 text-center animate-fade-in-up">
            {/* Green check icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Items Cancelled</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Selected items have been successfully cancelled from your order.
            </p>
            <button
              onClick={() => setCancelSuccessModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Google Review Rating Modal */}
      {showGoogleReviewModal && restaurant?.google_review_url && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#121318] rounded-[2rem] max-w-sm w-full p-6 shadow-2xl border border-white/10 text-center relative overflow-hidden animate-fade-in-up">

            {/* Top Close Button */}
            <button
              onClick={() => {
                setShowGoogleReviewModal(false);
                setSelectedRating(0);
                setHoveredRating(0);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Header Graphic */}
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>

            <h3 className="text-xl font-black text-white tracking-tight mb-1">Rate Your Experience</h3>
            <p className="text-xs text-gray-400 leading-relaxed px-2 mb-5">
              How did you like our food and service? Tap to review us on Google to support our team!
            </p>

            {/* Stars row */}
            <div
              className="flex items-center justify-center gap-2 mb-6"
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const activeRating = hoveredRating || selectedRating;
                const isFilled = star <= activeRating;

                return (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredRating(star)}
                    onClick={() => {
                      setSelectedRating(star);

                      // Copy to clipboard
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(reviewTemplate).then(() => {
                          toast.success("Review template copied to clipboard!");
                        }).catch(() => { });
                      }

                      // Open Google review page with a short delay for filled star visual feedback
                      const targetUrl = ensureAbsoluteUrl(restaurant.google_review_url);
                      setTimeout(() => {
                        window.open(targetUrl, '_blank');
                        setShowGoogleReviewModal(false);
                        setSelectedRating(0);
                        setHoveredRating(0);
                      }, 400);
                    }}
                    className="group p-1 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-10 h-10 transition-all duration-150 transform group-hover:scale-115 ${isFilled
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'text-white/20 fill-transparent hover:text-amber-400'
                        }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Review Template Preview Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left mb-6 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Review Draft
                </span>
                <span className="text-[9px] text-gray-500 font-medium flex items-center gap-1">
                  <Copy className="w-2.5 h-2.5" /> Auto-copies on tap
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                "{reviewTemplate}"
              </p>
            </div>

            {/* Manual Review Button */}
            <button
              onClick={() => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(reviewTemplate);
                }
                const targetUrl = ensureAbsoluteUrl(restaurant.google_review_url);
                window.open(targetUrl, '_blank');
                setShowGoogleReviewModal(false);
                setSelectedRating(0);
                setHoveredRating(0);
              }}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm active:scale-98 cursor-pointer"
            >
              <span>Write Review on Google</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Background Radial Glows — left, center & right, low opacity */}
      {/* LEFT side */}
      <div className="absolute top-[5%] left-[-12%] w-[420px] h-[420px] rounded-full bg-orange-600/10 blur-[90px] pointer-events-none z-0"></div>
      <div className="absolute top-[45%] left-[-10%] w-[380px] h-[380px] rounded-full bg-amber-500/8 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[5%] left-[-8%] w-[350px] h-[350px] rounded-full bg-orange-500/10 blur-[80px] pointer-events-none z-0"></div>
      {/* CENTER */}
      <div className="absolute top-[2%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/8 blur-[110px] pointer-events-none z-0"></div>
      <div className="absolute top-[42%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-orange-600/7 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[2%] left-[50%] -translate-x-1/2 w-[380px] h-[380px] rounded-full bg-amber-400/8 blur-[100px] pointer-events-none z-0"></div>
      {/* RIGHT side */}
      <div className="absolute top-[5%] right-[-12%] w-[420px] h-[420px] rounded-full bg-orange-600/10 blur-[90px] pointer-events-none z-0"></div>
      <div className="absolute top-[45%] right-[-10%] w-[380px] h-[380px] rounded-full bg-amber-500/8 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[5%] right-[-8%] w-[350px] h-[350px] rounded-full bg-orange-500/10 blur-[80px] pointer-events-none z-0"></div>

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
          box-shadow: 0 0 0 2px #EA580C !important; 
          border-color: transparent !important; 
        }
        /* Prevent mobile copy/selection overlay for a native app feel */
        body {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          background-color: #07080B;
        }
        /* Allow selection only on inputs */
        input, textarea {
          -webkit-user-select: auto;
          user-select: auto;
          }
      `}</style>

      {/* Minimal Top Header */}
      <MenuHeader restaurant={restaurant} menuBlocked={menuBlocked} tableNo={tableNo || undefined} />

      {menuBlocked ? (
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 relative z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-16 text-center animate-fade-in">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Menu Unavailable</h2>
            <p className="text-gray-400 font-medium">This menu is temporarily unavailable. Please contact the restaurant owner.</p>
          </div>
        </main>
      ) : (
        <>
          {/* Recommended & Bestseller Section */}
          <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-2 relative z-10">
            {/* Bestseller Dish of Week Section (Item crosses 100 views) */}
            {dishes.filter(d => (d.isBestSeller || (d.view_count || 0) >= 100) && d.is_available && d.restaurant_id === initialRestaurant.id).length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg sm:text-xl font-black text-white mb-4 flex items-center gap-2">
                  <span className="text-amber-400">🔥</span> Bestseller Dish of Week
                </h2>
                <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x pl-1 pr-4">
                  {dishes
                    .filter(d => (d.isBestSeller || (d.view_count || 0) >= 100) && d.is_available && d.restaurant_id === initialRestaurant.id)
                    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                    .map(item => {
                      const isVeg = item.category?.toLowerCase().includes('non-veg') || item.category?.toLowerCase().includes('chicken') || item.category?.toLowerCase().includes('meat') ? false : true;
                      const sizeKey = item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0
                        ? Object.keys(item.sizes)[selectedSizes[item.id] || 0]
                        : 'Standard';
                      const cartItem = cart.find(c => c.dish_id === item.id && c.size === sizeKey);
                      const quantity = cartItem ? cartItem.quantity : 0;

                      return (
                        <motion.div
                          key={`bestseller-${item.id}`}
                          onClick={() => handleDishClick(item)}
                          whileTap={{ scale: 0.98 }}
                          className="min-w-[280px] max-w-[280px] bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white/[0.03] backdrop-blur-md rounded-[32px] p-5 flex flex-col justify-between shadow-xl border border-amber-500/30 relative overflow-visible snap-center cursor-pointer hover:border-amber-500/50 transition-all duration-300 shrink-0"
                        >
                          {/* Tags */}
                          <div className="flex justify-between items-start w-full relative z-10">
                            <span className={`w-3.5 h-3.5 border ${isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-sm shrink-0 mt-0.5`}>
                              <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                            </span>

                            <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-500/30 flex items-center gap-1 shadow-sm">
                              <span>⭐</span> Bestseller Dish of Week
                            </span>
                          </div>

                          {/* Centered Dish Image */}
                          <div className="my-3 flex justify-center w-full relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden relative shadow-md border border-amber-500/30 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                              {item.image_url ? (
                                <Image src={item.image_url} fill sizes="96px" alt={item.name} className="object-cover" />
                              ) : (
                                <span className="text-3xl font-black text-amber-400 uppercase select-none">{item.name.charAt(0)}</span>
                              )}
                            </div>
                          </div>

                          {/* Dish Meta */}
                          <div className="text-left w-full mt-1">
                            <h3 className="text-base font-black text-white leading-snug line-clamp-1">{item.name}</h3>

                            {/* Portion / Size Selector (Half / Full / Pieces / Portion) */}
                            {item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                                {Object.entries(item.sizes).map(([label], i: number) => {
                                  const isSelected = (selectedSizes[item.id] || 0) === i;
                                  return (
                                    <button
                                      key={i}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSizes(prev => ({ ...prev, [item.id]: i }));
                                      }}
                                      className={`px-2.5 py-1 text-[9px] uppercase tracking-wide font-extrabold rounded-lg transition-all ${isSelected
                                          ? 'bg-[#EA580C] text-white shadow-[0_0_8px_rgba(234,88,12,0.4)]'
                                          : 'bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20'
                                        }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              <span className="text-base font-black text-amber-400 tabular-nums">
                                ₹{getDishPrice(item)}
                              </span>
                              {item.is_available && (
                                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                  {quantity > 0 ? (
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-1 py-1 rounded-full shadow-sm">
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
                                        className="w-6 h-6 flex items-center justify-center bg-white/10 text-white rounded-full font-bold text-xs active:scale-95 transition-all hover:bg-white/20"
                                      >
                                        -
                                      </button>
                                      <span className="font-bold text-white text-xs w-4 text-center">{quantity}</span>
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
                                        className="w-6 h-6 flex items-center justify-center bg-white/10 text-white rounded-full font-bold text-xs active:scale-95 transition-all hover:bg-white/20"
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
                                      className="bg-[#EA580C] hover:bg-orange-600 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-full shadow-[0_0_12px_rgba(234,88,12,0.3)] transition-colors"
                                    >
                                      ADD +
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Special Offers Section */}
            {dishes.filter(d => d.is_special_offer && d.is_available && d.restaurant_id === initialRestaurant.id).length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-orange-500">⭐</span> Recommended For You
                </h2>
                <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x pl-1 pr-4">
                  {dishes.filter(d => d.is_special_offer && d.is_available && d.restaurant_id === initialRestaurant.id).map(item => {
                    const isVeg = item.category?.toLowerCase().includes('non-veg') || item.category?.toLowerCase().includes('chicken') || item.category?.toLowerCase().includes('meat') ? false : true;
                    const sizeKey = item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0
                      ? Object.keys(item.sizes)[selectedSizes[item.id] || 0]
                      : 'Standard';
                    const cartItem = cart.find(c => c.dish_id === item.id && c.size === sizeKey);
                    const quantity = cartItem ? cartItem.quantity : 0;

                    return (
                      <motion.div
                        key={`offer-${item.id}`}
                        onClick={() => handleDishClick(item)}
                        whileTap={{ scale: 0.98 }}
                        className="min-w-[280px] max-w-[280px] bg-white/[0.03] backdrop-blur-md rounded-[32px] p-5 flex flex-col justify-between shadow-xl border border-white/10 relative overflow-visible snap-center cursor-pointer hover:border-white/20 transition-all duration-300 shrink-0"
                      >
                        {/* Tags */}
                        <div className="flex justify-between items-start w-full relative z-10">
                          <span className={`w-3.5 h-3.5 border ${isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-sm shrink-0 mt-0.5`}>
                            <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                          </span>

                          {item.special_tag && item.special_tag.trim() !== "" ? (
                            <span className="bg-orange-500/10 text-orange-450 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-orange-500/20">
                              {item.special_tag}
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-450 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-500/20">
                              Popular
                            </span>
                          )}
                        </div>

                        {/* Centered Dish Image */}
                        <div className="my-3 flex justify-center w-full relative">
                          <div className="w-24 h-24 rounded-full overflow-hidden relative shadow-md border border-white/5 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                            {item.image_url ? (
                              <Image src={item.image_url} fill sizes="96px" alt={item.name} className="object-cover" />
                            ) : (
                              <span className="text-3xl font-black text-gray-500 uppercase select-none">{item.name.charAt(0)}</span>
                            )}
                          </div>
                        </div>

                        {/* Dish Meta */}
                        <div className="text-left w-full mt-1">
                          <h3 className="text-base font-black text-white leading-snug line-clamp-1">{item.name}</h3>

                          {/* Portion / Size Selector (Half / Full / Pieces / Portion) */}
                          {item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                              {Object.entries(item.sizes).map(([label], i: number) => {
                                const isSelected = (selectedSizes[item.id] || 0) === i;
                                return (
                                  <button
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSizes(prev => ({ ...prev, [item.id]: i }));
                                    }}
                                    className={`px-2.5 py-1 text-[9px] uppercase tracking-wide font-extrabold rounded-lg transition-all ${isSelected
                                        ? 'bg-[#EA580C] text-white shadow-[0_0_8px_rgba(234,88,12,0.4)]'
                                        : 'bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20'
                                      }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-base font-black text-amber-400 tabular-nums">
                              ₹{getDishPrice(item)}
                            </span>
                            {item.is_available && (
                              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                {quantity > 0 ? (
                                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-1 py-1 rounded-full shadow-sm">
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
                                      className="w-6 h-6 flex items-center justify-center bg-white/10 text-white rounded-full font-bold text-xs active:scale-95 transition-all hover:bg-white/20"
                                    >
                                      -
                                    </button>
                                    <span className="font-bold text-white text-xs w-4 text-center">{quantity}</span>
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
                                      className="w-6 h-6 flex items-center justify-center bg-white/10 text-white rounded-full font-bold text-xs active:scale-95 transition-all hover:bg-white/20"
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
                                    className="bg-[#EA580C] hover:bg-orange-600 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-full shadow-[0_0_12px_rgba(234,88,12,0.3)] transition-colors"
                                  >
                                    ADD +
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Curved Dark Sheet Container (Full Width Edge-to-Edge) */}
          <div className="w-full bg-white/[0.02] backdrop-blur-md rounded-t-[40px] border-t border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] relative mt-8 pb-32">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-14 pr-10 py-4 sm:py-5 text-sm sm:text-base bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/40 transition-all shadow-sm font-medium"
                    placeholder="Search for a dish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Jump Bar */}
              {categories.length > 0 && (
                <div className="sticky top-0 z-40 backdrop-blur-sm py-4 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          setHasTappedCategory(true);
                          const el = document.getElementById(`category-${cat}`);
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.scrollY - 100;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }}
                        className={`whitespace-nowrap shrink-0 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 snap-start focus:outline-none shadow-sm ${activeCategory === cat
                          ? 'text-white bg-[#EA580C] shadow-[0_0_12px_rgba(234,88,12,0.4)]'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu List by Categories */}
              <div className="space-y-12">
                {dishes.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 font-medium sm:text-lg">No items available</p>
                  </div>
                ) : Object.keys(groupedDishes).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 font-medium sm:text-lg">No dishes found matching your search.</p>
                  </div>
                ) : (
                  categories.map((cat, catIdx) => {
                    const rawCategoryDishes = groupedDishes[cat];
                    if (!rawCategoryDishes || rawCategoryDishes.length === 0) return null;

                    const categoryDishes = [...rawCategoryDishes].sort((a: any, b: any) => {
                      const aBest = (a.isBestSeller || (a.view_count || 0) >= 100) ? 1 : 0;
                      const bBest = (b.isBestSeller || (b.view_count || 0) >= 100) ? 1 : 0;
                      if (aBest !== bBest) return bBest - aBest;
                      return (b.view_count || 0) - (a.view_count || 0);
                    });

                    return (
                      <div key={cat} id={`category-${cat}`} className="scroll-mt-36 pt-4">
                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 flex items-center gap-2.5">
                          {cat}
                          <span className="text-[10px] font-black text-orange-400 bg-orange-400/10 border border-orange-450/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Popular
                          </span>
                        </h2>

                        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
                          {categoryDishes.map((item: any, idx: number) => {
                            const sizeKey = item.sizes && Object.keys(item.sizes).length > 0
                              ? Object.keys(item.sizes)[selectedSizes[item.id] || 0]
                              : 'Standard';

                            const cartItem = cart.find(c => c.dish_id === item.id && c.size === sizeKey);
                            const quantity = cartItem ? cartItem.quantity : 0;
                            const isVeg = item.category?.toLowerCase().includes('non-veg') || item.category?.toLowerCase().includes('chicken') || item.category?.toLowerCase().includes('meat') ? false : true;
                            const isStartItem = idx === 0;
                            const cardBgBorderClasses = !item.is_available
                              ? 'bg-[#1E1E1E] border-white/5 opacity-40 grayscale cursor-not-allowed'
                              : isStartItem
                                ? 'bg-[#1E1E1E] border-orange-500/30 shadow-[0_0_18px_rgba(234,88,12,0.18)] cursor-pointer hover:border-orange-500/50 hover:bg-[#252525] hover:shadow-[0_0_26px_rgba(234,88,12,0.28)]'
                                : 'bg-[#1E1E1E] border-white/5 cursor-pointer hover:border-white/15 hover:bg-[#252525] hover:shadow-lg hover:shadow-black/20';

                            return (
                              <motion.div
                                key={item.id}
                                onClick={() => {
                                  handleDishClick(item);
                                }}
                                layoutId={`dish-${item.id}`}
                                transition={springTransition}
                                whileTap={{ scale: 0.98 }}
                                className={`backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-row gap-4 items-center relative group shadow-sm border transition-all duration-300 ${cardBgBorderClasses}`}
                              >
                                {/* Image */}
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gradient-to-br from-white/5 to-white/10 shrink-0 overflow-hidden relative border border-white/5 flex items-center justify-center">
                                  {item.image_url ? (
                                    <Image
                                      src={item.image_url}
                                      fill
                                      sizes="(max-width: 640px) 96px, 112px"
                                      alt={item.name}
                                      className="object-cover"
                                      priority={catIdx === 0 && idx < 4}
                                    />
                                  ) : (
                                    <span className="text-2xl font-black text-gray-400 uppercase select-none">{item.name.charAt(0)}</span>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <div className={`w-3 h-3 border ${isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-sm shrink-0`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-white truncate">
                                      {item.name}
                                    </h3>
                                    {/* Bestseller Badge (100+ views) or Special Tag */}
                                    {(item.isBestSeller || (item.view_count || 0) >= 100) ? (
                                      <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-sm">
                                        <span>⭐</span> Bestseller Dish of Week
                                      </span>
                                    ) : item.special_tag && item.special_tag.trim() !== "" ? (
                                      <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                        {item.special_tag}
                                      </span>
                                    ) : null}
                                  </div>
                                  {item.description && (
                                    <p className="text-[#A0A0A0] text-xs sm:text-sm mt-0.5 line-clamp-2 leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}

                                  {item.sizes && typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                                      {Object.entries(item.sizes).map(([label], i: number) => {
                                        const isSelected = (selectedSizes[item.id] || 0) === i;
                                        return (
                                          <button
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); setSelectedSizes({ ...selectedSizes, [item.id]: i }); }}
                                            className={`px-2 py-1 text-[10px] uppercase tracking-wide font-bold rounded-lg transition-all ${isSelected ? 'bg-[#EA580C] text-white shadow-[0_0_8px_rgba(234,88,12,0.4)]' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
                                          >
                                            {label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="text-base sm:text-lg font-black text-amber-400 tabular-nums">
                                      ₹{getDishPrice(item)}
                                    </span>

                                    {/* Add to Cart logic */}
                                    {item.is_available && (
                                      <div className="shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                                        {quantity > 0 ? (
                                          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-1 py-1 rounded-full shadow-sm animate-fade-in">
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
                                              className="w-7 h-7 flex items-center justify-center bg-white/10 text-white rounded-full font-bold active:scale-95 transition-all hover:bg-white/20"
                                            >
                                              -
                                            </button>
                                            <span className="font-bold text-white text-sm w-4 text-center">{quantity}</span>
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
                                              className="w-7 h-7 flex items-center justify-center bg-white/10 text-white rounded-full font-bold active:scale-95 transition-all hover:bg-white/20"
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
                                            className="bg-[#EA580C] hover:bg-orange-600 text-white px-5 py-1.5 rounded-full font-black text-xs sm:text-sm transition-colors active:scale-95 shadow-sm"
                                          >
                                            ADD
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!item.is_available && (
                                  <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-xl bg-gray-700 text-white text-[10px] font-black px-2.5 py-1 shadow-sm tracking-wider z-10 uppercase">
                                    Out of stock
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Powered By Footer — inside the dark container to keep visual contrast */}
              <footer className="w-full text-center py-10 mt-16 border-t border-white/5 shrink-0 flex flex-col items-center justify-center gap-1.5">
                <span className="text-[9px] tracking-widest font-black uppercase text-gray-500">Powered By</span>
                <Image
                  src="/restdigi-logo.png"
                  alt="RESTDIGI"
                  width={90}
                  height={20}
                  className="h-5 w-auto object-contain drop-shadow-[0_0_8px_rgba(234,88,12,0.6)] select-none"
                />
              </footer>
            </div>
          </div>
        </>
      )}

      {/* Sticky Bottom Bar for Cart */}
      {cartItemCount > 0 && !showTracking && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up sm:max-w-md sm:mx-auto">
          <div
            onClick={() => {
              setShowTracking(false);
              setIsCartOpen(true);
            }}
            className="bg-[#EA580C] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-orange-500/20 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer shadow-[0_0_20px_rgba(234,88,12,0.4)]"
          >
            <div className="flex flex-col">
              <span className="font-bold text-[10px] uppercase tracking-widest text-white/70">{cartItemCount} Items Added</span>
              <span className="font-black text-xl tabular-nums">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <span>View Cart & Order</span>
              <span className="w-8 h-8 rounded-full bg-[#07080B] text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
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
            className="bg-[#0F1012] text-white px-5 h-14 rounded-full shadow-lg border border-white/10 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-transform font-bold cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.4)]"></span>
            <span className="text-xs uppercase tracking-wider">Track Order</span>
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
              transition={{ duration: 0.1 }}
              onClick={() => setSelectedDish(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-6">
              <motion.div
                layoutId={`dish-${selectedDish.id}`}
                transition={springTransition}
                className="relative bg-[#0F1012] border border-white/10 w-full h-[85vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-[2rem] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl pointer-events-auto"
              >
                <div className="relative h-64 sm:h-80 w-full bg-gradient-to-br from-white/5 to-white/10 shrink-0 flex items-center justify-center border-b border-white/10">
                  {selectedDish.image_url ? (
                    <>
                      <Image
                        src={selectedDish.image_url}
                        fill
                        sizes="(max-width: 640px) 100vw, 512px"
                        alt={selectedDish.name}
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                    </>
                  ) : (
                    <span className="text-6xl font-black text-gray-500 uppercase select-none">{selectedDish.name.charAt(0)}</span>
                  )}

                  {/* X Close Button — always visible on top of image */}
                  <button
                    onClick={() => setSelectedDish(null)}
                    className="absolute top-4 right-4 z-30 w-11 h-11 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 shadow-lg transition-all active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#0F1012]">
                  {(selectedDish.isBestSeller || (selectedDish.view_count || 0) >= 100) && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        <span>⭐</span> Bestseller Dish of Week
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {selectedDish.name}
                    </h2>
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 shrink-0">
                      ₹{getDishPrice(selectedDish)}
                    </span>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: 0.02 }}
                    className="text-[#A0A0A0] text-sm sm:text-base leading-relaxed mb-8"
                  >
                    {selectedDish.description || "Prepared with fresh ingredients and our secret house spices."}
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, delay: 0.04 }}
                  className="p-4 sm:p-6 border-t border-white/10 bg-[#0F1012] shrink-0"
                >
                  {(() => {
                    const price = Number(getDishPrice(selectedDish));
                    const sizeKey = selectedDish.sizes && Object.keys(selectedDish.sizes).length > 0
                      ? Object.keys(selectedDish.sizes)[selectedSizes[selectedDish.id] || 0]
                      : 'Standard';

                    return (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/10">
                          <button
                            onClick={() => setDishQuantity(Math.max(1, dishQuantity - 1))}
                            className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xl shadow-sm border border-white/10"
                          >
                            -
                          </button>
                          <span className="font-black text-xl w-12 text-center text-white">{dishQuantity}</span>
                          <button
                            onClick={() => setDishQuantity(Math.min(10, dishQuantity + 1))}
                            className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xl shadow-sm border border-white/10"
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
                          className="w-full bg-[#EA580C] hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg transition-transform hover:scale-[1.02] flex items-center justify-between px-6 shadow-[0_0_20px_rgba(234,88,12,0.4)]"
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
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[70] bg-[#0F1012] border-t border-white/10 rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] sm:max-w-md sm:mx-auto text-white"
            >
              <button
                onClick={() => setIsCartOpen(false)}
                className="absolute top-5 right-5 z-[80] w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white shadow-sm transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-4 flex justify-center shrink-0">
                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              </div>

              <div className="px-6 pb-4 border-b border-white/5 shrink-0">
                <h2 className="text-2xl font-black text-white">
                  {isCancelViewOpen ? "Cancel Items" : showTracking ? "KOT Status" : "Your Cart"}
                </h2>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-hide">
                {showTracking && activeOrderIds.length > 0 ? (
                  isCancelViewOpen ? (
                    <div className="flex flex-col gap-6">
                      <span className="font-bold text-xs uppercase text-gray-500 tracking-wider px-1">Select items to cancel</span>

                      {(() => {
                        const pendingOrders = trackedOrders.filter(order => order.status === 'pending');
                        const allPendingItems: { orderId: string, dishId: string, size: string, name: string, price: number, quantity: number }[] = [];
                        pendingOrders.forEach(order => {
                          const orderItems = order.items || [];
                          orderItems.forEach((item: any) => {
                            allPendingItems.push({
                              orderId: order.id,
                              dishId: item.dish_id,
                              size: item.size || 'Standard',
                              name: item.name,
                              price: item.price,
                              quantity: item.quantity
                            });
                          });
                        });

                        if (allPendingItems.length === 0) {
                          return (
                            <div className="text-center py-12 text-gray-400 font-medium">
                              No pending items available to cancel.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {allPendingItems.map((item, idx) => {
                              const dishDetail = dishes.find(d => d.id === item.dishId);
                              const imgUrl = dishDetail?.image_url;
                              const isSelected = selectedCancelItems.some(
                                i => i.orderId === item.orderId && i.dishId === item.dishId && i.size === item.size
                              );

                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleToggleCancelItem(item)}
                                  className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer items-center select-none ${isSelected ? 'border-red-500/40 bg-red-500/[0.03] shadow-[0_0_15px_rgba(239,68,68,0.08)]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.03]'}`}
                                >
                                  <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden relative shrink-0 border border-white/5 flex items-center justify-center">
                                    {imgUrl ? (
                                      <Image src={imgUrl} fill sizes="48px" alt={item.name} className="object-cover" />
                                    ) : (
                                      <span className="text-xs font-black text-gray-500 uppercase">{item.name.charAt(0)}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-xs font-black text-gray-400">Qty: {item.quantity}</span>
                                      {item.size && item.size !== 'Standard' && (
                                        <span className="text-[9px] bg-white/5 text-gray-300 px-1 py-0.5 rounded border border-white/10 font-bold uppercase tracking-wider">{item.size}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-sm text-[#EA580C] tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-red-600 border-red-600 text-white' : 'border-white/20'}`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {trackedOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <Loader2 className="w-8 h-8 animate-spin text-[#EA580C] mb-3" />
                          <p className="font-bold text-sm">Retrieving order details...</p>
                        </div>
                      ) : (
                        <>
                          {/* Upper Card: KOT Confirmed */}
                          {(() => {
                            const activeOrdersList = [...trackedOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                            const primaryOrder = activeOrdersList[0];
                            const orderTimeStr = primaryOrder
                              ? new Date(primaryOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Just now';

                            return (
                              <div className="bg-white text-[#0F1012] rounded-3xl p-5 shadow-lg flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-black text-gray-450 uppercase tracking-widest block mb-1">Kitchen Order Ticket</span>
                                    <h3 className="text-xl font-black text-[#0F1012] leading-none">KOT Confirmed</h3>
                                  </div>
                                  <span className="bg-[#EA580C] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_12px_rgba(234,88,12,0.2)]">
                                    {formatTableNumber(tableNo) || '-'}
                                  </span>
                                </div>

                                <div className="border-t border-gray-100 pt-3.5 flex justify-between items-center text-xs">
                                  <div>
                                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px] mb-0.5">Order Time</p>
                                    <p className="font-black text-gray-900">{orderTimeStr}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px] mb-0.5">Est. Ready In</p>
                                    <p className="font-black text-[#B27A23]">15 - 20 mins</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Middle Card: Cooking Animation */}
                          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                              <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="text-[#EA580C]"
                              >
                                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M4 11h11a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3Z" fill="currentColor" fillOpacity="0.05" />
                                  <path d="M18 14.5h4" strokeLinecap="round" />
                                  <motion.path
                                    animate={{ opacity: [0.3, 1, 0.3], y: [1, -2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                    d="M6 7c0-1.5 1-2.5 1-2.5M10 7c0-1.5 1-2.5 1-2.5M14 7c0-1.5 1-2.5 1-2.5"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </motion.div>
                            </div>
                            <p className="text-xs font-black text-white text-center uppercase tracking-wider mb-1">
                              {orderStatus === 'pending' && "Order Queued"}
                              {orderStatus === 'preparing' && "Preparing Meal"}
                              {orderStatus === 'served' && "Meal Served"}
                              {orderStatus === 'cancelled' && "Order Cancelled"}
                            </p>
                            <p className="text-[11px] text-gray-400 text-center max-w-[85%] leading-normal">
                              {orderStatus === 'pending' && "Your ticket is received and will be sent to the kitchen shortly."}
                              {orderStatus === 'preparing' && "The chef has started cooking your food with fresh ingredients."}
                              {orderStatus === 'served' && "Your hot meal has been delivered. Bon appétit!"}
                              {orderStatus === 'cancelled' && "This order ticket was cancelled. Please contact staff if this is an error."}
                            </p>
                          </div>

                          {/* Lower Card: Stepper */}
                          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
                            <div className="relative pl-8 space-y-8">
                              {/* Stepper Vertical line */}
                              <div className="absolute top-2 bottom-2 left-[11px] w-[2px] bg-white/10">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{
                                    height:
                                      orderStatus === 'pending' ? '0%' :
                                        orderStatus === 'preparing' ? '50%' :
                                          orderStatus === 'served' ? '100%' : '0%'
                                  }}
                                  transition={{ duration: 0.5, ease: "easeInOut" }}
                                  className="w-full bg-[#EA580C] shadow-[0_0_8px_rgba(234,88,12,0.4)]"
                                />
                              </div>

                              {[
                                { label: 'Order Received', desc: 'Added to live kitchen queue', active: orderStatus === 'pending' || orderStatus === 'preparing' || orderStatus === 'served' },
                                { label: 'Cooking KOT', desc: 'Being prepared by the chefs', active: orderStatus === 'preparing' || orderStatus === 'served' },
                                { label: 'Served & Ready', desc: 'Delivered hot to your table', active: orderStatus === 'served' }
                              ].map((step, index) => {
                                const isActive = step.active && orderStatus !== 'cancelled';
                                return (
                                  <div key={index} className="relative flex gap-4 items-start">
                                    {/* Dot / Indicator */}
                                    <div className="absolute -left-[29px] top-1 z-10 flex items-center justify-center">
                                      {isActive ? (
                                        <div className="relative">
                                          <div className="w-[24px] h-[24px] rounded-full bg-[#EA580C] flex items-center justify-center text-white font-black text-[10px] shadow-[0_0_12px_rgba(234,88,12,0.4)]">
                                            <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                          <span className="absolute -inset-1 rounded-full bg-[#EA580C]/30 animate-ping z-0" />
                                        </div>
                                      ) : (
                                        <div className="w-[24px] h-[24px] rounded-full bg-[#16181B] border-2 border-white/20 flex items-center justify-center text-gray-500 font-bold text-xs" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h5 className={`font-black text-sm transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}>{step.label}</h5>
                                      <p className={`text-xs mt-0.5 transition-colors ${isActive ? 'text-gray-300' : 'text-gray-655'}`}>{step.desc}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Detailed KOT Ticket Items List */}
                          <div className="flex flex-col gap-4 mt-2">
                            <span className="font-bold text-xs uppercase text-gray-500 tracking-wider px-1">KOT Ticket Details</span>

                            {trackedOrders.map((order, orderIdx) => {
                              const orderItems = originalItemsCache[order.id] || order.items || [];
                              const isOrderCancelled = order.status === 'cancelled';
                              const isOrderServed = order.status === 'served';
                              const isOrderPreparing = order.status === 'preparing';
                              const isOrderPending = order.status === 'pending';

                              return (
                                <div
                                  key={order.id}
                                  className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 shadow-lg flex flex-col gap-4 relative overflow-hidden transition-all duration-200"
                                >
                                  {/* Card Header */}
                                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                    <div>
                                      <span className="text-[10px] font-black text-gray-550 uppercase tracking-widest block leading-none mb-1">
                                        KOT Ticket #{orderIdx + 1}
                                      </span>
                                      <span className="text-sm font-black text-white leading-none">
                                        {tableNo ? formatTableNumber(tableNo) : 'WhatsApp Order'}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {isOrderPending && <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Pending</span>}
                                      {isOrderPreparing && <span className="flex items-center gap-1 text-[10px] font-black text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span> Preparing</span>}
                                      {isOrderServed && <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Served</span>}
                                      {isOrderCancelled && <span className="flex items-center gap-1 text-[10px] font-black text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Cancelled</span>}
                                    </div>
                                  </div>

                                  {/* Items List */}
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
                                            {activeQty > 0 && (
                                              <motion.div
                                                key={`active-${item.dish_id}-${item.size || 'Standard'}`}
                                                initial={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                                className="flex gap-3 items-center"
                                              >
                                                <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden relative shrink-0 border border-white/5 flex items-center justify-center">
                                                  {imgUrl ? (
                                                    <Image src={imgUrl} fill sizes="40px" alt={item.name} className="object-cover" />
                                                  ) : (
                                                    <span className="text-xs font-black text-gray-500 uppercase select-none">{item.name.charAt(0)}</span>
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                                                  <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs font-black text-gray-400">Qty: {activeQty}</span>
                                                    {item.size && item.size !== 'Standard' && (
                                                      <span className="text-[9px] bg-white/5 text-gray-300 px-1 py-0.5 rounded border border-white/10 font-bold uppercase tracking-wider">{item.size}</span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="font-black text-sm text-[#EA580C] tabular-nums">₹{(item.price * activeQty).toFixed(2)}</span>
                                                </div>
                                              </motion.div>
                                            )}

                                            {cancelledQty > 0 && (
                                              <motion.div
                                                key={`cancelled-${item.dish_id}-${item.size || 'Standard'}`}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="flex gap-3 items-center opacity-40 line-through text-gray-550"
                                              >
                                                <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden relative shrink-0 border border-white/5 flex items-center justify-center grayscale">
                                                  {imgUrl ? (
                                                    <Image src={imgUrl} fill sizes="40px" alt={item.name} className="object-cover" />
                                                  ) : (
                                                    <span className="text-xs font-black text-gray-500 uppercase select-none">{item.name.charAt(0)}</span>
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <h4 className="font-bold text-sm text-gray-555 truncate">{item.name}</h4>
                                                  <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs font-medium text-gray-550">Qty: {cancelledQty}</span>
                                                    {item.size && item.size !== 'Standard' && (
                                                      <span className="text-[9px] bg-white/5 text-gray-555 px-1 py-0.5 rounded border border-white/10 font-bold uppercase tracking-wider">{item.size}</span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <span className="text-[9px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/25 flex items-center gap-1">
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

                                  {/* Total */}
                                  <div className="border-t border-dashed border-white/10 pt-3 flex justify-between items-center mt-1">
                                    <span className="font-bold text-xs text-gray-555 uppercase tracking-wide">Ticket Total</span>
                                    <span className="font-black text-base text-[#EA580C] tabular-nums">
                                      ₹{Number(order.total_amount || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )
                ) : cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
                    <p className="font-bold text-lg text-white">Cart is empty</p>
                    <p className="text-sm text-gray-400 mt-1">Add some delicious dishes!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-4 bg-white/[0.03] p-3.5 rounded-2xl border border-white/10 shadow-sm items-center">
                        <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden relative shrink-0">
                          {item.img && <Image src={item.img} fill sizes="64px" alt={item.name} className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate">{item.name}</h4>
                          <div className="flex flex-col mt-1 gap-0.5">
                            <span className="font-black text-[#EA580C]">₹{item.price}</span>
                            {item.size !== 'Standard' && (
                              <span className="text-[10px] text-gray-450 font-black uppercase tracking-widest mt-0.5">
                                {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
                          <button onClick={() => {
                            setCart(prev => {
                              const newCart = [...prev];
                              newCart[idx].quantity -= 1;
                              if (newCart[idx].quantity <= 0) newCart.splice(idx, 1);
                              return newCart;
                            });
                          }} className="w-7 h-7 flex items-center justify-center font-bold bg-white/10 rounded shadow-sm text-white hover:bg-white/20 active:scale-95 transition-all">-</button>
                          <span className="font-bold w-4 text-center text-sm text-white">{item.quantity}</span>
                          <button onClick={() => {
                            setCart(prev => {
                              const newCart = [...prev];
                              newCart[idx].quantity = Math.min(10, newCart[idx].quantity + 1);
                              return newCart;
                            });
                          }} className="w-7 h-7 flex items-center justify-center font-bold bg-white/10 rounded shadow-sm text-white hover:bg-white/20 active:scale-95 transition-all">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              {showTracking && activeOrderIds.length > 0 ? (
                isCancelViewOpen ? (
                  <div className="p-6 bg-[#0F1012] border-t border-white/10 shrink-0 flex flex-col gap-3">
                    <button
                      onClick={handleCancelSelectedItems}
                      disabled={selectedCancelItems.length === 0}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-white/5 disabled:text-gray-500 disabled:border-white/5 text-white py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 cursor-pointer text-sm text-center"
                    >
                      Cancel {selectedCancelItems.length > 0 ? selectedCancelItems.length : ""}
                    </button>
                    <button
                      onClick={() => {
                        setIsCancelViewOpen(false);
                        setSelectedCancelItems([]);
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-4 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer text-sm text-center"
                    >
                      Go Back
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-[#0F1012] border-t border-white/10 shrink-0 flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setShowTracking(false);
                        setIsCartOpen(false);
                      }}
                      className="w-full bg-[#EA580C] text-white hover:bg-[#EA580C] py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(234,88,12,0.4)] active:scale-95 cursor-pointer text-sm text-center"
                    >
                      Order More Items
                    </button>
                    <button
                      onClick={() => setIsCancelViewOpen(true)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-4 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer text-sm text-center flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                      Cancel Item
                    </button>
                  </div>
                )
              ) : (
                !showTracking && cart.length > 0 && (
                  <div className="p-6 bg-[#0F1012] border-t border-white/10 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-400">Total Amount</span>
                      <span className="font-black text-2xl text-white">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (!tableNo) {
                          toast.error('Ordering is only available by scanning the QR code at your table.');
                          return;
                        }

                        // Save current cart for rollback if needed
                        const savedCart = [...cart];

                        // Create optimistic order structure
                        const tempOrderId = `temp_${Date.now()}`;
                        const optimisticItems = cart.map(item => ({
                          dish_id: item.dish_id,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                          size: item.size
                        }));

                        const optimisticOrder = {
                          id: tempOrderId,
                          restaurant_id: restaurant.id,
                          table_no: tableNo,
                          status: 'pending',
                          items: optimisticItems,
                          total_amount: cartTotal,
                          created_at: new Date().toISOString()
                        };

                        // Instantly clear cart and switch to tracking view
                        setCart([]);
                        setOrderStatus('pending');
                        setShowTracking(true);
                        setTrackedOrders(prev => [...prev.filter(o => o.id !== tempOrderId), optimisticOrder]);
                        setActiveOrderIds(prev => [...prev.filter(id => id !== tempOrderId), tempOrderId]);

                        // Cache optimistic items list
                        setOriginalItemsCache(prev => {
                          const updated = { ...prev, [tempOrderId]: optimisticItems };
                          if (typeof window !== 'undefined') {
                            localStorage.setItem(`original_items_cache_${params.slug}`, JSON.stringify(updated));
                          }
                          return updated;
                        });

                        // Run DB insert in background
                        try {
                          const { data, error } = await supabase
                            .from('orders')
                            .insert({
                              restaurant_id: restaurant.id,
                              table_no: tableNo,
                              status: 'pending',
                              items: optimisticItems,
                              total_amount: cartTotal
                            })
                            .select()
                            .single();

                          if (error) throw error;

                          // Replace temp ID with real ID in state & cache
                          setActiveOrderIds(prev => {
                            const filtered = prev.filter(id => id !== tempOrderId);
                            const updated = [...filtered, data.id];
                            if (typeof window !== 'undefined') {
                              localStorage.setItem(`active_order_ids_${params.slug}`, JSON.stringify(updated));
                            }
                            return updated;
                          });

                          setOriginalItemsCache(prev => {
                            const updated: Record<string, any[]> = { ...prev, [data.id]: optimisticItems };
                            delete updated[tempOrderId];
                            if (typeof window !== 'undefined') {
                              localStorage.setItem(`original_items_cache_${params.slug}`, JSON.stringify(updated));
                            }
                            return updated;
                          });

                          setTrackedOrders(prev => prev.map(o => o.id === tempOrderId ? data : o));

                        } catch (err: any) {
                          console.error('Order placement failed:', err);
                          // Rollback on failure
                          setCart(savedCart);
                          setOrderStatus('idle');
                          setShowTracking(false);
                          setTrackedOrders([]);
                          setActiveOrderIds([]);
                          toast.error(`Order failed: ${err.message || 'Please check your connection.'}`);
                        }
                      }}
                      className={`w-full py-4 rounded-2xl font-black text-lg transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,88,12,0.4)] text-white cursor-pointer bg-[#EA580C] hover:bg-orange-600`}
                    >
                      Place KOT Order
                    </button>
                  </div>
                )
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
