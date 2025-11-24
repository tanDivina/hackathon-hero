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
import { InfoModal } from './components/InfoModal';
import { HelpButton } from './components/HelpButton';
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
  const [showInfoModal, setShowInfoModal] = useState(false);

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

    // Extract deadline from both rules and intel
    await extractDeadline(currentProject.id, rulesData);
  };

  const extractDeadline = async (projectId: string, rulesData: any = null) => {
    let deadlineFound = false;

    // Try to extract deadline from rules first
    if (rulesData?.deadline && !rulesData.deadline.toLowerCase().includes('no specific deadline')) {
      const deadlineMatch = rulesData.deadline.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2},? \d{4}/);
      if (deadlineMatch) {
        const parsedDate = new Date(deadlineMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          setDeadline(parsedDate.toISOString());
          deadlineFound = true;
        }
      }
    }

    // If no deadline found in rules, check insider intel
    if (!deadlineFound) {
      const project = await databaseService.getProject(projectId);
      if (project?.custom_instructions) {
        const intelMatch = project.custom_instructions.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2},? \d{4}|(?:deadline|due|submit by|ends?)[:\s]+([^\n]+)/i);
        if (intelMatch) {
          const dateStr = intelMatch[1] || intelMatch[0];
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            setDeadline(parsedDate.toISOString());
          }
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
      await databaseService.saveRulesData(currentProject.id, rulesText, {
        deadline: result.deadline,
        sponsors: result.sponsors,
        judgingCriteria: result.judgingCriteria,
        prizes: result.prizes,
        theme: result.theme,
        eventType: result.eventType,
      });
      setHasRules(true);

      // Extract deadline from both rules and intel
      const rulesData = await databaseService.getRulesData(currentProject.id);
      await extractDeadline(currentProject.id, rulesData);

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

    const project = await databaseService.getProject(currentProject.id);
    const customInstructions = project?.custom_instructions || '';

    const result = await aiService.generateIdea({
      deadline: rulesData.deadline,
      sponsors: rulesData.sponsors,
      judgingCriteria: rulesData.judging_criteria,
      prizes: rulesData.prizes,
      theme: rulesData.theme,
      eventType: rulesData.event_type,
      fullRulesText: rulesData.rules_text,
      customInstructions,
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
    if (!currentProject) throw new Error('No project selected');

    const rulesData = await databaseService.getRulesData(currentProject.id);
    const result = await aiService.optimizePrompt(idea, rulesData ? {
      sponsors: rulesData.sponsors,
      eventType: rulesData.event_type,
    } : undefined);

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
    const project = currentProject ? await databaseService.getProject(currentProject.id) : null;
    const customInstructions = project?.custom_instructions || '';

    if (scriptType === 'intro') {
      const result = await aiService.generateIntroPitch(idea, yourName, customInstructions);

      if (currentProject) {
        setIsSaving(true);
        const saved = await databaseService.savePitchScript(currentProject.id, idea, {
          problem: '',
          solution: '',
          traction: '',
          script_type: scriptType,
          demo_requirements: '',
          demo_tools: '',
          demo_realworld_use: '',
          github_url: '',
          github_analyzed: false,
          intro_who: result.who,
          intro_what: result.what,
          intro_why: result.why,
          intro_full_script: result.fullScript,
          your_name: yourName || '',
        });
        setCurrentPitchScript(saved);
        setIsSaving(false);
      }

      return {
        problem: '',
        solution: '',
        traction: '',
      };
    } else if (scriptType === 'demo') {
      const rulesData = currentProject ? await databaseService.getRulesData(currentProject.id) : undefined;
      const result = await aiService.generateDemoScript(
        idea,
        rulesData ? {
          deadline: rulesData.deadline,
          sponsors: rulesData.sponsors,
          judgingCriteria: rulesData.judging_criteria
        } : undefined,
        githubUrl,
        customInstructions
      );

      if (currentProject) {
        setIsSaving(true);
        const saved = await databaseService.savePitchScript(currentProject.id, idea, {
          problem: result.problem,
          solution: result.solution,
          traction: result.traction,
          script_type: scriptType,
          demo_requirements: result.requirements,
          demo_tools: result.tools,
          demo_realworld_use: result.realworld_use,
          github_url: githubUrl || '',
          github_analyzed: !!githubUrl,
          intro_who: '',
          intro_what: '',
          intro_why: '',
          intro_full_script: '',
          your_name: '',
        });
        setCurrentPitchScript(saved);
        setIsSaving(false);
      }

      return {
        problem: result.problem,
        solution: result.solution,
        traction: result.traction,
      };
    } else {
      const result = await aiService.generatePitchScript(idea, customInstructions);

      if (currentProject) {
        setIsSaving(true);
        const saved = await databaseService.savePitchScript(currentProject.id, idea, {
          problem: result.problem,
          solution: result.solution,
          traction: result.traction,
          script_type: scriptType,
          demo_requirements: '',
          demo_tools: '',
          demo_realworld_use: '',
          github_url: '',
          github_analyzed: false,
          intro_who: '',
          intro_what: '',
          intro_why: '',
          intro_full_script: '',
          your_name: '',
        });
        setCurrentPitchScript(saved);
        setIsSaving(false);
      }

      return result;
    }
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
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2.5 text-sm font-bold tracking-wide transition-all rounded border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => setShowProModal(true)}
                    className="px-6 py-2.5 text-sm font-bold tracking-wide transition-all rounded border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white flex items-center gap-2"
                  >
                    <Lock size={16} />
                    UNLOCK PRO
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-gray-800 mb-8 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-accent-yellow font-mono text-sm tracking-wider">
                  // HACKATHON PLANNING COMMAND CENTER
                </p>
                <HelpButton onClick={() => setShowInfoModal(true)} />
              </div>
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
              onIntelSaved={async () => {
                if (currentProject) {
                  const rulesData = await databaseService.getRulesData(currentProject.id);
                  await extractDeadline(currentProject.id, rulesData);
                }
              }}
            />
            <RulesChat
              projectId={currentProject?.id}
              onAskQuestion={handleChatWithRules}
              isPro={isPro}
              hasRules={hasRules}
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

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="How to Use Hackathon Hero"
      >
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-bold text-white mb-2">Getting Started</h3>
            <p className="text-gray-400 leading-relaxed">
              Hackathon Hero is your AI-powered command center for winning hackathons. Follow these steps to maximize your chances of success.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Step 1: Parse Rules</h3>
            <p className="text-gray-400 leading-relaxed mb-2">
              Paste the hackathon rules or provide a URL. Our AI will extract:
            </p>
            <ul className="list-disc list-outside text-gray-400 space-y-1 ml-4 pl-4">
              <li>Submission deadline</li>
              <li>Sponsors and their technologies</li>
              <li>Judging criteria</li>
              <li>Event type (Game Jam, Hackathon, etc.)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Step 2: Generate Ideas</h3>
            <p className="text-gray-400 leading-relaxed">
              Based on the parsed rules, our AI generates project ideas that align with sponsors and judging criteria. Each idea includes category and reasoning.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Step 3: Optimize Prompt</h3>
            <p className="text-gray-400 leading-relaxed">
              Turn your idea into a detailed technical prompt. The AI considers the event type and sponsors to recommend the right tech stack and deployment platform.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Step 4: Generate Pitch Script</h3>
            <p className="text-gray-400 leading-relaxed mb-2">
              Choose from three script types:
            </p>
            <ul className="list-disc list-outside text-gray-400 space-y-1 ml-4 pl-4">
              <li><strong className="text-white">Pitch:</strong> Problem, solution, traction framework</li>
              <li><strong className="text-white">Demo:</strong> Requirements, tools, real-world use</li>
              <li><strong className="text-white">Intro (20s):</strong> Who, what, why format</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Step 5: Create Video</h3>
            <p className="text-gray-400 leading-relaxed">
              Upload your logo and audio, position elements, and generate your pitch video with captions synced to your script.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Pro Features</h3>
            <ul className="list-disc list-outside text-gray-400 space-y-1 ml-4 pl-4">
              <li>Chat with Rules AI assistant</li>
              <li>Parse rules from URLs</li>
              <li>Video Creator with logo and audio</li>
              <li>Export projects (JSON, PDF, Markdown, DOCX)</li>
              <li>Multiple project management</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Tips for Success</h3>
            <ul className="list-disc list-outside text-gray-400 space-y-1 ml-4 pl-4">
              <li>Always parse rules first to get context-aware suggestions</li>
              <li>Review sponsor technologies and align your idea</li>
              <li>Watch sponsor livestreams and Q&A sessions - they often reveal what judges want to see beyond the written rules</li>
              <li>Use the optimized prompt in AI tools like Claude or ChatGPT</li>
              <li>Keep your pitch concise and impactful</li>
            </ul>
          </section>
        </div>
      </InfoModal>

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
