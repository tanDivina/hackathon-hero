import React, { useState } from 'react';
import { Building2, Loader2, ChevronDown, ChevronRight, Trophy, Package, Wrench, Crosshair } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { aiService } from '../services/aiService';
import { databaseService } from '../services/database';

interface SponsorDeepDiveProps {
  projectId?: string;
  idea?: string;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

interface SponsorInsight {
  overview: string;
  relevantProducts: string[];
  integrationTips: string[];
  winningAngle: string;
  pastWinPatterns: string;
}

export const SponsorDeepDive: React.FC<SponsorDeepDiveProps> = ({
  projectId,
  idea,
  isPro,
  onUpgradeClick,
}) => {
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<string>('');
  const [insight, setInsight] = useState<SponsorInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('winningAngle');
  const [error, setError] = useState('');
  const [eventType, setEventType] = useState('HACKATHON');

  const loadSponsors = async () => {
    if (!projectId) return;
    setIsLoadingSponsors(true);
    const rulesData = await databaseService.getRulesData(projectId);
    if (rulesData) {
      const valid = rulesData.sponsors.filter(s =>
        !s.toLowerCase().includes('no sponsor') &&
        !s.toLowerCase().includes('not identified')
      );
      setSponsors(valid);
      setEventType(rulesData.event_type);
      if (valid.length > 0) setSelectedSponsor(valid[0]);
    }
    setIsLoadingSponsors(false);
  };

  React.useEffect(() => {
    if (projectId && isPro) loadSponsors();
  }, [projectId, isPro]);

  const handleAnalyze = async () => {
    if (!selectedSponsor || !idea) return;
    setIsLoading(true);
    setError('');
    setInsight(null);
    try {
      const res = await aiService.sponsorDeepDive(selectedSponsor, idea, eventType);
      setInsight(res);
      setExpandedSection('winningAngle');
    } catch {
      setError('Analysis failed. Please try again.');
    }
    setIsLoading(false);
  };

  const Section: React.FC<{
    id: string;
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, label, icon, children }) => (
    <div className="border border-gray-800 rounded overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-accent-yellow">{icon}</span>
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex-1 text-left">{label}</span>
        {expandedSection === id ? (
          <ChevronDown size={14} className="text-gray-500" />
        ) : (
          <ChevronRight size={14} className="text-gray-500" />
        )}
      </button>
      {expandedSection === id && (
        <div className="px-3 pb-3 pt-1">{children}</div>
      )}
    </div>
  );

  if (!isPro) {
    return (
      <CyberCard title="SPONSOR DEEP DIVE" icon={<Building2 size={20} />}>
        <div className="text-center py-8">
          <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 text-sm mb-3">Pro feature</p>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 text-xs font-bold bg-accent-yellow text-black rounded hover:bg-accent-yellow/90 transition-colors"
          >
            UNLOCK PRO
          </button>
        </div>
      </CyberCard>
    );
  }

  return (
    <CyberCard title="SPONSOR DEEP DIVE" icon={<Building2 size={20} />}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Get AI insights on how to best align your idea with each sponsor's goals and win their prize.
        </p>

        {isLoadingSponsors ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-6">
            <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No sponsors identified</p>
            <p className="text-gray-600 text-xs mt-1">Parse hackathon rules to detect sponsors</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Select Sponsor</label>
              <div className="flex flex-wrap gap-2">
                {sponsors.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSponsor(s); setInsight(null); }}
                    className={`px-3 py-1.5 text-xs rounded transition-colors font-mono ${
                      selectedSponsor === s
                        ? 'bg-accent-yellow text-black font-bold'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isLoading || !selectedSponsor || !idea}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold bg-accent-yellow text-black rounded hover:bg-accent-yellow/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  ANALYZING {selectedSponsor.toUpperCase()}...
                </>
              ) : (
                <>
                  <Building2 size={16} />
                  DEEP DIVE: {selectedSponsor.toUpperCase()}
                </>
              )}
            </button>

            {!idea && <p className="text-xs text-gray-600 text-center">Generate an idea first.</p>}
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            {insight && (
              <div className="space-y-2">
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                  <p className="text-xs text-gray-300 leading-relaxed">{insight.overview}</p>
                </div>

                <Section id="winningAngle" label="Winning Angle" icon={<Crosshair size={14} />}>
                  <p className="text-xs text-gray-300 leading-relaxed">{insight.winningAngle}</p>
                </Section>

                <Section id="products" label="Relevant Products" icon={<Package size={14} />}>
                  <ul className="space-y-1.5">
                    {insight.relevantProducts.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section id="tips" label="Integration Tips" icon={<Wrench size={14} />}>
                  <ul className="space-y-1.5">
                    {insight.integrationTips.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-1" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section id="patterns" label="Win Patterns" icon={<Trophy size={14} />}>
                  <p className="text-xs text-gray-300 leading-relaxed">{insight.pastWinPatterns}</p>
                </Section>
              </div>
            )}
          </>
        )}
      </div>
    </CyberCard>
  );
};
