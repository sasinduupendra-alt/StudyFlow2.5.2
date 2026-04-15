import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task, Subject } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateSNR(task: Task, subject?: Subject) {
  // 80/20 ratio: Impact is weighted at 80%, Effort at 20%
  const signal = (task.impact || 5) * 0.8;
  const noise = (task.effort || 5) * 0.2;
  const baseSNR = signal / noise;
  
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

  // Recency of last review (Spaced Repetition)
  let recencyFactor = 1;
  if (task.lastReviewed) {
    const lastReview = new Date(task.lastReviewed);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    
    // The longer it's been since the last review, the higher the priority (SNR)
    if (diffDays > 30) recencyFactor = 1.5;
    else if (diffDays > 14) recencyFactor = 1.3;
    else if (diffDays > 7) recencyFactor = 1.1;
    else if (diffDays <= 2) recencyFactor = 0.8; // Recently reviewed, lower priority
  }

  // Difficulty level (Practice tasks)
  let difficultyFactor = 1;
  if (task.difficulty) {
    // Higher difficulty means higher priority (more signal needed to overcome it)
    if (task.difficulty >= 8) difficultyFactor = 1.3;
    else if (task.difficulty >= 4) difficultyFactor = 1.1;
    else difficultyFactor = 0.9;
  }

  return baseSNR * urgencyFactor * subjectFactor * frequencyFactor * recencyFactor * difficultyFactor;
}

export const classifyEvent = (title: string) => {
  const t = title.toLowerCase();
  
  if (t.includes('math') || t.includes('pure') || t.includes('applied') || t.includes('integration')) {
    return { subject: 'Combined Maths', color: '#3b82f6' }; // Blue
  }
  if (t.includes('phys') || t.includes('mechanics') || t.includes('waves') || t.includes('light')) {
    return { subject: 'Physics', color: '#ef4444' }; // Red
  }
  if (t.includes('chem') || t.includes('organic') || t.includes('inorganic') || t.includes('equil')) {
    return { subject: 'Chemistry', color: '#10b981' }; // Green
  }
  
  return { subject: 'General Study', color: '#6b7280' }; // Gray
};

export const processCalendarEvent = (event: any) => {
  const classification = classifyEvent(event.summary);
  const isTuition = event.summary.toLowerCase().includes('tuition') || event.summary.toLowerCase().includes('class');
  const focusMode = event.summary.toLowerCase().includes('past paper') || event.summary.toLowerCase().includes('deep work');
  
  // Determine priority based on day of week
  const date = new Date(event.start.dateTime || event.start.date);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  let priority = 'Medium';
  
  if ((day === 1 || day === 3) && classification.subject === 'Chemistry') {
    priority = 'High';
  } else if ((day === 2 || day === 4) && classification.subject === 'Physics') {
    priority = 'High';
  } else if ((day === 5 || day === 6 || day === 0) && classification.subject === 'Combined Maths') {
    priority = 'High';
  }

  return {
    title: event.summary,
    start: event.start.dateTime || event.start.date,
    subject: classification.subject,
    themeColor: classification.color,
    isTuition,
    focusMode,
    priority,
    description: event.description || `Focus on ${classification.subject} theory.`
  };
};
