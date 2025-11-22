import { supabase } from '../lib/supabase';

export interface Project {
  id: string;
  session_id: string;
  name: string;
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
    const { data, error } = await supabase
      .from('projects')
      .insert({ session_id: sessionId, name })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }
    return data;
  },

  async getProjects(): Promise<Project[]> {
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    return data || [];
  },

  async updateProject(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .update({ name })
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
      .maybeSingle();

    if (error) {
      console.error('Error fetching idea:', error);
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

    const { data, error } = await supabase
      .from('payments')
      .insert({
        session_id: sessionId,
        paypal_order_id: 'BETA_ACCESS',
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
};

