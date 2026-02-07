import React from 'react';
import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react';

interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ status }) => {
  if (status === 'idle') return null;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono transition-opacity duration-300 ${
      status === 'saving' ? 'text-gray-500' :
      status === 'saved' ? 'text-accent-green' :
      'text-red-400'
    }`}>
      {status === 'saving' && <Loader2 size={12} className="animate-spin" />}
      {status === 'saved' && <Check size={12} />}
      {status === 'error' && <AlertCircle size={12} />}
      {status === 'saving' && 'Saving...'}
      {status === 'saved' && 'Saved'}
      {status === 'error' && 'Save failed'}
    </span>
  );
};
