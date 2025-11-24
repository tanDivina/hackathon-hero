import React, { useState, useEffect } from 'react';
import { FileText, Link, Sparkles } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';

interface ParsedData {
  deadline: string;
  sponsors: string[];
  judgingCriteria: string[];
  prizes: string[];
}

interface RulesParserProps {
  onParse: (rulesText: string) => Promise<ParsedData>;
  onParseFromUrl: (url: string) => Promise<ParsedData>;
  isPro: boolean;
  projectId?: string;
  onUpgradeClick: () => void;
}

export const RulesParser: React.FC<RulesParserProps> = ({ onParse, onParseFromUrl, isPro, projectId, onUpgradeClick }) => {
  const [rulesText, setRulesText] = useState('');
  const [hackathonUrl, setHackathonUrl] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [insiderIntel, setInsiderIntel] = useState('');
  const [isSavingIntel, setIsSavingIntel] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadSavedData();
    } else {
      setRulesText('');
      setParsedData(null);
    }
  }, [projectId]);

  const loadSavedData = async () => {
    if (!projectId) return;

    const saved = await databaseService.getRulesData(projectId);
    if (saved) {
      setRulesText(saved.rules_text);
      setParsedData({
        deadline: saved.deadline,
        sponsors: saved.sponsors,
        judgingCriteria: saved.judging_criteria,
        prizes: saved.prizes || [],
      });
    } else {
      setRulesText('');
      setParsedData(null);
    }

    // Load insider intel
    const project = await databaseService.getProject(projectId);
    if (project?.custom_instructions) {
      setInsiderIntel(project.custom_instructions);
    }
  };

  const handleSaveInsiderIntel = async () => {
    if (!projectId) return;

    setIsSavingIntel(true);
    try {
      await databaseService.updateProject(projectId, { custom_instructions: insiderIntel });
    } catch (error) {
      console.error('Failed to save insider intel:', error);
    } finally {
      setIsSavingIntel(false);
    }
  };

  const handleAnalyze = async () => {
    if (inputMode === 'url') {
      if (!hackathonUrl.trim()) return;
      setIsAnalyzing(true);
      try {
        const result = await onParseFromUrl(hackathonUrl);
        setParsedData(result);
      } catch (error) {
        console.error('URL fetch failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      if (!rulesText.trim()) return;
      setIsAnalyzing(true);
      try {
        const result = await onParse(rulesText);
        setParsedData(result);
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleUrlModeClick = () => {
    if (!isPro) {
      onUpgradeClick();
    } else {
      setInputMode('url');
    }
  };

  return (
    <CyberCard
      icon={<FileText size={32} strokeWidth={1.5} />}
      title="Rules Parser"
      description="AI-powered extraction of deadlines, sponsors, and judging criteria from hackathon documentation."
    >
      <div className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode('text')}
            className={`flex-1 py-2 text-xs font-mono transition-colors ${
              inputMode === 'text'
                ? 'bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan'
                : 'bg-black/50 border border-gray-800 text-gray-500 hover:text-gray-400'
            }`}
          >
            PASTE TEXT
          </button>
          <button
            onClick={handleUrlModeClick}
            className={`flex-1 py-2 text-xs font-mono transition-colors relative ${
              inputMode === 'url'
                ? 'bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan'
                : 'bg-black/50 border border-gray-800 text-gray-500 hover:text-gray-400'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Link size={12} />
              <span>FROM URL</span>
              {!isPro && <Sparkles size={12} className="text-accent-yellow" />}
            </div>
          </button>
        </div>

        {inputMode === 'text' ? (
          <textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder="Paste hackathon rules here..."
            className="w-full h-32 bg-black border border-gray-800 p-4 text-gray-300 text-sm placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors resize-none font-mono"
          />
        ) : (
          <div className="space-y-3">
            <input
              type="url"
              value={hackathonUrl}
              onChange={(e) => setHackathonUrl(e.target.value)}
              placeholder="https://devpost.com/hackathon-name"
              className="w-full bg-black border border-gray-800 px-4 py-3 text-gray-300 text-sm placeholder-gray-600 focus:border-accent-cyan focus:outline-none transition-colors font-mono"
            />
            <p className="text-xs text-gray-500 font-mono">
              Supports Devpost and most hackathon websites
            </p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={(inputMode === 'text' ? !rulesText.trim() : !hackathonUrl.trim()) || isAnalyzing}
          className="w-full bg-accent-yellow text-black font-bold py-3 text-sm tracking-wide hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'ANALYZING...' : 'ANALYZE RULES'}
        </button>

        {parsedData && (
          <div className="mt-6 space-y-3 pt-6 border-t border-gray-800">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Deadline</p>
              <p className="text-sm text-gray-300">{parsedData.deadline || 'Not found'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                Sponsors ({parsedData.sponsors.length})
              </p>
              {parsedData.sponsors.length > 0 ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  {parsedData.sponsors.map((sponsor, idx) => (
                    <li key={idx}>• {sponsor}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None identified</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                Judging Criteria ({parsedData.judgingCriteria.length})
              </p>
              {parsedData.judgingCriteria.length > 0 ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  {parsedData.judgingCriteria.map((criteria, idx) => (
                    <li key={idx}>• {criteria}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None identified</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                Prizes ({parsedData.prizes.length})
              </p>
              {parsedData.prizes.length > 0 ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  {parsedData.prizes.map((prize, idx) => (
                    <li key={idx}>• {prize}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None identified</p>
              )}
            </div>
          </div>
        )}

        {parsedData && (
          <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                Insider Intel / Livestream Notes
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Paste notes from sponsor Q&As or livestreams. AI will prioritize these insights when generating ideas and scripts.
              </p>
            </div>
            <textarea
              value={insiderIntel}
              onChange={(e) => setInsiderIntel(e.target.value)}
              placeholder="e.g., 'Sponsor emphasized humor and creativity', 'Looking for solutions that help students', 'Prefer mobile-first approaches'"
              className="w-full h-24 bg-black border border-gray-800 p-4 text-gray-300 text-sm placeholder-gray-600 focus:border-accent-cyan focus:outline-none transition-colors resize-none font-mono"
            />
            <button
              onClick={handleSaveInsiderIntel}
              disabled={isSavingIntel || !projectId}
              className="w-full bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan font-bold py-2 text-sm tracking-wide hover:bg-accent-cyan/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isSavingIntel ? 'SAVING...' : 'SAVE INTEL'}
            </button>
          </div>
        )}
      </div>
    </CyberCard>
  );
};
