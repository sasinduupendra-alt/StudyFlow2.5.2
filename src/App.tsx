import React from 'react';
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
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { user, isAuthReady } = useAppStore();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="syllabus" element={<ProtectedRoute><Syllabus /></ProtectedRoute>} />
            <Route path="schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="manage" element={<ProtectedRoute><Manage /></ProtectedRoute>} />
            <Route path="weak-areas" element={<ProtectedRoute><WeakAreas /></ProtectedRoute>} />
            <Route path="achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="session/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
