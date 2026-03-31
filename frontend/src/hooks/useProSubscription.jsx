import { useState, useEffect } from 'react';

/**
 * Centralized hook for Pro subscription status.
 * Listens to localStorage changes so subscription updates sync across all pages.
 * 
 * @returns {Object} { isProUser: boolean, subscriptionPlan: string, refreshSubscription: function }
 */
export const useProSubscription = () => {
  const getUserStorageKey = () => {
    const raw = localStorage.getItem('userId') || '';
    const normalized = raw.includes('/') ? raw.split('/').pop() : raw;
    return String(normalized || '').trim() || 'guest';
  };

  const getProStatus = () => {
    const userId = getUserStorageKey();
    const billingData = JSON.parse(localStorage.getItem(`billing_${userId}`) || '{}');
    const plan = String(billingData.plan || '').toLowerCase();
    // Source of truth should be per-user billing plan; keep global flag only as fallback.
    const isPro = plan ? plan === 'pro' : localStorage.getItem('isProUser') === 'true';
    return {
      isProUser: isPro,
      subscriptionPlan: plan || 'basic',
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
