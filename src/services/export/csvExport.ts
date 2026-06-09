import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';
import { getLogsForExport } from '@services/db/analyticsRepo';

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportLogsToCSV(days = 90): Promise<void> {
  const rows = await getLogsForExport(days);

  const header = ['Date', 'Activity', 'Category', 'Duration (min)', 'Status'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [r.date, r.activity, r.category, r.duration, r.status]
        .map(escapeCSV)
        .join(',')
    ),
  ];

  const csv = lines.join('\n');
  const filename = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  const fileUri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  await Share.share({
    url: fileUri,        // iOS
    message: csv,       // Android fallback (text share)
    title: filename,
  });
}
