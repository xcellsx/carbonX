import { useState, useEffect } from 'react';

/**
 * Centralized hook for Pro subscription status.
 * Listens to localStorage changes so subscription updates sync across all pages.
 * 
 * @returns {Object} { isProUser: boolean, subscriptionPlan: string, refreshSubscription: function }
 */
export const useProSubscription = () => {
  const getProStatus = () => {
    const isPro = localStorage.getItem('isProUser') === 'true';
    const userId = localStorage.getItem('userId') || 'guest';
    const billingData = JSON.parse(localStorage.getItem(`billing_${userId}`) || '{}');
    return {
      isProUser: isPro,
      subscriptionPlan: billingData.plan || 'basic',
      billingData,
    };
  };

  const [subscription, setSubscription] = useState(getProStatus());

  // Listen for localStorage changes (when Settings updates subscription)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isProUser' || e.key?.startsWith('billing_')) {
        setSubscription(getProStatus());
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (same-tab updates)
    const handleCustomStorage = () => {
      setSubscription(getProStatus());
    };
    window.addEventListener('subscriptionUpdated', handleCustomStorage);

    // Initial check
    setSubscription(getProStatus());

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('subscriptionUpdated', handleCustomStorage);
    };
  }, []);

  // Manual refresh function (call after updating subscription)
  const refreshSubscription = () => {
    setSubscription(getProStatus());
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new Event('subscriptionUpdated'));
  };

  return {
    isProUser: subscription.isProUser,
    subscriptionPlan: subscription.subscriptionPlan,
    billingData: subscription.billingData,
    refreshSubscription,
  };
};
