import { getDatabase } from './database';

export interface AiInsight {
  id: string;
  insight_week_start: string;
  insight_type: string;
  insight_title: string;
  insight_text: string;
  insight_data: string | null;
  xp_reward: number;
  was_acted_upon: number;
  created_at: string;
  viewed_at: string | null;
}

export async function saveInsight(insight: Omit<AiInsight, 'created_at'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO ai_insights
     (id, insight_week_start, insight_type, insight_title, insight_text,
      insight_data, xp_reward, was_acted_upon, viewed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      insight.id,
      insight.insight_week_start,
      insight.insight_type,
      insight.insight_title,
      insight.insight_text,
      insight.insight_data ?? null,
      insight.xp_reward,
      insight.was_acted_upon,
      insight.viewed_at ?? null,
    ]
  );
}

export async function getInsightForWeek(weekStart: string): Promise<AiInsight | null> {
  const db = await getDatabase();
  return db.getFirstAsync<AiInsight>(
    `SELECT * FROM ai_insights WHERE insight_week_start = ? AND insight_type = 'weekly_review'`,
    [weekStart]
  );
}

export async function getInsightHistory(limit = 12): Promise<AiInsight[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AiInsight>(
    `SELECT * FROM ai_insights ORDER BY insight_week_start DESC LIMIT ?`,
    [limit]
  );
  return rows ?? [];
}

export async function markInsightViewed(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ai_insights SET viewed_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export async function markInsightActedUpon(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ai_insights SET was_acted_upon = 1 WHERE id = ?`,
    [id]
  );
}
