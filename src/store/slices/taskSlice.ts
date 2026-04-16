import { StateCreator } from 'zustand';
import { Task, NoiseLog } from '../../types';
import { INITIAL_TASKS } from '../../constants';

export interface TaskSlice {
  tasks: Task[];
  dailyCommits: string[]; // Task IDs
  noiseLogs: NoiseLog[];
  isDailyCommitDone: boolean;
  lastCommitDate?: string;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  resetDailyTasks: (todayStr: string) => void;
  setDailyCommits: (taskIds: string[]) => void;
  addNoiseLog: (source: string) => void;
  setDailyCommitDone: (done: boolean, date: string) => void;
}

export const createTaskSlice: StateCreator<TaskSlice> = (set) => ({
  tasks: INITIAL_TASKS as Task[],
  dailyCommits: [],
  noiseLogs: [],
  isDailyCommitDone: false,
  lastCommitDate: undefined,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id)
  })),
  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  })),
  resetDailyTasks: (todayStr) => set((state) => ({
    tasks: state.tasks.map((t) => 
      t.frequency === 'Daily' && (!t.dueDate || t.dueDate < todayStr)
        ? { ...t, completed: false, dueDate: todayStr }
        : t
    ),
    isDailyCommitDone: state.lastCommitDate === todayStr,
  })),
  setDailyCommits: (taskIds) => set({ dailyCommits: taskIds }),
  addNoiseLog: (source) => set((state) => ({
    noiseLogs: [...state.noiseLogs, {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      source
    }]
  })),
  setDailyCommitDone: (done, date) => set({ isDailyCommitDone: done, lastCommitDate: date }),
});
