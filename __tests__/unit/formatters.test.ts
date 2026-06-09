import {
  formatDuration,
  formatStudyHours,
  formatPercentage,
  formatScore,
  formatStreakDays,
  truncate,
} from '../../src/utils/formatters';

describe('formatDuration', () => {
  it('returns minutes-only for values under 60', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(59)).toBe('59m');
  });

  it('returns hours-only when no remainder minutes', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('returns hours and minutes when there is a remainder', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(125)).toBe('2h 5m');
  });

  it('handles 0 minutes', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('formatStudyHours', () => {
  it('returns minutes for values under 1 hour', () => {
    expect(formatStudyHours(0.5)).toBe('30m');
    expect(formatStudyHours(0.25)).toBe('15m');
  });

  it('returns hours-only when no remainder', () => {
    expect(formatStudyHours(2)).toBe('2h');
    expect(formatStudyHours(1)).toBe('1h');
  });

  it('returns hours and minutes for fractional hours', () => {
    expect(formatStudyHours(1.5)).toBe('1h 30m');
    expect(formatStudyHours(2.75)).toBe('2h 45m');
  });
});

describe('formatPercentage', () => {
  it('rounds to nearest integer', () => {
    expect(formatPercentage(66.6)).toBe('67%');
    expect(formatPercentage(50)).toBe('50%');
  });

  it('clamps to 0–100 range', () => {
    expect(formatPercentage(-10)).toBe('0%');
    expect(formatPercentage(110)).toBe('100%');
  });

  it('handles boundary values', () => {
    expect(formatPercentage(0)).toBe('0%');
    expect(formatPercentage(100)).toBe('100%');
  });
});

describe('formatScore', () => {
  it('formats score with percentage', () => {
    expect(formatScore(120, 200)).toBe('120/200 (60%)');
    expect(formatScore(200, 200)).toBe('200/200 (100%)');
  });

  it('returns 0% when total is 0', () => {
    expect(formatScore(0, 0)).toBe('0/0 (0%)');
  });

  it('rounds percentage correctly', () => {
    expect(formatScore(1, 3)).toBe('1/3 (33%)');
  });
});

describe('formatStreakDays', () => {
  it('English: singular day', () => {
    expect(formatStreakDays(1, 'en')).toBe('1 day');
  });

  it('English: plural days', () => {
    expect(formatStreakDays(7, 'en')).toBe('7 days');
    expect(formatStreakDays(0, 'en')).toBe('0 days');
  });

  it('Hindi formatting', () => {
    expect(formatStreakDays(5, 'hi')).toBe('5 दिन');
  });

  it('Tamil formatting', () => {
    expect(formatStreakDays(3, 'ta')).toBe('3 நாட்கள்');
  });

  it('Telugu formatting', () => {
    expect(formatStreakDays(10, 'te')).toBe('10 రోజులు');
  });

  it('Bengali formatting', () => {
    expect(formatStreakDays(2, 'bn')).toBe('2 দিন');
  });

  it('defaults to English for unknown language', () => {
    expect(formatStreakDays(5)).toBe('5 days');
  });
});

describe('truncate', () => {
  it('returns original string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates with ellipsis if over limit', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  it('truncates to 1 char plus ellipsis at very low limit', () => {
    expect(truncate('abcde', 2)).toBe('a…');
  });
});
