import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task, Subject } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateSNR(task: Task, subject?: Subject) {
  const baseSNR = (task.impact || 5) / (task.effort || 5);
  
  // Urgency factor (Time decay/pressure)
  let urgencyFactor = 1;
  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) urgencyFactor = 2.5; // Overdue or due today
    else if (diffDays <= 2) urgencyFactor = 2.0;
    else if (diffDays <= 5) urgencyFactor = 1.5;
    else if (diffDays <= 10) urgencyFactor = 1.2;
  }

  // Subject priority factor (Strategic importance)
  let subjectFactor = 1;
  if (subject) {
    if (subject.status === 'Critical') subjectFactor = 1.6;
    else if (subject.status === 'Weak') subjectFactor = 1.3;
    else if (subject.status === 'Strong') subjectFactor = 0.9; // Focus on weak areas
  }

  // Frequency multiplier
  const frequencyFactor = task.frequency === 'Daily' ? 1.2 : 1.0;

  return baseSNR * urgencyFactor * subjectFactor * frequencyFactor;
}
