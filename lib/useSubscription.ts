import { useRestaurant } from './RestaurantContext';

export const useSubscription = () => {
  const { restaurant, payments, isLoading } = useRestaurant();

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

  const isBasicTrial = planType === 'basic' && 
    payments && payments.some(p => p.plan_type === 'basic' && p.payment_method === 'free_trial') &&
    !payments.some(p => p.plan_type === 'basic' && p.payment_method === 'razorpay' && p.status === 'success');

  const isTrial = (planType === 'free' && !!trialEndsAt) || isBasicTrial;
  const isExpired = isBasicTrial && restaurant.expiry_date
    ? now > new Date(restaurant.expiry_date)
    : (planType === 'free' && trialEndsAt ? now > trialEndsAt : false);

  let daysLeft = 0;
  if (isBasicTrial && restaurant.expiry_date) {
    const expiry = new Date(restaurant.expiry_date);
    const diffTime = expiry.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (trialEndsAt) {
    const diffTime = trialEndsAt.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    planType,
    isTrial,
    daysLeft: Math.max(0, daysLeft),
    canViewRevenue: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    canViewAllAnalytics: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    canCustomBrand: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    canWhatsAppOrder: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    isExpired,
    isLoading
  };
};
