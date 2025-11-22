import React, { useEffect, useState } from 'react';
import { Crown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionStatusProps {
  userId?: string;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ userId }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error);
        } else if (data) {
          setSubscription(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
        Free Plan
      </div>
    );
  }

  const getPlanName = (priceId: string) => {
    if (priceId === 'price_1SW2yhEOOYpADD50jiAQgeeP') {
      return 'Lifetime Pass';
    }
    if (priceId === 'price_1SW1yzEOOYpADD50JGzWjIig') {
      return 'Season Pass';
    }
    return 'Premium Plan';
  };

  return (
    <div className="flex items-center text-sm">
      <Crown className="w-4 h-4 mr-2 text-yellow-500" />
      <span className="text-yellow-600 font-medium">
        {getPlanName(subscription.price_id)}
      </span>
    </div>
  );
};