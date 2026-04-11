import { StateCreator } from 'zustand';
import { Task } from '../../types';
import { INITIAL_TASKS } from '../../constants';

export interface TaskSlice {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

export const createTaskSlice: StateCreator<TaskSlice> = (set) => ({
  tasks: INITIAL_TASKS as Task[],
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
});
