import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, ArrowRight, ArrowLeft, Sparkles, Zap, Target, Download } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService, IdeaData } from '../services/database';
import { CandidateIdeaData } from '../services/aiService';

interface GeneratedIdea {
  idea: string;
  category: string;
  reasoning: string;
  sponsorAlignment: string;
}

interface IdeaGeneratorProps {
  onGenerate: () => Promise<GeneratedIdea>;
  onGenerateCandidates: (userDirection?: string) => Promise<CandidateIdeaData[]>;
  onExpandCandidate: (candidate: CandidateIdeaData) => Promise<GeneratedIdea>;
  hasRules: boolean;
  projectId?: string;
  onSendToOptimizer?: (idea: string, ideaName?: string) => void;
}

type ViewMode = 'initial' | 'candidates' | 'expanded';

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({
  onGenerate,
  onGenerateCandidates,
  onExpandCandidate,
  hasRules,
  projectId,
  onSendToOptimizer,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('initial');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usePersonalDirection, setUsePersonalDirection] = useState(false);
  const [userDirection, setUserDirection] = useState('');
  const [candidates, setCandidates] = useState<IdeaData[]>([]);
  const [expandedIdea, setExpandedIdea] = useState<GeneratedIdea | null>(null);
  const [expandedIdeaName, setExpandedIdeaName] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const loadSavedData = async () => {
    if (isExpanding) return;
    if (!projectId) {
      setViewMode('initial');
      setCandidates([]);
      setExpandedIdea(null);
      return;
    }

    const savedCandidates = await databaseService.getCandidateIdeas(projectId);
    const savedExpandedIdea = await databaseService.getIdea(projectId);

    if (savedExpandedIdea) {
      setExpandedIdea({
        idea: savedExpandedIdea.idea_text,
        category: savedExpandedIdea.category,
        reasoning: savedExpandedIdea.reasoning,
        sponsorAlignment: savedExpandedIdea.sponsor_alignment,
      });
      setExpandedIdeaName(savedExpandedIdea.idea_name || '');
      setSelectedCandidateId(savedExpandedIdea.parent_candidate_id || null);
      setViewMode('expanded');
    } else if (savedCandidates.length > 0) {
      setCandidates(savedCandidates);
      setUserDirection(savedCandidates[0].user_direction || '');
      setUsePersonalDirection(!!savedCandidates[0].user_direction);
      setViewMode('candidates');
    } else {
      setViewMode('initial');
    }
  };

  useEffect(() => {
    loadSavedData();
  }, [projectId]);

  const handleGenerateCandidates = async () => {
    if (!hasRules) return;

    setIsGenerating(true);
    setExpandedIdea(null);
    setExpandedIdeaName('');
    setSelectedCandidateId(null);

    try {
      const direction = usePersonalDirection ? userDirection.trim() : undefined;
      const result = await onGenerateCandidates(direction);

      if (projectId) {
        const savedCandidates = await databaseService.saveCandidateIdeas(
          projectId,
          result.map(c => ({
            candidate_title: c.title,
            candidate_hook: c.hook,
            idea_text: c.idea,
            category: c.category,
            reasoning: c.reasoning,
            sponsor_alignment: c.sponsorAlignment,
            complexity: c.complexity,
            user_direction: direction,
          }))
        );
        setCandidates(savedCandidates);
      }

      setViewMode('candidates');
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCandidate = async (candidate: IdeaData) => {
    if (!projectId) return;

    setIsGenerating(true);
    setIsExpanding(true);
    setSelectedCandidateId(candidate.id);

    try {
      const candidateData: CandidateIdeaData = {
        title: candidate.candidate_title || '',
        hook: candidate.candidate_hook || '',
        idea: candidate.idea_text,
        category: candidate.category,
        reasoning: candidate.reasoning,
        sponsorAlignment: candidate.sponsor_alignment,
        complexity: (candidate.complexity as 'Low' | 'Medium' | 'High') || 'Medium',
      };

      const expanded = await onExpandCandidate(candidateData);

      const savedIdea = await databaseService.expandCandidateIdea(projectId, candidate.id, {
        idea_text: expanded.idea,
        category: expanded.category,
        reasoning: expanded.reasoning,
        sponsor_alignment: expanded.sponsorAlignment,
        idea_name: candidate.candidate_title || '',
      });

      if (savedIdea) {
        setExpandedIdea({
          idea: savedIdea.idea_text,
          category: savedIdea.category,
          reasoning: savedIdea.reasoning,
          sponsorAlignment: savedIdea.sponsor_alignment,
        });
        setExpandedIdeaName(savedIdea.idea_name || '');
      } else {
        setExpandedIdea(expanded);
        setExpandedIdeaName(candidate.candidate_title || '');
      }

      setViewMode('expanded');
    } catch (error) {
      console.error('Expansion failed:', error);
    } finally {
      setIsGenerating(false);
      setIsExpanding(false);
    }
  };

  const handleBackToCandidates = () => {
    setViewMode('candidates');
    setExpandedIdea(null);
    setSelectedCandidateId(null);
  };

  const handleBackToInitial = () => {
    setViewMode('initial');
    setCandidates([]);
    setExpandedIdea(null);
    setSelectedCandidateId(null);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'High': return 'text-red-500 border-red-500/30 bg-red-500/10';
      default: return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
    }
  };

  const handleDownloadIdea = () => {
    if (!expandedIdea) return;

    const content = `${expandedIdeaName ? `${expandedIdeaName}\n${'='.repeat(expandedIdeaName.length)}\n\n` : ''}CATEGORY: ${expandedIdea.category}\n\nPROJECT IDEA:\n${expandedIdea.idea}\n\n${'='.repeat(60)}\n\nREASONING:\n${expandedIdea.reasoning}\n\n${'='.repeat(60)}\n\nSPONSOR ALIGNMENT:\n${expandedIdea.sponsorAlignment}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = expandedIdeaName ? `${expandedIdeaName.toLowerCase().replace(/\s+/g, '-')}-idea.txt` : 'project-idea.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <CyberCard
      icon={<Lightbulb size={32} strokeWidth={1.5} />}
      title="Idea Generator"
      description="Generate project ideas with guided selection workflow."
      badge={expandedIdea ? 'READY' : candidates.length > 0 ? 'CANDIDATES' : undefined}
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
            {viewMode === 'initial' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-black/50 border border-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-accent-yellow" />
                      <span className="text-xs text-gray-400 font-mono">Add Personal Direction</span>
                    </div>
                    <button
                      onClick={() => setUsePersonalDirection(!usePersonalDirection)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        usePersonalDirection ? 'bg-accent-yellow' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 bg-black w-4 h-4 rounded-full transition-transform ${
                          usePersonalDirection ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {usePersonalDirection && (
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 font-mono">
                        What are your hobbies, skills, or rough ideas?
                      </label>
                      <textarea
                        value={userDirection}
                        onChange={(e) => setUserDirection(e.target.value)}
                        placeholder="e.g., 'I love cat videos', 'I want to build a fintech app', 'I'm into AI and music'"
                        className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-3 rounded focus:border-accent-yellow focus:outline-none min-h-[80px] resize-none"
                      />
                      <p className="text-xs text-gray-600">
                        This helps steer the AI to generate ideas matching your interests.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerateCandidates}
                  disabled={isGenerating}
                  className="w-full bg-accent-yellow text-black font-bold py-3 text-sm tracking-wide hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      GENERATING 3 IDEAS...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      GENERATE 3 CANDIDATE IDEAS
                    </>
                  )}
                </button>
              </>
            )}

            {viewMode === 'candidates' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                    Choose Your Project Direction
                  </span>
                  <button
                    onClick={handleBackToInitial}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-yellow/10 border-2 border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-black transition-all text-xs font-bold"
                  >
                    <ArrowLeft size={14} /> EDIT DIRECTION
                  </button>
                </div>

                <div className="space-y-4">
                  {candidates.map((candidate, idx) => (
                    <div
                      key={candidate.id}
                      className="border border-gray-800 bg-black/30 p-4 hover:border-accent-yellow/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-accent-yellow">
                              {candidate.candidate_title || `Idea ${idx + 1}`}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono border rounded ${getComplexityColor(
                                candidate.complexity || 'Medium'
                              )}`}
                            >
                              {candidate.complexity || 'Medium'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">
                            {candidate.candidate_hook || candidate.idea_text.substring(0, 80) + '...'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 font-mono uppercase mb-1">Concept</p>
                          <p className="text-xs text-gray-400 leading-relaxed">{candidate.idea_text}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-mono uppercase mb-1">Why It Fits</p>
                          <p className="text-xs text-gray-400 leading-relaxed">{candidate.reasoning}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectCandidate(candidate)}
                        disabled={isGenerating}
                        className="w-full bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow font-bold py-2 text-xs tracking-wide hover:bg-accent-yellow hover:text-black transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                      >
                        {isGenerating && selectedCandidateId === candidate.id ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            EXPANDING...
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            SELECT & EXPAND
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGenerateCandidates}
                  disabled={isGenerating}
                  className="w-full bg-black/50 border border-gray-800 hover:border-accent-yellow text-gray-400 hover:text-accent-yellow font-bold py-2 text-xs tracking-wide transition-colors disabled:opacity-30 flex items-center justify-center gap-2 mt-4"
                >
                  <RefreshCw size={14} />
                  REGENERATE 3 NEW IDEAS
                </button>
              </>
            )}

            {viewMode === 'expanded' && expandedIdea && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                    Detailed Project Plan
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBackToInitial}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all text-xs font-mono"
                    >
                      <ArrowLeft size={14} /> EDIT DIRECTION
                    </button>
                    <button
                      onClick={handleBackToCandidates}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-yellow/10 border-2 border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-black transition-all text-xs font-bold"
                    >
                      <ArrowLeft size={14} /> CANDIDATE IDEAS
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow text-xs font-mono">
                      {expandedIdea.category}
                    </span>
                    {expandedIdeaName && (
                      <span className="text-sm font-bold text-white">{expandedIdeaName}</span>
                    )}
                  </div>
                  <button
                    onClick={handleDownloadIdea}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-xs font-mono"
                  >
                    <Download size={14} />
                    DOWNLOAD
                  </button>
                </div>

                <div className="border-l-2 border-accent-yellow pl-4">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                    Full Project Concept
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">{expandedIdea.idea}</p>
                </div>

                <div className="border-l-2 border-accent-yellow pl-4">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                    Why This Aligns
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">{expandedIdea.reasoning}</p>
                </div>

                <div className="border-l-2 border-accent-yellow pl-4">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                    Technical Approach
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">{expandedIdea.sponsorAlignment}</p>
                </div>

                <button
                  onClick={() => onSendToOptimizer?.(expandedIdea.idea, expandedIdeaName)}
                  className="w-full bg-black/50 border border-gray-800 hover:border-accent-yellow p-3 mt-4 transition-colors text-left group"
                >
                  <p className="text-xs text-gray-600 group-hover:text-accent-yellow leading-relaxed flex items-center gap-2 transition-colors">
                    <ArrowRight size={14} className="text-accent-yellow flex-shrink-0" />
                    <span>
                      Click to send this idea to the Prompt Optimizer, or click Back to choose a different candidate.
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
