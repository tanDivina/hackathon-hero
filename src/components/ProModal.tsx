import React, { useState } from 'react';
import { X, Crown, Link, MessageCircle, Github, Video, FolderOpen, Download } from 'lucide-react';
import { StripeCheckout } from './StripeCheckout';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  isUnlocking: boolean;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onUnlock, isUnlocking }) => {
  const [showStripe, setShowStripe] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'lifetime' | 'season'>('lifetime');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      onUnlock();
    }, 1500);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <Crown className="text-accent-yellow mb-4" size={40} strokeWidth={1.5} />
          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Unlock Pro Features</h2>
          <p className="text-gray-500 text-base">
            Advanced AI insights and competitive intelligence
          </p>
          <button
            onClick={onUnlock}
            disabled={isUnlocking}
            className="mt-3 inline-block px-3 py-1 bg-accent-yellow/20 border border-accent-yellow/50 hover:bg-accent-yellow/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <p className="text-accent-yellow text-sm font-bold uppercase tracking-wider">Limited Time: Free in Beta</p>
          </button>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
            <Link className="text-accent-yellow flex-shrink-0 mt-1" size={18} strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">Parse from URL</h3>
              <p className="text-xs text-gray-500">
                Instantly extract rules from Devpost and hackathon websites
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
            <MessageCircle className="text-accent-yellow flex-shrink-0 mt-1" size={18} strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">AI Rules Chat</h3>
              <p className="text-xs text-gray-500">
                Get instant answers and strategic insights about rules
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
            <Github className="text-accent-yellow flex-shrink-0 mt-1" size={18} strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">GitHub Analysis</h3>
              <p className="text-xs text-gray-500">
                Automatically detect and document your tech stack
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
            <Video className="text-accent-yellow flex-shrink-0 mt-1" size={18} strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">Pro Video Recording</h3>
              <p className="text-xs text-gray-500">
                3-minute videos with teleprompter and custom branding
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
            <FolderOpen className="text-accent-yellow flex-shrink-0 mt-1" size={18} strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">Multi-Project Support</h3>
              <p className="text-xs text-gray-500">
                Work on multiple hackathons simultaneously
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
            <Download className="text-accent-yellow flex-shrink-0 mt-1" size={18} strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">All Export Formats</h3>
              <p className="text-xs text-gray-500">
                Download in PDF, DOCX, Markdown, and TXT
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => setSelectedTier('lifetime')}
            className={`w-full text-left transition-all ${
              selectedTier === 'lifetime'
                ? 'bg-black border-2 border-accent-yellow'
                : 'bg-black border border-gray-800 hover:border-gray-700'
            } p-6`}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-gray-600 text-sm line-through">$99</p>
                <p className="text-3xl font-bold text-white">$39<span className="text-base text-gray-600"> one-time</span></p>
              </div>
              <div className={`px-2 py-1 text-sm font-bold uppercase tracking-wider ${
                selectedTier === 'lifetime'
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                LIFETIME
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Pay once, use forever. No subscriptions.
            </p>
          </button>

          <button
            onClick={() => setSelectedTier('season')}
            className={`w-full text-left transition-all ${
              selectedTier === 'season'
                ? 'bg-black border-2 border-accent-yellow'
                : 'bg-black border border-gray-800 hover:border-gray-700'
            } p-6`}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-3xl font-bold text-white">$9<span className="text-base text-gray-600"> one-time</span></p>
              </div>
              <div className={`px-2 py-1 text-sm font-bold uppercase tracking-wider ${
                selectedTier === 'season'
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                SEASON PASS
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Access for 365 days from purchase.
            </p>
          </button>
        </div>

        {paymentSuccess ? (
          <div className="bg-accent-green/20 border border-accent-green p-4 text-center">
            <p className="text-accent-green font-bold text-base">PAYMENT SUCCESSFUL!</p>
            <p className="text-sm text-gray-400 mt-1">Activating Pro features...</p>
          </div>
        ) : paymentError ? (
          <div className="space-y-3">
            <div className="bg-red-950/20 border border-red-900/30 p-4 text-center">
              <p className="text-red-400 text-sm">{paymentError}</p>
            </div>
            <button
              onClick={() => setPaymentError(null)}
              className="w-full border border-gray-800 text-gray-400 font-bold py-3 hover:text-white hover:border-gray-700 transition-colors text-base tracking-wide uppercase"
            >
              TRY AGAIN
            </button>
          </div>
        ) : showStripe ? (
          <div>
            <StripeCheckout
              amount={selectedTier === 'lifetime' ? 3900 : 900}
              tier={selectedTier}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
            <button
              onClick={() => setShowStripe(false)}
              className="w-full border border-gray-800 text-gray-400 font-bold py-2 mt-3 hover:text-white hover:border-gray-700 transition-colors text-sm tracking-wide uppercase"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setShowStripe(true)}
              disabled={isUnlocking}
              className="w-full bg-accent-yellow text-black font-bold py-3 hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base tracking-wide uppercase"
            >
              PAY WITH STRIPE - {selectedTier === 'lifetime' ? '$39' : '$9'}
            </button>
            <button
              onClick={onUnlock}
              disabled={isUnlocking}
              className="w-full border border-gray-800 text-gray-400 font-bold py-3 hover:text-white hover:border-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-wide uppercase"
            >
              {isUnlocking ? 'PROCESSING...' : 'GET FREE BETA ACCESS'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Requires email signup • Limited time offer
            </p>
          </div>
        )}
        <p className="text-sm text-gray-600 text-center mt-4 font-mono">
          SECURE PAYMENT // POWERED BY STRIPE
        </p>
      </div>
    </div>
  );
};
