export interface HealthSample {
  date: string;           // YYYY-MM-DD
  value: number;
  unit: string;
}

export interface HealthAdapter {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getSteps(startDate: string, endDate: string): Promise<HealthSample[]>;
  getActiveMinutes(startDate: string, endDate: string): Promise<HealthSample[]>;
  getMindfulMinutes(startDate: string, endDate: string): Promise<HealthSample[]>;
  writeWorkout(date: string, durationMinutes: number, calories?: number): Promise<void>;
}

export type HealthPlatform = 'apple_health' | 'google_fit' | 'none';

export interface HealthSyncResult {
  platform: HealthPlatform;
  synced: number;
  skipped: number;
  error?: string;
}
