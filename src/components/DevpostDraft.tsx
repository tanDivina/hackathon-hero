import React, { useState } from 'react';
import { FileText, Loader2, Copy, Check, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { aiService } from '../services/aiService';
import { databaseService } from '../services/database';

interface DevpostDraftProps {
  projectId?: string;
  idea?: string;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

interface Draft {
  projectName: string;
  tagline: string;
  inspiration: string;
  whatItDoes: string;
  howWeBuiltIt: string;
  challenges: string;
  accomplishments: string;
  whatWelearned: string;
  whatsNext: string;
  builtWith: string[];
}

const SECTIONS = [
  { key: 'inspiration', label: 'Inspiration' },
  { key: 'whatItDoes', label: 'What It Does' },
  { key: 'howWeBuiltIt', label: 'How We Built It' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'accomplishments', label: 'Accomplishments' },
  { key: 'whatWelearned', label: 'What We Learned' },
  { key: 'whatsNext', label: "What's Next" },
] as const;

export const DevpostDraft: React.FC<DevpostDraftProps> = ({
  projectId,
  idea,
  isPro,
  onUpgradeClick,
}) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('whatItDoes');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!projectId || !idea) return;
    setIsLoading(true);
    setError('');
    try {
      const rulesData = await databaseService.getRulesData(projectId);
      const pitchScript = await databaseService.getPitchScript(projectId);

      const result = await aiService.generateDevpostDraft(
        idea,
        rulesData ? {
          sponsors: rulesData.sponsors,
          judgingCriteria: rulesData.judging_criteria,
          theme: rulesData.theme,
          eventType: rulesData.event_type,
        } : { sponsors: [], judgingCriteria: [], theme: 'General', eventType: 'HACKATHON' },
        pitchScript ? {
          problem: pitchScript.problem,
          solution: pitchScript.solution,
          traction: pitchScript.traction,
        } : undefined
      );
      setDraft(result);
      setExpandedSection('whatItDoes');
    } catch {
      setError('Failed to generate draft. Please try again.');
    }
    setIsLoading(false);
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportAsMarkdown = () => {
    if (!draft) return;
    const md = `# ${draft.projectName}

> ${draft.tagline}

## Inspiration
${draft.inspiration}

## What It Does
${draft.whatItDoes}

## How We Built It
${draft.howWeBuiltIt}

## Challenges We Ran Into
${draft.challenges}

## Accomplishments That We're Proud Of
${draft.accomplishments}

## What We Learned
${draft.whatWelearned}

## What's Next
${draft.whatsNext}

## Built With
${draft.builtWith.map(t => `- ${t}`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.projectName.toLowerCase().replace(/\s+/g, '-')}-devpost.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isPro) {
    return (
      <CyberCard title="DEVPOST DRAFT" icon={<FileText size={20} />}>
        <div className="text-center py-8">
          <FileText className="w-10 h-10 text-gray-700 mx-auto mb-2" />
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
    <CyberCard title="DEVPOST DRAFT" icon={<FileText size={20} />}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Generate a pre-filled Devpost submission draft from your project data — ready to copy-paste.
        </p>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !idea}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold bg-accent-yellow text-black rounded hover:bg-accent-yellow/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              GENERATING DRAFT...
            </>
          ) : (
            <>
              <FileText size={16} />
              {draft ? 'REGENERATE DRAFT' : 'GENERATE DEVPOST DRAFT'}
            </>
          )}
        </button>

        {!idea && <p className="text-xs text-gray-600 text-center">Generate an idea first.</p>}
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {draft && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-800/60 rounded border border-gray-700 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base">{draft.projectName}</h3>
                  <p className="text-gray-400 text-xs mt-0.5 italic">{draft.tagline}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(`${draft.projectName}\n${draft.tagline}`, 'header')}
                  className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded transition-colors"
                >
                  {copiedKey === 'header' ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {draft.builtWith.map((tech, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {SECTIONS.map(({ key, label }) => {
                const text = draft[key as keyof Draft] as string;
                return (
                  <div key={key} className="border border-gray-800 rounded overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600">{text.split(' ').length}w</span>
                        {expandedSection === key ? (
                          <ChevronDown size={14} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-500" />
                        )}
                      </div>
                    </button>
                    {expandedSection === key && (
                      <div className="px-3 pb-3">
                        <p className="text-xs text-gray-300 leading-relaxed mb-2">{text}</p>
                        <button
                          onClick={() => copyToClipboard(text, key)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                        >
                          {copiedKey === key ? (
                            <Check size={10} className="text-green-400" />
                          ) : (
                            <Copy size={10} />
                          )}
                          {copiedKey === key ? 'Copied!' : 'Copy section'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={exportAsMarkdown}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-300 border border-gray-700 rounded hover:border-gray-500 hover:text-white transition-colors"
            >
              <Download size={14} />
              EXPORT AS MARKDOWN
            </button>
          </div>
        )}
      </div>
    </CyberCard>
  );
};
