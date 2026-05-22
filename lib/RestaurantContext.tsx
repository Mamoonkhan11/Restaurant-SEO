"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

type RestaurantContextType = {
  restaurant: any;
  payments: any[];
  isLoading: boolean;
  refreshRestaurant: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextType>({
  restaurant: null,
  payments: [],
  isLoading: true,
  refreshRestaurant: async () => {},
});

export const useRestaurant = () => useContext(RestaurantContext);

export const RestaurantProvider = ({ children }: { children: React.ReactNode }) => {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRestaurant = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      setRestaurant(data);

      if (data) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('restaurant_id', data.id)
          .order('created_at', { ascending: false });
        setPayments(paymentsData || []);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  return (
    <RestaurantContext.Provider value={{ restaurant, payments, isLoading, refreshRestaurant: fetchRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
};
