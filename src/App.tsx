import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { useToast } from './components/Toast';
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
import { InfoModal } from './components/InfoModal';
import { HelpButton } from './components/HelpButton';
import { LandingPage } from './components/LandingPage';
import { aiService } from './services/aiService';
import { databaseService, Project, PitchScriptData } from './services/database';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SuccessPage } from './pages/SuccessPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthGuard } from './components/AuthGuard';
import { exportUtils } from './utils/exportUtils';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SubmissionChecklist } from './components/SubmissionChecklist';
import { TeamPanel } from './components/TeamPanel';
import { RevisionHistory } from './components/RevisionHistory';
import { ScorecardPanel } from './components/ScorecardPanel';
import { CompetitorAnalysis } from './components/CompetitorAnalysis';
import { SponsorDeepDive } from './components/SponsorDeepDive';
import { DevpostDraft } from './components/DevpostDraft';
import { ProjectRecycler } from './components/ProjectRecycler';

const EXIT_INTENT_KEY = 'hackathon_hero_exit_intent_shown';

function HackathonWizard() {
  const { showToast } = useToast();
  const [isPro, setIsPro] = useState(false);
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [showProModal, setShowProModal] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPitchScript, setCurrentPitchScript] = useState<PitchScriptData | null>(null);
  const [currentIdeaName, setCurrentIdeaName] = useState<string>('');
  const [hasRules, setHasRules] = useState(false);
  const [deadline, setDeadline] = useState<string>('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [optimizerReloadKey, setOptimizerReloadKey] = useState(0);
  const [scriptReloadKey, setScriptReloadKey] = useState(0);
  const [rulesText, setRulesText] = useState('');
  const [revisionReloadKey, setRevisionReloadKey] = useState(0);
  const [currentIdeaText, setCurrentIdeaText] = useState<string>('');

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
          setView('landing');
        } else if (event === 'SIGNED_IN' && session) {
          // When signing in, only reinitialize if there's no current project
          const projects = await databaseService.getProjects();
          if (projects.length > 0) {
            // Check if we need to set a project
            setCurrentProject(prev => prev || projects[0]);
          }
          // Update pro status
          const hasProAccess = await databaseService.checkProStatus();
          setIsPro(hasProAccess);
          if (hasProAccess) setView('dashboard');
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
    if (hasProAccess) setView('dashboard');

    const inviteToken = new URLSearchParams(window.location.search).get('invite');
    if (inviteToken) {
      const result = await databaseService.acceptInvite(inviteToken);
      if (result.success && result.projectId) {
        showToast('Joined project successfully!', 'success');
        const project = await databaseService.getProject(result.projectId);
        if (project) {
          setCurrentProject(project);
          window.history.replaceState({}, '', '/');
          return;
        }
      } else {
        showToast('Invalid or expired invite link', 'error');
        window.history.replaceState({}, '', '/');
      }
    }

    const projects = await databaseService.getProjects();
    if (projects.length === 0) {
      const newProject = await databaseService.createProject('My First Hackathon');
      if (newProject) {
        setCurrentProject(newProject);
      }
    } else if (!currentProject) {
      setCurrentProject(projects[0]);
    }
  };

  const loadProjectData = async () => {
    if (!currentProject) return;

    const pitchScript = await databaseService.getPitchScript(currentProject.id);
    setCurrentPitchScript(pitchScript);

    const idea = await databaseService.getIdea(currentProject.id);
    setCurrentIdeaName(idea?.idea_name || '');
    setCurrentIdeaText(idea?.idea_text || '');

    const rulesData = await databaseService.getRulesData(currentProject.id);
    setHasRules(!!rulesData);
    setRulesText(rulesData?.rules_text || '');

    await extractDeadline(currentProject.id, rulesData);
  };

  const parseFlexibleDate = (dateStr: string): Date | null => {
    // Remove ordinal suffixes (st, nd, rd, th)
    let cleanedStr = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, '$1');

    // Capture timezone before removing it
    const timezoneMatch = dateStr.match(/\s+(PT|PST|PDT|ET|EST|EDT|CT|CST|CDT|MT|MST|MDT)$/i);
    const timezone = timezoneMatch ? timezoneMatch[1].toUpperCase() : null;

    // Remove timezone abbreviations that confuse Date parser
    cleanedStr = cleanedStr.replace(/\s+(PT|PST|PDT|ET|EST|EDT|CT|CST|CDT|MT|MST|MDT)$/i, '');

    console.log('🧹 Cleaned date string:', cleanedStr);
    console.log('🌍 Detected timezone:', timezone);

    // Check if year is missing and add current or next year
    const hasYear = /\d{4}/.test(cleanedStr);
    if (!hasYear) {
      const monthDayMatch = cleanedStr.match(/([A-Z][a-z]+)\s+(\d{1,2})/i);
      if (monthDayMatch) {
        const currentYear = new Date().getFullYear();
        cleanedStr = `${monthDayMatch[1]} ${monthDayMatch[2]}, ${currentYear}`;
        console.log('📅 Added year to date:', cleanedStr);
      }
    }

    // Try parsing the cleaned string
    let parsedDate = new Date(cleanedStr);

    // If still invalid, try extracting just the date portion
    if (isNaN(parsedDate.getTime())) {
      // Try to match common date patterns
      const patterns = [
        /(\d{1,2}\/\d{1,2}\/\d{4})/,                    // MM/DD/YYYY
        /(\d{4}-\d{2}-\d{2})/,                          // YYYY-MM-DD
        /([A-Z][a-z]+ \d{1,2},? \d{4})/i,              // Month DD, YYYY
      ];

      for (const pattern of patterns) {
        const match = cleanedStr.match(pattern);
        if (match) {
          parsedDate = new Date(match[1]);
          console.log('📅 Trying pattern match:', match[1], parsedDate);
          if (!isNaN(parsedDate.getTime())) {
            break;
          }
        }
      }
    }

    // Set time to end of day (23:59:59.999)
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setHours(23, 59, 59, 999);

      // CRITICAL: Apply timezone offset if detected
      // Convert the date from the specified timezone to UTC
      if (timezone) {
        const timezoneOffsets: { [key: string]: number } = {
          'PT': -8, 'PST': -8, 'PDT': -7,  // Pacific
          'MT': -7, 'MST': -7, 'MDT': -6,  // Mountain
          'CT': -6, 'CST': -6, 'CDT': -5,  // Central
          'ET': -5, 'EST': -5, 'EDT': -4,  // Eastern
        };

        const offset = timezoneOffsets[timezone];
        if (offset !== undefined) {
          // Get the local timezone offset
          const localOffset = -parsedDate.getTimezoneOffset() / 60;
          // Calculate difference between specified timezone and local timezone
          const hoursDifference = offset - localOffset;

          console.log(`⏰ Timezone conversion: ${timezone} (UTC${offset}) -> Local (UTC${localOffset})`);
          console.log(`⏰ Adjusting by ${hoursDifference} hours`);

          // Adjust the date by the difference
          parsedDate.setHours(parsedDate.getHours() - hoursDifference);
          console.log('⏰ Adjusted deadline to local time:', parsedDate.toString());
        }
      } else {
        console.log('⏰ No timezone specified, using local time:', parsedDate.toString());
      }
    }

    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const extractDeadline = async (projectId: string, rulesData: any = null) => {
    console.log('🔍 Extracting deadline for project:', projectId);
    console.log('📋 Rules data:', rulesData);
    let deadlineFound = false;

    // Try to extract deadline from rules first
    if (rulesData?.deadline && !rulesData.deadline.toLowerCase().includes('no specific deadline')) {
      console.log('📅 Checking rules deadline:', rulesData.deadline);
      const deadlineMatch = rulesData.deadline.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}(st|nd|rd|th)?,? \d{4}/i);
      if (deadlineMatch) {
        const parsedDate = parseFlexibleDate(deadlineMatch[0]);
        if (parsedDate) {
          console.log('✅ Deadline found in rules:', parsedDate.toISOString());
          setDeadline(parsedDate.toISOString());
          deadlineFound = true;
        }
      }
    }

    // If no deadline found in rules, check insider intel
    if (!deadlineFound) {
      const project = await databaseService.getProject(projectId);
      console.log('🔍 Checking intel for deadline. Project:', project);
      if (project?.custom_instructions) {
        console.log('📝 Intel content:', project.custom_instructions);
        const intelMatch = project.custom_instructions.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}(st|nd|rd|th)?,? \d{4}|(?:deadline|due|submit by|ends?)[:\s]+([^\n.!?]+)/i);
        console.log('🔎 Intel regex match:', intelMatch);
        if (intelMatch) {
          const dateStr = intelMatch[intelMatch.length - 1] || intelMatch[0];
          console.log('📅 Date string extracted:', dateStr);
          const parsedDate = parseFlexibleDate(dateStr.trim());
          console.log('📅 Parsed date:', parsedDate);
          if (parsedDate) {
            console.log('✅ Deadline found in intel:', parsedDate.toISOString());
            setDeadline(parsedDate.toISOString());
          } else {
            console.log('❌ Invalid date parsed from intel');
          }
        } else {
          console.log('❌ No date match found in intel');
        }
      } else {
        console.log('❌ No intel found');
      }
    }
  };

  const handleUnlockPro = () => {
    setView('landing');
    setShowProModal(false);
    setTimeout(() => {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCloseExitIntent = () => {
    setShowExitIntent(false);
  };

  const handleExitIntentGetAccess = () => {
    setShowExitIntent(false);
    handleUnlockPro();
  };

  const handleParseRules = async (rulesText: string) => {
    try {
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
        setRulesText(rulesText);

        const rulesData = await databaseService.getRulesData(currentProject.id);
        await extractDeadline(currentProject.id, rulesData);

        databaseService.trackUsageEvent('rules_parsed', currentProject.id);
        setIsSaving(false);
      }

      showToast('Rules analyzed successfully', 'success');
      return result;
    } catch (error) {
      showToast('Failed to analyze rules. Please try again.', 'error');
      throw error;
    }
  };

  const handleParseRulesFromUrl = async (url: string) => {
    try {
      const textContent = await aiService.fetchUrlContent(url);
      return await handleParseRules(textContent);
    } catch (error) {
      showToast('Failed to fetch URL content. Check the link and try again.', 'error');
      throw error;
    }
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

    setCurrentIdeaText(result.idea);
    databaseService.trackUsageEvent('idea_generated', currentProject.id);
    databaseService.saveRevision(currentProject.id, 'idea', { idea_text: result.idea, category: result.category, reasoning: result.reasoning });
    setRevisionReloadKey(prev => prev + 1);

    return result;
  };

  const handleGenerateCandidateIdeas = async (userDirection?: string) => {
    if (!currentProject) throw new Error('No project selected');

    const rulesData = await databaseService.getRulesData(currentProject.id);
    if (!rulesData) throw new Error('No rules data found');

    const project = await databaseService.getProject(currentProject.id);
    const customInstructions = project?.custom_instructions || '';

    const result = await aiService.generateCandidateIdeas({
      deadline: rulesData.deadline,
      sponsors: rulesData.sponsors,
      judgingCriteria: rulesData.judging_criteria,
      prizes: rulesData.prizes,
      theme: rulesData.theme,
      eventType: rulesData.event_type,
      fullRulesText: rulesData.rules_text,
      customInstructions,
    }, userDirection);

    return result;
  };

  const handleExpandCandidate = async (candidate: any) => {
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
      customInstructions: `${customInstructions}\n\nEXPAND THIS CANDIDATE IDEA:\nTitle: ${candidate.title}\n${candidate.idea}\n\nProvide a more detailed version with enhanced features, technical details, and implementation strategy.\n\nCRITICAL INSTRUCTIONS:\n1. The project name is "${candidate.title}". DO NOT invent or use a different project name in the description. If you need to reference the project, use "${candidate.title}" exactly as provided.\n2. IGNORE the event title for topic selection. Focus 100% on expanding THIS idea: "${candidate.title}".\n3. DO NOT force event title keywords into the description unless the user's idea explicitly includes them.\n4. User Intent > Event Name ALWAYS. Stay true to the idea provided.`,
    });

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

      setScriptReloadKey(prev => prev + 1);

      setIsSaving(false);
    }

    databaseService.trackUsageEvent('prompt_optimized', currentProject?.id);
    if (currentProject) {
      databaseService.saveRevision(currentProject.id, 'prompt', { optimized_prompt: result.prompt, word_count: result.wordCount });
      setRevisionReloadKey(prev => prev + 1);
    }

    return result;
  };

  const handleGeneratePitch = async (idea: string, scriptType: 'pitch' | 'demo' | 'intro', githubUrl?: string, yourName?: string) => {
    const project = currentProject ? await databaseService.getProject(currentProject.id) : null;
    const customInstructions = project?.custom_instructions || '';

    if (scriptType === 'intro') {
      console.log('🎯 Generating intro script for:', idea);
      const result = await aiService.generateIntroPitch(idea, yourName, customInstructions);
      console.log('✅ Intro script generated:', {
        hasWho: !!result.who,
        hasWhat: !!result.what,
        hasWhy: !!result.why,
        who: result.who?.substring(0, 50),
      });

      if (currentProject) {
        setIsSaving(true);
        console.log('💾 Saving intro script to DB for project:', currentProject.id);
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
        console.log('✅ Intro script saved to DB:', {
          saved: !!saved,
          scriptType: saved?.script_type,
          hasWho: !!saved?.intro_who,
        });
        setCurrentPitchScript(saved);
        console.log('✅ setCurrentPitchScript called with saved data');
        setIsSaving(false);

        databaseService.trackUsageEvent('script_generated', currentProject.id, { type: 'intro' });
        databaseService.saveRevision(currentProject.id, 'intro_script', { who: result.who, what: result.what, why: result.why });
        setRevisionReloadKey(prev => prev + 1);
      }

      return {
        problem: '',
        solution: '',
        traction: '',
        who: result.who,
        what: result.what,
        why: result.why,
        fullScript: result.fullScript,
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

        databaseService.trackUsageEvent('script_generated', currentProject.id, { type: 'demo' });
        databaseService.saveRevision(currentProject.id, 'demo_script', { problem: result.problem, solution: result.solution, traction: result.traction });
        setRevisionReloadKey(prev => prev + 1);
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

        databaseService.trackUsageEvent('script_generated', currentProject.id, { type: 'pitch' });
        databaseService.saveRevision(currentProject.id, 'pitch_script', { problem: result.problem, solution: result.solution, traction: result.traction });
        setRevisionReloadKey(prev => prev + 1);
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
      ideaName: currentIdeaName,
    };

    try {
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
      showToast(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  return (
    <>
      {view === 'landing' && (
        <LandingPage
          isPro={isPro}
          onEnterDashboard={() => setView('dashboard')}
        />
      )}

      {view === 'dashboard' && (
        <div className="min-h-screen bg-black">
          <div className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
              <div className="flex items-center justify-between mb-4 gap-4">
                <button
                  onClick={() => setView('landing')}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight hover:opacity-80 transition-opacity"
                >
                  <span className="text-white header-text">HACKATHON</span>
                  <span className="text-accent-yellow header-text">HERO</span>
                </button>

                <div className="flex items-center gap-2 sm:gap-4">
                  {isSaving && (
                    <span className="flex items-center gap-2 text-accent-yellow text-xs font-mono animate-fadeIn">
                      <Save size={14} className="animate-pulse" />
                      SAVING...
                    </span>
                  )}
                  <ProDropdown />
                </div>
              </div>

              <div className="border-b border-gray-800 mb-6 sm:mb-8 pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <p className="text-accent-yellow font-mono text-xs sm:text-sm tracking-wider">
                      // HACKATHON PLANNING COMMAND CENTER
                    </p>
                    <HelpButton onClick={() => setShowInfoModal(true)} />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5" key={currentProject?.id}>
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
              onGenerateCandidates={handleGenerateCandidateIdeas}
              onExpandCandidate={handleExpandCandidate}
              hasRules={hasRules}
              projectId={currentProject?.id}
              onSendToOptimizer={async (idea, ideaName) => {
                if (!currentProject) return;

                setIsSaving(true);
                try {
                  const savedIdea = await databaseService.getIdea(currentProject.id);

                  if (savedIdea) {
                    await databaseService.saveIdea(currentProject.id, {
                      idea_text: idea,
                      category: savedIdea.category,
                      reasoning: savedIdea.reasoning,
                      sponsor_alignment: savedIdea.sponsor_alignment,
                    });
                  } else {
                    // No saved idea exists yet, create a new one
                    await databaseService.saveIdea(currentProject.id, {
                      idea_text: idea,
                      category: 'Uncategorized',
                      reasoning: '',
                      sponsor_alignment: '',
                    });
                  }

                  // Small delay to ensure database transaction completes
                  await new Promise(resolve => setTimeout(resolve, 50));

                  setOptimizerReloadKey(prev => prev + 1);
                  setScriptReloadKey(prev => prev + 1);

                  setTimeout(() => {
                    const optimizerElement = document.querySelector('[data-component="prompt-optimizer"]');
                    if (optimizerElement) {
                      optimizerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
                } finally {
                  setIsSaving(false);
                }
              }}
            />
            <PromptOptimizer
              onOptimize={handleOptimizePrompt}
              isPro={isPro}
              projectId={currentProject?.id}
              reloadKey={optimizerReloadKey}
            />
            <PitchScript
              onGenerate={handleGeneratePitch}
              isPro={isPro}
              projectId={currentProject?.id}
              reloadKey={scriptReloadKey}
              onShowProModal={() => setShowProModal(true)}
              onScriptSaved={async (scriptData) => {
                // Update the pitch script immediately with the saved data
                setCurrentPitchScript({
                  id: currentPitchScript?.id || '',
                  project_id: currentProject?.id || '',
                  idea_text: currentPitchScript?.idea_text || 'Manual Script',
                  problem: scriptData.problem,
                  solution: scriptData.solution,
                  traction: scriptData.traction,
                  script_type: scriptData.script_type,
                  demo_requirements: scriptData.demo_requirements,
                  demo_tools: scriptData.demo_tools,
                  demo_realworld_use: scriptData.demo_realworld_use,
                  intro_who: scriptData.intro_who,
                  intro_what: scriptData.intro_what,
                  intro_why: scriptData.intro_why,
                  github_url: currentPitchScript?.github_url || '',
                  github_analyzed: currentPitchScript?.github_analyzed || false,
                  your_name: currentPitchScript?.your_name || '',
                  intro_full_script: '',
                  created_at: currentPitchScript?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }}
            />
            <VideoCreator
              isPro={isPro}
              projectId={currentProject?.id}
              projectName={currentIdeaName || ''}
              onUpgradeClick={() => setShowProModal(true)}
              pitchScript={(() => {
                console.log('📝 App.tsx currentPitchScript:', {
                  hasScript: !!currentPitchScript,
                  scriptType: currentPitchScript?.script_type,
                  intro_who: currentPitchScript?.intro_who?.substring(0, 50),
                  intro_what: currentPitchScript?.intro_what?.substring(0, 50),
                  intro_why: currentPitchScript?.intro_why?.substring(0, 50),
                });
                return currentPitchScript ? {
                  problem: currentPitchScript.problem,
                  solution: currentPitchScript.solution,
                  traction: currentPitchScript.traction,
                  script_type: currentPitchScript.script_type,
                  requirements: currentPitchScript.demo_requirements,
                  tools: currentPitchScript.demo_tools,
                  realworld_use: currentPitchScript.demo_realworld_use,
                  who: currentPitchScript.intro_who,
                  what: currentPitchScript.intro_what,
                  why: currentPitchScript.intro_why,
                } : undefined;
              })()}
            />
            <ErrorBoundary fallbackTitle="Submission Checklist encountered an error">
              <SubmissionChecklist
                projectId={currentProject?.id}
                hasRules={hasRules}
                rulesText={rulesText}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Team Panel encountered an error">
              <TeamPanel
                projectId={currentProject?.id}
                projectName={currentProject?.name}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Revision History encountered an error">
              <RevisionHistory
                projectId={currentProject?.id}
                key={revisionReloadKey}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Scorecard encountered an error">
              <ScorecardPanel
                projectId={currentProject?.id}
                idea={currentIdeaText}
                hasRules={hasRules}
                isPro={isPro}
                onUpgradeClick={() => setShowProModal(true)}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Competitor Analysis encountered an error">
              <CompetitorAnalysis
                idea={currentIdeaText}
                isPro={isPro}
                onUpgradeClick={() => setShowProModal(true)}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Sponsor Deep Dive encountered an error">
              <SponsorDeepDive
                projectId={currentProject?.id}
                idea={currentIdeaText}
                isPro={isPro}
                onUpgradeClick={() => setShowProModal(true)}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Devpost Draft encountered an error">
              <DevpostDraft
                projectId={currentProject?.id}
                idea={currentIdeaText}
                isPro={isPro}
                onUpgradeClick={() => setShowProModal(true)}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Project Recycler encountered an error">
              <ProjectRecycler
                isPro={isPro}
                onUpgradeClick={() => setShowProModal(true)}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

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

    </div>
  )}

      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onUnlock={handleUnlockPro}
        isUnlocking={false}
      />

      <ExitIntentPopup
        isVisible={showExitIntent}
        onClose={handleCloseExitIntent}
        onGetAccess={handleExitIntentGetAccess}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
