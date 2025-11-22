import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, ArrowRight } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';

interface GeneratedIdea {
  idea: string;
  category: string;
  reasoning: string;
  sponsorAlignment: string;
}

interface IdeaGeneratorProps {
  onGenerate: () => Promise<GeneratedIdea>;
  hasRules: boolean;
  projectId?: string;
  onSendToOptimizer?: (idea: string) => void;
}

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ onGenerate, hasRules, projectId, onSendToOptimizer }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<GeneratedIdea | null>(null);
  const [lastLoadedProjectId, setLastLoadedProjectId] = useState<string | undefined>();

  useEffect(() => {
    // Only load from database if project changed
    if (projectId !== lastLoadedProjectId) {
      if (projectId) {
        loadSavedIdea();
        setLastLoadedProjectId(projectId);
      } else {
        setGeneratedIdea(null);
        setLastLoadedProjectId(undefined);
      }
    }
  }, [projectId]);

  const loadSavedIdea = async () => {
    if (!projectId) return;

    const saved = await databaseService.getIdea(projectId);
    if (saved) {
      setGeneratedIdea({
        idea: saved.idea_text,
        category: saved.category,
        reasoning: saved.reasoning,
        sponsorAlignment: saved.sponsor_alignment,
      });
    } else {
      setGeneratedIdea(null);
    }
  };

  const handleGenerate = async () => {
    if (!hasRules) return;

    setIsGenerating(true);
    try {
      const result = await onGenerate();
      setGeneratedIdea(result);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CyberCard
      icon={<Lightbulb size={32} strokeWidth={1.5} />}
      title="Idea Generator"
      description="Generate project ideas tailored to hackathon requirements and judging criteria."
      badge={generatedIdea ? 'READY' : undefined}
    >
      <div className="space-y-4">
        {!hasRules ? (
          <div className="border border-gray-800 bg-black/50 p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Parse hackathon rules first</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Upload and parse the hackathon rules to generate ideas aligned with judging criteria and sponsor requirements.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-accent-yellow text-black font-bold py-3 text-sm tracking-wide hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  GENERATING IDEA...
                </>
              ) : (
                <>
                  <Lightbulb size={16} />
                  {generatedIdea ? 'REGENERATE IDEA' : 'GENERATE IDEA'}
                </>
              )}
            </button>

            {generatedIdea && (
              <div className="mt-6 space-y-4 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                    Generated Project Idea
                  </span>
                  <span className="px-2 py-1 bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow text-xs font-mono">
                    {generatedIdea.category}
                  </span>
                </div>

                <div className="border-l-2 border-accent-yellow pl-4">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                    Project Concept
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {generatedIdea.idea}
                  </p>
                </div>

                <div className="border-l-2 border-accent-yellow pl-4">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                    Why This Aligns
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {generatedIdea.reasoning}
                  </p>
                </div>

                <div className="border-l-2 border-accent-yellow pl-4">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                    Technical Approach
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {generatedIdea.sponsorAlignment}
                  </p>
                </div>

                <button
                  onClick={() => onSendToOptimizer?.(generatedIdea.idea)}
                  className="w-full bg-black/50 border border-gray-800 hover:border-accent-yellow p-3 mt-4 transition-colors text-left group"
                >
                  <p className="text-xs text-gray-600 group-hover:text-accent-yellow leading-relaxed flex items-center gap-2 transition-colors">
                    <ArrowRight size={14} className="text-accent-yellow flex-shrink-0" />
                    <span>
                      Click to send this idea to the Prompt Optimizer, or click REGENERATE IDEA for a different concept.
                    </span>
                  </p>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CyberCard>
  );
};
