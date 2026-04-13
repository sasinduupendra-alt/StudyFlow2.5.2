import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, Library, PlusSquare, Heart, 
  LayoutDashboard, Calendar, BarChart2, Settings, 
  Menu, X, Zap, LogIn, LogOut, User, Trophy, Sparkles,
  ChevronLeft, ChevronRight, Bell, Users, Clock, ListTodo,
  Shuffle, SkipBack, SkipForward, Repeat, Pause, Play, ListMusic, Volume2, Brain, Square, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import Logo from './Logo';
import NowPlayingSidebar from './NowPlayingSidebar';
import { auth, googleProvider, signInWithPopup, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, updateDoc } from 'firebase/firestore';
import ActiveSessionBar from './ActiveSessionBar';
import OverlayManager from './OverlayManager';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import ErrorBoundary from './ErrorBoundary';
import AIAssistant from './AIAssistant';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Sync Firestore data when user is logged in
  useFirestoreSync();

  const user = useAppStore(state => state.user);
  const isFocusMode = useAppStore(state => state.isFocusMode);
  const setIsFocusMode = useAppStore(state => state.setIsFocusMode);
  const isNowPlayingOpen = useAppStore(state => state.isNowPlayingOpen);
  const setIsNowPlayingOpen = useAppStore(state => state.setIsNowPlayingOpen);
  const activeSession = useAppStore(state => state.activeSession);
  const setIsPaused = useAppStore(state => state.setIsPaused);
  const isPaused = useAppStore(state => state.isPaused);
  const subjects = useAppStore(state => state.subjects);
  const searchQuery = useAppStore(state => state.searchQuery);
  const setSearchQuery = useAppStore(state => state.setSearchQuery);
  const toasts = useAppStore(state => state.toasts);
  const removeToast = useAppStore(state => state.removeToast);
  const setActiveSession = useAppStore(state => state.setActiveSession);
  const addToast = useAppStore(state => state.addToast);
  const userProfile = useAppStore(state => state.userProfile);
  const setUserProfile = useAppStore(state => state.setUserProfile);
  const studyLogs = useAppStore(state => state.studyLogs);
  const setStudyLogs = useAppStore(state => state.setStudyLogs);

  const updateTopicSRS = useAppStore(state => state.updateTopicSRS);

  const handleSaveLog = async (log: { subjectId: string, topicIds: string[], duration: number, focusLevel: number, notes: string, sessionType: 'self-study' | 'tuition' | 'exam' }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLog = {
      ...log,
      id,
      timestamp: new Date().toISOString()
    };

    // Update local logs
    setStudyLogs([...studyLogs, newLog]);

    // Update SRS for all covered topics
    if (log.topicIds && log.topicIds.length > 0) {
      log.topicIds.forEach(topicId => {
        // Performance is based on focus level (1-5)
        updateTopicSRS(log.subjectId, topicId, log.focusLevel);
      });
    }

    // Calculate XP and update profile
    const xpEarned = log.duration * log.focusLevel * 10;
    let currentXp = (userProfile.xp || 0) + xpEarned;
    let currentLevel = userProfile.level || 1;
    let xpToNextLevel = userProfile.xpToNextLevel || 1000;

    while (currentXp >= xpToNextLevel) {
      currentXp -= xpToNextLevel;
      currentLevel += 1;
      xpToNextLevel = currentLevel * 1000;
      addToast(`Level Up! You are now Level ${currentLevel}!`, 'success');
    }

    // Streak Calculation
    const today = new Date().toISOString().split('T')[0];
    let newStreak = userProfile.streak || 0;
    let lastStudyDate = (userProfile as any).lastStudyDate;

    if (lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastStudyDate === yesterdayStr) {
        newStreak += 1; // Studied yesterday, increment streak
        addToast(`Streak increased to ${newStreak} days! 🔥`, 'success');
      } else {
        newStreak = 1; // Missed a day, reset streak
        if (lastStudyDate) {
           addToast(`Streak reset to 1. Keep it going!`, 'info');
        }
      }
      lastStudyDate = today;
    }

    const updatedProfile = {
      ...userProfile,
      xp: currentXp,
      level: currentLevel,
      xpToNextLevel,
      streak: newStreak,
      lastStudyDate: lastStudyDate,
      totalSessions: (userProfile.totalSessions || 0) + 1,
      totalStudyTime: (userProfile.totalStudyTime || 0) + log.duration
    };

    setUserProfile(updatedProfile);
    addToast(`Study session logged! +${xpEarned} XP`, 'success');
    setActiveSession(null);

    // Update Firestore if logged in
    if (user) {
      try {
        await setDoc(doc(collection(db, 'users', user.uid, 'study_logs'), id), newLog);
        await updateDoc(doc(db, 'users', user.uid), updatedProfile as any);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/study_logs/${id}`);
      }
    }
  };

  const finishSession = () => {
    if (!activeSession) return;
    // Set elapsed to total to trigger the log form
    setActiveSession({
      ...activeSession,
      elapsedSeconds: activeSession.totalSeconds
    });
    setIsFocusMode(false);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutDashboard, label: 'Syllabus', path: '/syllabus' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: ListTodo, label: 'Tasks', path: '/tasks' },
    { icon: Brain, label: 'Review', path: '/review' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: Zap, label: 'Practice', path: '/practice' },
    { icon: Sparkles, label: 'Weak Areas', path: '/weak-areas' },
    { icon: Trophy, label: 'Achievements', path: '/achievements' },
    { icon: PlusSquare, label: 'Manage', path: '/manage' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const activeSubject = subjects.find(s => s.id === activeSession?.subjectId);

  return (
    <div className="flex h-[100dvh] bg-surface text-zinc-50 overflow-hidden font-sans selection:bg-brand selection:text-white relative">
      {/* Neural Background Elements */}
      <div className="neural-field">
        <div className="neural-grid" />
        <div className="neural-orb w-[600px] h-[600px] -top-48 -left-48 bg-white/5" />
        <div className="neural-orb w-[400px] h-[400px] bottom-0 right-0 bg-white/5" />
        <div className="scan-line" />
      </div>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[48] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 transition-all duration-700 ease-expo border-r border-white/10",
        "bg-[#1c1c1e]/60 backdrop-blur-3xl",
        isSidebarOpen ? "w-72" : "w-24",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-12 px-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <Logo className="w-6 h-6 text-black" />
            </div>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  key="sidebar-logo-text"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-xl font-bold tracking-tight leading-none">StudyFlow</h1>
                  <p className="text-[10px] font-medium text-zinc-400 mt-1">Neural Interface</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-4 py-3.5 transition-all duration-300 group relative rounded-2xl border",
                    isActive 
                      ? "text-brand bg-brand/10 shadow-[0_0_15px_var(--color-brand-dim)] border-brand/20" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "scale-105 text-brand" : "group-hover:scale-105 group-hover:text-white"
                  )} />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[13px] font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10 space-y-2 mt-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-300 group hidden md:flex"
            >
              <Menu className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-[13px] font-medium"
                >
                  Collapse
                </motion.span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-300 group md:hidden"
            >
              <X className="w-5 h-5" />
              <span className="text-[13px] font-medium">Close Menu</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "transition-all duration-700 ease-expo h-[100dvh] overflow-y-auto flex-1 flex flex-col relative z-0",
        isSidebarOpen ? "md:pl-72" : "md:pl-24"
      )}>
        {/* Top Navigation Bar */}
        <header className="h-24 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 bg-black/40 backdrop-blur-3xl border-b border-white/5">
          <div className="flex items-center gap-4 md:gap-8 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2.5 text-zinc-400 hover:text-white transition-all hover:bg-white/10 rounded-full md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2.5 text-zinc-400 hover:text-white transition-all hover:bg-white/10 rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => navigate(1)} className="p-2.5 text-zinc-400 hover:text-white transition-all hover:bg-white/10 rounded-full">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative hidden lg:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search Neural Database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[480px] bg-white/5 border border-white/10 focus:border-white/30 py-3 pl-12 pr-6 text-sm text-white outline-none transition-all focus:bg-white/10 placeholder:text-zinc-500 rounded-full font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-brand/5 border border-brand/20 rounded-full">
              <div className="w-2 h-2 bg-brand rounded-full shadow-[0_0_8px_var(--color-brand-glow)]" />
              <span className="text-[11px] font-medium text-brand">Sync: Active</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-semibold text-white">{user?.displayName?.split(' ')[0] || 'Guest'}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Level {userProfile?.level || 1}</p>
              </div>
              <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden rounded-full hover:border-white/40 transition-all duration-300 cursor-pointer shadow-sm" onClick={() => navigate('/settings')}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-5 h-5 text-zinc-400" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 relative">
          <ErrorBoundary fullScreen={false}>
            <div className="p-0">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>

        {/* Global Player / Focus Bar */}
        <AnimatePresence>
          <ActiveSessionBar />
        </AnimatePresence>

        <OverlayManager handleSaveLog={handleSaveLog} finishSession={finishSession} />
      </main>

      {/* Right Sidebar - Now Playing */}
      <AnimatePresence>
        {isNowPlayingOpen && activeSession && (
          <NowPlayingSidebar 
            key="now-playing-sidebar"
            onClose={() => setIsNowPlayingOpen(false)}
            onToggleFocus={() => setIsFocusMode(true)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-10 right-24 z-[100] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={cn(
                "pointer-events-auto px-6 py-4 rounded-none shadow-2xl border flex items-center gap-5 min-w-[360px] backdrop-blur-xl",
                toast.type === 'success' ? "bg-black/90 text-white border-white/20" :
                toast.type === 'error' ? "bg-black/90 text-red-500 border-red-500/30" :
                "bg-black/90 text-white border-white/20"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-none shrink-0 shadow-lg",
                toast.type === 'success' ? "bg-white shadow-white/50" :
                toast.type === 'error' ? "bg-red-500 shadow-red-500/50" :
                "bg-white shadow-white/50"
              )} />
              <div className="flex-1 font-mono text-xs uppercase tracking-widest">{toast.message}</div>
              <button onClick={() => removeToast(toast.id)} className="p-1.5 hover:bg-white/10 rounded-none transition-colors border border-transparent hover:border-white/20">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AIAssistant />
    </div>
  );
}
