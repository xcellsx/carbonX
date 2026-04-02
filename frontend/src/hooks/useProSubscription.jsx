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
    return String(normalized || '').trim() || '';
  };

  const getProStatus = () => {
    const userId = getUserStorageKey();
    // Logged out: never treat billing_guest or stale isProUser as Pro.
    if (!userId) {
      return {
        isProUser: false,
        subscriptionPlan: 'basic',
        billingData: {},
      };
    }
    const billingData = JSON.parse(localStorage.getItem(`billing_${userId}`) || '{}');
    const plan = String(billingData.plan || '').toLowerCase();
    // billing_* is source of truth when present; isProUser is a login-time cache for UI.
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
      if (e.key === 'isProUser' || e.key === 'userId' || e.key?.startsWith('billing_')) {
        setSubscription(getProStatus());
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    const handleCustomStorage = () => {
      setSubscription(getProStatus());
    };
    window.addEventListener('subscriptionUpdated', handleCustomStorage);
    window.addEventListener('carbonx-session-updated', handleCustomStorage);

    setSubscription(getProStatus());

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('subscriptionUpdated', handleCustomStorage);
      window.removeEventListener('carbonx-session-updated', handleCustomStorage);
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
