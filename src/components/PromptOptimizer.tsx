import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Download } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';
import { GenerationProgress, useGenerationProgress } from './GenerationProgress';

interface PromptOptimizerProps {
  onOptimize: (idea: string) => Promise<{ prompt: string; wordCount: number }>;
  isPro: boolean;
  projectId?: string;
  reloadKey?: number;
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ onOptimize, isPro, projectId, reloadKey }) => {
  const [idea, setIdea] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const promptProgress = useGenerationProgress([
    'Analyzing project requirements',
    'Selecting optimal tech stack',
    'Structuring technical prompt',
    'Optimizing for AI builders',
  ]);

  useEffect(() => {
    loadSavedData();
  }, [projectId, reloadKey]);

  const loadSavedData = async () => {
    if (!projectId) {
      setIdea('');
      setOptimizedPrompt('');
      setWordCount(0);
      return;
    }

    const ideaData = await databaseService.getIdea(projectId);
    const latestIdea = ideaData?.idea_text || '';

    setIdea(latestIdea);

    const saved = await databaseService.getPrompt(projectId);
    if (saved) {
      setOptimizedPrompt(saved.optimized_prompt);
      setWordCount(saved.word_count);
    } else {
      setOptimizedPrompt('');
      setWordCount(0);
    }
  };

  const handleOptimize = async () => {
    if (!idea.trim()) return;

    setIsOptimizing(true);
    promptProgress.start();
    try {
      const advanceInterval = setInterval(() => promptProgress.advance(), 1800);
      const result = await onOptimize(idea);
      clearInterval(advanceInterval);
      promptProgress.complete();
      setOptimizedPrompt(result.prompt);
      setWordCount(result.wordCount);
    } catch (error) {
      console.error('Optimization failed:', error);
      promptProgress.reset();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `PROJECT IDEA:\n${idea}\n\n${'='.repeat(60)}\n\nOPTIMIZED PROMPT (${wordCount} words):\n\n${optimizedPrompt}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-prompt.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-component="prompt-optimizer">
      <CyberCard
        icon={<Sparkles size={32} strokeWidth={1.5} />}
        title="Prompt Optimizer"
        description="Transform your idea into a detailed 500-word technical prompt optimized for AI app builders."
      >
        <div className="space-y-4">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe your project idea..."
          className="w-full h-32 bg-black border border-gray-800 p-4 text-gray-300 text-sm placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors resize-none"
        />

        <button
          onClick={handleOptimize}
          disabled={!idea.trim() || isOptimizing}
          className="w-full bg-accent-yellow text-black font-bold py-3 text-sm tracking-wide hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isOptimizing ? 'GENERATING...' : 'GENERATE PROMPT'}
        </button>

        <GenerationProgress steps={promptProgress.steps} isVisible={promptProgress.isActive} />

        {optimizedPrompt && (
          <div className="mt-6 space-y-3 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                {wordCount} words
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-xs font-mono"
                >
                  <Download size={14} />
                  DOWNLOAD
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-xs font-mono"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      COPY
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-black border border-gray-800 p-4 max-h-64 overflow-y-auto">
              <pre className="text-gray-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {optimizedPrompt}
              </pre>
            </div>
          </div>
        )}
        </div>
      </CyberCard>
    </div>
  );
};
