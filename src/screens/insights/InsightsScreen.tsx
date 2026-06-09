import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useProStore } from '@store/proStore';
import { useXPStore } from '@store/xpStore';
import {
  fetchWeeklyReview,
  getInsights,
  viewInsight,
  actOnInsight,
  getWeekStart,
  type AiInsight,
} from '@services/ai/insightService';
import { WeeklyInsightCard } from '@components/insights/WeeklyInsightCard';

const PHASE3_COLOR = '#6A1B9A';

export function InsightsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isPremiumPlus = useProStore((s) => s.isPremiumPlus);
  const { addXP, level } = useXPStore();

  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AiInsight | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getInsights();
      setInsights(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  async function handleGenerateThisWeek() {
    if (!isPremiumPlus) {
      Alert.alert(t('insights.premium_required_title'), t('insights.premium_required_body'));
      return;
    }
    setGenerating(true);
    try {
      const result = await fetchWeeklyReview(getWeekStart());
      if (result) {
        await loadInsights();
      }
    } catch {
      Alert.alert(t('insights.generation_failed'));
    } finally {
      setGenerating(false);
    }
  }

  async function handleInsightPress(insight: AiInsight) {
    setSelectedInsight(insight);
    if (!insight.viewed_at) {
      await viewInsight(insight.id);
      setInsights((prev) =>
        prev.map((i) => i.id === insight.id ? { ...i, viewed_at: new Date().toISOString() } : i)
      );
    }
  }

  async function handleAct(id: string) {
    const insight = insights.find((i) => i.id === id);
    if (!insight) return;
    await actOnInsight(id);
    addXP(insight.xp_reward, level);
    setInsights((prev) =>
      prev.map((i) => i.id === id ? { ...i, was_acted_upon: 1 } : i)
    );
    Alert.alert(`+${insight.xp_reward} XP`, t('insights.acted_on'));
  }

  if (selectedInsight) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedInsight(null)}>
            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>← {t('common.back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, padding: 20, gap: 16 }}>
          <View style={[styles.badge, { backgroundColor: PHASE3_COLOR + '20' }]}>
            <Text style={[styles.badgeText, { color: PHASE3_COLOR }]}>✨ {t('insights.ai_review')}</Text>
          </View>
          <Text style={[styles.detailTitle, { color: theme.colors.onBackground }]}>
            {selectedInsight.insight_title}
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
            {selectedInsight.insight_text}
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
            {formatWeek(selectedInsight.insight_week_start)}
          </Text>
          {!selectedInsight.was_acted_upon && (
            <TouchableOpacity
              style={[styles.actFullBtn, { backgroundColor: PHASE3_COLOR }]}
              onPress={() => handleAct(selectedInsight.id)}
            >
              <Text style={styles.actFullBtnText}>
                {t('insights.act_on_it')} · +{selectedInsight.xp_reward} XP
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          {t('insights.title')}
        </Text>
        {isPremiumPlus && (
          <TouchableOpacity
            onPress={handleGenerateThisWeek}
            disabled={generating}
            style={[styles.generateBtn, { backgroundColor: PHASE3_COLOR }]}
          >
            {generating
              ? <ActivityIndicator size={14} color="white" />
              : <Text style={styles.generateBtnText}>✨ {t('insights.generate')}</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {!isPremiumPlus && (
        <Surface style={[styles.gateCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text style={styles.gateEmoji}>🧠</Text>
          <Text style={[styles.gateTitle, { color: theme.colors.onSurface }]}>
            {t('insights.premium_required_title')}
          </Text>
          <Text style={[styles.gateSub, { color: theme.colors.onSurfaceVariant }]}>
            {t('insights.premium_required_body')}
          </Text>
          <View style={[styles.ppBadge, { backgroundColor: PHASE3_COLOR }]}>
            <Text style={styles.ppBadgeText}>Premium+ feature · ₹149/mo</Text>
          </View>
        </Surface>
      )}

      {loading ? (
        <ActivityIndicator color={PHASE3_COLOR} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={insights}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WeeklyInsightCard
              insight={item}
              onPress={handleInsightPress}
              onAct={handleAct}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isPremiumPlus ? (
              <Surface style={[styles.empty, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  {t('insights.no_insights')}
                </Text>
              </Surface>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${d.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '700' },
  generateBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  generateBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32 },
  empty: { borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 24 },
  gateCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 10, margin: 20 },
  gateEmoji: { fontSize: 48 },
  gateTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  gateSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  ppBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  ppBadgeText: { color: 'white', fontSize: 13, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailHeader: { paddingHorizontal: 20, paddingTop: 16 },
  detailTitle: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  detailText: { fontSize: 16, lineHeight: 26 },
  actFullBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  actFullBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
