import React, { useState } from 'react';
import {
  RefreshCw, Github, FileText, Link, Loader2, CheckCircle2, XCircle,
  AlertTriangle, ChevronDown, ChevronRight, Zap, Shield, AlertCircle,
  TrendingUp, Wrench, Star, Copy, Check,
} from 'lucide-react';
import { CyberCard } from './CyberCard';
import { aiService } from '../services/aiService';

interface ProjectRecyclerProps {
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

type Verdict = 'allowed' | 'not_allowed' | 'unclear';

interface RecycleResult {
  verdict: Verdict;
  verdictReason: string;
  projectSummary: string;
  techStack: string[];
  compatibilityScore: number;
  recyclingPolicy: string;
  requiredAdjustments: Array<{
    title: string;
    description: string;
    effort: 'Low' | 'Medium' | 'High';
    instructions: string;
  }>;
  keyStrengths: string[];
  missingRequirements: string[];
  recommendedApproach: string;
}

type Step = 'repo' | 'rules' | 'analyzing' | 'results';
type RulesMode = 'paste' | 'url';

const PROGRESS_STEPS = [
  'Fetching repository content',
  'Checking repo creation date',
  'Reading hackathon rules',
  'Analyzing tech compatibility',
  'Building adjustment plan',
];

const EffortBadge: React.FC<{ effort: 'Low' | 'Medium' | 'High' }> = ({ effort }) => {
  const styles = {
    Low: 'bg-green-500/20 text-green-400',
    Medium: 'bg-orange-500/20 text-orange-400',
    High: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded font-mono ${styles[effort]}`}>
      {effort}
    </span>
  );
};

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-orange-400' : 'text-red-400';
  const bg = score >= 70 ? 'border-green-500/40' : score >= 40 ? 'border-orange-500/40' : 'border-red-500/40';
  return (
    <div className={`w-16 h-16 rounded-full border-4 ${bg} flex items-center justify-center flex-shrink-0`}>
      <div className="text-center">
        <span className={`text-lg font-black font-mono ${color}`}>{score}</span>
        <span className="text-gray-600 text-[10px] block leading-none">/100</span>
      </div>
    </div>
  );
};

export const ProjectRecycler: React.FC<ProjectRecyclerProps> = ({ isPro, onUpgradeClick }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [rulesMode, setRulesMode] = useState<RulesMode>('paste');
  const [rulesText, setRulesText] = useState('');
  const [rulesUrl, setRulesUrl] = useState('');
  const [step, setStep] = useState<Step>('repo');
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<RecycleResult | null>(null);
  const [repoCreatedDate, setRepoCreatedDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expandedAdj, setExpandedAdj] = useState<number | null>(0);
  const [copiedInstr, setCopiedInstr] = useState<number | null>(null);

  const getRepoFirstCommitDate = async (repoUrl: string): Promise<string | null> => {
    const match = repoUrl.trim().replace(/\/$/, '').match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match) return null;
    const slug = match[1].replace(/\.git$/, '');
    try {
      // Get the default branch's commit list in ascending order to find the first commit
      const commitsResp = await fetch(
        `https://api.github.com/repos/${slug}/commits?per_page=1&order=asc`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );
      if (!commitsResp.ok) return null;

      // GitHub doesn't support order=asc directly, so we use the last page trick via Link header
      // Instead, fetch the repo creation date which is a reliable proxy for the first push
      const repoResp = await fetch(
        `https://api.github.com/repos/${slug}`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );
      if (!repoResp.ok) return null;
      const repoData = await repoResp.json();
      const createdAt: string = repoData.created_at;
      if (!createdAt) return null;
      return new Date(createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return null;
    }
  };

  const normalizeGitHubUrl = (url: string): { raw: string; readme: string } => {
    const cleaned = url.trim().replace(/\/$/, '');
    const match = cleaned.match(/github\.com\/([^/]+\/[^/]+)/);
    const slug = match ? match[1] : null;
    if (slug) {
      return {
        raw: `https://github.com/${slug}`,
        readme: `https://raw.githubusercontent.com/${slug}/main/README.md`,
      };
    }
    return { raw: cleaned, readme: '' };
  };

  const advance = (n: number) => setProgressStep(n);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    const hasRules = rulesMode === 'paste' ? !!rulesText.trim() : !!rulesUrl.trim();
    if (!hasRules) return;

    setError('');
    setResult(null);
    setRepoCreatedDate(null);
    setStep('analyzing');
    setProgressStep(0);

    try {
      // 1. Fetch repo content
      advance(0);
      const { raw, readme } = normalizeGitHubUrl(repoUrl);

      let repoContent = '';

      // Try README first (more reliable & focused)
      if (readme) {
        try {
          const readmeResp = await fetch(readme);
          if (readmeResp.ok) {
            repoContent = await readmeResp.text();
          }
        } catch {
          // fallback to scraping
        }
      }

      // If README fetch failed, fall back to scraping the GitHub page
      if (!repoContent) {
        try {
          repoContent = await aiService.fetchUrlContent(raw);
        } catch {
          // try master branch README
          const masterReadme = readme.replace('/main/', '/master/');
          try {
            const resp = await fetch(masterReadme);
            if (resp.ok) repoContent = await resp.text();
          } catch {
            // give up and use whatever we have
          }
        }
      }

      if (!repoContent) {
        setError('Could not fetch repository content. Make sure the repo is public and the URL is correct.');
        setStep('repo');
        return;
      }

      // 2. Fetch repo creation date from GitHub API
      advance(1);
      const createdDate = await getRepoFirstCommitDate(repoUrl);
      setRepoCreatedDate(createdDate);

      // 3. Fetch rules
      advance(2);
      let finalRulesText = rulesText;
      if (rulesMode === 'url' && rulesUrl.trim()) {
        try {
          finalRulesText = await aiService.fetchUrlContent(rulesUrl.trim());
        } catch {
          setError('Could not fetch rules from URL. Try pasting the rules text instead.');
          setStep('repo');
          return;
        }
      }

      if (!finalRulesText.trim()) {
        setError('Hackathon rules are required for analysis.');
        setStep('repo');
        return;
      }

      // 4-5. Analyze
      advance(3);
      setTimeout(() => advance(4), 1500);

      const analysis = await aiService.analyzeProjectRecyclability(repoContent, finalRulesText, raw, createdDate);

      setResult(analysis);
      setStep('results');
      setExpandedAdj(0);
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please check the repo URL and rules, then try again.');
      setStep('repo');
    }
  };

  const reset = () => {
    setStep('repo');
    setResult(null);
    setRepoCreatedDate(null);
    setError('');
    setProgressStep(0);
  };

  const copyInstructions = async (idx: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedInstr(idx);
    setTimeout(() => setCopiedInstr(null), 2000);
  };

  const verdictConfig: Record<Verdict, { icon: React.ReactNode; label: string; bg: string; border: string; text: string }> = {
    allowed: {
      icon: <CheckCircle2 size={24} />,
      label: 'RECYCLING ALLOWED',
      bg: 'bg-green-500/10',
      border: 'border-green-500/40',
      text: 'text-green-400',
    },
    not_allowed: {
      icon: <XCircle size={24} />,
      label: 'RECYCLING NOT ALLOWED',
      bg: 'bg-red-500/10',
      border: 'border-red-500/40',
      text: 'text-red-400',
    },
    unclear: {
      icon: <AlertTriangle size={24} />,
      label: 'RULES ARE UNCLEAR',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/40',
      text: 'text-orange-400',
    },
  };

  return (
    <CyberCard
      title="PROJECT RECYCLER"
      icon={<RefreshCw size={20} />}
      badge="NEW"
    >
      <div className="space-y-5">
        <p className="text-xs text-gray-500 leading-relaxed">
          Running multiple hackathons simultaneously? Check if you can recycle an existing
          project and get a precise list of adjustments needed to meet the new requirements.
        </p>

        {/* STEP: REPO + RULES INPUT */}
        {(step === 'repo' || step === 'results') && (
          <div className="space-y-4">
            {/* GitHub Repo URL */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Github size={12} />
                GitHub Repo URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="https://github.com/you/your-project"
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-yellow transition-colors font-mono"
              />
              <p className="text-[10px] text-gray-600">Repo must be public. README will be analyzed.</p>
            </div>

            {/* Rules input */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileText size={12} />
                Hackathon Rules
              </label>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setRulesMode('paste')}
                  className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                    rulesMode === 'paste'
                      ? 'bg-accent-yellow text-black font-bold'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  PASTE TEXT
                </button>
                <button
                  onClick={() => {
                    if (!isPro) { onUpgradeClick?.(); return; }
                    setRulesMode('url');
                  }}
                  className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors flex items-center justify-center gap-1 ${
                    rulesMode === 'url'
                      ? 'bg-accent-yellow text-black font-bold'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Link size={11} />
                  FROM URL
                  {!isPro && <span className="text-[9px] opacity-60 ml-0.5">PRO</span>}
                </button>
              </div>

              {rulesMode === 'paste' ? (
                <textarea
                  value={rulesText}
                  onChange={e => setRulesText(e.target.value)}
                  placeholder="Paste the hackathon rules, eligibility requirements, and judging criteria here..."
                  rows={5}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-yellow transition-colors resize-none leading-relaxed"
                />
              ) : (
                <input
                  type="url"
                  value={rulesUrl}
                  onChange={e => setRulesUrl(e.target.value)}
                  placeholder="https://devpost.com/hackathon-name or rules page URL"
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-yellow transition-colors font-mono"
                />
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={step === 'results' ? reset : handleAnalyze}
              disabled={!repoUrl.trim() || (rulesMode === 'paste' ? !rulesText.trim() : !rulesUrl.trim())}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold bg-accent-yellow text-black rounded hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 'results' ? (
                <>
                  <RefreshCw size={16} />
                  ANALYZE DIFFERENT REPO
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  CHECK IF I CAN RECYCLE THIS
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP: ANALYZING */}
        {step === 'analyzing' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <RefreshCw size={40} className="text-accent-yellow animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              {PROGRESS_STEPS.map((label, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                    i < progressStep ? 'text-gray-500' :
                    i === progressStep ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {i < progressStep ? (
                    <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  ) : i === progressStep ? (
                    <Loader2 size={14} className="animate-spin text-accent-yellow flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-700 flex-shrink-0" />
                  )}
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: RESULTS */}
        {step === 'results' && result && (
          <div className="space-y-4">
            {/* Verdict Banner */}
            <div className={`p-4 rounded border ${verdictConfig[result.verdict].bg} ${verdictConfig[result.verdict].border}`}>
              <div className="flex items-start gap-3">
                <span className={verdictConfig[result.verdict].text}>
                  {verdictConfig[result.verdict].icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black uppercase tracking-wider ${verdictConfig[result.verdict].text}`}>
                    {verdictConfig[result.verdict].label}
                  </p>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{result.verdictReason}</p>
                </div>
                <ScoreRing score={result.compatibilityScore} />
              </div>
            </div>

            {/* Project Summary */}
            <div className="p-3 bg-gray-800/40 rounded border border-gray-800 space-y-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Project Summary</p>
              <p className="text-xs text-gray-300 leading-relaxed">{result.projectSummary}</p>
              <div className="flex flex-wrap gap-2 pt-1 items-center">
                {repoCreatedDate && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-mono border border-blue-500/30">
                    Repo created: {repoCreatedDate}
                  </span>
                )}
                {result.techStack.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Recycling Policy */}
            <div className="p-3 bg-gray-800/40 rounded border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-1.5">What the Rules Say</p>
              <p className="text-xs text-gray-300 leading-relaxed italic">"{result.recyclingPolicy}"</p>
            </div>

            {/* Strengths + Missing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.keyStrengths.length > 0 && (
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Shield size={12} className="text-green-400" />
                    <p className="text-[10px] text-green-400 uppercase tracking-wider font-mono font-bold">Strengths</p>
                  </div>
                  <ul className="space-y-1">
                    {result.keyStrengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300 leading-relaxed">
                        <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.missingRequirements.length > 0 && (
                <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded space-y-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-orange-400" />
                    <p className="text-[10px] text-orange-400 uppercase tracking-wider font-mono font-bold">Gaps</p>
                  </div>
                  <ul className="space-y-1">
                    {result.missingRequirements.map((m, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300 leading-relaxed">
                        <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Required Adjustments */}
            {result.requiredAdjustments.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-accent-yellow" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Required Adjustments ({result.requiredAdjustments.length})
                  </p>
                </div>
                <div className="space-y-1.5">
                  {result.requiredAdjustments.map((adj, i) => (
                    <div key={i} className="border border-gray-800 rounded overflow-hidden">
                      <button
                        onClick={() => setExpandedAdj(expandedAdj === i ? null : i)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/40 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-xs text-gray-200 font-medium flex-1 text-left">{adj.title}</span>
                        <EffortBadge effort={adj.effort} />
                        {expandedAdj === i ? (
                          <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                        )}
                      </button>

                      {expandedAdj === i && (
                        <div className="px-3 pb-3 pt-1 border-t border-gray-800/60 space-y-2.5">
                          <p className="text-xs text-gray-400 leading-relaxed">{adj.description}</p>
                          <div className="p-2.5 bg-gray-900/60 rounded space-y-1">
                            <p className="text-[10px] text-accent-yellow uppercase tracking-wider font-mono mb-1.5">Instructions</p>
                            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{adj.instructions}</p>
                          </div>
                          <button
                            onClick={() => copyInstructions(i, adj.instructions)}
                            className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors"
                          >
                            {copiedInstr === i ? (
                              <><Check size={11} className="text-green-400" /> Copied</>
                            ) : (
                              <><Copy size={11} /> Copy instructions</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.requiredAdjustments.length === 0 && result.verdict === 'allowed' && (
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded">
                <Star size={16} className="text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-300 leading-relaxed">
                  No adjustments needed — this project meets all hackathon requirements as-is.
                </p>
              </div>
            )}

            {/* Recommended Approach */}
            <div className="p-3 bg-accent-yellow/5 border border-accent-yellow/20 rounded space-y-1.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-accent-yellow" />
                <p className="text-[10px] text-accent-yellow uppercase tracking-wider font-mono font-bold">Recommended Approach</p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{result.recommendedApproach}</p>
            </div>

            {/* Re-analyze button */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-400 border border-gray-700 rounded hover:border-gray-500 hover:text-white transition-colors"
            >
              <RefreshCw size={13} />
              ANALYZE A DIFFERENT REPO
            </button>
          </div>
        )}
      </div>
    </CyberCard>
  );
};
