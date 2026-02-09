import React, { useState, useEffect } from 'react';
import { Video, Download, Lock, Github, Save, X } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { ScriptSection } from './ScriptSection';
import { databaseService } from '../services/database';
import { scriptTips } from '../utils/scriptTips';
import { aiService } from '../services/aiService';
import { GenerationProgress, useGenerationProgress } from './GenerationProgress';

interface ScriptSections {
  problem: string;
  solution: string;
  traction: string;
  requirements?: string;
  tools?: string;
  realworld_use?: string;
  who?: string;
  what?: string;
  why?: string;
  fullScript: string;
}

interface PitchScriptProps {
  onGenerate: (idea: string, scriptType: 'pitch' | 'demo' | 'intro', githubUrl?: string, yourName?: string) => Promise<ScriptSections>;
  isPro: boolean;
  projectId?: string;
  reloadKey?: number;
  onShowProModal?: () => void;
  onScriptSaved?: (scriptData: {
    problem: string;
    solution: string;
    traction: string;
    script_type: 'pitch' | 'demo' | 'intro';
    demo_requirements: string;
    demo_tools: string;
    demo_realworld_use: string;
    intro_who: string;
    intro_what: string;
    intro_why: string;
  }) => void;
}

type SectionKey = 'problem' | 'solution' | 'traction' | 'requirements' | 'tools' | 'realworld_use' | 'who' | 'what' | 'why';

export const PitchScript: React.FC<PitchScriptProps> = ({ onGenerate, isPro, projectId, reloadKey, onShowProModal, onScriptSaved }) => {
  const [idea, setIdea] = useState('');
  const [scriptType, setScriptType] = useState<'pitch' | 'demo' | 'intro'>('pitch');
  const [yourName, setYourName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<ScriptSections | null>(null);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [generatingAlternatives, setGeneratingAlternatives] = useState<SectionKey | null>(null);
  const [alternatives, setAlternatives] = useState<Record<SectionKey, string[]>>({} as Record<SectionKey, string[]>);
  const [manualMode, setManualMode] = useState(false);
  const [fullScriptMode, setFullScriptMode] = useState(false);
  const [fullScriptContent, setFullScriptContent] = useState('');
  const scriptProgress = useGenerationProgress([
    'Understanding project context',
    'Crafting narrative structure',
    'Writing script sections',
    'Polishing delivery notes',
  ]);

  useEffect(() => {
    loadSavedData();
  }, [projectId, reloadKey]);

  useEffect(() => {
    const checkForNewIdea = async () => {
      if (!projectId || script) return;

      const ideaData = await databaseService.getIdea(projectId);
      if (ideaData && ideaData.idea_text !== idea) {
        setIdea(ideaData.idea_text);
      }
    };

    const interval = setInterval(checkForNewIdea, 2000);
    return () => clearInterval(interval);
  }, [projectId, idea, script]);

  const resetForm = () => {
    setIdea('');
    setScriptType('pitch');
    setYourName('');
    setGithubUrl('');
    setScript(null);
    setEditingSection(null);
    setEditedContent('');
    setAlternatives({} as Record<SectionKey, string[]>);
    setManualMode(false);
    setFullScriptMode(false);
    setFullScriptContent('');
  };

  const loadSavedData = async () => {
    if (!projectId) {
      resetForm();
      return;
    }

    const ideaData = await databaseService.getIdea(projectId);
    const latestIdea = ideaData?.idea_text || '';

    // If we have a freshly generated script (not saved yet), only update the idea
    // Don't overwrite the generated script with old data from database
    if (script && !isGenerating) {
      // Only update idea if it changed
      if (latestIdea !== idea) {
        setIdea(latestIdea);
      }
      return;
    }

    const saved = await databaseService.getPitchScript(projectId);
    if (saved) {
      setIdea(latestIdea);

      // If the saved script was generated for a different idea, don't load it
      if (saved.idea_text !== latestIdea) {
        setScript(null);
        setScriptType('pitch');
        setGithubUrl('');
        setYourName('');
        return;
      }

      setScriptType(saved.script_type || 'pitch');
      setGithubUrl(saved.github_url || '');
      setYourName(saved.your_name || '');

      if (saved.script_type === 'intro') {
        setScript({
          problem: '',
          solution: '',
          traction: '',
          who: saved.intro_who,
          what: saved.intro_what,
          why: saved.intro_why,
          fullScript: saved.intro_full_script || '',
        });
      } else if (saved.script_type === 'demo') {
        setScript({
          problem: saved.problem,
          solution: saved.solution,
          traction: saved.traction,
          requirements: saved.demo_requirements,
          tools: saved.demo_tools,
          realworld_use: saved.demo_realworld_use,
          fullScript: `PROBLEM (45s):\n${saved.problem}\n\nREQUIREMENTS (30s):\n${saved.demo_requirements}\n\nSOLUTION (60s):\n${saved.solution}\n\nTOOLS (30s):\n${saved.demo_tools}\n\nREAL-WORLD USE (30s):\n${saved.demo_realworld_use}\n\nTRACTION (15s):\n${saved.traction}`,
        });
      } else {
        setScript({
          problem: saved.problem,
          solution: saved.solution,
          traction: saved.traction,
          fullScript: `PROBLEM (60s):\n${saved.problem}\n\nSOLUTION (90s):\n${saved.solution}\n\nTRACTION (30s):\n${saved.traction}`,
        });
      }
    } else {
      // No saved script, just set the idea
      setIdea(latestIdea);
      setScript(null);
      setScriptType('pitch');
      setGithubUrl('');
      setYourName('');
    }
  };

  const handleCreateManual = () => {
    const emptyScript: ScriptSections = scriptType === 'intro'
      ? {
          problem: '',
          solution: '',
          traction: '',
          who: '',
          what: '',
          why: '',
          fullScript: '',
        }
      : scriptType === 'demo'
      ? {
          problem: '',
          solution: '',
          traction: '',
          requirements: '',
          tools: '',
          realworld_use: '',
          fullScript: '',
        }
      : {
          problem: '',
          solution: '',
          traction: '',
          fullScript: '',
        };

    setScript(emptyScript);
    setManualMode(true);
    setFullScriptMode(false);
    setFullScriptContent('');
    setAlternatives({} as Record<SectionKey, string[]>);
  };

  const handleSaveFullScript = async () => {
    if (!fullScriptContent.trim()) return;

    setIsSaving(true);

    // Create a script object with the full script content
    const updatedScript: ScriptSections = {
      problem: '',
      solution: '',
      traction: '',
      fullScript: fullScriptContent,
    };

    setScript(updatedScript);

    // Prepare script data for parent
    const scriptData = {
      problem: fullScriptContent,
      solution: '',
      traction: '',
      script_type: scriptType,
      demo_requirements: '',
      demo_tools: '',
      demo_realworld_use: '',
      intro_who: '',
      intro_what: '',
      intro_why: '',
    };

    // Notify parent
    onScriptSaved?.(scriptData);

    // Save to database if project exists
    if (projectId) {
      try {
        await databaseService.savePitchScript(projectId, idea || 'Manual Script', {
          ...scriptData,
          github_url: githubUrl || '',
          github_analyzed: false,
          your_name: yourName || '',
        });
      } catch (error) {
        console.error('Save failed:', error);
      }
    }

    setIsSaving(false);
    setFullScriptMode(false);
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    if (scriptType === 'demo' && githubUrl && !isPro) {
      onShowProModal?.();
      return;
    }

    setIsGenerating(true);
    setManualMode(false);
    scriptProgress.start();
    try {
      const advanceInterval = setInterval(() => scriptProgress.advance(), 2000);
      const result = await onGenerate(idea, scriptType, githubUrl || undefined, yourName || undefined);
      clearInterval(advanceInterval);
      scriptProgress.complete();
      setScript(result);
      setEditingSection(null);
      setEditedContent('');
      setAlternatives({} as Record<SectionKey, string[]>);
    } catch (error) {
      console.error('Generation failed:', error);
      scriptProgress.reset();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSection = (section: SectionKey) => {
    if (script) {
      setEditingSection(section);
      setEditedContent(script[section] || '');
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditedContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingSection || !script) return;

    const updatedScript = { ...script, [editingSection]: editedContent };

    // Update local state immediately for better UX
    const updatedFullScript = scriptType === 'intro'
      ? `WHO (6-7s):\n${updatedScript.who}\n\nWHAT (6-7s):\n${updatedScript.what}\n\nWHY (6-7s):\n${updatedScript.why}`
      : scriptType === 'demo'
      ? `PROBLEM (45s):\n${updatedScript.problem}\n\nREQUIREMENTS (30s):\n${updatedScript.requirements}\n\nSOLUTION (60s):\n${updatedScript.solution}\n\nTOOLS (30s):\n${updatedScript.tools}\n\nREAL-WORLD USE (30s):\n${updatedScript.realworld_use}\n\nTRACTION (15s):\n${updatedScript.traction}`
      : `PROBLEM (60s):\n${updatedScript.problem}\n\nSOLUTION (90s):\n${updatedScript.solution}\n\nTRACTION (30s):\n${updatedScript.traction}`;

    setScript({ ...updatedScript, fullScript: updatedFullScript });
    setEditingSection(null);
    setEditedContent('');

    // Prepare script data for parent
    const scriptData = {
      problem: updatedScript.problem || '',
      solution: updatedScript.solution || '',
      traction: updatedScript.traction || '',
      script_type: scriptType,
      demo_requirements: updatedScript.requirements || '',
      demo_tools: updatedScript.tools || '',
      demo_realworld_use: updatedScript.realworld_use || '',
      intro_who: updatedScript.who || '',
      intro_what: updatedScript.what || '',
      intro_why: updatedScript.why || '',
    };

    // Always notify parent with the updated script data
    onScriptSaved?.(scriptData);

    // Save to database if project exists
    if (projectId) {
      setIsSaving(true);
      try {
        await databaseService.savePitchScript(projectId, idea || 'Manual Script', {
          ...scriptData,
          github_url: githubUrl || '',
          github_analyzed: !!githubUrl,
          your_name: yourName || '',
        });
      } catch (error) {
        console.error('Save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRegenerateSection = async (section: SectionKey) => {
    if (!script) return;

    setGeneratingAlternatives(section);
    try {
      const alts = await aiService.generateAlternativeSections(
        section,
        script[section] || '',
        { idea, scriptType }
      );
      setAlternatives(prev => ({ ...prev, [section]: alts }));
    } catch (error) {
      console.error('Failed to generate alternatives:', error);
    } finally {
      setGeneratingAlternatives(null);
    }
  };

  const handleSelectAlternative = async (section: SectionKey, alternative: string) => {
    if (!projectId || !script) return;

    const updatedScript = { ...script, [section]: alternative };

    setIsSaving(true);
    try {
      await databaseService.savePitchScript(projectId, idea, {
        problem: updatedScript.problem,
        solution: updatedScript.solution,
        traction: updatedScript.traction,
        script_type: scriptType,
        demo_requirements: updatedScript.requirements || '',
        demo_tools: updatedScript.tools || '',
        demo_realworld_use: updatedScript.realworld_use || '',
        github_url: githubUrl || '',
        github_analyzed: !!githubUrl,
        intro_who: updatedScript.who || '',
        intro_what: updatedScript.what || '',
        intro_why: updatedScript.why || '',
        intro_full_script: scriptType === 'intro' ? `WHO YOU ARE (6-7s):\n${updatedScript.who}\n\nWHAT YOU'RE BUILDING (6-7s):\n${updatedScript.what}\n\nWHY YOU'RE BUILDING IT (6-7s):\n${updatedScript.why}` : '',
        your_name: yourName || '',
      });

      const updatedFullScript = scriptType === 'intro'
        ? `WHO YOU ARE (6-7s):\n${updatedScript.who}\n\nWHAT YOU'RE BUILDING (6-7s):\n${updatedScript.what}\n\nWHY YOU'RE BUILDING IT (6-7s):\n${updatedScript.why}`
        : scriptType === 'demo'
        ? `PROBLEM (45s):\n${updatedScript.problem}\n\nREQUIREMENTS (30s):\n${updatedScript.requirements}\n\nSOLUTION (60s):\n${updatedScript.solution}\n\nTOOLS (30s):\n${updatedScript.tools}\n\nREAL-WORLD USE (30s):\n${updatedScript.realworld_use}\n\nTRACTION (15s):\n${updatedScript.traction}`
        : `PROBLEM (60s):\n${updatedScript.problem}\n\nSOLUTION (90s):\n${updatedScript.solution}\n\nTRACTION (30s):\n${updatedScript.traction}`;

      setScript({ ...updatedScript, fullScript: updatedFullScript });
      setAlternatives(prev => ({ ...prev, [section]: [] }));
    } catch (error) {
      console.error('Failed to save alternative:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!script) return;
    const blob = new Blob([script.fullScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptType}-script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <CyberCard
      icon={<Video size={32} strokeWidth={1.5} />}
      title="Script Generator"
      description="Generate, edit, and export pitch or demo video scripts."
      badge={script ? 'READY' : undefined}
    >
      <div className="space-y-4">
        <div className="border border-gray-800 p-4">
          <label className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3 block">
            Script Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setScriptType('intro');
                setFullScriptMode(false);
              }}
              disabled={!!editingSection || fullScriptMode}
              className={`py-2 px-3 text-xs font-mono transition-colors ${
                scriptType === 'intro'
                  ? 'bg-accent-yellow text-black'
                  : 'border border-gray-800 text-gray-400 hover:text-white'
              } ${(editingSection || fullScriptMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              20s INTRO
            </button>
            <button
              onClick={() => {
                setScriptType('pitch');
                setFullScriptMode(false);
              }}
              disabled={!!editingSection || fullScriptMode}
              className={`py-2 px-3 text-xs font-mono transition-colors ${
                scriptType === 'pitch'
                  ? 'bg-accent-yellow text-black'
                  : 'border border-gray-800 text-gray-400 hover:text-white'
              } ${(editingSection || fullScriptMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              3m PITCH
            </button>
            <button
              onClick={() => {
                setScriptType('demo');
                setFullScriptMode(false);
              }}
              disabled={!!editingSection || fullScriptMode}
              className={`py-2 px-3 text-xs font-mono transition-colors ${
                scriptType === 'demo'
                  ? 'bg-accent-yellow text-black'
                  : 'border border-gray-800 text-gray-400 hover:text-white'
              } ${(editingSection || fullScriptMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              3m DEMO
            </button>
          </div>
          {scriptType === 'intro' && (
            <p className="text-xs text-gray-600 mt-3">
              20-second intro: Who you are, What you're building, Why you're building it
            </p>
          )}
          {scriptType === 'pitch' && (
            <p className="text-xs text-gray-600 mt-3">
              3-minute pitch: Problem (60s), Solution (90s), Traction (30s)
            </p>
          )}
          {scriptType === 'demo' && (
            <p className="text-xs text-gray-600 mt-3">
              3-minute demo: Problem, Requirements, Solution, Tools, Real-World Use, Traction
            </p>
          )}
        </div>

        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          disabled={!!editingSection || fullScriptMode}
          placeholder="Describe your project idea..."
          className={`w-full h-32 bg-black border border-gray-800 p-4 text-gray-300 text-sm placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors resize-none ${
            (editingSection || fullScriptMode) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />

        {scriptType === 'intro' && (
          <div className="border border-gray-800 p-4">
            <label className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3 block">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="John Doe"
              disabled={!!editingSection || fullScriptMode}
              className={`w-full bg-black border border-gray-800 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors ${
                (editingSection || fullScriptMode) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <p className="text-xs text-gray-600 mt-2">
              Personalize your intro pitch with your name
            </p>
          </div>
        )}

        {scriptType === 'demo' && (
          <div className="border border-gray-800 p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-500 font-mono uppercase tracking-wider flex items-center gap-2">
                <Github size={14} />
                GitHub Repository (Optional)
              </label>
              {!isPro && (
                <span className="flex items-center gap-1 text-xs text-accent-yellow font-mono">
                  <Lock size={12} />
                  PRO
                </span>
              )}
            </div>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              disabled={!isPro || !!editingSection || fullScriptMode}
              className={`w-full bg-black border border-gray-800 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors ${
                !isPro || editingSection || fullScriptMode ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <p className="text-xs text-gray-600 mt-2">
              Connect your GitHub repo to auto-extract tech stack details
            </p>
          </div>
        )}

        <div className="space-y-2">
          {script && !fullScriptMode && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded">
              <span className="text-xs text-accent-yellow">💡</span>
              <p className="text-xs text-gray-400">
                Idea changed? Click <span className="text-accent-yellow font-bold">GENERATE SCRIPT</span> to update
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleGenerate}
              disabled={!idea.trim() || isGenerating || !!editingSection || fullScriptMode}
              className="bg-accent-yellow text-black font-bold py-3 text-xs tracking-wide hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Click to generate a new script based on your current idea"
            >
              {isGenerating ? 'GENERATING...' : 'GENERATE'}
            </button>
            <button
              onClick={handleCreateManual}
              disabled={isGenerating || !!editingSection || fullScriptMode}
              className="border-2 border-accent-yellow text-accent-yellow font-bold py-3 text-xs tracking-wide hover:bg-accent-yellow hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Create empty script sections to write your own"
            >
              BY SECTION
            </button>
            <button
              onClick={() => {
                setFullScriptMode(true);
                setManualMode(false);
                setScript(null);
                setFullScriptContent('');
              }}
              disabled={isGenerating || !!editingSection}
              className="border-2 border-accent-green text-accent-green font-bold py-3 text-xs tracking-wide hover:bg-accent-green hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Write your entire script in one go"
            >
              ONE GO
            </button>
          </div>
        </div>

        <GenerationProgress steps={scriptProgress.steps} isVisible={scriptProgress.isActive} />

        {fullScriptMode && (
          <div className="mt-6 space-y-4 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-accent-green/10 border border-accent-green rounded">
              <span className="text-xs text-accent-green">✍️</span>
              <p className="text-xs text-accent-green">
                <strong>Full Script Mode:</strong> Write your entire script below in one go. No sections needed.
              </p>
            </div>

            <div className="bg-black/50 border-l-4 border-accent-green p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-accent-green font-mono uppercase tracking-wider">
                  Your Complete Script
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFullScriptMode(false);
                      setFullScriptContent('');
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-xs font-mono disabled:opacity-30"
                  >
                    <X size={14} />
                    CANCEL
                  </button>
                  <button
                    onClick={handleSaveFullScript}
                    disabled={isSaving || !fullScriptContent.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-accent-green text-black hover:bg-accent-yellow transition-colors text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Save size={14} />
                    {isSaving ? 'SAVING...' : 'SAVE SCRIPT'}
                  </button>
                </div>
              </div>
              <textarea
                value={fullScriptContent}
                onChange={(e) => setFullScriptContent(e.target.value)}
                className="w-full h-96 bg-black border border-gray-800 p-4 text-base text-gray-300 focus:border-accent-green focus:outline-none resize-none leading-relaxed"
                placeholder="Write your entire script here... No need to break it into sections."
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-3">
                💡 Tip: Just write naturally. Include timing cues if you want (e.g., "Problem (60s): ..." or just write your script as-is)
              </p>
            </div>
          </div>
        )}

        {script && (
          <div className="mt-6 space-y-4 pt-6 border-t border-gray-800">
            {manualMode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent-yellow/10 border border-accent-yellow rounded">
                <span className="text-xs text-accent-yellow">✍️</span>
                <p className="text-xs text-accent-yellow">
                  <strong>Manual Mode:</strong> Click any section below to write your script. Each edit saves automatically.
                </p>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                {scriptType === 'intro' ? '20 second intro structure' : scriptType === 'pitch' ? '3 minute pitch structure' : '3 minute demo structure'}
              </span>
              <div className="flex items-center gap-2">
                {editingSection ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-xs font-mono disabled:opacity-30"
                    >
                      <X size={14} />
                      CANCEL
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent-yellow text-black hover:bg-accent-green transition-colors text-xs font-mono disabled:opacity-30"
                    >
                      <Save size={14} />
                      {isSaving ? 'SAVING...' : 'SAVE'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setFullScriptMode(true);
                        setFullScriptContent(script?.fullScript || '');
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 border border-accent-green text-accent-green hover:bg-accent-green hover:text-black transition-colors text-xs font-mono"
                      title="Edit entire script at once"
                    >
                      EDIT AS ONE
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-xs font-mono"
                    >
                      <Download size={14} />
                      DOWNLOAD
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingSection ? (
              <div className="bg-black/50 border-l-4 border-accent-yellow p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-accent-yellow font-mono uppercase tracking-wider">
                    Editing: {editingSection.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Click SAVE above to finish editing and move to next section
                  </p>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-64 bg-black border border-gray-800 p-4 text-base text-gray-300 focus:border-accent-yellow focus:outline-none resize-none leading-relaxed"
                  placeholder="Write your script here..."
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-3">
                  💡 Tip: After saving, you can click on any other section to edit it
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scriptType === 'intro' ? (
                  <>
                    <ScriptSection
                      title="Who You Are"
                      duration="6-7s"
                      content={script.who || ''}
                      tip="Introduce yourself or your team. Keep it concise and energetic."
                      visualTip="Show yourself or team members on camera"
                      onEdit={() => handleEditSection('who')}
                      onRegenerate={() => handleRegenerateSection('who')}
                      onSelectAlternative={(alt) => handleSelectAlternative('who', alt)}
                      alternatives={alternatives.who}
                      isGeneratingAlternatives={generatingAlternatives === 'who'}
                      hideRegenerate={manualMode}
                    />

                    <ScriptSection
                      title="What You're Building"
                      duration="6-7s"
                      content={script.what || ''}
                      tip="Describe your project in one clear, compelling sentence."
                      visualTip="Show your product interface or key feature"
                      onEdit={() => handleEditSection('what')}
                      onRegenerate={() => handleRegenerateSection('what')}
                      onSelectAlternative={(alt) => handleSelectAlternative('what', alt)}
                      alternatives={alternatives.what}
                      isGeneratingAlternatives={generatingAlternatives === 'what'}
                      hideRegenerate={manualMode}
                    />

                    <ScriptSection
                      title="Why You're Building It"
                      duration="6-7s"
                      content={script.why || ''}
                      tip="Share your motivation or the problem you're solving. Make it personal."
                      visualTip="Show the problem or your passion for solving it"
                      onEdit={() => handleEditSection('why')}
                      onRegenerate={() => handleRegenerateSection('why')}
                      onSelectAlternative={(alt) => handleSelectAlternative('why', alt)}
                      alternatives={alternatives.why}
                      isGeneratingAlternatives={generatingAlternatives === 'why'}
                      hideRegenerate={manualMode}
                    />
                  </>
                ) : (
                  <>
                    <ScriptSection
                      title="Problem"
                      duration={scriptType === 'pitch' ? '60s' : '45s'}
                      content={script.problem}
                      tip={scriptTips.problem.writing}
                      visualTip={scriptTips.problem.visual}
                      onEdit={() => handleEditSection('problem')}
                      onRegenerate={() => handleRegenerateSection('problem')}
                      onSelectAlternative={(alt) => handleSelectAlternative('problem', alt)}
                      alternatives={alternatives.problem}
                      isGeneratingAlternatives={generatingAlternatives === 'problem'}
                      hideRegenerate={manualMode}
                    />

                    {scriptType === 'demo' && script.requirements && (
                  <ScriptSection
                    title="Hackathon Requirements"
                    duration="30s"
                    content={script.requirements}
                    tip={scriptTips.requirements.writing}
                    visualTip={scriptTips.requirements.visual}
                    onEdit={() => handleEditSection('requirements')}
                    onRegenerate={() => handleRegenerateSection('requirements')}
                    onSelectAlternative={(alt) => handleSelectAlternative('requirements', alt)}
                    alternatives={alternatives.requirements}
                    isGeneratingAlternatives={generatingAlternatives === 'requirements'}
                    hideRegenerate={manualMode}
                  />
                )}

                <ScriptSection
                  title="Solution"
                  duration={scriptType === 'pitch' ? '90s' : '60s'}
                  content={script.solution}
                  tip={scriptTips.solution.writing}
                  visualTip={scriptTips.solution.visual}
                  onEdit={() => handleEditSection('solution')}
                  onRegenerate={() => handleRegenerateSection('solution')}
                  onSelectAlternative={(alt) => handleSelectAlternative('solution', alt)}
                  alternatives={alternatives.solution}
                  isGeneratingAlternatives={generatingAlternatives === 'solution'}
                  hideRegenerate={manualMode}
                />

                {scriptType === 'demo' && script.tools && (
                  <ScriptSection
                    title="Tools & Tech Stack"
                    duration="30s"
                    content={script.tools}
                    tip={scriptTips.tools.writing}
                    visualTip={scriptTips.tools.visual}
                    onEdit={() => handleEditSection('tools')}
                    onRegenerate={() => handleRegenerateSection('tools')}
                    onSelectAlternative={(alt) => handleSelectAlternative('tools', alt)}
                    alternatives={alternatives.tools}
                    isGeneratingAlternatives={generatingAlternatives === 'tools'}
                    hideRegenerate={manualMode}
                  />
                )}

                {scriptType === 'demo' && script.realworld_use && (
                  <ScriptSection
                    title="Real-World Use"
                    duration="30s"
                    content={script.realworld_use}
                    tip={scriptTips.realworld_use.writing}
                    visualTip={scriptTips.realworld_use.visual}
                    onEdit={() => handleEditSection('realworld_use')}
                    onRegenerate={() => handleRegenerateSection('realworld_use')}
                    onSelectAlternative={(alt) => handleSelectAlternative('realworld_use', alt)}
                    alternatives={alternatives.realworld_use}
                    isGeneratingAlternatives={generatingAlternatives === 'realworld_use'}
                    hideRegenerate={manualMode}
                  />
                )}

                    <ScriptSection
                      title="Traction"
                      duration={scriptType === 'pitch' ? '30s' : '15s'}
                      content={script.traction}
                      tip={scriptTips.traction.writing}
                      visualTip={scriptTips.traction.visual}
                      onEdit={() => handleEditSection('traction')}
                      onRegenerate={() => handleRegenerateSection('traction')}
                      onSelectAlternative={(alt) => handleSelectAlternative('traction', alt)}
                      alternatives={alternatives.traction}
                      isGeneratingAlternatives={generatingAlternatives === 'traction'}
                      hideRegenerate={manualMode}
                    />
                  </>
                )}
              </div>
            )}

            <div className="bg-black/50 border border-gray-800 p-3 mt-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-500">Pro Tip:</strong> Click the info icon on any section to see writing and visual tips. Use the refresh icon to generate alternative versions, or click edit to write your own.
              </p>
            </div>
          </div>
        )}
      </div>
    </CyberCard>
  );
};
