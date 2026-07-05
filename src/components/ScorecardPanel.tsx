import React, { useState } from 'react';
import { Target, Loader2, TrendingUp, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { aiService } from '../services/aiService';
import { databaseService } from '../services/database';

interface ScorecardPanelProps {
  projectId?: string;
  idea?: string;
  hasRules: boolean;
  onUpgradeClick?: () => void;
  isPro?: boolean;
}

interface CriterionScore {
  criterion: string;
  score: number;
  rationale: string;
  tips: string;
}

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? 'bg-green-500' :
    score >= 6 ? 'bg-accent-yellow' :
    score >= 4 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold font-mono w-6 text-right ${
        score >= 8 ? 'text-green-400' :
        score >= 6 ? 'text-accent-yellow' :
        score >= 4 ? 'text-orange-400' : 'text-red-400'
      }`}>
        {score}
      </span>
    </div>
  );
};

export const ScorecardPanel: React.FC<ScorecardPanelProps> = ({
  projectId,
  idea,
  hasRules,
  onUpgradeClick,
  isPro,
}) => {
  const [scores, setScores] = useState<CriterionScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10) / 10
    : null;

  const handleScore = async () => {
    if (!projectId || !idea) return;
    setIsLoading(true);
    setError('');
    try {
      const rulesData = await databaseService.getRulesData(projectId);
      if (!rulesData) {
        setError('Parse hackathon rules first.');
        setIsLoading(false);
        return;
      }
      const result = await aiService.scorecardIdea(
        idea,
        rulesData.judging_criteria,
        rulesData.sponsors,
        rulesData.theme
      );
      setScores(result);
    } catch {
      setError('Failed to generate scorecard. Try again.');
    }
    setIsLoading(false);
  };

  const canRun = isPro && idea && hasRules;

  return (
    <CyberCard title="JUDGING SCORECARD" icon={<Target size={20} />}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          AI rates your idea against each judging criterion with actionable tips to improve.
        </p>

        {!isPro ? (
          <div className="text-center py-6">
            <Target className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-3">Pro feature</p>
            <button
              onClick={onUpgradeClick}
              className="px-4 py-2 text-xs font-bold bg-accent-yellow text-black rounded hover:bg-gray-200 transition-colors"
            >
              UNLOCK PRO
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleScore}
              disabled={isLoading || !canRun}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold bg-accent-yellow text-black rounded hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  SCORING...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  {scores.length > 0 ? 'RE-SCORE IDEA' : 'SCORE MY IDEA'}
                </>
              )}
            </button>

            {!idea && (
              <p className="text-xs text-gray-600 text-center">Generate an idea first to enable scoring.</p>
            )}
            {!hasRules && (
              <p className="text-xs text-gray-600 text-center">Parse hackathon rules first.</p>
            )}

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            {scores.length > 0 && (
              <div className="space-y-3">
                {avgScore !== null && (
                  <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded border border-gray-700">
                    <span className="text-sm font-bold text-white">Overall Fit Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <ScoreBar score={avgScore} />
                      </div>
                      <span className="text-lg font-black font-mono text-accent-yellow">{avgScore}/10</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {scores.map((item, idx) => (
                    <div key={idx} className="border border-gray-800 rounded overflow-hidden">
                      <button
                        onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                        className="w-full p-3 hover:bg-gray-800/40 transition-colors"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xs text-gray-300 text-left flex-1 leading-relaxed">{item.criterion}</span>
                          {expandedIdx === idx ? (
                            <ChevronUp size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <ScoreBar score={item.score} />
                      </button>

                      {expandedIdx === idx && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-800/60">
                          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.rationale}</p>
                          <div className="flex items-start gap-2 p-2 bg-accent-yellow/5 rounded border border-accent-yellow/20">
                            <Lightbulb size={12} className="text-accent-yellow flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-accent-yellow/80 leading-relaxed">{item.tips}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CyberCard>
  );
};
