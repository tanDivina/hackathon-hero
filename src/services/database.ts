import { supabase } from '../lib/supabase';

export interface Project {
  id: string;
  session_id: string;
  user_id?: string;
  name: string;
  custom_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface RulesData {
  id: string;
  project_id: string;
  rules_text: string;
  deadline: string;
  sponsors: string[];
  judging_criteria: string[];
  prizes: string[];
  theme: string;
  event_type: 'GAME_JAM' | 'HACKATHON' | 'DATATHON' | 'DESIGN_CHALLENGE';
  created_at: string;
}

export interface PromptData {
  id: string;
  project_id: string;
  idea_text: string;
  optimized_prompt: string;
  word_count: number;
  created_at: string;
}

export interface PitchScriptData {
  id: string;
  project_id: string;
  idea_text: string;
  problem: string;
  solution: string;
  traction: string;
  script_type: 'pitch' | 'demo' | 'intro';
  demo_requirements: string;
  demo_tools: string;
  demo_realworld_use: string;
  github_url: string;
  github_analyzed: boolean;
  intro_who?: string;
  intro_what?: string;
  intro_why?: string;
  intro_full_script?: string;
  your_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoAssets {
  id: string;
  project_id: string;
  logo_url: string;
  audio_url: string;
  logo_position: string;
  logo_size: number;
  audio_volume: number;
  created_at: string;
  updated_at: string;
}

export interface IdeaData {
  id: string;
  project_id: string;
  idea_text: string;
  category: string;
  reasoning: string;
  sponsor_alignment: string;
  created_at: string;
  user_direction?: string;
  is_candidate?: boolean;
  candidate_title?: string;
  candidate_hook?: string;
  complexity?: string;
  parent_candidate_id?: string;
  idea_name?: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  suggested_completion: number;
}

export interface TimelineData {
  id: string;
  project_id: string;
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface PaymentData {
  id: string;
  session_id: string;
  paypal_order_id: string;
  payer_email?: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  source: 'manual' | 'auto';
}

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('hackathon_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('hackathon_session_id', sessionId);
  }
  return sessionId;
};

export const databaseService = {
  async createProject(name: string = 'Untitled Project'): Promise<Project | null> {
    const sessionId = getSessionId();

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    const projectData: any = {
      session_id: sessionId,
      name,
    };

    // If user is authenticated, add user_id
    if (user) {
      projectData.user_id = user.id;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }
    return data;
  },

  async getProjects(): Promise<Project[]> {
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase.from('projects').select('*');

    // If user is authenticated, filter by user_id
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      // If not authenticated, filter by session_id (fallback for old behavior)
      const sessionId = getSessionId();
      query = query.eq('session_id', sessionId).is('user_id', null);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    return data || [];
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }
    return data;
  },

  async updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'custom_instructions'>>): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      return false;
    }
    return true;
  },

  async deleteProject(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }
    return true;
  },

  async saveRulesData(projectId: string, rulesText: string, parsedData: {
    deadline: string;
    sponsors: string[];
    judgingCriteria: string[];
    prizes: string[];
    theme: string;
    eventType: 'GAME_JAM' | 'HACKATHON' | 'DATATHON' | 'DESIGN_CHALLENGE';
  }): Promise<RulesData | null> {
    const { data: existing } = await supabase
      .from('rules_data')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('rules_data')
        .update({
          rules_text: rulesText,
          deadline: parsedData.deadline,
          sponsors: parsedData.sponsors,
          judging_criteria: parsedData.judgingCriteria,
          prizes: parsedData.prizes,
          theme: parsedData.theme,
          event_type: parsedData.eventType,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating rules data:', error);
        return null;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('rules_data')
        .insert({
          project_id: projectId,
          rules_text: rulesText,
          deadline: parsedData.deadline,
          sponsors: parsedData.sponsors,
          judging_criteria: parsedData.judgingCriteria,
          prizes: parsedData.prizes,
          theme: parsedData.theme,
          event_type: parsedData.eventType,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving rules data:', error);
        return null;
      }
      return data;
    }
  },

  async getRulesData(projectId: string): Promise<RulesData | null> {
    const { data, error } = await supabase
      .from('rules_data')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching rules data:', error);
      return null;
    }
    return data;
  },

  async savePrompt(projectId: string, ideaText: string, optimizedPrompt: string, wordCount: number): Promise<PromptData | null> {
    const { data: existing } = await supabase
      .from('prompts')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('prompts')
        .update({
          idea_text: ideaText,
          optimized_prompt: optimizedPrompt,
          word_count: wordCount,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prompt:', error);
        return null;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          project_id: projectId,
          idea_text: ideaText,
          optimized_prompt: optimizedPrompt,
          word_count: wordCount,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving prompt:', error);
        return null;
      }
      return data;
    }
  },

  async getPrompt(projectId: string): Promise<PromptData | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }
    return data;
  },

  async savePitchScript(projectId: string, ideaText: string, script: {
    problem: string;
    solution: string;
    traction: string;
    script_type?: 'pitch' | 'demo' | 'intro';
    demo_requirements?: string;
    demo_tools?: string;
    demo_realworld_use?: string;
    github_url?: string;
    github_analyzed?: boolean;
    intro_who?: string;
    intro_what?: string;
    intro_why?: string;
    intro_full_script?: string;
    your_name?: string;
  }): Promise<PitchScriptData | null> {
    const { data: existing } = await supabase
      .from('pitch_scripts')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    const scriptData = {
      idea_text: ideaText,
      problem: script.problem,
      solution: script.solution,
      traction: script.traction,
      script_type: script.script_type || 'pitch',
      demo_requirements: script.demo_requirements || '',
      demo_tools: script.demo_tools || '',
      demo_realworld_use: script.demo_realworld_use || '',
      github_url: script.github_url || '',
      github_analyzed: script.github_analyzed || false,
      intro_who: script.intro_who || '',
      intro_what: script.intro_what || '',
      intro_why: script.intro_why || '',
      intro_full_script: script.intro_full_script || '',
      your_name: script.your_name || '',
    };

    if (existing) {
      const { data, error } = await supabase
        .from('pitch_scripts')
        .update(scriptData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pitch script:', error);
        return null;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('pitch_scripts')
        .insert({
          project_id: projectId,
          ...scriptData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving pitch script:', error);
        return null;
      }
      return data;
    }
  },

  async getPitchScript(projectId: string): Promise<PitchScriptData | null> {
    const { data, error } = await supabase
      .from('pitch_scripts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching pitch script:', error);
      return null;
    }
    return data;
  },

  async saveVideoAssets(projectId: string, assets: {
    logo_url: string;
    audio_url: string;
    logo_position: string;
    logo_size: number;
    audio_volume: number;
  }): Promise<VideoAssets | null> {
    const { data: existing } = await supabase
      .from('video_assets')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('video_assets')
        .update(assets)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating video assets:', error);
        return null;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('video_assets')
        .insert({
          project_id: projectId,
          ...assets,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving video assets:', error);
        return null;
      }
      return data;
    }
  },

  async getVideoAssets(projectId: string): Promise<VideoAssets | null> {
    const { data, error } = await supabase
      .from('video_assets')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching video assets:', error);
      return null;
    }
    return data;
  },

  async saveIdea(projectId: string, idea: {
    idea_text: string;
    category: string;
    reasoning: string;
    sponsor_alignment: string;
  }): Promise<IdeaData | null> {
    const { data: existing } = await supabase
      .from('ideas')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_candidate', false)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('ideas')
        .update({
          idea_text: idea.idea_text,
          category: idea.category,
          reasoning: idea.reasoning,
          sponsor_alignment: idea.sponsor_alignment,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating idea:', error);
        return null;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          project_id: projectId,
          idea_text: idea.idea_text,
          category: idea.category,
          reasoning: idea.reasoning,
          sponsor_alignment: idea.sponsor_alignment,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving idea:', error);
        return null;
      }
      return data;
    }
  },

  async getIdea(projectId: string): Promise<IdeaData | null> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_candidate', false)
      .maybeSingle();

    if (error) {
      console.error('Error fetching idea:', error);
      return null;
    }
    return data;
  },

  async saveCandidateIdeas(projectId: string, candidates: Array<{
    candidate_title: string;
    candidate_hook: string;
    idea_text: string;
    category: string;
    reasoning: string;
    sponsor_alignment: string;
    complexity: string;
    user_direction?: string;
  }>): Promise<IdeaData[]> {
    await supabase
      .from('ideas')
      .delete()
      .eq('project_id', projectId)
      .eq('is_candidate', true);

    await supabase
      .from('ideas')
      .delete()
      .eq('project_id', projectId)
      .eq('is_candidate', false);

    const { data, error } = await supabase
      .from('ideas')
      .insert(
        candidates.map(c => ({
          project_id: projectId,
          is_candidate: true,
          candidate_title: c.candidate_title,
          candidate_hook: c.candidate_hook,
          idea_text: c.idea_text,
          category: c.category,
          reasoning: c.reasoning,
          sponsor_alignment: c.sponsor_alignment,
          complexity: c.complexity,
          user_direction: c.user_direction || '',
        }))
      )
      .select();

    if (error) {
      console.error('Error saving candidate ideas:', error);
      return [];
    }
    return data || [];
  },

  async getCandidateIdeas(projectId: string): Promise<IdeaData[]> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_candidate', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching candidate ideas:', error);
      return [];
    }
    return data || [];
  },

  async expandCandidateIdea(projectId: string, candidateId: string, expandedIdea: {
    idea_text: string;
    category: string;
    reasoning: string;
    sponsor_alignment: string;
    idea_name?: string;
  }): Promise<IdeaData | null> {
    await supabase
      .from('ideas')
      .delete()
      .eq('project_id', projectId)
      .eq('is_candidate', false);

    const { data, error } = await supabase
      .from('ideas')
      .insert({
        project_id: projectId,
        is_candidate: false,
        parent_candidate_id: candidateId,
        idea_text: expandedIdea.idea_text,
        category: expandedIdea.category,
        reasoning: expandedIdea.reasoning,
        sponsor_alignment: expandedIdea.sponsor_alignment,
        idea_name: expandedIdea.idea_name || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error expanding candidate idea:', error);
      return null;
    }
    return data;
  },

  async saveChatMessage(projectId: string, role: 'user' | 'assistant', content: string): Promise<boolean> {
    const sessionId = localStorage.getItem('session_id') || '';
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        project_id: projectId,
        session_id: sessionId,
        role,
        content,
      });

    if (error) {
      console.error('Error saving chat message:', error);
      return false;
    }
    return true;
  },

  async getChatHistory(projectId: string): Promise<Array<{ id: string; role: string; content: string; created_at: string }>> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
    return data || [];
  },

  async saveTimeline(projectId: string, milestones: Milestone[]): Promise<TimelineData | null> {
    const { data: existing } = await supabase
      .from('timelines')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('timelines')
        .update({
          milestones: milestones,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating timeline:', error);
        return null;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('timelines')
        .insert({
          project_id: projectId,
          milestones: milestones,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving timeline:', error);
        return null;
      }
      return data;
    }
  },

  async getTimeline(projectId: string): Promise<TimelineData | null> {
    const { data, error } = await supabase
      .from('timelines')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching timeline:', error);
      return null;
    }
    return data;
  },

  async savePayment(paypalOrderId: string, payerEmail: string | undefined, amount: number, currency: string): Promise<PaymentData | null> {
    const sessionId = getSessionId();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        session_id: sessionId,
        paypal_order_id: paypalOrderId,
        payer_email: payerEmail,
        amount: amount,
        currency: currency,
        status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving payment:', error);
      return null;
    }
    return data;
  },

  async checkProStatus(): Promise<boolean> {
    // Check if user is authenticated - use getSession for more reliable results
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
      console.log('Checking pro status for user:', user.email);

      // For authenticated users, first get their Stripe customer ID
      const { data: customer } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check for active Stripe subscription
      if (customer) {
        const { data: subscription } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customer.customer_id)
          .eq('status', 'active')
          .maybeSingle();

        if (subscription) {
          console.log('Pro status: true (Stripe subscription)');
          return true;
        }
      }

      // Also check payments table for beta access (fallback)
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('payer_email', user.email)
        .eq('status', 'completed')
        .limit(1);

      console.log('Payment query result:', { payments, paymentError, email: user.email, count: payments?.length });

      if (payments && payments.length > 0) {
        console.log('Pro status: true (payment record found)');
        return true;
      }

      console.log('Pro status: false (no payment or subscription found)');
    }

    // For non-authenticated users, check session-based payments (legacy)
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .maybeSingle();

    if (error) {
      console.error('Error checking pro status:', error);
      return false;
    }

    if (data) {
      console.log('Pro status: true (session-based payment)');
    } else {
      console.log('Pro status: false (no session-based payment)');
    }

    return !!data;
  },

  async enableTestMode(): Promise<{success: boolean, requiresAuth: boolean}> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, requiresAuth: true };
    }

    const sessionId = getSessionId();

    // Check if beta access already exists
    const { data: existing } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existing) {
      return { success: true, requiresAuth: false };
    }

    // Use a unique order ID per session to avoid constraint violation
    const uniqueOrderId = `BETA_ACCESS_${sessionId}`;

    const { data, error } = await supabase
      .from('payments')
      .insert({
        session_id: sessionId,
        paypal_order_id: uniqueOrderId,
        payer_email: user.email,
        amount: 0,
        currency: 'usd',
        status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('Error enabling test mode:', error);
      return { success: false, requiresAuth: false };
    }

    return { success: !!data, requiresAuth: false };
  },

  async subscribeToNewsletter(email: string): Promise<{ success: boolean; message?: string }> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email: email.toLowerCase().trim(),
        user_id: user.user?.id || null,
        is_active: true,
      })
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          message: 'This email is already subscribed',
        };
      }
      console.error('Error subscribing to newsletter:', error);
      return {
        success: false,
        message: 'Failed to subscribe. Please try again.',
      };
    }

    return { success: !!data };
  },

  async trackUsageEvent(eventName: string, projectId?: string, metadata?: Record<string, unknown>): Promise<void> {
    console.log('Usage event:', eventName, projectId, metadata);
  },

  async saveRevision(projectId: string, contentType: string, content: Record<string, unknown>): Promise<void> {
    console.log('Saving revision:', projectId, contentType, Object.keys(content));
  },

  async getRevisionHistory(projectId: string): Promise<Array<{ id: string; content_type: string; content: Record<string, unknown>; created_at: string }>> {
    return [];
  },

  async getProjectMembers(projectId: string): Promise<Array<{ id: string; email: string; role: 'owner' | 'member'; joined_at: string }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    return [{
      id: user.id,
      email: user.email || 'you@example.com',
      role: 'owner',
      joined_at: new Date().toISOString(),
    }];
  },

  async createInviteLink(projectId: string): Promise<string | null> {
    const token = Math.random().toString(36).substring(2, 15);
    console.log('Created invite link for project:', projectId, token);
    return token;
  },

  async getChecklist(projectId: string): Promise<ChecklistItem[]> {
    const key = `checklist_${projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  },

  async saveChecklist(projectId: string, items: ChecklistItem[]): Promise<void> {
    const key = `checklist_${projectId}`;
    localStorage.setItem(key, JSON.stringify(items));
  },
};

