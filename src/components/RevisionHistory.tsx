import React, { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';

interface RevisionHistoryProps {
  projectId?: string;
  onRestoreIdea?: (content: Record<string, unknown>) => void;
  onRestorePrompt?: (content: Record<string, unknown>) => void;
  onRestoreScript?: (content: Record<string, unknown>) => void;
}

interface Revision {
  id: string;
  content_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

const CONTENT_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'idea', label: 'Ideas' },
  { value: 'prompt', label: 'Prompts' },
  { value: 'pitch_script', label: 'Pitch Scripts' },
  { value: 'demo_script', label: 'Demo Scripts' },
  { value: 'intro_script', label: 'Intro Scripts' },
];

export const RevisionHistory: React.FC<RevisionHistoryProps> = ({
  projectId,
  onRestoreIdea,
  onRestorePrompt,
  onRestoreScript,
}) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadRevisions();
    }
  }, [projectId]);

  const loadRevisions = async () => {
    if (!projectId) return;
    setIsLoading(true);
    const history = await databaseService.getRevisionHistory(projectId);
    setRevisions(history);
    setIsLoading(false);
  };

  const filteredRevisions = filter === 'all'
    ? revisions
    : revisions.filter(r => r.content_type === filter);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeLabel = (type: string) => {
    const found = CONTENT_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'idea': return 'bg-blue-500/20 text-blue-400';
      case 'prompt': return 'bg-green-500/20 text-green-400';
      case 'pitch_script': return 'bg-purple-500/20 text-purple-400';
      case 'demo_script': return 'bg-orange-500/20 text-orange-400';
      case 'intro_script': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleRestore = (revision: Revision) => {
    if (revision.content_type === 'idea' && onRestoreIdea) {
      onRestoreIdea(revision.content);
    } else if (revision.content_type === 'prompt' && onRestorePrompt) {
      onRestorePrompt(revision.content);
    } else if (revision.content_type.includes('script') && onRestoreScript) {
      onRestoreScript(revision.content);
    }
  };

  const renderContentPreview = (content: Record<string, unknown>) => {
    const entries = Object.entries(content).slice(0, 3);
    return (
      <div className="space-y-1 mt-2 p-2 bg-gray-900/50 rounded text-xs">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="text-gray-500 flex-shrink-0">{key}:</span>
            <span className="text-gray-400 truncate">
              {typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value).substring(0, 100)}
            </span>
          </div>
        ))}
        {Object.keys(content).length > 3 && (
          <span className="text-gray-600">...and {Object.keys(content).length - 3} more fields</span>
        )}
      </div>
    );
  };

  return (
    <CyberCard title="REVISION HISTORY" icon={History}>
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CONTENT_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`px-3 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                filter === type.value
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredRevisions.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredRevisions.map(revision => (
              <div
                key={revision.id}
                className="border border-gray-800 rounded overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === revision.id ? null : revision.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors"
                >
                  {expandedId === revision.id ? (
                    <ChevronDown size={14} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-500" />
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded ${getTypeColor(revision.content_type)}`}>
                    {getTypeLabel(revision.content_type)}
                  </span>
                  <span className="text-xs text-gray-400 flex-1 text-left">
                    {formatTimeAgo(revision.created_at)}
                  </span>
                </button>
                {expandedId === revision.id && (
                  <div className="px-3 pb-3">
                    {renderContentPreview(revision.content)}
                    <button
                      onClick={() => handleRestore(revision)}
                      className="mt-2 flex items-center gap-1 px-2 py-1 text-xs bg-accent-yellow/10 text-accent-yellow rounded hover:bg-accent-yellow/20 transition-colors"
                    >
                      <RotateCcw size={12} />
                      RESTORE THIS VERSION
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No revision history yet</p>
            <p className="text-gray-600 text-xs mt-1">
              Generated content will be saved here automatically
            </p>
          </div>
        )}
      </div>
    </CyberCard>
  );
};
