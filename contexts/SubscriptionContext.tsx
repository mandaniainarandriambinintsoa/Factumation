import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { getPlan, type Plan } from '../lib/plans';
import { getUserSubscription, getMonthlyUsage, type Subscription } from '../services/subscriptionService';

interface SubscriptionContextType {
  subscription: Subscription | null;
  plan: Plan;
  usage: { invoices: number; quotes: number };
  loading: boolean;
  canCreateInvoice: boolean;
  canCreateQuote: boolean;
  isPro: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState({ invoices: 0, quotes: 0 });
  const [loading, setLoading] = useState(true);

  const plan = getPlan(subscription?.plan || 'free');
  const isPro = plan.id !== 'free' && subscription?.status === 'active';

  const canCreateInvoice = plan.features.invoicesPerMonth === -1 || usage.invoices < plan.features.invoicesPerMonth;
  const canCreateQuote = plan.features.quotesPerMonth === -1 || usage.quotes < plan.features.quotesPerMonth;

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setUsage({ invoices: 0, quotes: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    const [sub, monthlyUsage] = await Promise.all([
      getUserSubscription(),
      getMonthlyUsage(),
    ]);
    setSubscription(sub);
    setUsage(monthlyUsage);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for realtime subscription changes
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plan,
        usage,
        loading,
        canCreateInvoice,
        canCreateQuote,
        isPro,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
