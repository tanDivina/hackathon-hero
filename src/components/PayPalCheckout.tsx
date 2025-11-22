import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { databaseService } from '../services/database';

interface PayPalCheckoutProps {
  amount: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({ amount, onSuccess, onError }) => {
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="border border-gray-800 bg-black/50 p-4 text-center">
        <p className="text-sm text-gray-500 mb-2">PayPal not configured</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Add your PayPal Client ID to the .env file to enable payments.
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
        }}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: amount,
                },
                description: 'HackPrep Pro - Lifetime Access',
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          try {
            if (!actions.order) {
              throw new Error('Order actions not available');
            }

            const details = await actions.order.capture();
            const payerEmail = details.payer?.email_address;
            const orderId = details.id;

            await databaseService.savePayment(
              orderId,
              payerEmail,
              parseFloat(amount),
              'USD'
            );

            onSuccess();
          } catch (error) {
            console.error('Payment capture error:', error);
            onError('Payment completed but failed to verify. Please contact support.');
          }
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError('Payment failed. Please try again or contact support.');
        }}
      />
    </PayPalScriptProvider>
  );
};
