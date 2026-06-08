import { create } from 'zustand';
import type { Activity } from '@services/db/activitiesRepo';
import type { LogStatus } from '@services/db/logsRepo';

type TodayLogMap = Record<number, LogStatus>;

interface ActivitiesState {
  activities: Activity[];
  todayLogs: TodayLogMap;
  optimisticLogs: Set<number>; // activity IDs optimistically checked off
  setActivities: (activities: Activity[]) => void;
  setTodayLogs: (logs: TodayLogMap) => void;
  optimisticCheckOff: (activityId: number) => void;
  confirmCheckOff: (activityId: number) => void;
  revertCheckOff: (activityId: number) => void;
  optimisticUndo: (activityId: number) => void;
  confirmUndo: (activityId: number) => void;
  isCheckedOff: (activityId: number) => boolean;
  addActivity: (activity: Activity) => void;
  removeActivity: (activityId: number) => void;
  updateActivity: (activity: Activity) => void;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  todayLogs: {},
  optimisticLogs: new Set(),

  setActivities: (activities) => set({ activities }),

  setTodayLogs: (logs) => set({ todayLogs: logs }),

  // Called synchronously on button press — updates UI immediately
  optimisticCheckOff: (activityId) => {
    set((state) => {
      const optimisticLogs = new Set(state.optimisticLogs);
      optimisticLogs.add(activityId);
      return { optimisticLogs };
    });
  },

  // Called after SQLite write succeeds — moves from optimistic to confirmed
  confirmCheckOff: (activityId) => {
    set((state) => {
      const optimisticLogs = new Set(state.optimisticLogs);
      optimisticLogs.delete(activityId);
      return {
        optimisticLogs,
        todayLogs: { ...state.todayLogs, [activityId]: 'completed' },
      };
    });
  },

  // Called if SQLite write fails — reverts the optimistic update
  revertCheckOff: (activityId) => {
    set((state) => {
      const optimisticLogs = new Set(state.optimisticLogs);
      optimisticLogs.delete(activityId);
      const todayLogs = { ...state.todayLogs };
      delete todayLogs[activityId];
      return { optimisticLogs, todayLogs };
    });
  },

  // Optimistically remove the check-off (undo)
  optimisticUndo: (activityId) => {
    set((state) => {
      const todayLogs = { ...state.todayLogs };
      delete todayLogs[activityId];
      return { todayLogs };
    });
  },

  // Confirm undo after SQLite delete succeeds
  confirmUndo: (_activityId) => {
    // Already done in optimisticUndo; nothing more to do
  },

  isCheckedOff: (activityId) => {
    const state = get();
    return (
      state.optimisticLogs.has(activityId) ||
      state.todayLogs[activityId] === 'completed'
    );
  },

  addActivity: (activity) => {
    set((state) => ({ activities: [...state.activities, activity] }));
  },

  removeActivity: (activityId) => {
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== activityId),
    }));
  },

  updateActivity: (activity) => {
    set((state) => ({
      activities: state.activities.map((a) => (a.id === activity.id ? activity : a)),
    }));
  },
}));
