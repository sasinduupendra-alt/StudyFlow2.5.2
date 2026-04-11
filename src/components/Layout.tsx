import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, Library, PlusSquare, Heart, 
  LayoutDashboard, Calendar, BarChart2, Settings, 
  Menu, X, Zap, LogIn, LogOut, User, Trophy, Sparkles,
  ChevronLeft, ChevronRight, Bell, Users, Clock, ListTodo,
  Shuffle, SkipBack, SkipForward, Repeat, Pause, Play, ListMusic, Volume2, Brain
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
    <div className="flex h-screen bg-surface text-white overflow-hidden font-mono selection:bg-brand selection:text-black">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-surface flex flex-col transition-transform duration-500 md:relative md:translate-x-0 border-r border-border-dim",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center gap-3">
          <Logo className="text-brand" size={32} />
          <h1 className="text-xl font-black tracking-tighter font-sans">StudyFlow</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3 font-black transition-all group relative overflow-hidden uppercase text-[10px] tracking-[0.2em]",
                isActive ? "text-brand bg-brand/5" : "text-gray-600 hover:text-white hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand shadow-[0_0_10px_var(--color-brand-glow)]" 
                    />
                  )}
                  <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive && "text-brand")} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          
          <div className="pt-8 pb-3 px-4">
            <p className="hud-label">System</p>
          </div>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/manage');
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-600 font-black hover:text-white hover:bg-white/5 transition-all group uppercase text-[10px] tracking-[0.2em]"
          >
            <PlusSquare className="w-4 h-4 group-hover:text-brand transition-colors" />
            <span>Create Session</span>
          </button>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/syllabus');
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-600 font-black hover:text-white hover:bg-white/5 transition-all group uppercase text-[10px] tracking-[0.2em]"
          >
            <Heart className="w-4 h-4 group-hover:text-brand transition-colors" />
            <span>Liked Topics</span>
          </button>

          <button 
            onClick={deferredPrompt ? handleInstallClick : () => addToast("To install, open the app in a new tab and use your browser's 'Add to Home Screen' option.", "info")}
            className="w-full flex items-center gap-4 px-4 py-3 text-brand font-black hover:bg-brand/10 transition-all group mt-4 border border-brand/10 uppercase text-[10px] tracking-[0.2em]"
          >
            <PlusSquare className="w-4 h-4" />
            <span>{deferredPrompt ? "Install App" : "How to Install"}</span>
          </button>
        </nav>

        <div className="p-4 border-t border-border-dim">
          {user ? (
            <div className="flex flex-col gap-4 p-5 bg-white/5 border border-border-dim relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-brand/20" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-brand/20" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-black shadow-[0_0_15px_rgba(29,185,84,0.1)]">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black truncate group-hover:text-brand transition-colors uppercase tracking-tight">{user.displayName || 'User'}</p>
                    <p className="hud-label !text-gray-500">LVL {userProfile?.level || 1}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              {/* XP Progress Bar */}
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                  <span>{userProfile?.xp || 0} XP</span>
                  <span>{userProfile?.xpToNextLevel || 1000} XP</span>
                </div>
                <div className="h-1 w-full bg-black border border-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)] transition-all duration-1000"
                    style={{ width: `${((userProfile?.xp || 0) / (userProfile?.xpToNextLevel || 1000)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLogin}
                className="scifi-button w-full"
              >
                <LogIn className="w-4 h-4" />
                LINK ACCOUNT
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface relative overflow-hidden">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 pointer-events-none tech-grid opacity-40" />
        <div className="absolute inset-0 pointer-events-none tech-grid-fine opacity-20" />
        <div className="scanline" />
        
        {/* Top Navigation Bar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border-dim">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-white transition-all border border-transparent hover:border-border-bright">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigate(1)} className="p-2 text-gray-500 hover:text-white transition-all border border-transparent hover:border-border-bright">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input 
                type="text" 
                placeholder="SYSTEM_SEARCH_INIT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 bg-white/5 border border-border-dim focus:border-brand/50 py-2 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:bg-white/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-1">
              <button className="p-2 text-gray-600 hover:text-brand transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand shadow-[0_0_5px_var(--color-brand-glow)]" />
              </button>
              <button className="p-2 text-gray-600 hover:text-brand transition-colors">
                <Users className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-white transition-colors border border-border-dim"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-[1px] h-6 bg-border-dim mx-2 hidden md:block" />
            <div className="hidden md:flex items-center gap-4 pl-2 group cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="text-right hidden xl:block">
                <p className="text-[11px] font-black group-hover:text-brand transition-colors uppercase tracking-tight">{user?.displayName?.split(' ')[0] || 'GUEST_01'}</p>
                <p className="hud-label !text-gray-600">AUTH_VERIFIED</p>
              </div>
              <div className="w-9 h-9 bg-white/5 border border-border-dim flex items-center justify-center overflow-hidden group-hover:border-brand/50 transition-all">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                ) : (
                  <User className="w-4 h-4 text-gray-600" />
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
              className="fixed bottom-0 left-0 right-0 z-[60] bg-surface border-t border-border-dim px-4 py-4 md:px-8"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
                <div className="flex items-center gap-5 min-w-0 flex-1 md:flex-none">
                  <div className="w-12 h-12 bg-white/5 border border-border-dim overflow-hidden shrink-0 relative group cursor-pointer" onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)}>
                    <img 
                      src={activeSubject?.image || `https://picsum.photos/seed/${activeSubject?.id}/100/100`} 
                      alt="" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ChevronRight className={cn("w-5 h-5 text-white transition-transform", isNowPlayingOpen ? "rotate-90" : "-rotate-90")} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-[11px] uppercase tracking-tight truncate hover:text-brand cursor-pointer">{activeSubject?.name}</h4>
                    <p className="hud-label !text-gray-600">ACTIVE_SESSION</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
                  <div className="flex items-center gap-8">
                    <button className="text-gray-600 hover:text-white transition-colors hidden sm:block"><Shuffle className="w-3.5 h-3.5" /></button>
                    <button className="text-gray-600 hover:text-white transition-colors"><SkipBack className="w-4 h-4 fill-current" /></button>
                    <button 
                      onClick={() => setIsPaused(!isPaused)}
                      className="w-10 h-10 bg-white text-black flex items-center justify-center hover:bg-brand transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                      style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)' }}
                    >
                      {!isPaused ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    <button className="text-gray-600 hover:text-white transition-colors"><SkipForward className="w-4 h-4 fill-current" /></button>
                    <button className="text-gray-600 hover:text-white transition-colors hidden sm:block"><Repeat className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="w-full flex items-center gap-3">
                    <span className="text-[9px] font-black text-gray-600 tabular-nums w-10 text-right tracking-widest">{formatTime(activeSession.elapsedSeconds)}</span>
                    <div className="flex-1 h-[2px] bg-white/5 relative group cursor-pointer">
                      <div className="absolute inset-0 bg-brand/10" />
                      <div className="h-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-gray-600 tabular-nums w-10 tracking-widest">{formatTime(activeSession.totalSeconds)}</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-end gap-4 min-w-[240px]">
                  <button onClick={() => setIsFocusMode(true)} className="p-2 text-gray-600 hover:text-brand transition-colors group relative">
                    <Zap className="w-4 h-4" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand text-black text-[8px] font-black px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest">HUD_FOCUS</span>
                  </button>
                  <button onClick={finishSession} className="p-2 text-gray-600 hover:text-white transition-colors group relative">
                    <Clock className="w-4 h-4" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-black px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest">TERM_SESSION</span>
                  </button>
                  <div className="w-[1px] h-4 bg-border-dim mx-1" />
                  <div className="flex items-center gap-3 w-28">
                    <Volume2 className="w-4 h-4 text-gray-600" />
                    <div className="flex-1 h-[2px] bg-white/5">
                      <div className="h-full bg-gray-500 w-2/3" />
                    </div>
                  </div>
                  <button onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <ChevronRight className={cn("w-4 h-4 transition-transform", isNowPlayingOpen ? "rotate-90" : "-rotate-90")} />
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
      <div className="fixed top-20 right-8 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 min-w-[300px]",
                toast.type === 'success' ? "bg-[#1DB954] text-black border-white/10" :
                toast.type === 'error' ? "bg-red-500 text-white border-white/10" :
                "bg-[#282828] text-white border-white/10"
              )}
            >
              <div className="flex-1 font-bold text-sm">{toast.message}</div>
              <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
