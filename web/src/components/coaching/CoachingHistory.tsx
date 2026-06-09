'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  persona_id: string;
  title: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
}

interface Persona {
  id: string;
  name: string;
  avatar_emoji: string;
  color: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Props {
  sessions: Session[];
  personas: Record<string, Persona>;
  userId: string;
}

export function CoachingHistory({ sessions, personas, userId }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  async function handleExpand(sessionId: string) {
    if (expandedId === sessionId) { setExpandedId(null); return; }
    setExpandedId(sessionId);
    if (messages[sessionId]) return;

    setLoadingId(sessionId);
    const { data } = await supabase
      .from('coaching_messages')
      .select('id, role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at');
    setMessages((prev) => ({ ...prev, [sessionId]: (data ?? []) as Message[] }));
    setLoadingId(null);
  }

  async function handleExportPDF(sessionId: string) {
    setExportingId(sessionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/v1/coaching/sessions/${sessionId}/export`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coaching-session-${sessionId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingId(null);
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 border border-gray-100 dark:border-gray-800 text-center">
        <p className="text-3xl mb-3">🤖</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No coaching sessions yet. Open the mobile app and start a conversation with your coach.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const persona = personas[session.persona_id];
        const isExpanded = expandedId === session.id;
        const sessionMessages = messages[session.id] ?? [];

        return (
          <div key={session.id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Session header */}
            <button
              onClick={() => handleExpand(session.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
              <span className="text-2xl">{persona?.avatar_emoji ?? '🤖'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {persona && (
                    <span className="text-sm font-bold" style={{ color: persona.color }}>{persona.name}</span>
                  )}
                  <span className="text-xs text-gray-400">{session.message_count} messages</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {session.title ?? 'Untitled session'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {session.last_message_at
                    ? new Date(session.last_message_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : new Date(session.started_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleExportPDF(session.id); }}
                  disabled={exportingId === session.id}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {exportingId === session.id ? '…' : '↓ PDF'}
                </button>
                <span className="text-gray-400 text-lg">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Messages */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3 max-h-96 overflow-y-auto">
                {loadingId === session.id ? (
                  <div className="text-center py-4 text-sm text-gray-400">Loading messages…</div>
                ) : sessionMessages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No messages found.</p>
                ) : (
                  sessionMessages.map((msg) => (
                    <div key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}
                        style={msg.role === 'user' ? { backgroundColor: persona?.color ?? '#6A1B9A' } : undefined}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
