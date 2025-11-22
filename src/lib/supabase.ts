import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface HackathonProject {
  id: string;
  user_id: string;
  project_name: string;
  rules_text: string;
  user_idea: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedRules {
  id: string;
  project_id: string;
  deadline: string;
  sponsors: string[];
  judging_criteria: string[];
  raw_analysis: Record<string, any>;
  created_at: string;
}

export interface GeneratedPrompt {
  id: string;
  project_id: string;
  input_idea: string;
  optimized_prompt: string;
  word_count: number;
  created_at: string;
}

export interface PitchScript {
  id: string;
  project_id: string;
  problem_section: string;
  solution_section: string;
  traction_section: string;
  full_script: string;
  created_at: string;
}

export interface ProAccess {
  id: string;
  user_id: string;
  is_pro: boolean;
  unlocked_at: string | null;
  created_at: string;
}
