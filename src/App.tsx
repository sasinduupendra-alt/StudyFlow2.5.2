import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Syllabus from './pages/Syllabus';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';
import Manage from './pages/Manage';
import WeakAreas from './pages/WeakAreas';
import Achievements from './pages/Achievements';
import SessionDetail from './pages/SessionDetail';
import Settings from './pages/Settings';
import Practice from './pages/Practice';
import Tasks from './pages/Tasks';
import Review from './pages/Review';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore } from './store/useAppStore';
import { INITIAL_TASKS } from './constants';
import { Task } from './types';
import { auth, onAuthStateChanged } from './firebase';

export default function App() {
  const { user, isAuthReady, setAuth, schedule, tasks, setTasks, resetToDefault } = useAppStore();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAuth(currentUser, true);
    });

    // Fallback: If auth doesn't respond in 6 seconds, force ready state
    const timeout = setTimeout(() => {
      if (!useAppStore.getState().isAuthReady) {
        console.warn('Auth initialization timed out, forcing ready state');
        useAppStore.getState().setAuth(null, true);
      }
    }, 6000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [setAuth]);

  // Migration: If user is on the old schedule, force reset to the new intensive plan
  // Also ensure new daily tasks are added
  useEffect(() => {
    if (isAuthReady) {
      // Check for old schedule description
      const firstMondayActivity = schedule.Monday?.[0]?.description;
      const isOldSchedule = firstMondayActivity === 'Deep Work: Pure Maths (core practice)';
      
      if (isOldSchedule) {
        console.log('StudyFlow: Old schedule detected, resetting to default...');
        resetToDefault();
      }

      // Check if new tasks are missing using a stable check
      const existingIds = new Set(tasks.map(t => t.id));
      const missingTasks = (INITIAL_TASKS as Task[]).filter(t => !existingIds.has(t.id));
      
      if (missingTasks.length > 0) {
        console.log('StudyFlow: Missing tasks detected, adding to store...');
        setTasks([...tasks, ...missingTasks]);
      }
    }
  }, [isAuthReady, schedule.Monday?.[0]?.description, tasks.length, setTasks, resetToDefault]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="syllabus" element={<ProtectedRoute><Syllabus /></ProtectedRoute>} />
            <Route path="schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
            <Route path="practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="manage" element={<ProtectedRoute><Manage /></ProtectedRoute>} />
            <Route path="weak-areas" element={<ProtectedRoute><WeakAreas /></ProtectedRoute>} />
            <Route path="achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="session/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
