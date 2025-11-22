import { useState, useEffect, useCallback } from 'react';
import { Lock, Save } from 'lucide-react';
import { RulesParser } from './components/RulesParser';
import { IdeaGenerator } from './components/IdeaGenerator';
import { PromptOptimizer } from './components/PromptOptimizer';
import { PitchScript } from './components/PitchScript';
import { VideoCreator } from './components/VideoCreator';
import { HackathonTimer } from './components/HackathonTimer';
import { ProModal } from './components/ProModal';
import { ProDropdown } from './components/ProDropdown';
import { ProjectSelector } from './components/ProjectSelector';
import { ExportDropdown, ExportFormat } from './components/ExportDropdown';
import { RulesChat } from './components/RulesChat';
import { ExitIntentPopup, useExitIntent } from './components/ExitIntentPopup';
import { Footer } from './components/Footer';
import { aiService } from './services/aiService';
import { databaseService, Project, PitchScriptData } from './services/database';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SuccessPage } from './pages/SuccessPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthGuard } from './components/AuthGuard';
import { exportUtils } from './utils/exportUtils';
import { supabase } from './lib/supabase';

const EXIT_INTENT_KEY = 'hackathon_hero_exit_intent_shown';

function HackathonWizard() {
  const navigate = useNavigate();
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPitchScript, setCurrentPitchScript] = useState<PitchScriptData | null>(null);
  const [hasRules, setHasRules] = useState(false);
  const [deadline, setDeadline] = useState<string>('');

  const handleExitIntent = useCallback(() => {
    if (isPro) return;

    const hasSeenPopup = localStorage.getItem(EXIT_INTENT_KEY);
    if (!hasSeenPopup) {
      setShowExitIntent(true);
      localStorage.setItem(EXIT_INTENT_KEY, 'true');
    }
  }, [isPro]);

  useExitIntent(handleExitIntent);

  useEffect(() => {
    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT') {
          setIsPro(false);
          setCurrentProject(null);
        } else if (event === 'SIGNED_IN' && session) {
          await initializeApp();
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentProject) {
      loadProjectData();
    }
  }, [currentProject]);

  const initializeApp = async () => {
    const hasProAccess = await databaseService.checkProStatus();
    setIsPro(hasProAccess);

    const projects = await databaseService.getProjects();
    if (projects.length === 0) {
      const newProject = await databaseService.createProject('My First Hackathon');
      if (newProject) {
        setCurrentProject(newProject);
      }
    } else {
      setCurrentProject(projects[0]);
    }
  };

  const loadProjectData = async () => {
    if (!currentProject) return;

    const pitchScript = await databaseService.getPitchScript(currentProject.id);
    setCurrentPitchScript(pitchScript);

    const rulesData = await databaseService.getRulesData(currentProject.id);
    setHasRules(!!rulesData);

    if (rulesData?.deadline) {
      const deadlineMatch = rulesData.deadline.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2},? \d{4}/);
      if (deadlineMatch) {
        const parsedDate = new Date(deadlineMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          setDeadline(parsedDate.toISOString());
        }
      }
    }
  };

  const handleUnlockPro = async () => {
    setIsUnlocking(true);

    const result = await databaseService.enableTestMode();

    if (result.requiresAuth) {
      setIsUnlocking(false);
      navigate('/login');
      return;
    }

    if (result.success) {
      const hasProAccess = await databaseService.checkProStatus();
      setIsPro(hasProAccess);
      setShowProModal(false);
      setShowExitIntent(false);
    }

    setIsUnlocking(false);
  };

  const handleCloseExitIntent = () => {
    setShowExitIntent(false);
  };

  const handleExitIntentGetAccess = () => {
    setShowExitIntent(false);
    handleUnlockPro();
  };

  const handleParseRules = async (rulesText: string) => {
    const result = await aiService.parseRules(rulesText);

    if (currentProject) {
      setIsSaving(true);
      await databaseService.saveRulesData(currentProject.id, rulesText, result);
      setHasRules(true);

      if (result.deadline) {
        const deadlineMatch = result.deadline.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2},? \d{4}/);
        if (deadlineMatch) {
          const parsedDate = new Date(deadlineMatch[0]);
          if (!isNaN(parsedDate.getTime())) {
            setDeadline(parsedDate.toISOString());
          }
        }
      }

      setIsSaving(false);
    }

    return result;
  };

  const handleParseRulesFromUrl = async (url: string) => {
    const textContent = await aiService.fetchUrlContent(url);
    return await handleParseRules(textContent);
  };

  const handleGenerateIdea = async () => {
    if (!currentProject) throw new Error('No project selected');

    const rulesData = await databaseService.getRulesData(currentProject.id);
    if (!rulesData) throw new Error('No rules data found');

    const result = await aiService.generateIdea({
      deadline: rulesData.deadline,
      sponsors: rulesData.sponsors,
      judgingCriteria: rulesData.judging_criteria,
    });

    setIsSaving(true);
    await databaseService.saveIdea(currentProject.id, {
      idea_text: result.idea,
      category: result.category,
      reasoning: result.reasoning,
      sponsor_alignment: result.sponsorAlignment,
    });
    setIsSaving(false);

    return result;
  };

  const handleOptimizePrompt = async (idea: string) => {
    const result = await aiService.optimizePrompt(idea);

    if (currentProject) {
      setIsSaving(true);

      // Check if this idea is different from the saved idea
      const savedIdea = await databaseService.getIdea(currentProject.id);
      if (!savedIdea || savedIdea.idea_text !== idea) {
        // Update the idea as well since it's been modified
        await databaseService.saveIdea(currentProject.id, {
          idea_text: idea,
          category: savedIdea?.category || 'General',
          reasoning: savedIdea?.reasoning || 'User-provided idea',
          sponsor_alignment: savedIdea?.sponsor_alignment || 'Custom idea',
        });
      }

      await databaseService.savePrompt(
        currentProject.id,
        idea,
        result.prompt,
        result.wordCount
      );
      setIsSaving(false);
    }

    return result;
  };

  const handleGeneratePitch = async (idea: string, scriptType: 'pitch' | 'demo' | 'intro', githubUrl?: string, yourName?: string) => {
    let result;

    if (scriptType === 'intro') {
      result = await aiService.generateIntroPitch(idea, yourName);
    } else if (scriptType === 'demo') {
      const rulesData = currentProject ? await databaseService.getRulesData(currentProject.id) : undefined;
      result = await aiService.generateDemoScript(
        idea,
        rulesData ? {
          deadline: rulesData.deadline,
          sponsors: rulesData.sponsors,
          judgingCriteria: rulesData.judging_criteria
        } : undefined,
        githubUrl
      );
    } else {
      result = await aiService.generatePitchScript(idea);
    }

    if (currentProject) {
      setIsSaving(true);
      const saved = await databaseService.savePitchScript(currentProject.id, idea, {
        problem: result.problem || '',
        solution: result.solution || '',
        traction: result.traction || '',
        script_type: scriptType,
        demo_requirements: scriptType === 'demo' ? result.requirements : '',
        demo_tools: scriptType === 'demo' ? result.tools : '',
        demo_realworld_use: scriptType === 'demo' ? result.realworld_use : '',
        github_url: githubUrl || '',
        github_analyzed: !!githubUrl,
        intro_who: scriptType === 'intro' ? result.who : '',
        intro_what: scriptType === 'intro' ? result.what : '',
        intro_why: scriptType === 'intro' ? result.why : '',
        intro_full_script: scriptType === 'intro' ? result.fullScript : '',
        your_name: yourName || '',
      });
      setCurrentPitchScript(saved);
      setIsSaving(false);
    }

    return result;
  };

  const handleChatWithRules = async (question: string, rulesContext: string) => {
    return await aiService.chatWithRules(question, rulesContext);
  };

  const handleExport = async (format: ExportFormat) => {
    if (!currentProject) return;

    const rulesData = await databaseService.getRulesData(currentProject.id);
    const promptData = await databaseService.getPrompt(currentProject.id);
    const pitchScriptData = await databaseService.getPitchScript(currentProject.id);

    const exportData = {
      project: currentProject,
      rulesData,
      promptData,
      pitchScriptData,
    };

    switch (format) {
      case 'json':
        exportUtils.exportAsJSON(exportData);
        break;
      case 'markdown':
        exportUtils.exportAsMarkdown(exportData);
        break;
      case 'pdf':
        exportUtils.exportAsPDF(exportData);
        break;
      case 'text':
        exportUtils.exportAsText(exportData);
        break;
      case 'docx':
        exportUtils.exportAsDocx(exportData);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-6xl font-black tracking-tight">
              <span className="text-white header-text">HACKATHON</span>
              <span className="text-accent-yellow header-text">HERO</span>
            </h1>

            <div className="flex items-center gap-4">
              {isSaving && (
                <span className="flex items-center gap-2 text-accent-yellow text-xs font-mono">
                  <Save size={14} className="animate-pulse" />
                  SAVING...
                </span>
              )}
              {isPro ? (
                <ProDropdown />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="px-6 py-2.5 text-sm font-bold tracking-wide transition-all rounded border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white flex items-center gap-2"
                >
                  <Lock size={16} />
                  UNLOCK PRO
                </button>
              )}
            </div>
          </div>

          <div className="border-b border-gray-800 mb-8 pb-6">
            <div className="flex items-center justify-between">
              <p className="text-accent-yellow font-mono text-sm tracking-wider">
                // HACKATHON PLANNING COMMAND CENTER
              </p>
              <div className="flex items-center gap-3">
                <ExportDropdown
                  onExport={handleExport}
                  disabled={!currentProject}
                  isPro={isPro}
                  onUpgradeClick={() => setShowProModal(true)}
                />
                <ProjectSelector
                  currentProject={currentProject}
                  onProjectChange={setCurrentProject}
                  isPro={isPro}
                  onUpgradeClick={() => setShowProModal(true)}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6" key={currentProject?.id}>
            <RulesParser
              onParse={handleParseRules}
              onParseFromUrl={handleParseRulesFromUrl}
              isPro={isPro}
              projectId={currentProject?.id}
              onUpgradeClick={() => setShowProModal(true)}
            />
            <RulesChat
              projectId={currentProject?.id}
              onAskQuestion={handleChatWithRules}
              isPro={isPro}
              onUpgradeClick={() => setShowProModal(true)}
            />
            <HackathonTimer
              deadline={deadline}
              projectId={currentProject?.id}
            />
            <IdeaGenerator
              onGenerate={handleGenerateIdea}
              hasRules={hasRules}
              projectId={currentProject?.id}
              onSendToOptimizer={(idea) => {
                const optimizerElement = document.querySelector('[data-component="prompt-optimizer"]');
                if (optimizerElement) {
                  optimizerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const textarea = optimizerElement.querySelector('textarea');
                  if (textarea) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                    if (nativeInputValueSetter) {
                      nativeInputValueSetter.call(textarea, idea);
                      textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }
                }
              }}
            />
            <PromptOptimizer
              onOptimize={handleOptimizePrompt}
              isPro={isPro}
              projectId={currentProject?.id}
            />
            <PitchScript
              onGenerate={handleGeneratePitch}
              isPro={isPro}
              projectId={currentProject?.id}
              onShowProModal={() => setShowProModal(true)}
            />
            <VideoCreator
              isPro={isPro}
              projectId={currentProject?.id}
              onUpgradeClick={() => setShowProModal(true)}
              pitchScript={currentPitchScript ? {
                problem: currentPitchScript.problem,
                solution: currentPitchScript.solution,
                traction: currentPitchScript.traction,
                script_type: currentPitchScript.script_type,
                requirements: currentPitchScript.demo_requirements,
                tools: currentPitchScript.demo_tools,
                realworld_use: currentPitchScript.demo_realworld_use,
              } : undefined}
            />
          </div>
        </div>
      </div>

      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onUnlock={handleUnlockPro}
        isUnlocking={isUnlocking}
      />

      <ExitIntentPopup
        isVisible={showExitIntent}
        onClose={handleCloseExitIntent}
        onGetAccess={handleExitIntentGetAccess}
      />

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/profile" element={
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        } />
        <Route path="/" element={<HackathonWizard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
