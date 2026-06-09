import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/types';
import {
  getOrCreateSession, getSessionMessages, sendCoachMessage,
  getCoachPersonas,
  type CoachingMessage, type CoachPersona,
} from '@services/ai/coachingService';

type RouteProps = RouteProp<RootStackParamList, 'CoachChat'>;

export default function CoachChatScreen() {
  const theme = useTheme() as MD3Theme;
  const route = useRoute<RouteProps>();
  const { personaId } = route.params;
  const flatListRef = useRef<FlatList>(null);

  const [persona, setPersona] = useState<CoachPersona | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [personas, session] = await Promise.all([
        getCoachPersonas(),
        getOrCreateSession(personaId),
      ]);
      const p = personas.find((x) => x.id === personaId) ?? null;
      setPersona(p);
      setSessionId(session.id);
      const msgs = await getSessionMessages(session.id);
      setMessages(msgs);
      setLoading(false);
    }
    init().catch(() => setLoading(false));
  }, [personaId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !sessionId || sending) return;
    setInput('');
    setSending(true);

    // Optimistically add user message
    const optimistic: CoachingMessage = {
      id: `opt-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const reply = await sendCoachMessage(sessionId, personaId, text);
      setMessages((prev) => [...prev, reply]);
    } catch {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sessionId, personaId, sending]);

  const s = styles(theme, persona?.color ?? '#6A1B9A');

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      {persona && (
        <View style={s.header}>
          <Text style={s.avatarEmoji}>{persona.avatar_emoji}</Text>
          <View>
            <Text style={s.headerName}>{persona.name}</Text>
            <Text style={s.headerTagline}>{persona.tagline}</Text>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={s.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>{persona?.avatar_emoji ?? '🤖'}</Text>
            <Text style={s.emptyText}>
              Hi! I'm {persona?.name ?? 'your coach'}. {persona?.tagline ?? ''}{'\n\n'}
              Ask me anything about your habits, goals, or daily routine.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === 'user' ? s.userBubble : s.assistantBubble]}>
            <Text style={item.role === 'user' ? s.userText : s.assistantText}>
              {item.content}
            </Text>
          </View>
        )}
      />

      {/* Input bar */}
      <View style={s.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Ask ${persona?.name ?? 'your coach'}…`}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={s.input}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || sending}
          style={[s.sendButton, (!input.trim() || sending) && s.sendButtonDisabled]}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.sendIcon}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: MD3Theme, accentColor: string) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.colors.background },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant,
  },
  avatarEmoji:    { fontSize: 32 },
  headerName:     { fontSize: 16, fontWeight: '700', color: theme.colors.onSurface },
  headerTagline:  { fontSize: 12, color: theme.colors.onSurfaceVariant },
  messagesList:   { padding: 16, gap: 10 },
  emptyState:     { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji:     { fontSize: 48, marginBottom: 16 },
  emptyText:      { fontSize: 15, color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  bubble: {
    maxWidth: '82%', padding: 12, borderRadius: 18,
    marginBottom: 4,
  },
  userBubble:     { alignSelf: 'flex-end', backgroundColor: accentColor, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant, borderBottomLeftRadius: 4 },
  userText:       { color: '#fff', fontSize: 15, lineHeight: 21 },
  assistantText:  { color: theme.colors.onSurface, fontSize: 15, lineHeight: 21 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: theme.colors.onSurface,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: accentColor,
    alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
