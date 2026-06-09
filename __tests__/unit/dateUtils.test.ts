import { daysBetween, isWithin48Hours, isScheduledForDate, addDays, getDayOfWeek } from '../../src/utils/dateUtils';

describe('daysBetween', () => {
  it('same date returns 0', () => {
    expect(daysBetween('2024-01-10', '2024-01-10')).toBe(0);
  });

  it('adjacent days return 1', () => {
    expect(daysBetween('2024-01-10', '2024-01-11')).toBe(1);
  });

  it('order does not matter (absolute)', () => {
    expect(daysBetween('2024-01-15', '2024-01-10')).toBe(5);
    expect(daysBetween('2024-01-10', '2024-01-15')).toBe(5);
  });

  it('across month boundary', () => {
    expect(daysBetween('2024-01-31', '2024-02-01')).toBe(1);
  });

  it('across year boundary', () => {
    expect(daysBetween('2023-12-31', '2024-01-01')).toBe(1);
  });

  it('leap year — Feb 28 to Mar 1 = 2 days in non-leap, 2 in leap', () => {
    // 2024 is leap year: Feb has 29 days
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    // 2023 is not leap
    expect(daysBetween('2023-02-28', '2023-03-01')).toBe(1);
  });

  it('returns 0 for invalid dates', () => {
    expect(daysBetween('invalid', '2024-01-01')).toBe(0);
  });
});

describe('isWithin48Hours', () => {
  it('same day returns true', () => {
    expect(isWithin48Hours('2024-01-10', '2024-01-10')).toBe(true);
  });

  it('gap of 1 day returns true', () => {
    expect(isWithin48Hours('2024-01-09', '2024-01-10')).toBe(true);
  });

  it('gap of 2 days returns false (> 48h)', () => {
    expect(isWithin48Hours('2024-01-08', '2024-01-10')).toBe(false);
  });
});

describe('addDays', () => {
  it('adds days correctly', () => {
    expect(addDays('2024-01-01', 5)).toBe('2024-01-06');
  });

  it('handles month rollover', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
  });

  it('handles year rollover', () => {
    expect(addDays('2023-12-31', 1)).toBe('2024-01-01');
  });
});

describe('getDayOfWeek', () => {
  it('returns correct day index (0=Sun)', () => {
    expect(getDayOfWeek('2024-01-07')).toBe(0); // Sunday
    expect(getDayOfWeek('2024-01-08')).toBe(1); // Monday
    expect(getDayOfWeek('2024-01-13')).toBe(6); // Saturday
  });
});

describe('isScheduledForDate', () => {
  it('"daily" frequency is always true', () => {
    expect(isScheduledForDate('daily', '2024-01-07')).toBe(true);
    expect(isScheduledForDate('daily', '2024-06-01')).toBe(true);
  });

  it('weekly with specific days — true on matching day', () => {
    // 2024-01-08 is Monday (index 1)
    expect(isScheduledForDate('weekly:1,3,5', '2024-01-08')).toBe(true);
  });

  it('weekly with specific days — false on non-matching day', () => {
    // 2024-01-09 is Tuesday (index 2) — not in 1,3,5
    expect(isScheduledForDate('weekly:1,3,5', '2024-01-09')).toBe(false);
  });

  it('monthly with specific day numbers — matches', () => {
    // 2024-01-15 is the 15th
    expect(isScheduledForDate('monthly:15,20', '2024-01-15')).toBe(true);
  });

  it('monthly with specific day numbers — no match', () => {
    expect(isScheduledForDate('monthly:15,20', '2024-01-16')).toBe(false);
  });

  it('unknown frequency defaults to true', () => {
    expect(isScheduledForDate('someUnknownFormat', '2024-01-01')).toBe(true);
  });
});

describe('getDayOfWeekName', () => {
  it('returns correct day name strings', () => {
    const { getDayOfWeekName } = require('../../src/utils/dateUtils');
    expect(getDayOfWeekName('2024-01-07')).toBe('sun');
    expect(getDayOfWeekName('2024-01-08')).toBe('mon');
    expect(getDayOfWeekName('2024-01-13')).toBe('sat');
  });
});

describe('getDateRangeIST', () => {
  it('returns array of dates inclusive of start and end', () => {
    const { getDateRangeIST } = require('../../src/utils/dateUtils');
    const range = getDateRangeIST('2024-01-01', '2024-01-05');
    expect(range).toEqual(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']);
  });

  it('returns single date when start equals end', () => {
    const { getDateRangeIST } = require('../../src/utils/dateUtils');
    expect(getDateRangeIST('2024-06-01', '2024-06-01')).toEqual(['2024-06-01']);
  });

  it('spans month boundary correctly', () => {
    const { getDateRangeIST } = require('../../src/utils/dateUtils');
    const range = getDateRangeIST('2024-01-30', '2024-02-02');
    expect(range).toEqual(['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']);
  });
});
