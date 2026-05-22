import { useRestaurant } from './RestaurantContext';

export const useSubscription = () => {
  const { restaurant, isLoading } = useRestaurant();

  if (isLoading || !restaurant) {
    return {
      planType: 'free',
      isTrial: false,
      daysLeft: 0,
      canViewRevenue: false,
      canViewAllAnalytics: false,
      isExpired: false,
      isLoading
    };
  }

  const planType = restaurant.plan_type || 'free';
  const trialEndsAt = restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const now = new Date();

  const isTrial = planType === 'free' && !!trialEndsAt;
  const isExpired = planType === 'free' && trialEndsAt ? now > trialEndsAt : false;

  let daysLeft = 0;
  if (trialEndsAt) {
    const diffTime = trialEndsAt.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    planType,
    isTrial,
    daysLeft: Math.max(0, daysLeft),
    canViewRevenue: ['pro', 'premium', 'enterprise'].includes(planType) || (isTrial && !isExpired),
    canViewAllAnalytics: ['pro', 'premium', 'enterprise'].includes(planType) || (isTrial && !isExpired),
    canCustomBrand: ['pro', 'premium', 'enterprise'].includes(planType) || (isTrial && !isExpired),
    canWhatsAppOrder: ['pro', 'premium', 'enterprise'].includes(planType) || (isTrial && !isExpired),
    isExpired,
    isLoading
  };
};
