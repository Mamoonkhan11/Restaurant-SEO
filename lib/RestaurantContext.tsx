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
  refreshRestaurant: async () => { },
  audioMuted: false,
  setAudioMuted: () => { },
  isAlerting: false,
  setIsAlerting: () => { },
  audioNeedsInteraction: false,
  handleToggleAudio: () => { },
  playSynthesizedBell: (singleRound?: boolean) => { },
});

export const useRestaurant = () => useContext(RestaurantContext);

export const RestaurantProvider = ({ children }: { children: React.ReactNode }) => {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [audioMuted, setAudioMuted] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);

  const audioMutedRef = useRef(audioMuted);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioMutedRef.current = audioMuted;
  }, [audioMuted]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_audio_muted');
      setAudioMuted(saved === 'true');
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
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const rounds = singleRound ? [0.0] : [0.0, 2.0, 4.0];
      const notes = [523.25, 659.25, 783.99];
      const noteDelay = 0.15;
      const noteDecay = 0.6;
      const maxVolume = 0.25;

      rounds.forEach((roundStart) => {
        notes.forEach((freq, idx) => {
          const startTime = now + roundStart + (idx * noteDelay);
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(maxVolume * (1 - idx * 0.15), startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDecay);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + noteDecay + 0.1);
        });
      });
    } catch (err) {
      console.error("Audio playback error:", err);
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
          playSynthesizedBell(true);
        });
      }
    } else {
      setIsAlerting(false);
    }
  };

  useEffect(() => {
    if (!isAlerting || audioMuted) return;

    const interval = setInterval(() => {
      playSynthesizedBell();
    }, 9500);

    return () => clearInterval(interval);
  }, [isAlerting, audioMuted]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let listenersRegistered = false;

    const resumeAudio = async () => {
      const ctx = getAudioContext();
      if (ctx) {
        await ctx.resume();
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
    };

    const removeListeners = () => {
      if (!listenersRegistered) return;
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
      listenersRegistered = false;
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
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr && userErr.name !== 'AuthSessionMissingError') {
      console.error("Error fetching user session:", userErr);
    }

    if (user) {
      const { data, error: fetchErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (fetchErr) {
        console.error("Error fetching restaurant profile:", fetchErr);
      }

      let restaurantData = data;
      if (restaurantData && (restaurantData.plan_type === 'free' || !restaurantData.plan_type) && restaurantData.subscription_status !== 'active') {
        let count = 0;
        const { count: restCount, error: restErr } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('plan_type', 'basic');
        if (restErr) {
          console.error("Error checking basic plans count:", restErr);
        }
        count = restCount || 0;

        if (count < 5) {
          const activeUserId = user.id;
          const newExpiry = new Date();
          newExpiry.setDate(newExpiry.getDate() + 30);

          // 1. Update the core business subscription states directly inside 'restaurants'
          const { error: restaurantUpdateError } = await supabase
            .from('restaurants')
            .update({
              plan_type: 'basic',
              subscription_status: 'active',
              expiry_date: newExpiry.toISOString()
            })
            .eq('owner_id', activeUserId); // Matches the unique ID of the restaurant owner

          if (restaurantUpdateError) throw restaurantUpdateError;

          // Re-fetch the updated restaurant data
          const { data: refetchedRest, error: refetchRestErr } = await supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', activeUserId)
            .single();

          if (!refetchRestErr && refetchedRest) {
            restaurantData = refetchedRest;
          }

          const { data: targetRestaurant } = await supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', activeUserId)
            .single();

          if (targetRestaurant) {
            const targetRestaurantId = targetRestaurant.id;
            const payload = {
              restaurant_id: String(targetRestaurantId),
              amount: parseFloat("0.00"),
              plan_tier: 'basic',
              billing_cycle: 'monthly',
              status: 'success',
              payment_gateway: 'system_promo',
              description: 'Automated 1-Month Early Adopter Promotional Free Activation',
              created_at: new Date().toISOString()
            };

            await supabase.from('payments').insert([payload]);
          }
        }
      }

      setRestaurant(restaurantData);

      if (restaurantData) {
        const { data: paymentsData, error: paymentsErr } = await supabase
          .from('payments')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .order('created_at', { ascending: false });

        if (paymentsErr) {
          console.error("Error fetching payments history:", paymentsErr);
        }

        let paymentsList = paymentsData || [];

        if (restaurantData.plan_type === 'basic' && paymentsList.length === 0) {
          const { error: insertErr } = await supabase.from('payments').insert({
            restaurant_id: restaurantData.id,
            amount: 0,
            plan_tier: 'basic',
            billing_cycle: 'monthly',
            status: 'success',
            payment_gateway: 'system_promo',
            description: 'Automated 1-Month Early Adopter Promotional Free Activation',
            created_at: new Date().toISOString()
          });

          if (insertErr) {
            console.error("Self-healing error inserting payment:", insertErr);
          } else {
            const { data: refetchedPayments, error: refetchErr } = await supabase
              .from('payments')
              .select('*')
              .eq('restaurant_id', restaurantData.id)
              .order('created_at', { ascending: false });
            if (refetchErr) {
              console.error("Self-healing re-fetch error:", refetchErr);
            }
            paymentsList = refetchedPayments || [];
          }
        }

        setPayments(paymentsList);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRestaurant();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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

  useEffect(() => {
    if (!restaurant?.owner_id) return;

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
            setRestaurant(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.owner_id]);

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
            if (!audioMutedRef.current) {
              setIsAlerting(true);
              playSynthesizedBell();
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
            if (payload.new.status === 'cancelled' || payload.new.status === 'served') {
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
        () => {
          setIsAlerting(false);
        }
      )
      .subscribe();

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
