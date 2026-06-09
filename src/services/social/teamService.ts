import { supabase } from '@services/supabase/client';

export interface Team {
  id: string;
  teamName: string;
  companyName: string | null;
  adminUserId: string;
  memberCount: number;
  status: 'active' | 'paused' | 'archived';
  inviteCode: string;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'member';
  weekXp: number;
  level: number;
  joinedAt: string;
  avatarInitials: string;
}

export interface TeamChallenge {
  id: string;
  challengeName: string;
  description: string | null;
  targetCount: number | null;
  targetMetric: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'active' | 'completed' | 'cancelled';
}

export async function createTeam(
  adminUserId: string,
  teamName: string,
  companyName?: string
): Promise<Team> {
  // Generate a 6-char alphanumeric invite code
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('team_workspaces')
    .insert({
      team_name: teamName,
      company_name: companyName ?? null,
      admin_user_id: adminUserId,
      invite_code: inviteCode,
      member_count: 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Add creator as admin member
  await supabase.from('team_members').insert({
    team_id: data.id,
    user_id: adminUserId,
    role: 'admin',
  });

  return toTeam(data);
}

export async function joinTeamByCode(userId: string, inviteCode: string): Promise<Team> {
  const { data: workspace, error } = await supabase
    .from('team_workspaces')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .eq('status', 'active')
    .maybeSingle();

  if (error || !workspace) throw new Error('Team not found or invalid code');

  // Check already member
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', workspace.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('team_members').insert({
      team_id: workspace.id,
      user_id: userId,
      role: 'member',
    });
    await supabase
      .from('team_workspaces')
      .update({ member_count: workspace.member_count + 1 })
      .eq('id', workspace.id);
  }

  return toTeam(workspace);
}

export async function getUserTeam(userId: string): Promise<Team | null> {
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) return null;

  const { data: workspace } = await supabase
    .from('team_workspaces')
    .select('*')
    .eq('id', membership.team_id)
    .eq('status', 'active')
    .maybeSingle();

  return workspace ? toTeam(workspace) : null;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, role, joined_at')
    .eq('team_id', teamId);

  if (!members || members.length === 0) return [];

  const memberIds = members.map((m) => m.user_id as string);

  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .in('id', memberIds);

  const weekStart = getWeekStartISO();
  const { data: xpRows } = await supabase
    .from('leaderboards')
    .select('user_id, week_xp, level')
    .in('user_id', memberIds)
    .eq('week_start', weekStart);

  const userMap = new Map((users ?? []).map((u) => [u.id as string, u]));
  const xpMap = new Map(
    (xpRows ?? []).map((r) => [r.user_id as string, { weekXp: r.week_xp as number, level: r.level as number }])
  );

  return members
    .map((m) => {
      const user = userMap.get(m.user_id as string);
      if (!user) return null;
      const name = (user.email as string).split('@')[0];
      const xp = xpMap.get(m.user_id as string) ?? { weekXp: 0, level: 0 };
      return {
        userId: m.user_id as string,
        email: user.email as string,
        displayName: name,
        role: m.role as TeamMember['role'],
        weekXp: xp.weekXp,
        level: xp.level,
        joinedAt: m.joined_at as string,
        avatarInitials: name.slice(0, 2).toUpperCase(),
      };
    })
    .filter((m): m is TeamMember => m !== null)
    .sort((a, b) => b.weekXp - a.weekXp);
}

export async function getTeamChallenges(teamId: string): Promise<TeamChallenge[]> {
  const { data } = await supabase
    .from('team_challenges')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id as string,
    challengeName: r.challenge_name as string,
    description: r.description as string | null,
    targetCount: r.target_count as number | null,
    targetMetric: r.target_metric as string | null,
    startDate: r.start_date as string | null,
    endDate: r.end_date as string | null,
    status: r.status as TeamChallenge['status'],
  }));
}

export async function createTeamChallenge(
  teamId: string,
  challengeName: string,
  targetMetric: string,
  targetCount: number,
  endDate: string
): Promise<void> {
  await supabase.from('team_challenges').insert({
    team_id: teamId,
    challenge_name: challengeName,
    target_metric: targetMetric,
    target_count: targetCount,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: endDate,
    status: 'active',
  });
}

export async function leaveTeam(userId: string, teamId: string): Promise<void> {
  await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);
}

function toTeam(data: Record<string, unknown>): Team {
  return {
    id: data.id as string,
    teamName: data.team_name as string,
    companyName: data.company_name as string | null,
    adminUserId: data.admin_user_id as string,
    memberCount: data.member_count as number,
    status: data.status as Team['status'],
    inviteCode: (data.invite_code as string) ?? '',
    createdAt: data.created_at as string,
  };
}

function getWeekStartISO(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
