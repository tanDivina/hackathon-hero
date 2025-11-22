import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: 'lime' | 'green' | 'white';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  color = 'lime'
}) => {
  const colorClasses = {
    lime: 'bg-neon-lime shadow-neon-lime',
    green: 'bg-neon-green shadow-neon-green',
    white: 'bg-neon-white shadow-neon-white',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-300">{label}</span>
          <span className="text-sm font-bold text-neon-lime">{progress}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-gray-700">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out animate-pulse-glow`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
