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
      isLoading,
      hasActivePlan: false,
      subscriptionStatus: null
    };
  }

  const planType = restaurant.plan_type || 'free';
  const subscriptionStatus = restaurant.subscription_status || null;
  const trialEndsAt = restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const expiryDate = restaurant.expiry_date ? new Date(restaurant.expiry_date) : null;
  const now = new Date();

  const isBasicTrial = planType === 'basic' && (
    (payments && payments.some(p => p.plan_type === 'basic' && (p.payment_method === 'free_trial' || p.payment_method === 'free_trier'))) ||
    (!payments || !payments.some(p => p.plan_type === 'basic' && p.payment_method === 'razorpay' && p.status === 'success'))
  );

  const isTrial = (planType === 'free' && !!trialEndsAt) || isBasicTrial;
  const isExpired = planType !== 'free' && expiryDate
    ? now > expiryDate
    : (trialEndsAt ? now > trialEndsAt : false);

  let daysLeft: number | null = null;
  if (planType !== 'free' && expiryDate) {
    const diffTime = expiryDate.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (trialEndsAt) {
    const diffTime = trialEndsAt.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Available plans are strictly restricted to: 'basic', 'pro', 'premium', and 'enterprise'.
  const validPlans = ['basic', 'pro', 'premium', 'enterprise'];
  const hasActivePlan = validPlans.includes(planType) && subscriptionStatus === 'active' && !isExpired;

  return {
    planType,
    isTrial,
    daysLeft: daysLeft !== null ? Math.max(0, daysLeft) : null,
    canViewRevenue: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    canViewAllAnalytics: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    canCustomBrand: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    canWhatsAppOrder: ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired),
    isExpired,
    isLoading,
    hasActivePlan,
    subscriptionStatus
  };
};
