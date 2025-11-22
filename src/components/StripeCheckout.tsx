import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { CreditCard, Loader2 } from 'lucide-react';

interface StripeCheckoutProps {
  amount: number;
  tier: 'lifetime' | 'season';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StripeCheckout({ amount, tier, onSuccess, onError }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const product = STRIPE_PRODUCTS.find(p =>
    tier === 'lifetime' ? p.name.includes('Lifetime') : p.name.includes('Season')
  );

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        onError?.('Please sign in to continue');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: product?.priceId,
          mode: product?.mode || 'payment',
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      onError?.(error instanceof Error ? error.message : 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="bg-red-950/20 border border-red-900/30 p-4 text-center">
        <p className="text-red-400 text-sm">Product configuration error</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-accent-yellow text-black font-bold py-3 hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide uppercase flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            PROCESSING...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            COMPLETE PAYMENT
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">
        You'll be redirected to Stripe's secure checkout
      </p>
    </div>
  );
}