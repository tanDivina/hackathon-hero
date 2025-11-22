import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Simulate order verification
      setTimeout(() => {
        setOrderDetails({
          sessionId,
          amount: '$39.00', // This would come from the actual order
          product: 'Hackathon Hero - Lifetime Pass'
        });
        setIsLoading(false);
      }, 2000);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Processing your order...
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your account has been upgraded.
          </p>
        </div>

        {orderDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Product:</strong> {orderDetails.product}</p>
              <p><strong>Amount:</strong> {orderDetails.amount}</p>
              <p><strong>Session ID:</strong> {orderDetails.sessionId.slice(0, 20)}...</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          
          <button
            onClick={() => navigate('/pricing')}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2"
          >
            View Pricing Plans
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            You'll receive a confirmation email shortly. If you have any questions, 
            please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};