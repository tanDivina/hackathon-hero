@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { 
   Trophy, 
   Target, 
   Lightbulb, 
   FileText, 
   Video, 
   Calendar,
-  Settings
+  Settings,
+  Crown
 } from 'lucide-react';
 import { RulesAnalyzer } from '../components/RulesAnalyzer';
 import { IdeaGenerator } from '../components/IdeaGenerator';
 import { PromptOptimizer } from '../components/PromptOptimizer';
 import { PitchScriptGenerator } from '../components/PitchScriptGenerator';
 import { VideoCreator } from '../components/VideoCreator';
 import { TimelineManager } from '../components/TimelineManager';
+import { SubscriptionStatus } from '../components/SubscriptionStatus';
 import { supabase } from '../lib/supabase';
+import { useNavigate } from 'react-router-dom';
 
 type ActiveTool = 'rules' | 'ideas' | 'prompts' | 'pitch' | 'video' | 'timeline';
 
@@ .. @@
 export const Dashboard: React.FC = () => {
   const [activeTool, setActiveTool] = useState<ActiveTool>('rules');
   const [currentProject, setCurrentProject] = useState<Project | null>(null);
+  const [user, setUser] = useState<any>(null);
+  const navigate = useNavigate();
 
   useEffect(() => {
+    // Check for authenticated user
+    const checkUser = async () => {
+      const { data: { user } } = await supabase.auth.getUser();
+      setUser(user);
+    };
+    checkUser();
+
     // Get or create session-based project
     const initializeProject = async () => {
       const sessionId = getSessionId();
@@ .. @@
       <div className="min-h-screen bg-gray-50">
         {/* Header */}
         <header className="bg-white shadow-sm border-b">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex justify-between items-center h-16">
               <div className="flex items-center">
                 <Trophy className="w-8 h-8 text-blue-600 mr-3" />
                 <h1 className="text-2xl font-bold text-gray-900">Hackathon Hero</h1>
               </div>
+              <div className="flex items-center space-x-4">
+                <SubscriptionStatus userId={user?.id} />
+                <button
+                  onClick={() => navigate('/pricing')}
+                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
+                >
+                  <Crown className="w-4 h-4 mr-2" />
+                  Upgrade
+                </button>
+              </div    }
  }
>
             </div>
           </div>
         </header>