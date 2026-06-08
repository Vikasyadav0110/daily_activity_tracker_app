import { getDatabase } from './database';

export type ExamType = 'UPSC' | 'JEE' | 'NEET' | 'SSC' | 'Banking';

export interface ExamSubject {
  name: string;
  completion: number; // 0–100
}

export interface ExamPrep {
  id: number;
  activity_id: number;
  exam_type: ExamType;
  subjects: ExamSubject[];
  exam_date: string | null;
  syllabus_coverage_pct: number;
}

export interface ExamLog {
  id: number;
  exam_id: number;
  subject: string;
  study_hours: number;
  difficulty: 'easy' | 'medium' | 'hard';
  log_date: string;
  created_at: string;
}

export interface MockTest {
  id: number;
  exam_id: number;
  subject: string | null;
  score: number;
  total_marks: number;
  test_date: string;
  created_at: string;
}

export async function createExamPrep(
  activityId: number,
  examType: ExamType,
  subjects: ExamSubject[] = [],
  examDate?: string
): Promise<ExamPrep> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO exam_prep (activity_id, exam_type, subjects, exam_date)
     VALUES (?, ?, ?, ?)`,
    [activityId, examType, JSON.stringify(subjects), examDate ?? null]
  );
  const prep = await getExamPrepById(result.lastInsertRowId);
  if (!prep) throw new Error('Failed to create exam prep');
  return prep;
}

export async function getExamPrepById(id: number): Promise<ExamPrep | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM exam_prep WHERE id = ?`,
    [id]
  );
  return row ? normalizeExamPrep(row) : null;
}

export async function getExamPrepForActivity(activityId: number): Promise<ExamPrep | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM exam_prep WHERE activity_id = ?`,
    [activityId]
  );
  return row ? normalizeExamPrep(row) : null;
}

export async function updateExamPrep(
  id: number,
  updates: Partial<Pick<ExamPrep, 'subjects' | 'exam_date' | 'syllabus_coverage_pct'>>
): Promise<void> {
  const db = await getDatabase();
  if (updates.subjects !== undefined) {
    await db.runAsync(
      `UPDATE exam_prep SET subjects = ? WHERE id = ?`,
      [JSON.stringify(updates.subjects), id]
    );
  }
  if (updates.exam_date !== undefined) {
    await db.runAsync(
      `UPDATE exam_prep SET exam_date = ? WHERE id = ?`,
      [updates.exam_date, id]
    );
  }
  if (updates.syllabus_coverage_pct !== undefined) {
    await db.runAsync(
      `UPDATE exam_prep SET syllabus_coverage_pct = ? WHERE id = ?`,
      [updates.syllabus_coverage_pct, id]
    );
  }
}

export async function logStudySession(
  examId: number,
  subject: string,
  studyHours: number,
  difficulty: 'easy' | 'medium' | 'hard',
  logDate: string
): Promise<ExamLog> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO exam_logs (exam_id, subject, study_hours, difficulty, log_date)
     VALUES (?, ?, ?, ?, ?)`,
    [examId, subject, studyHours, difficulty, logDate]
  );
  const log = await db.getFirstAsync<ExamLog>(
    `SELECT * FROM exam_logs WHERE id = ?`,
    [result.lastInsertRowId]
  );
  if (!log) throw new Error('Failed to create exam log');
  return log;
}

export async function getStudyLogs(examId: number, limit = 30): Promise<ExamLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<ExamLog>(
    `SELECT * FROM exam_logs WHERE exam_id = ? ORDER BY log_date DESC LIMIT ?`,
    [examId, limit]
  );
}

export async function logMockTest(
  examId: number,
  score: number,
  totalMarks: number,
  testDate: string,
  subject?: string
): Promise<MockTest> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO mock_tests (exam_id, score, total_marks, test_date, subject)
     VALUES (?, ?, ?, ?, ?)`,
    [examId, score, totalMarks, testDate, subject ?? null]
  );
  const test = await db.getFirstAsync<MockTest>(
    `SELECT * FROM mock_tests WHERE id = ?`,
    [result.lastInsertRowId]
  );
  if (!test) throw new Error('Failed to create mock test');
  return test;
}

export async function getMockTests(examId: number): Promise<MockTest[]> {
  const db = await getDatabase();
  return db.getAllAsync<MockTest>(
    `SELECT * FROM mock_tests WHERE exam_id = ? ORDER BY test_date DESC`,
    [examId]
  );
}

function normalizeExamPrep(row: Record<string, unknown>): ExamPrep {
  let subjects: ExamSubject[] = [];
  try {
    subjects = JSON.parse((row.subjects as string) || '[]');
  } catch {
    subjects = [];
  }
  return {
    id: row.id as number,
    activity_id: row.activity_id as number,
    exam_type: row.exam_type as ExamType,
    subjects,
    exam_date: (row.exam_date as string | null) ?? null,
    syllabus_coverage_pct: (row.syllabus_coverage_pct as number) || 0,
  };
}
