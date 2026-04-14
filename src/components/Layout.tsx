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
import NotificationCenter from './NotificationCenter';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import ErrorBoundary from './ErrorBoundary';
import AIAssistant from './AIAssistant';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
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
  const notifications = useAppStore(state => state.notifications);
  const addNotification = useAppStore(state => state.addNotification);

  useEffect(() => {
    // Add a mock review reminder if it doesn't exist
    const hasReminder = notifications.some(n => n.type === 'reminder');
    if (!hasReminder) {
      addNotification({
        title: 'Upcoming Review',
        message: 'You have 3 topics due for review today. Keep your mastery high!',
        type: 'reminder',
        link: '/review'
      });
    }
  }, []);

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
    <div className="flex h-[100dvh] bg-black text-zinc-50 overflow-hidden font-sans selection:bg-brand selection:text-white relative">
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
        "fixed inset-y-0 left-0 z-50 transition-all duration-500 ease-out border-r border-white/5",
        "bg-[#1C1C1E]/90 backdrop-blur-xl",
        isSidebarOpen ? "w-72" : "w-24",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-10 px-2">
            <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center shrink-0 shadow-sm">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-4 py-3 transition-all duration-200 group relative rounded-[14px]",
                    isActive 
                      ? "text-white bg-brand shadow-sm" 
                      : "text-[#8E8E93] hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive ? "scale-105" : "group-hover:scale-105"
                  )} />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[15px] font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/5 space-y-2 mt-4">
            {!user ? (
              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-4 px-4 py-3 text-brand hover:bg-brand/10 rounded-[14px] transition-all duration-200 group"
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[15px] font-semibold"
                  >
                    Sign In
                  </motion.span>
                )}
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-[14px] transition-all duration-200 group"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[15px] font-medium"
                  >
                    Sign Out
                  </motion.span>
                )}
              </button>
            )}
            
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full flex items-center gap-4 px-4 py-3 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-[14px] transition-all duration-200 group hidden md:flex"
            >
              <Menu className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-[15px] font-medium"
                >
                  Collapse
                </motion.span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center gap-4 px-4 py-3 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-[14px] transition-all duration-200 group md:hidden"
            >
              <X className="w-5 h-5" />
              <span className="text-[15px] font-medium">Close Menu</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "transition-all duration-500 ease-out h-[100dvh] overflow-y-auto flex-1 flex flex-col relative z-0 bg-black",
        isSidebarOpen ? "md:pl-72" : "md:pl-24"
      )}>
        {/* Top Navigation Bar */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4 md:gap-8 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2 text-[#8E8E93] hover:text-white transition-all hover:bg-white/10 rounded-full md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2 text-[#8E8E93] hover:text-white transition-all hover:bg-white/10 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => navigate(1)} className="p-2 text-[#8E8E93] hover:text-white transition-all hover:bg-white/10 rounded-full">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative hidden lg:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[400px] bg-[#1C1C1E] border-none py-2.5 pl-11 pr-4 text-[15px] text-white outline-none transition-all focus:bg-[#2C2C2E] placeholder:text-[#8E8E93] rounded-[12px] font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {!user ? (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-full font-semibold text-[15px] hover:opacity-90 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1C1E] rounded-full">
                <div className="w-2 h-2 bg-brand rounded-full" />
                <span className="text-[13px] font-medium text-[#8E8E93]">Synced</span>
              </div>
            )}
            
            {user && (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative p-2 text-[#8E8E93] hover:text-white transition-all hover:bg-white/10 rounded-full group"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF453A] border-2 border-black rounded-full" />
                  )}
                </button>

                <div className="text-right hidden xl:block">
                  <p className="text-[15px] font-semibold text-white">{user.displayName?.split(' ')[0]}</p>
                  <p className="text-[13px] text-[#8E8E93] font-medium">Level {userProfile?.level || 1}</p>
                </div>
                <div className="w-10 h-10 bg-[#1C1C1E] flex items-center justify-center overflow-hidden rounded-full hover:opacity-80 transition-all duration-200 cursor-pointer shadow-sm" onClick={() => navigate('/settings')}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5 text-[#8E8E93]" />
                  )}
                </div>
              </div>
            )}
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
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "pointer-events-auto px-4 py-3 rounded-[16px] shadow-lg flex items-center gap-3 min-w-[300px] backdrop-blur-xl",
                toast.type === 'success' ? "bg-[#1C1C1E]/90 text-white" :
                toast.type === 'error' ? "bg-[#1C1C1E]/90 text-[#FF453A]" :
                "bg-[#1C1C1E]/90 text-white"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                toast.type === 'success' ? "bg-[#32D74B]" :
                toast.type === 'error' ? "bg-[#FF453A]" :
                "bg-brand"
              )} />
              <div className="flex-1 text-[15px] font-medium">{toast.message}</div>
              <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4 text-[#8E8E93]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AIAssistant />
      <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <OverlayManager handleSaveLog={handleSaveLog} finishSession={finishSession} />
    </div>
  );
}
