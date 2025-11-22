import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { StripeProduct, formatPrice } from '../stripe-config';

interface PricingCardProps {
  product: StripeProduct;
  onPurchase: (priceId: string) => Promise<void>;
  isPopular?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ 
  product, 
  onPurchase, 
  isPopular = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      await onPurchase(product.priceId);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = product.name.includes('Lifetime') 
    ? [
        'Unlimited hackathon projects',
        'AI-powered idea generation',
        'Pitch script optimization',
        'Timeline management',
        'Video creation tools',
        'Lifetime access',
        'All future updates'
      ]
    : [
        'Unlimited hackathon projects',
        'AI-powered idea generation', 
        'Pitch script optimization',
        'Timeline management',
        'Video creation tools',
        '365 days access',
        'Priority support'
      ];

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl p-8 ${isPopular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-gray-600 mb-4">{product.description}</p>
        )}
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {formatPrice(product.price, product.currency)}
        </div>
        <p className="text-gray-500">One-time payment</p>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
          isPopular
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-900 hover:bg-gray-800 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Get Started'
        )}
      </button>
    </div>
  );
};