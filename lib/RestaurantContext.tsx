"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

type RestaurantContextType = {
  restaurant: any;
  isLoading: boolean;
  refreshRestaurant: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextType>({
  restaurant: null,
  isLoading: true,
  refreshRestaurant: async () => {},
});

export const useRestaurant = () => useContext(RestaurantContext);

export const RestaurantProvider = ({ children }: { children: React.ReactNode }) => {
  const [restaurant, setRestaurant] = useState<any>(null);
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
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  return (
    <RestaurantContext.Provider value={{ restaurant, isLoading, refreshRestaurant: fetchRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
};
