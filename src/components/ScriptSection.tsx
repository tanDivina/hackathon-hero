import React, { useState } from 'react';
import { Edit2, RefreshCw, Check, Info, Video as VideoIcon } from 'lucide-react';

interface ScriptSectionProps {
  title: string;
  duration: string;
  content: string;
  tip: string;
  visualTip: string;
  onEdit: () => void;
  onRegenerate: () => void;
  onSelectAlternative?: (alternative: string) => void;
  alternatives?: string[];
  isGeneratingAlternatives?: boolean;
}

export const ScriptSection: React.FC<ScriptSectionProps> = ({
  title,
  duration,
  content,
  tip,
  visualTip,
  onEdit,
  onRegenerate,
  onSelectAlternative,
  alternatives,
  isGeneratingAlternatives,
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleRegenerate = () => {
    setShowAlternatives(true);
    onRegenerate();
  };

  const handleSelectAlternative = (alt: string) => {
    onSelectAlternative?.(alt);
    setShowAlternatives(false);
  };

  return (
    <div className="border-l-2 border-accent-yellow pl-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{title}</p>
          <span className="text-xs text-gray-600">{duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className="p-1 text-gray-500 hover:text-accent-yellow transition-colors"
            title="Show tips"
          >
            <Info size={14} />
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isGeneratingAlternatives}
            className="p-1 text-gray-500 hover:text-accent-yellow transition-colors disabled:opacity-30"
            title="Generate alternatives"
          >
            <RefreshCw size={14} className={isGeneratingAlternatives ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-accent-yellow transition-colors"
            title="Edit section"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>

      {showTips && (
        <div className="mb-3 space-y-2">
          <div className="bg-black/50 border border-gray-800 p-3">
            <div className="flex items-start gap-2 mb-2">
              <Info size={14} className="text-accent-yellow mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">Writing Tip</p>
                <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
              </div>
            </div>
          </div>
          <div className="bg-black/50 border border-gray-800 p-3">
            <div className="flex items-start gap-2">
              <VideoIcon size={14} className="text-accent-green mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">Visual Tip</p>
                <p className="text-xs text-gray-400 leading-relaxed">{visualTip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-400 leading-relaxed mb-3">{content}</p>

      {showAlternatives && (
        <div className="mt-3 space-y-2 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
              Alternative Options
            </p>
            <button
              onClick={() => setShowAlternatives(false)}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Close
            </button>
          </div>

          {isGeneratingAlternatives ? (
            <div className="bg-black/30 border border-gray-800 p-4 text-center">
              <RefreshCw size={16} className="animate-spin text-accent-yellow mx-auto mb-2" />
              <p className="text-xs text-gray-500">Generating alternatives...</p>
            </div>
          ) : alternatives && alternatives.length > 0 ? (
            <div className="space-y-2">
              {alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="bg-black/30 border border-gray-800 p-3 hover:border-gray-700 transition-colors cursor-pointer group"
                  onClick={() => handleSelectAlternative(alt)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-gray-400 leading-relaxed flex-1">{alt}</p>
                    <button className="text-gray-600 group-hover:text-accent-yellow transition-colors flex-shrink-0">
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
