import React, { useState, useEffect } from 'react';
import { Video, Download, Lock, Github, Save, X } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { ScriptSection } from './ScriptSection';
import { databaseService } from '../services/database';
import { scriptTips } from '../utils/scriptTips';
import { aiService } from '../services/aiService';

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
  onShowProModal?: () => void;
}

type SectionKey = 'problem' | 'solution' | 'traction' | 'requirements' | 'tools' | 'realworld_use' | 'who' | 'what' | 'why';

export const PitchScript: React.FC<PitchScriptProps> = ({ onGenerate, isPro, projectId, onShowProModal }) => {
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

  useEffect(() => {
    loadSavedData();
  }, [projectId]);

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
  };

  const loadSavedData = async () => {
    resetForm();

    if (!projectId) return;

    const ideaData = await databaseService.getIdea(projectId);
    const latestIdea = ideaData?.idea_text || '';

    setIdea(latestIdea);

    const saved = await databaseService.getPitchScript(projectId);
    if (saved) {
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
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    if (scriptType === 'demo' && githubUrl && !isPro) {
      onShowProModal?.();
      return;
    }

    setIsGenerating(true);
    try {
      const result = await onGenerate(idea, scriptType, githubUrl || undefined, yourName || undefined);
      setScript(result);
      setEditingSection(null);
      setEditedContent('');
      setAlternatives({} as Record<SectionKey, string[]>);
    } catch (error) {
      console.error('Generation failed:', error);
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
    if (!editingSection || !projectId || !script) return;

    const updatedScript = { ...script, [editingSection]: editedContent };

    setIsSaving(true);
    try {
      const saved = await databaseService.savePitchScript(projectId, idea, {
        problem: updatedScript.problem,
        solution: updatedScript.solution,
        traction: updatedScript.traction,
        script_type: scriptType,
        demo_requirements: updatedScript.requirements || '',
        demo_tools: updatedScript.tools || '',
        demo_realworld_use: updatedScript.realworld_use || '',
        github_url: githubUrl || '',
        github_analyzed: !!githubUrl,
      });

      if (saved) {
        const updatedFullScript = scriptType === 'demo'
          ? `PROBLEM (45s):\n${updatedScript.problem}\n\nREQUIREMENTS (30s):\n${updatedScript.requirements}\n\nSOLUTION (60s):\n${updatedScript.solution}\n\nTOOLS (30s):\n${updatedScript.tools}\n\nREAL-WORLD USE (30s):\n${updatedScript.realworld_use}\n\nTRACTION (15s):\n${updatedScript.traction}`
          : `PROBLEM (60s):\n${updatedScript.problem}\n\nSOLUTION (90s):\n${updatedScript.solution}\n\nTRACTION (30s):\n${updatedScript.traction}`;

        setScript({ ...updatedScript, fullScript: updatedFullScript });
        setEditingSection(null);
        setEditedContent('');
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
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
              onClick={() => setScriptType('intro')}
              disabled={!!editingSection}
              className={`py-2 px-3 text-xs font-mono transition-colors ${
                scriptType === 'intro'
                  ? 'bg-accent-yellow text-black'
                  : 'border border-gray-800 text-gray-400 hover:text-white'
              } ${editingSection ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              20s INTRO
            </button>
            <button
              onClick={() => setScriptType('pitch')}
              disabled={!!editingSection}
              className={`py-2 px-3 text-xs font-mono transition-colors ${
                scriptType === 'pitch'
                  ? 'bg-accent-yellow text-black'
                  : 'border border-gray-800 text-gray-400 hover:text-white'
              } ${editingSection ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              3m PITCH
            </button>
            <button
              onClick={() => setScriptType('demo')}
              disabled={!!editingSection}
              className={`py-2 px-3 text-xs font-mono transition-colors ${
                scriptType === 'demo'
                  ? 'bg-accent-yellow text-black'
                  : 'border border-gray-800 text-gray-400 hover:text-white'
              } ${editingSection ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          disabled={!!editingSection}
          placeholder="Describe your project idea..."
          className={`w-full h-32 bg-black border border-gray-800 p-4 text-gray-300 text-sm placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors resize-none ${
            editingSection ? 'opacity-50 cursor-not-allowed' : ''
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
              disabled={!!editingSection}
              className={`w-full bg-black border border-gray-800 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors ${
                editingSection ? 'opacity-50 cursor-not-allowed' : ''
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
              disabled={!isPro || !!editingSection}
              className={`w-full bg-black border border-gray-800 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-colors ${
                !isPro || editingSection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <p className="text-xs text-gray-600 mt-2">
              Connect your GitHub repo to auto-extract tech stack details
            </p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!idea.trim() || isGenerating || !!editingSection}
          className="w-full bg-accent-yellow text-black font-bold py-3 text-sm tracking-wide hover:bg-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'GENERATING...' : 'GENERATE SCRIPT'}
        </button>

        {script && (
          <div className="mt-6 space-y-4 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                {scriptType === 'pitch' ? '3 minute pitch structure' : '3 minute demo structure'}
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
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-xs font-mono"
                  >
                    <Download size={14} />
                    DOWNLOAD
                  </button>
                )}
              </div>
            </div>

            {editingSection ? (
              <div className="bg-black/50 border border-gray-800 p-4">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
                  Editing: {editingSection}
                </p>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-48 bg-black border border-gray-800 p-3 text-sm text-gray-300 focus:border-gray-700 focus:outline-none resize-none"
                  placeholder="Edit section content..."
                />
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
