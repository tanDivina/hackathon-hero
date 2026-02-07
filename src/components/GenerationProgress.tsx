import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface GenerationProgressProps {
  steps: ProgressStep[];
  isVisible: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ steps, isVisible }) => {
  if (!isVisible || steps.length === 0) return null;

  const completedCount = steps.filter(s => s.status === 'complete').length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="border border-gray-800 bg-black/60 rounded p-4 space-y-3 animate-fadeIn">
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-yellow rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress, 5)}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            {step.status === 'complete' ? (
              <Check size={14} className="text-accent-green flex-shrink-0" />
            ) : step.status === 'active' ? (
              <Loader2 size={14} className="text-accent-yellow flex-shrink-0 animate-spin" />
            ) : (
              <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              </div>
            )}
            <span
              className={`text-xs font-mono transition-colors duration-300 ${
                step.status === 'complete'
                  ? 'text-accent-green'
                  : step.status === 'active'
                  ? 'text-accent-yellow'
                  : 'text-gray-600'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function useGenerationProgress(stepLabels: string[]) {
  const [steps, setSteps] = React.useState<ProgressStep[]>([]);
  const [isActive, setIsActive] = React.useState(false);

  const start = React.useCallback(() => {
    setSteps(stepLabels.map((label, idx) => ({
      label,
      status: idx === 0 ? 'active' : 'pending',
    })));
    setIsActive(true);
  }, [stepLabels]);

  const advance = React.useCallback(() => {
    setSteps(prev => {
      const activeIdx = prev.findIndex(s => s.status === 'active');
      if (activeIdx === -1) return prev;
      return prev.map((s, i) => {
        if (i === activeIdx) return { ...s, status: 'complete' as const };
        if (i === activeIdx + 1) return { ...s, status: 'active' as const };
        return s;
      });
    });
  }, []);

  const complete = React.useCallback(() => {
    setSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })));
    setTimeout(() => setIsActive(false), 800);
  }, []);

  const reset = React.useCallback(() => {
    setSteps([]);
    setIsActive(false);
  }, []);

  return { steps, isActive, start, advance, complete, reset };
}
