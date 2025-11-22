export interface StripeProduct {
  priceId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    priceId: 'price_1SW2yhEOOYpADD50jiAQgeeP',
    name: 'Hackathon Hero - Lifetime Pass',
    price: 39.00,
    currency: 'usd',
    mode: 'payment'
  },
  {
    priceId: 'price_1SW1yzEOOYpADD50JGzWjIig',
    name: 'Hackathon Hero - Season Pass',
    description: 'Stop manually tracking deadlines. Get the Command Center for every hackathon you enter in the next 365 days',
    price: 9.00,
    currency: 'usd',
    mode: 'payment'
  }
];

export const formatPrice = (price: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
};