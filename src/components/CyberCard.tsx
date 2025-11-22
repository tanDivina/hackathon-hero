import React from 'react';

interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  badge?: string;
}

export const CyberCard: React.FC<CyberCardProps> = ({
  children,
  className = '',
  icon,
  title,
  description,
  badge
}) => {
  return (
    <div className={`bg-[#0a0a0a] border border-gray-800 hover:border-gray-700 transition-colors ${className}`}>
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          {icon && (
            <div className="text-accent-yellow">
              {icon}
            </div>
          )}
          {badge && (
            <span className="text-xs text-gray-500 font-mono tracking-wider uppercase">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-tight">
          {title}
        </h3>

        {description && (
          <p className="text-gray-400 text-base leading-relaxed mb-6">
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  );
};
