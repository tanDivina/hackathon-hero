import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService, ChecklistItem } from '../services/database';
import { geminiService } from '../services/geminiService';

interface SubmissionChecklistProps {
  projectId?: string;
  hasRules: boolean;
  rulesText: string;
}

export const SubmissionChecklist: React.FC<SubmissionChecklistProps> = ({
  projectId,
  hasRules,
  rulesText,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadChecklist();
    }
  }, [projectId]);

  const loadChecklist = async () => {
    if (!projectId) return;
    setIsLoading(true);
    const savedItems = await databaseService.getChecklist(projectId);
    if (savedItems.length > 0) {
      setItems(savedItems);
    } else {
      setItems([
        { id: '1', text: 'Submit project to hackathon platform', completed: false, source: 'manual' },
        { id: '2', text: 'Record demo video', completed: false, source: 'manual' },
        { id: '3', text: 'Write README documentation', completed: false, source: 'manual' },
      ]);
    }
    setIsLoading(false);
  };

  const saveChecklist = async (newItems: ChecklistItem[]) => {
    if (!projectId) return;
    await databaseService.saveChecklist(projectId, newItems);
  };

  const toggleItem = async (id: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);
    await saveChecklist(newItems);
  };

  const addItem = async () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
      source: 'manual',
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setNewItemText('');
    await saveChecklist(newItems);
  };

  const removeItem = async (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    await saveChecklist(newItems);
  };

  const generateFromRules = async () => {
    if (!rulesText || !projectId) return;
    setIsGenerating(true);

    try {
      const prompt = `Analyze these hackathon rules and extract a checklist of submission requirements. Return ONLY a JSON array of strings, each being a specific requirement or deliverable that participants must complete.

Rules:
${rulesText.substring(0, 4000)}

Return format: ["requirement 1", "requirement 2", ...]
Focus on: video requirements, documentation, deployment, source code, team registration, etc.`;

      const response = await geminiService.generateContent(prompt);
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        const requirements = JSON.parse(match[0]) as string[];
        const newItems: ChecklistItem[] = requirements.map((req, idx) => ({
          id: `auto-${Date.now()}-${idx}`,
          text: req,
          completed: false,
          source: 'auto' as const,
        }));
        const combined = [...items.filter(i => i.source === 'manual'), ...newItems];
        setItems(combined);
        await saveChecklist(combined);
      }
    } catch (error) {
      console.error('Failed to generate checklist:', error);
    }

    setIsGenerating(false);
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <CyberCard title="SUBMISSION CHECKLIST" icon={CheckSquare}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {completedCount}/{items.length} completed
            </span>
          </div>
          {hasRules && (
            <button
              onClick={generateFromRules}
              disabled={isGenerating}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-accent-yellow/10 text-accent-yellow rounded hover:bg-accent-yellow/20 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isGenerating ? 'GENERATING...' : 'AUTO-GENERATE'}
            </button>
          )}
        </div>

        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-accent-yellow h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors group"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex-shrink-0"
                >
                  {item.completed ? (
                    <CheckSquare size={18} className="text-accent-yellow" />
                  ) : (
                    <Square size={18} className="text-gray-500" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    item.completed ? 'text-gray-500 line-through' : 'text-gray-300'
                  }`}
                >
                  {item.text}
                </span>
                {item.source === 'auto' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-accent-yellow/20 text-accent-yellow rounded">
                    AI
                  </span>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Add custom item..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-yellow"
          />
          <button
            onClick={addItem}
            disabled={!newItemText.trim()}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </CyberCard>
  );
};
