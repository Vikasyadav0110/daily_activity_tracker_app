import type { ExamType } from '@services/db/examRepo';

export interface ExamConfig {
  type: ExamType;
  label: string;
  icon: string;
  defaultSubjects: string[];
  studyHoursTarget: number;
}

export const EXAM_CONFIGS: ExamConfig[] = [
  {
    type: 'UPSC',
    label: 'UPSC',
    icon: '🏛️',
    defaultSubjects: [
      'General Studies I',
      'General Studies II (Polity)',
      'General Studies III (Economy)',
      'General Studies IV (Ethics)',
      'Optional Subject',
      'Essay',
      'Current Affairs',
    ],
    studyHoursTarget: 8,
  },
  {
    type: 'JEE',
    label: 'JEE',
    icon: '⚗️',
    defaultSubjects: ['Physics', 'Chemistry', 'Mathematics'],
    studyHoursTarget: 6,
  },
  {
    type: 'NEET',
    label: 'NEET',
    icon: '🩺',
    defaultSubjects: ['Physics', 'Chemistry', 'Biology (Botany)', 'Biology (Zoology)'],
    studyHoursTarget: 6,
  },
  {
    type: 'SSC',
    label: 'SSC',
    icon: '📋',
    defaultSubjects: [
      'General Intelligence & Reasoning',
      'General Awareness',
      'Quantitative Aptitude',
      'English Language',
    ],
    studyHoursTarget: 4,
  },
  {
    type: 'Banking',
    label: 'Banking',
    icon: '🏦',
    defaultSubjects: [
      'Reasoning',
      'Quantitative Aptitude',
      'English',
      'General/Financial Awareness',
      'Computer Knowledge',
    ],
    studyHoursTarget: 4,
  },
];

export function getExamConfig(type: ExamType): ExamConfig | undefined {
  return EXAM_CONFIGS.find((e) => e.type === type);
}
