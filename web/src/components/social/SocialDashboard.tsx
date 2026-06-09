'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Friend {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  user_a?: { display_name: string | null; avatar_url: string | null } | null;
  user_b?: { display_name: string | null; avatar_url: string | null } | null;
}
export interface LeaderboardEntry {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  user_profiles?: { display_name: string | null; avatar_url: string | null } | null;
}
export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  activity_id: string;
  duration_days: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  activities?: { name: string; emoji?: string | null } | null;
  challenger?: { display_name: string | null } | null;
  challenged?: { display_name: string | null } | null;
}

interface Props {
  userId: string;
  friends: Friend[];
  leaderboard: LeaderboardEntry[];
  challenges: Challenge[];
}

const TABS = ['Friends', 'Leaderboard', 'Challenges'] as const;
type Tab = typeof TABS[number];

export function SocialDashboard({ userId, friends, leaderboard, challenges }: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('Friends');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function getFriendProfile(f: Friend) {
    return f.user_a_id === userId ? f.user_b : f.user_a;
  }

  function getInitials(name: string | null | undefined) {
    return name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  }

  async function sendFriendRequest() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setSendingInvite(true);
    setInviteMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const res = await fetch('/api/v1/friends', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json() as { data?: { status?: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed');
      const status = json.data?.status;
      setInviteMsg({
        ok: true,
        text: status === 'accepted' ? `You and ${email} are now friends!` : `Friend request sent to ${email}.`,
      });
      setInviteEmail('');
    } catch (err) {
      setInviteMsg({ ok: false, text: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSendingInvite(false);
    }
  }

  async function removeFriend(friendshipId: string) {
    if (!confirm('Remove this friend?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch('/api/v1/friends', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ friend_id: friendshipId }),
    });
  }

  const myRank = leaderboard.findIndex((e) => e.user_id === userId);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Friends',           value: String(friends.length) },
          { label: 'Your Rank',         value: myRank >= 0 ? `#${myRank + 1}` : '—' },
          { label: 'Active Challenges', value: String(challenges.filter((c) => c.status === 'active').length) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
            {tab === 'Challenges' && challenges.filter((c) => c.status === 'pending' && c.challenged_id === userId).length > 0 && (
              <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                {challenges.filter((c) => c.status === 'pending' && c.challenged_id === userId).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {activeTab === 'Friends' && (
        <div className="space-y-4">
          {/* Invite */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add Friend</h2>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
                placeholder="friend@example.com"
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendFriendRequest}
                disabled={sendingInvite || !inviteEmail.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
              >
                {sendingInvite ? 'Sending…' : 'Add'}
              </button>
            </div>
            {inviteMsg && (
              <p className={`mt-2 text-xs ${inviteMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {inviteMsg.text}
              </p>
            )}
          </div>

          {/* Friends list */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {friends.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">👋</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No friends yet. Invite someone above!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {friends.map((f) => {
                  const profile = getFriendProfile(f);
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">
                          {getInitials(profile?.display_name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {profile?.display_name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">Friends since {new Date(f.created_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => removeFriend(f.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard tab */}
      {activeTab === 'Leaderboard' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">🏆 Streak Leaderboard</h2>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No data yet.</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {leaderboard.map((entry, idx) => {
                const isMe = entry.user_id === userId;
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <span className="w-8 text-center text-base">{medal}</span>
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                      {getInitials(entry.user_profiles?.display_name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.user_profiles?.display_name ?? 'Anonymous'}
                        {isMe && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-400">Best: {entry.longest_streak} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-500">🔥 {entry.current_streak}</p>
                      <p className="text-xs text-gray-400">days</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Challenges tab */}
      {activeTab === 'Challenges' && (
        <div className="space-y-4">
          {challenges.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-12 text-center">
              <p className="text-3xl mb-2">⚔️</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">No active challenges. Challenge a friend from their profile!</p>
            </div>
          ) : (
            challenges.map((c) => {
              const isChallenger = c.challenger_id === userId;
              const opponent = isChallenger ? c.challenged : c.challenger;
              const isPending = c.status === 'pending' && c.challenged_id === userId;
              return (
                <div key={c.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{c.activities?.emoji ?? '⚔️'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {c.activities?.name ?? 'Activity'} Challenge
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.status === 'active'   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          c.status === 'pending'  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {isChallenger ? `You challenged ${opponent?.display_name ?? 'someone'}` : `${opponent?.display_name ?? 'Someone'} challenged you`}
                        {' · '}{c.duration_days} days
                      </p>
                      {c.start_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(c.start_date).toLocaleDateString()} – {c.end_date ? new Date(c.end_date).toLocaleDateString() : '?'}
                        </p>
                      )}
                    </div>
                    {isPending && (
                      <button className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
