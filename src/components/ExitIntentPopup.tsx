import React, { useState, useEffect } from 'react';
import { X, Zap, Crown, Tag } from 'lucide-react';

interface ExitIntentPopupProps {
  onClose: () => void;
  onGetAccess: () => void;
  isVisible: boolean;
}

export const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({
  onClose,
  onGetAccess,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-accent-yellow max-w-lg w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-yellow/20 border-2 border-accent-yellow mb-4">
            <Tag className="text-accent-yellow" size={32} strokeWidth={2} />
          </div>

          <div className="inline-flex items-center gap-2 bg-accent-yellow/10 border border-accent-yellow/40 px-3 py-1 mb-3">
            <span className="text-accent-yellow text-xs font-bold uppercase tracking-widest">Special Deal</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">
            Wait! Don't Leave Yet
          </h2>

          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            Grab the <span className="text-white font-bold">Lifetime Pass</span> at our limited-time price before you go.
          </p>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-gray-600 line-through text-2xl font-bold">$39</span>
            <span className="text-accent-yellow text-4xl font-black">$25</span>
            <span className="text-gray-400 text-sm">one-time, forever</span>
          </div>

          <div className="bg-black/50 border border-gray-800 p-4 mb-6 space-y-2">
            <div className="flex items-start gap-3 text-left">
              <Crown className="text-accent-yellow flex-shrink-0 mt-1" size={16} strokeWidth={1.5} />
              <p className="text-sm text-gray-300">
                <span className="text-white font-bold">Lifetime Access</span> - Pay once, use forever
              </p>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Crown className="text-accent-yellow flex-shrink-0 mt-1" size={16} strokeWidth={1.5} />
              <p className="text-sm text-gray-300">
                <span className="text-white font-bold">All Pro Features</span> - Parse URLs, AI Chat, Video Recording
              </p>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Crown className="text-accent-yellow flex-shrink-0 mt-1" size={16} strokeWidth={1.5} />
              <p className="text-sm text-gray-300">
                <span className="text-white font-bold">Limited Time</span> - This deal won't last long
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onGetAccess}
              className="w-full bg-accent-yellow text-black font-bold py-4 text-base tracking-wide uppercase hover:bg-gray-200 transition-all transform hover:scale-[1.02]"
            >
              GET LIFETIME ACCESS — $25
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 text-sm font-mono hover:text-gray-400 transition-colors"
            >
              No thanks, I'll pay full price later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useExitIntent = (onExitIntent: () => void) => {
  useEffect(() => {
    let lastY = 0;
    let velocityThreshold = -50;

    const handleMouseMove = (e: MouseEvent) => {
      const currentY = e.clientY;
      const velocity = currentY - lastY;
      lastY = currentY;

      if (
        (currentY <= 20 || e.clientX >= window.innerWidth - 20) &&
        velocity < velocityThreshold
      ) {
        onExitIntent();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientX >= window.innerWidth) {
        onExitIntent();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onExitIntent]);
};
