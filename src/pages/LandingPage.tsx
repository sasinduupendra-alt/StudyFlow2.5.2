import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, Brain, Target, Flame, Trophy, Sparkles, 
  ArrowRight, CheckCircle2, BarChart2, Calendar, 
  Clock, Shield, Globe, Rocket, BookOpen, LogIn,
  Cpu, Activity, Gauge, Layers
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import Logo from '../components/Logo';

export default function LandingPage() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const features = [
    {
      icon: Cpu,
      title: "Neural Optimization",
      description: "Engineered algorithms that analyze cognitive load to dynamically adjust your learning trajectory.",
      color: "text-brand"
    },
    {
      icon: Activity,
      title: "Flow State Protocol",
      description: "High-fidelity focus environments designed to eliminate cognitive friction and maximize output.",
      color: "text-[#FF9F0A]"
    },
    {
      icon: Gauge,
      title: "Precision Execution",
      description: "Adaptive scheduling logic that synchronizes with your peak performance windows.",
      color: "text-[#32D74B]"
    },
    {
      icon: Layers,
      title: "Advanced Telemetry",
      description: "Comprehensive data visualization of your academic performance and knowledge retention.",
      color: "text-[#5E5CE6]"
    }
  ];

  const stats = [
    { label: "Active Nodes", value: "10K+" },
    { label: "Cycles Completed", value: "500K+" },
    { label: "Efficiency Gain", value: "40%" },
    { label: "Data Integrity", value: "99.9%" }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand selection:text-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 text-brand" size={40} />
            <span className="text-xl font-bold tracking-tighter uppercase font-mono">StudyFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-bold uppercase tracking-widest text-[#8E8E93] hover:text-white transition-colors">Systems</a>
            <a href="#stats" className="text-xs font-bold uppercase tracking-widest text-[#8E8E93] hover:text-white transition-colors">Telemetry</a>
            <button 
              onClick={handleLogin}
              className="px-6 py-2 bg-brand text-white rounded-none font-bold text-xs uppercase tracking-widest hover:bg-brand/90 transition-all active:scale-95 flex items-center gap-2 border border-brand/50"
            >
              <LogIn className="w-3.5 h-3.5" />
              Initialize
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        {/* Technical Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand/5 rounded-full blur-[120px]" />
          <img 
            src="https://picsum.photos/seed/neural-flow/1920/1080?grayscale&blur=10" 
            className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale"
            alt=""
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 rounded-none border border-brand/30 mb-10">
              <div className="w-1.5 h-1.5 bg-brand animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand">System Status: Operational</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase italic">
              Engineered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-[#5E5CE6]">Performance.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#8E8E93] max-w-2xl mx-auto mb-14 leading-relaxed font-medium font-mono uppercase tracking-tight">
              The high-performance study environment for the next generation of scholars. Optimize output. Eliminate friction.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleLogin}
                className="w-full sm:w-auto px-12 py-5 bg-brand text-white rounded-none font-black text-sm uppercase tracking-[0.2em] hover:bg-brand/90 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(10,132,255,0.3)]"
              >
                Launch System
                <ArrowRight className="w-5 h-5" />
              </button>
              <a 
                href="#features"
                className="w-full sm:w-auto px-12 py-5 bg-transparent text-white rounded-none font-black text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-all active:scale-95 border border-white/20 flex items-center justify-center gap-3"
              >
                View Specs
              </a>
            </div>
          </motion.div>

          {/* Technical App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "circOut" }}
            className="mt-32 relative mx-auto max-w-6xl"
          >
            <div className="relative rounded-none overflow-hidden border border-white/10 bg-[#0A0A0A] p-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
              <div className="relative bg-[#1C1C1E] overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/studyflow-interface/1920/1080?grayscale" 
                  alt="StudyFlow Interface" 
                  className="w-full h-auto opacity-60 grayscale"
                  referrerPolicy="no-referrer"
                />
                
                {/* Technical Overlays */}
                <div className="absolute top-8 left-8 p-4 bg-black/80 backdrop-blur-md border border-brand/30 rounded-none hidden lg:block font-mono">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-4 h-4 text-brand" />
                    <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Real-time Telemetry</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-32 h-1 bg-white/5 rounded-none overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                        className="h-full bg-brand" 
                      />
                    </div>
                    <p className="text-[10px] text-white/50">CPU LOAD: 42%</p>
                  </div>
                </div>

                <div className="absolute bottom-8 right-8 p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-none hidden lg:block font-mono">
                  <div className="flex items-center gap-3 mb-2">
                    <Gauge className="w-4 h-4 text-[#32D74B]" />
                    <span className="text-[10px] font-bold text-[#32D74B] uppercase tracking-widest">Mastery Index</span>
                  </div>
                  <p className="text-2xl font-black text-white">0.882</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 border-y border-white/10 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,132,255,0.05)_0,transparent_70%)]" />
        <img 
          src="https://picsum.photos/seed/data-stream/1920/400?grayscale&blur=5" 
          className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="group">
                <p className="text-5xl md:text-6xl font-black mb-3 tracking-tighter group-hover:text-brand transition-colors">{stat.value}</p>
                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.3em] font-mono">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-40 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 uppercase italic">Core Systems.</h2>
              <p className="text-[#8E8E93] text-lg font-mono uppercase tracking-tight">Integrated protocols for maximum academic efficiency.</p>
            </div>
            <div className="h-[1px] flex-1 bg-white/10 mb-4 hidden md:block mx-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="p-16 bg-black hover:bg-[#0A0A0A] transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity">
                  <img 
                    src={`https://picsum.photos/seed/tech-${idx}/800/600?grayscale`} 
                    className="w-full h-full object-cover"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <feature.icon className="w-32 h-32" />
                </div>
                <div className={`w-12 h-12 rounded-none bg-white/5 flex items-center justify-center mb-10 group-hover:bg-brand/10 transition-colors`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tight italic">{feature.title}</h3>
                <p className="text-[#8E8E93] text-lg leading-relaxed font-medium max-w-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonial */}
      <section className="py-40 px-6 bg-[#050505] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-4 mb-12">
            <div className="h-px w-12 bg-brand/30" />
            <Trophy className="w-8 h-8 text-brand" />
            <div className="h-px w-12 bg-brand/30" />
          </div>
          <p className="text-3xl md:text-5xl font-black italic leading-[1.1] mb-12 uppercase tracking-tighter">
            "The most advanced study environment I've ever encountered. It's not just an app; it's an engineering marvel for the mind."
          </p>
          <div className="font-mono">
            <p className="text-xl font-black text-white uppercase tracking-widest">Alex Chen</p>
            <p className="text-xs text-brand font-bold uppercase tracking-[0.3em] mt-2">Stanford University // Dept. of Medicine</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-56 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,132,255,0.1)_0,transparent_70%)]" />
        <div className="max-w-4xl mx-auto relative">
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter mb-16 uppercase italic leading-[0.85]">Join the <br /> <span className="text-brand">Vanguard.</span></h2>
          <button 
            onClick={handleLogin}
            className="px-16 py-7 bg-brand text-white rounded-none font-black text-xl uppercase tracking-[0.3em] hover:bg-brand/90 transition-all active:scale-95 shadow-[0_0_50px_rgba(10,132,255,0.4)] border border-brand/50"
          >
            Initialize Session
          </button>
          <p className="mt-12 text-[#8E8E93] font-mono text-[10px] uppercase tracking-[0.5em]">Secure Authentication // Cloud Sync Enabled</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex items-center gap-4">
            <Logo className="w-8 h-8 text-brand" />
            <span className="text-2xl font-black tracking-tighter uppercase font-mono italic">StudyFlow</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-[#8E8E93]">
            <a href="#" className="hover:text-white transition-colors">Privacy_Protocol</a>
            <a href="#" className="hover:text-white transition-colors">Terms_of_Service</a>
            <a href="#" className="hover:text-white transition-colors">System_Status</a>
            <a href="#" className="hover:text-white transition-colors">X_Terminal</a>
          </div>

          <p className="text-[10px] text-[#48484A] font-mono uppercase tracking-widest">© 2024 StudyFlow // Ver 2.4.0</p>
        </div>
      </footer>
    </div>
  );
}
