import { supabase } from '@services/supabase/client';

export interface CoachPersona {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatar_emoji: string;
  color: string;
  specialty: string;
  is_premium: boolean;
}

export interface HabitProgram {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  persona_id: string | null;
  category: string;
  difficulty: string;
  is_premium: boolean;
}

export interface ProgramTask {
  id: string;
  program_id: string;
  day_number: number;
  title: string;
  description: string | null;
  task_type: string;
  duration_minutes: number | null;
  xp_reward: number;
}

export interface UserProgram {
  id: string;
  program_id: string;
  started_at: string;
  target_end_at: string | null;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  current_day: number;
  completion_pct: number;
  habit_programs?: { title: string; duration_days: number; category: string };
}

export interface CoachingSession {
  id: string;
  persona_id: string;
  title: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
}

export interface CoachingMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface HabitPrediction {
  activity_id: string;
  risk_score: number;
  reasoning: string | null;
  predicted_for: string;
}

// ── Personas ──────────────────────────────────────────────────────────────────

export async function getCoachPersonas(): Promise<CoachPersona[]> {
  const { data, error } = await supabase
    .from('coach_personas')
    .select('id, name, tagline, description, avatar_emoji, color, specialty, is_premium')
    .order('is_premium', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getUserPersona(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'motivator';
  const { data } = await supabase
    .from('user_coach_preferences')
    .select('primary_persona')
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.primary_persona ?? 'motivator';
}

export async function setUserPersona(personaId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_coach_preferences').upsert(
    { user_id: user.id, primary_persona: personaId, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
}

// ── Programs ──────────────────────────────────────────────────────────────────

export async function getHabitPrograms(): Promise<HabitProgram[]> {
  const { data, error } = await supabase
    .from('habit_programs')
    .select('id, title, description, duration_days, persona_id, category, difficulty, is_premium')
    .eq('is_template', true)
    .order('is_premium', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getUserPrograms(): Promise<UserProgram[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('user_programs')
    .select('*, habit_programs(title, duration_days, category)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserProgram[];
}

export async function enrollInProgram(programId: string): Promise<UserProgram> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const program = await supabase.from('habit_programs')
    .select('duration_days').eq('id', programId).single();
  const durationDays = program.data?.duration_days ?? 30;
  const targetEnd = new Date();
  targetEnd.setDate(targetEnd.getDate() + durationDays);

  const { data, error } = await supabase.from('user_programs').insert({
    user_id: user.id,
    program_id: programId,
    target_end_at: targetEnd.toISOString(),
    status: 'active',
    current_day: 1,
    completion_pct: 0,
  }).select().single();
  if (error) throw error;
  return data as UserProgram;
}

export async function getProgramTasks(programId: string, dayNumber: number): Promise<ProgramTask[]> {
  const { data, error } = await supabase
    .from('program_tasks')
    .select('*')
    .eq('program_id', programId)
    .eq('day_number', dayNumber)
    .order('task_type');
  if (error) throw error;
  return data ?? [];
}

export async function completeTask(userProgramId: string, taskId: string, reflection?: string): Promise<void> {
  const { error } = await supabase.from('program_progress').upsert({
    user_program_id: userProgramId,
    task_id: taskId,
    completed_at: new Date().toISOString(),
    reflection: reflection ?? null,
  }, { onConflict: 'user_program_id,task_id' });
  if (error) throw error;
}

// ── Coaching chat ─────────────────────────────────────────────────────────────

export async function getOrCreateSession(personaId: string): Promise<CoachingSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get most recent session for this persona (within last 24h, reuse it)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('persona_id', personaId)
    .gte('last_message_at', yesterday)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as CoachingSession;

  const { data, error } = await supabase.from('coaching_sessions').insert({
    user_id: user.id,
    persona_id: personaId,
  }).select().single();
  if (error) throw error;
  return data as CoachingSession;
}

export async function getSessionMessages(sessionId: string): Promise<CoachingMessage[]> {
  const { data, error } = await supabase
    .from('coaching_messages')
    .select('id, session_id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as CoachingMessage[];
}

export async function sendCoachMessage(
  sessionId: string,
  personaId: string,
  userMessage: string,
): Promise<CoachingMessage> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('coach-chat', {
    body: { sessionId, personaId, userMessage },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw error;
  return data as CoachingMessage;
}

// ── Habit predictions ─────────────────────────────────────────────────────────

export async function getHabitPredictions(): Promise<HabitPrediction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('habit_predictions')
    .select('activity_id, risk_score, reasoning, predicted_for')
    .eq('user_id', user.id)
    .eq('predicted_for', today)
    .order('risk_score', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function refreshHabitPredictions(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  await supabase.functions.invoke('predict-habits', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}
