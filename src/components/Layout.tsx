import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, Library, PlusSquare, Heart, 
  LayoutDashboard, Calendar, BarChart2, Settings, 
  Menu, X, Zap, LogIn, LogOut, User, Trophy, Sparkles,
  ChevronLeft, ChevronRight, Bell, Users, Clock,
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
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: Brain, label: 'Practice', path: '/practice' },
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
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-[#1DB954] selection:text-black">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-black flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <Logo className="text-[#1DB954]" size={32} />
          <h1 className="text-xl font-black tracking-tighter">StudyFlow</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all group relative overflow-hidden",
                isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[#1DB954]" 
                    />
                  )}
                  <item.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isActive && "text-[#1DB954]")} />
                  <span className="tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          
          <div className="pt-8 pb-3 px-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Library</p>
          </div>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/manage');
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 font-bold hover:text-white hover:bg-white/5 rounded-xl transition-all group"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
              <PlusSquare className="w-4 h-4 text-white" />
            </div>
            <span className="tracking-wide">Create Session</span>
          </button>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/syllabus');
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 font-bold hover:text-white hover:bg-white/5 rounded-xl transition-all group"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-[#1DB954] to-emerald-900 rounded flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-[#1DB954]/20">
              <Heart className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="tracking-wide">Liked Topics</span>
          </button>

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center gap-4 px-4 py-3 text-[#1DB954] font-bold hover:bg-[#1DB954]/10 rounded-xl transition-all group mt-4 border border-[#1DB954]/20"
            >
              <div className="w-6 h-6 bg-[#1DB954] rounded flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-[#1DB954]/20">
                <PlusSquare className="w-4 h-4 text-black" />
              </div>
              <span className="tracking-wide">Download App</span>
            </button>
          )}
        </nav>

        <div className="p-4">
          {user ? (
            <div className="flex flex-col gap-3 p-3 bg-[#181818] border border-white/5 rounded-2xl hover:bg-[#282828] transition-colors group shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DB954] to-[#1ed760] flex items-center justify-center text-black font-bold shadow-inner">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-[#1DB954] transition-colors">{user.displayName || 'User'}</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Level {userProfile?.level || 1}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              {/* XP Progress Bar */}
              <div className="space-y-1.5 px-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>{userProfile?.xp || 0} XP</span>
                  <span>{userProfile?.xpToNextLevel || 1000} XP</span>
                </div>
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] rounded-full transition-all duration-500 relative"
                    style={{ width: `${((userProfile?.xp || 0) / (userProfile?.xpToNextLevel || 1000)) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {!user && (
                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl mb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Guest Account</p>
                      <p className="text-[10px] text-gray-500">Local progress only</p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-600 rounded-full"
                      style={{ width: `${((userProfile?.xp || 0) / (userProfile?.xpToNextLevel || 1000)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <button 
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black rounded-full font-black hover:scale-105 transition-all"
              >
                <LogIn className="w-5 h-5" />
                {!user ? 'Link Account' : 'Sign In'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#1a1a1a] to-[#121212] relative overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 bg-[#121212]/40 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2 bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => navigate(1)} className="p-2 bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="What do you want to study?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 md:w-80 bg-white/10 border border-transparent focus:border-white/20 rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white/20"
              />
            </div>

            {!user && isAuthReady && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Guest Mode: Local Save Only</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {!user && (
              <button 
                onClick={handleLogin}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1DB954] text-black rounded-full font-black text-xs hover:scale-105 transition-all shadow-lg shadow-[#1DB954]/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                SIGN IN TO SYNC
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#1DB954] rounded-full border-2 border-black" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="w-px h-6 bg-white/10 mx-2 hidden md:block" />
            <div className="hidden md:flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <span className="text-sm font-bold group-hover:text-[#1DB954] transition-colors">
                {user?.displayName?.split(' ')[0] || 'Guest'}
              </span>
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
              className="fixed bottom-0 left-0 right-0 z-[60] bg-black border-t border-white/10 px-4 py-3 md:px-6"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1 md:flex-none">
                  <div className="w-14 h-14 bg-white/5 rounded-lg overflow-hidden shrink-0 relative group cursor-pointer" onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)}>
                    <img 
                      src={activeSubject?.image || `https://picsum.photos/seed/${activeSubject?.id}/100/100`} 
                      alt="" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ChevronRight className={cn("w-6 h-6 text-white transition-transform", isNowPlayingOpen ? "rotate-90" : "-rotate-90")} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate hover:underline cursor-pointer">{activeSubject?.name}</h4>
                    <p className="text-xs text-gray-400 truncate">Deep Focus Session</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-1 flex-1 max-w-xl">
                  <div className="flex items-center gap-6">
                    <button className="text-gray-400 hover:text-white transition-colors hidden sm:block"><Shuffle className="w-4 h-4" /></button>
                    <button className="text-gray-400 hover:text-white transition-colors"><SkipBack className="w-5 h-5 fill-current" /></button>
                    <button 
                      onClick={() => setIsPaused(!isPaused)}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      {!isPaused ? <Pause className="w-5 h-5 text-black fill-current" /> : <Play className="w-5 h-5 text-black fill-current ml-0.5" />}
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors"><SkipForward className="w-5 h-5 fill-current" /></button>
                    <button className="text-gray-400 hover:text-white transition-colors hidden sm:block"><Repeat className="w-4 h-4" /></button>
                  </div>
                  <div className="w-full flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 tabular-nums w-8 text-right">{formatTime(activeSession.elapsedSeconds)}</span>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden group cursor-pointer">
                      <div className="h-full bg-white group-hover:bg-[#1DB954] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 tabular-nums w-8">{formatTime(activeSession.totalSeconds)}</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-end gap-3 min-w-[200px]">
                  <button onClick={() => setIsFocusMode(true)} className="p-2 text-gray-400 hover:text-[#1DB954] transition-colors group relative">
                    <Zap className="w-5 h-5" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">FOCUS MODE</span>
                  </button>
                  <button onClick={finishSession} className="p-2 text-gray-400 hover:text-white transition-colors group relative">
                    <Clock className="w-5 h-5" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">FINISH SESSION</span>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors"><ListMusic className="w-5 h-5" /></button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors"><Clock className="w-5 h-5" /></button>
                  <div className="flex items-center gap-2 w-24">
                    <Volume2 className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-2/3" />
                    </div>
                  </div>
                  <button onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className={cn("w-5 h-5 transition-transform", isNowPlayingOpen ? "rotate-90" : "-rotate-90")} />
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
