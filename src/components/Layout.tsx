import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, Library, PlusSquare, Heart, 
  LayoutDashboard, Calendar, BarChart2, Settings, 
  Menu, X, Zap, LogIn, LogOut, User, Trophy, Sparkles,
  ChevronLeft, ChevronRight, Bell, Users, Clock, ListTodo,
  Shuffle, SkipBack, SkipForward, Repeat, Pause, Play, ListMusic, Volume2, Brain, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import Logo from './Logo';
import NowPlayingSidebar from './NowPlayingSidebar';
import FocusMode from './FocusMode';
import StudyLogForm from './StudyLogForm';
import { auth, googleProvider, signInWithPopup, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, updateDoc } from 'firebase/firestore';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Sync Firestore data when user is logged in
  useFirestoreSync();

  const { 
    user, 
    setUser, 
    isFocusMode, 
    setIsFocusMode, 
    isNowPlayingOpen, 
    setIsNowPlayingOpen,
    activeSession,
    setIsPaused,
    isPaused,
    subjects,
    isAuthReady,
    setIsAuthReady,
    setAuth,
    searchQuery,
    setSearchQuery,
    toasts,
    removeToast,
    tickActiveSession,
    setActiveSession,
    addToast,
    userProfile,
    setUserProfile,
    studyLogs,
    setStudyLogs
  } = useAppStore();

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && !isPaused) {
      interval = setInterval(() => {
        tickActiveSession();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, isPaused, tickActiveSession]);

  // Handle session completion
  useEffect(() => {
    if (activeSession && activeSession.elapsedSeconds >= activeSession.totalSeconds) {
      setIsPaused(true);
      setIsFocusMode(false);
      setIsNowPlayingOpen(true);
      addToast('Focus session complete! Time to log your progress.', 'success');
    }
  }, [activeSession?.elapsedSeconds, activeSession?.totalSeconds, setIsPaused, setIsFocusMode, setIsNowPlayingOpen, addToast]);

  const handleSaveLog = async (log: { subjectId: string, topicId: string, duration: number, focusLevel: number, notes: string }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLog = {
      ...log,
      id,
      timestamp: new Date().toISOString()
    };

    // Update local logs
    setStudyLogs([...studyLogs, newLog]);

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

  const signInInProgress = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setAuth(null, true);
      } else {
        setAuth(currentUser, true);
      }
    });
    return () => unsubscribe();
  }, [setAuth]);

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
  const progress = activeSession ? (activeSession.elapsedSeconds / activeSession.totalSeconds) * 100 : 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-surface text-zinc-50 overflow-hidden font-sans selection:bg-brand selection:text-white">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-black flex flex-col transition-transform duration-500 md:relative md:translate-x-0 border-r border-white/10",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-transparent border border-white/30 flex items-center justify-center">
            <Brain className="text-white w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-white">StudyFlow</h1>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          <div className="px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">Main Menu</p>
          </div>
          {navItems.slice(0, 6).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3.5 text-xs font-bold uppercase tracking-widest transition-all group relative overflow-hidden",
                isActive 
                  ? "text-black bg-white" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-4 h-4 transition-colors relative z-10", isActive ? "text-black" : "text-zinc-600 group-hover:text-white")} />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          
          <div className="px-4 py-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">Insights & Tools</p>
          </div>
          {navItems.slice(6).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3.5 text-xs font-bold uppercase tracking-widest transition-all group relative overflow-hidden",
                isActive 
                  ? "text-black bg-white" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-4 h-4 transition-colors relative z-10", isActive ? "text-black" : "text-zinc-600 group-hover:text-white")} />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 space-y-6">
          {user ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover grayscale" />
                    ) : (
                      user.displayName?.[0] || user.email?.[0] || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white uppercase tracking-widest truncate">{user.displayName || 'User'}</p>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Level {userProfile?.level || 1}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-zinc-600 hover:text-white transition-colors hover:bg-white/10">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              <div className="px-2 space-y-2">
                <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
                  <span>XP Progress</span>
                  <span className="text-zinc-400">{Math.round(((userProfile?.xp || 0) / (userProfile?.xpToNextLevel || 1000)) * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-zinc-900 overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((userProfile?.xp || 0) / (userProfile?.xpToNextLevel || 1000)) * 100}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="w-full py-3.5 bg-transparent border border-white/20 text-white font-mono uppercase tracking-widest hover:bg-white/10 hover:border-white transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-black relative overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-24 flex items-center justify-between px-10 sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-3 text-zinc-500 hover:text-white transition-all hover:bg-white/5 border border-transparent hover:border-white/10">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => navigate(1)} className="p-3 text-zinc-500 hover:text-white transition-all hover:bg-white/5 border border-transparent hover:border-white/10">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative hidden lg:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources, topics, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[480px] bg-transparent border border-white/10 focus:border-white/50 py-3.5 pl-12 pr-6 text-sm text-white outline-none transition-all focus:bg-white/5 placeholder:text-zinc-700 font-mono uppercase tracking-wider"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-3 text-zinc-500 hover:text-white transition-colors relative hover:bg-white/5 border border-transparent hover:border-white/10 group">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-white border-2 border-black" />
              </button>
              <button className="p-3 text-zinc-500 hover:text-white transition-colors hover:bg-white/5 border border-transparent hover:border-white/10 group">
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 text-zinc-500 hover:text-white transition-colors border border-white/10 bg-transparent"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="w-[1px] h-8 bg-white/10 mx-2 hidden md:block" />
            <div className="hidden md:flex items-center gap-4 pl-2 group cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="text-right hidden xl:block">
                <p className="text-xs font-bold text-white uppercase tracking-widest group-hover:text-zinc-300 transition-colors">{user?.displayName?.split(' ')[0] || 'Guest'}</p>
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Pro Member</p>
              </div>
              <div className="w-11 h-11 bg-transparent border border-white/20 flex items-center justify-center overflow-hidden group-hover:border-white/50 transition-all">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover grayscale" />
                ) : (
                  <User className="w-5 h-5 text-zinc-600" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
          <ErrorBoundary fullScreen={false}>
            <Outlet />
          </ErrorBoundary>
        </div>

        {/* Global Player / Focus Bar */}
        <AnimatePresence>
          {activeSession && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-4rem)] max-w-6xl"
            >
              <div className="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-none px-10 py-6 shadow-2xl shadow-black/80 flex items-center justify-between gap-12">
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-16 h-16 bg-transparent border border-white/20 overflow-hidden shrink-0 relative group cursor-pointer" onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)}>
                    <img 
                      src={activeSubject?.image || `https://picsum.photos/seed/${activeSubject?.id}/100/100`} 
                      alt="" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 grayscale"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ChevronRight className={cn("w-6 h-6 text-white transition-transform duration-500", isNowPlayingOpen ? "rotate-90" : "-rotate-90")} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-lg text-white uppercase tracking-widest truncate hover:text-zinc-300 cursor-pointer transition-colors">{activeSubject?.name}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-2 px-2.5 py-0.5 border border-white/20 rounded-none">
                        <div className="w-1.5 h-1.5 bg-white animate-pulse" />
                        <span className="text-[10px] font-mono text-white uppercase tracking-widest">Active Session</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-500 tabular-nums">{formatTime(activeSession.elapsedSeconds)} / {formatTime(activeSession.totalSeconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-xl px-10">
                  <div className="h-1 w-full bg-zinc-900 overflow-hidden border border-white/10">
                    <motion.div 
                      className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-14 h-14 rounded-none bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </button>
                  <button 
                    onClick={() => setActiveSession(null)}
                    className="w-14 h-14 rounded-none bg-transparent border border-white/20 text-zinc-400 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all group"
                  >
                    <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Right Sidebar - Now Playing */}
      <AnimatePresence>
        {isNowPlayingOpen && activeSession && (
          <NowPlayingSidebar 
            currentSubject={activeSubject?.name || ''}
            currentSubjectImage={activeSubject?.image}
            progress={progress}
            timeElapsed={formatTime(activeSession.elapsedSeconds)}
            totalTime={formatTime(activeSession.totalSeconds)}
            onClose={() => setIsNowPlayingOpen(false)}
            onToggleFocus={() => setIsFocusMode(true)}
            isPlaying={!isPaused}
            onTogglePlay={() => setIsPaused(!isPaused)}
          />
        )}
      </AnimatePresence>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && activeSession && activeSubject && (
          <FocusMode 
            subject={activeSubject}
            session={activeSession}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            onExit={() => setIsFocusMode(false)}
            onFinish={finishSession}
          />
        )}
      </AnimatePresence>

      {/* Study Log Form */}
      <AnimatePresence>
        {activeSession && activeSession.elapsedSeconds >= activeSession.totalSeconds && (
          <StudyLogForm 
            subjects={subjects}
            initialData={{
              subjectId: activeSession.subjectId,
              topicId: activeSession.topicId,
              duration: Math.floor(activeSession.elapsedSeconds / 60)
            }}
            onSave={handleSaveLog}
            onClose={() => setActiveSession(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
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
    </div>
  );
}
