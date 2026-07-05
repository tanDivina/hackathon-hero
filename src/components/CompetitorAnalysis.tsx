import React, { useState } from 'react';
import { Swords, Loader2, Plus, X, ShieldCheck, AlertTriangle, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { aiService } from '../services/aiService';

interface CompetitorAnalysisProps {
  idea?: string;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

interface AnalysisResult {
  differentiators: string[];
  risks: string[];
  improvements: string[];
  summary: string;
}

export const CompetitorAnalysis: React.FC<CompetitorAnalysisProps> = ({
  idea,
  isPro,
  onUpgradeClick,
}) => {
  const [urls, setUrls] = useState<string[]>(['']);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('differentiators');

  const addUrl = () => setUrls(prev => [...prev, '']);
  const removeUrl = (idx: number) => setUrls(prev => prev.filter((_, i) => i !== idx));
  const updateUrl = (idx: number, val: string) => setUrls(prev => prev.map((u, i) => i === idx ? val : u));

  const handleAnalyze = async () => {
    if (!idea) return;
    setIsLoading(true);
    setError('');
    try {
      const filledUrls = urls.filter(u => u.trim());
      const res = await aiService.analyzeCompetitors(idea, filledUrls);
      setResult(res);
      setExpandedSection('differentiators');
    } catch {
      setError('Analysis failed. Please try again.');
    }
    setIsLoading(false);
  };

  const Section: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    items: string[];
    color: string;
    bgColor: string;
    borderColor: string;
  }> = ({ id, title, icon, items, color, bgColor, borderColor }) => (
    <div className={`rounded border ${borderColor} overflow-hidden`}>
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className={`w-full flex items-center justify-between px-3 py-2.5 ${bgColor} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</span>
          <span className={`text-xs ${color} opacity-70`}>({items.length})</span>
        </div>
        {expandedSection === id ? (
          <ChevronUp size={14} className={color} />
        ) : (
          <ChevronDown size={14} className={color} />
        )}
      </button>
      {expandedSection === id && (
        <ul className="px-3 py-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
              <span className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!isPro) {
    return (
      <CyberCard title="COMPETITOR ANALYSIS" icon={<Swords size={20} />}>
        <div className="text-center py-8">
          <Swords className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 text-sm mb-3">Pro feature</p>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 text-xs font-bold bg-accent-yellow text-black rounded hover:bg-gray-200 transition-colors"
          >
            UNLOCK PRO
          </button>
        </div>
      </CyberCard>
    );
  }

  return (
    <CyberCard title="COMPETITOR ANALYSIS" icon={<Swords size={20} />}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Paste competitor project URLs (Devpost, GitHub) to identify how to differentiate your idea.
        </p>

        <div className="space-y-2">
          {urls.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={e => updateUrl(idx, e.target.value)}
                placeholder="https://devpost.com/software/... or describe a competitor"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-yellow transition-colors"
              />
              {urls.length > 1 && (
                <button
                  onClick={() => removeUrl(idx)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {urls.length < 4 && (
            <button
              onClick={addUrl}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Plus size={12} />
              Add another URL
            </button>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading || !idea}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold bg-accent-yellow text-black rounded hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              ANALYZING...
            </>
          ) : (
            <>
              <Swords size={16} />
              {result ? 'RE-ANALYZE' : 'ANALYZE COMPETITION'}
            </>
          )}
        </button>

        {!idea && <p className="text-xs text-gray-600 text-center">Generate an idea first.</p>}
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {result && (
          <div className="space-y-2">
            <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
              <p className="text-xs text-gray-300 leading-relaxed">{result.summary}</p>
            </div>

            <Section
              id="differentiators"
              title="Your Edge"
              icon={<ShieldCheck size={14} />}
              items={result.differentiators}
              color="text-green-400"
              bgColor="bg-green-500/10"
              borderColor="border-green-500/20"
            />
            <Section
              id="risks"
              title="Watch Out"
              icon={<AlertTriangle size={14} />}
              items={result.risks}
              color="text-orange-400"
              bgColor="bg-orange-500/10"
              borderColor="border-orange-500/20"
            />
            <Section
              id="improvements"
              title="Power Moves"
              icon={<Zap size={14} />}
              items={result.improvements}
              color="text-accent-yellow"
              bgColor="bg-accent-yellow/10"
              borderColor="border-accent-yellow/20"
            />
          </div>
        )}
      </div>
    </CyberCard>
  );
};
