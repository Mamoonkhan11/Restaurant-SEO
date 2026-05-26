"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from './supabase';

type RestaurantContextType = {
  restaurant: any;
  payments: any[];
  isLoading: boolean;
  refreshRestaurant: () => Promise<void>;
  audioMuted: boolean;
  setAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isAlerting: boolean;
  setIsAlerting: React.Dispatch<React.SetStateAction<boolean>>;
  audioNeedsInteraction: boolean;
  handleToggleAudio: () => void;
  playSynthesizedBell: (singleRound?: boolean) => void;
};

const RestaurantContext = createContext<RestaurantContextType>({
  restaurant: null,
  payments: [],
  isLoading: true,
  refreshRestaurant: async () => {},
  audioMuted: false,
  setAudioMuted: () => {},
  isAlerting: false,
  setIsAlerting: () => {},
  audioNeedsInteraction: false,
  handleToggleAudio: () => {},
  playSynthesizedBell: (singleRound?: boolean) => {},
});

export const useRestaurant = () => useContext(RestaurantContext);

export const RestaurantProvider = ({ children }: { children: React.ReactNode }) => {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Audio States
  const [audioMuted, setAudioMuted] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);

  const audioMutedRef = useRef(audioMuted);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioMutedRef.current = audioMuted;
  }, [audioMuted]);

  // Load the initial audio preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_audio_muted');
      if (saved !== null) {
        setAudioMuted(saved === 'true');
      } else {
        setAudioMuted(false);
      }
    }
  }, []);

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSynthesizedBell = (singleRound = false) => {
    console.log("🔔 playSynthesizedBell() called. AudioContext state:", audioCtxRef.current?.state);
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        console.warn("🔔 Failed to get AudioContext");
        return;
      }

      const now = ctx.currentTime;
      console.log("🔔 Playing soft notification chime arpeggio at AudioContext time:", now);

      // Play 3 rounds, or just 1 round if singleRound is true
      const rounds = singleRound ? [0.0] : [0.0, 2.0, 4.0];
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const noteDelay = 0.15; // Fast arpeggio speed (0.15s between notes)
      const noteDecay = 0.6;  // Fast decay for a clean, modern UI alert sound
      const maxVolume = 0.25; // Increased volume level for clear audibility

      rounds.forEach((roundStart) => {
        notes.forEach((freq, idx) => {
          const startTime = now + roundStart + (idx * noteDelay);
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine'; // Pure sine wave for a soft, smooth timbre
          osc.frequency.setValueAtTime(freq, startTime);

          gainNode.gain.setValueAtTime(0, startTime);
          // Soft attack slope (0.02s) to eliminate pop/click artifacts
          gainNode.gain.linearRampToValueAtTime(maxVolume * (1 - idx * 0.15), startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDecay);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + noteDecay + 0.1);
        });
      });
    } catch (err) {
      console.warn("Realtime Audio Playback Intercepted:", err);
    }
  };

  const handleToggleAudio = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_audio_muted', String(nextMuted));
    }

    if (!nextMuted) {
      const ctx = getAudioContext();
      if (ctx) {
        ctx.resume().then(() => {
          setAudioNeedsInteraction(false);
          playSynthesizedBell(true); // Play once on user gesture activation
        });
      }
    } else {
      setIsAlerting(false);
    }
  };

  // Loop the alert sound every 9.5 seconds (6s play window + 3.5s silence gap) if isAlerting is true and not muted
  useEffect(() => {
    if (!isAlerting || audioMuted) return;

    const interval = setInterval(() => {
      playSynthesizedBell();
    }, 9500);

    return () => clearInterval(interval);
  }, [isAlerting, audioMuted]);

  // Acknowledge/clear alert on user interaction
  useEffect(() => {
    if (!isAlerting) return;

    const stopAlerting = () => {
      setIsAlerting(false);
    };

    window.addEventListener('click', stopAlerting);
    window.addEventListener('keydown', stopAlerting);
    window.addEventListener('touchstart', stopAlerting);

    return () => {
      window.removeEventListener('click', stopAlerting);
      window.removeEventListener('keydown', stopAlerting);
      window.removeEventListener('touchstart', stopAlerting);
    };
  }, [isAlerting]);

  // Check browser AudioContext state and manage interaction requirement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let listenersRegistered = false;

    const resumeAudio = async () => {
      console.log("👆 User gesture detected. Attempting to resume AudioContext...");
      const ctx = getAudioContext();
      if (ctx) {
        console.log("State before resume:", ctx.state);
        await ctx.resume();
        console.log("✅ AudioContext state after resume:", ctx.state);
        if (ctx.state === 'running') {
          setAudioNeedsInteraction(false);
          removeListeners();
        }
      }
    };

    const addListeners = () => {
      if (listenersRegistered) return;
      window.addEventListener('click', resumeAudio);
      window.addEventListener('keydown', resumeAudio);
      window.addEventListener('touchstart', resumeAudio);
      listenersRegistered = true;
      console.log("🔊 Registered AudioContext unblocking gesture listeners.");
    };

    const removeListeners = () => {
      if (!listenersRegistered) return;
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
      listenersRegistered = false;
      console.log("🔇 Removed AudioContext unblocking gesture listeners.");
    };

    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        setAudioNeedsInteraction(true);
        addListeners();
      } else if (ctx.state === 'running') {
        setAudioNeedsInteraction(false);
      }
    }

    return () => {
      removeListeners();
    };
  }, []);

  const fetchRestaurant = async () => {
    setIsLoading(true);
    console.log("RestaurantContext: Fetching restaurant session...");
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("RestaurantContext: Get user session error:", userErr);
    }
    
    if (user) {
      console.log("RestaurantContext: User authenticated. Fetching restaurant details for user id:", user.id);
      const { data, error: fetchErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (fetchErr) {
        console.error("RestaurantContext: Error fetching restaurant:", fetchErr);
      }

      let restaurantData = data;
      if (restaurantData && (restaurantData.plan_type === 'free' || !restaurantData.plan_type) && restaurantData.subscription_status !== 'active') {
        console.log("RestaurantContext: Restaurant is on free/null plan. Checking promo slots...");
        let count = 0;
        const { count: restCount, error: restErr } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('plan_type', 'basic');
        if (restErr) {
          console.error("RestaurantContext: Restaurants count check failed:", restErr);
        }
        count = restCount || 0;
        console.log("RestaurantContext: Counted basic users from restaurants:", count);

        if (count < 5) {
          console.log("RestaurantContext: Promo slot available (count < 5). Automatically activating Basic plan...");
          const newExpiry = new Date();
          newExpiry.setDate(newExpiry.getDate() + 30);

          const { data: updatedData, error: updateErr } = await supabase
            .from('restaurants')
            .update({
              plan_type: 'basic',
              subscription_status: 'active',
              expiry_date: newExpiry.toISOString()
            })
            .eq('id', restaurantData.id)
            .select()
            .single();

          if (updateErr) {
            console.error("RestaurantContext: Failed to update restaurant to basic plan:", updateErr);
          }

          if (!updateErr && updatedData) {
            console.log("RestaurantContext: Successfully updated restaurant to basic plan:", updatedData);
            restaurantData = updatedData;
            
            console.log("RestaurantContext: Inserting payment record for free_trier...");
            const { error: payErr } = await supabase.from('payments').insert({
              restaurant_id: restaurantData.id,
              amount: 0,
              plan_type: 'basic',
              status: 'success',
              payment_method: 'free_trier'
            });
            if (payErr) {
              console.error("RestaurantContext: Failed to insert payments history record:", payErr);
            } else {
              console.log("RestaurantContext: Payment history record successfully created!");
            }
          }
        } else {
          console.log("RestaurantContext: Promo count has reached 5. Early adopter promo not applied.");
        }
      }

      setRestaurant(restaurantData);

      if (restaurantData) {
        console.log("RestaurantContext: Loading payments history for restaurant id:", restaurantData.id);
        const { data: paymentsData, error: paymentsErr } = await supabase
          .from('payments')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .order('created_at', { ascending: false });
        
        if (paymentsErr) {
          console.error("RestaurantContext: Error fetching payments history:", paymentsErr);
        }
        
        let paymentsList = paymentsData || [];
        console.log("RestaurantContext: Payments list loaded. Count:", paymentsList.length);

        // Self-healing check: If the restaurant is registered as basic but has 0 payment history records,
        // it means the unauthenticated registration page tried to insert the payment record but got blocked.
        // Let's insert the missing 'free_trier' payment record now under this authenticated session.
        if (restaurantData.plan_type === 'basic' && paymentsList.length === 0) {
          console.log("RestaurantContext: SELF-HEALING: Restaurant is basic but has 0 payments. Attempting to insert payment history...");
          const { error: insertErr } = await supabase.from('payments').insert({
            restaurant_id: restaurantData.id,
            amount: 0,
            plan_type: 'basic',
            status: 'success',
            payment_method: 'free_trier'
          });
          
          if (insertErr) {
            console.error("RestaurantContext: SELF-HEALING: Failed to insert payment history record:", insertErr);
          } else {
            console.log("RestaurantContext: SELF-HEALING: Payment history record successfully inserted! Re-fetching payments...");
            const { data: refetchedPayments, error: refetchErr } = await supabase
              .from('payments')
              .select('*')
              .eq('restaurant_id', restaurantData.id)
              .order('created_at', { ascending: false });
            if (refetchErr) {
              console.error("RestaurantContext: SELF-HEALING: Re-fetching payments error:", refetchErr);
            }
            paymentsList = refetchedPayments || [];
          }
        }

        setPayments(paymentsList);
      }
    } else {
      console.warn("RestaurantContext: No authenticated user session found.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRestaurant();

    // Listen for auth state changes to dynamically trigger fetching or reset the restaurant state
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("RestaurantContext: Auth event fired:", event, session?.user?.id);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchRestaurant();
      } else if (event === 'SIGNED_OUT') {
        setRestaurant(null);
        setPayments([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Realtime channel subscription for postgres UPDATE changes on the current owner's restaurant profile
  useEffect(() => {
    if (!restaurant?.owner_id) return;

    console.log("RestaurantContext: Setting up postgres change channel for owner's restaurant:", restaurant.owner_id);
    const channel = supabase
      .channel('restaurant-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `owner_id=eq.${restaurant.owner_id}`
        },
        (payload) => {
          if (payload.new) {
            console.log("RestaurantContext: Realtime update received from db for restaurant:", payload.new);
            setRestaurant(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log(`RestaurantContext: Postgres change channel status:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.owner_id]);

  // Realtime subscription for incoming orders to trigger the alert chime across all admin pages
  useEffect(() => {
    if (!restaurant?.id) return;

    const ordersSubscription = supabase
      .channel(`global-live-orders-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`
        },
        (payload) => {
          if (payload.new && payload.new.restaurant_id === restaurant.id) {
            console.log("🟢 REALTIME GLOBAL NEW ORDER DETECTED FOR TABLE:", payload.new.table_no);
            if (!audioMutedRef.current) {
              console.log("🔔 Audio is unmuted. Triggering bell ring and loop alert...");
              setIsAlerting(true);
              playSynthesizedBell();
            } else {
              console.log("🔇 Audio is muted. Skipping bell ring.");
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`
        },
        (payload) => {
          if (payload.new && payload.new.restaurant_id === restaurant.id) {
            // If the order status changes to served or cancelled (user/owner deleted/resolved)
            if (payload.new.status === 'cancelled' || payload.new.status === 'served') {
              console.log("🛑 Order resolved or cancelled. Stopping notification sound.");
              setIsAlerting(false);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log("🛑 Order deleted. Stopping notification sound.");
          setIsAlerting(false);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Global Supabase Realtime Subscription Status (orders):`, status);
      });

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [restaurant?.id]);

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        payments,
        isLoading,
        refreshRestaurant: fetchRestaurant,
        audioMuted,
        setAudioMuted,
        isAlerting,
        setIsAlerting,
        audioNeedsInteraction,
        handleToggleAudio,
        playSynthesizedBell
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};
