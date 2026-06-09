import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { CoachingHistory } from '@/components/coaching/CoachingHistory';

export default async function CoachingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [sessionsRes, personasRes] = await Promise.all([
    supabase
      .from('coaching_sessions')
      .select('id, persona_id, title, started_at, last_message_at, message_count')
      .eq('user_id', user!.id)
      .order('last_message_at', { ascending: false })
      .limit(20),
    supabase
      .from('coach_personas')
      .select('id, name, avatar_emoji, color'),
  ]);

  const sessions = sessionsRes.data ?? [];
  const personas = Object.fromEntries((personasRes.data ?? []).map((p) => [p.id, p]));

  return (
    <>
      <TopBar title="Coaching History" />
      <div className="flex-1 overflow-auto p-6 max-w-3xl">
        <CoachingHistory sessions={sessions} personas={personas} userId={user!.id} />
      </div>
    </>
  );
}
