import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, 
  CheckCircle2, Wallet,
  Search, Star, MapPin, Sparkles, BookOpen, 
  PenTool, Coffee, Code, GraduationCap,
  School,
  MessageCircle, Users, Layout, CreditCard,
  ChevronRight, Lock, Sun, Moon
} from 'lucide-react';
import { User } from '../types';

interface HomeProps {
  user: User | null;
  darkMode: boolean;
  toggleTheme: () => void;
}

const COLLEGES = ["IIT Bombay", "Delhi University", "BITS Pilani", "VIT Vellore", "SRM", "Manipal", "Amity", "Christ", "NIFT", "IIT Delhi"];

// --- Components ---

const SpotlightCard = ({ children, className = "", id }: { children?: React.ReactNode, className?: string, id?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      id={id}
      className={`relative overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/5 bg-white/80 dark:bg-[#0B101B]/60 backdrop-blur-2xl p-8 shadow-2xl transition-all duration-700 hover:scale-[1.01] hover:shadow-primary-500/5 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-500 opacity-0 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.08), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

const FeatureBento = () => {
  return (
    <div id="features" className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 sm:px-6 py-32 scroll-mt-24">
       {/* Large Card: Escrow */}
       <SpotlightCard className="lg:col-span-2 lg:row-span-2 !p-0 group min-h-[550px] flex flex-col">
          <div className="p-12 relative z-20">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-8 border border-indigo-500/20 shadow-glow-sm">
                  <ShieldCheck className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-tight">Escrow. Locked.<br/>Pure Security.</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xl max-w-md font-medium leading-relaxed">
                  Funds are held in an automated student-safe vault. Payment only flows when you approve the work. No fraud, just fairness.
              </p>
          </div>
          <div className="absolute right-0 bottom-0 w-full md:w-3/4 h-2/3 bg-gradient-to-t from-slate-50 to-transparent dark:from-[#0F172A] border-t border-l border-white/30 dark:border-white/10 rounded-tl-[4rem] overflow-hidden translate-y-12 translate-x-12 transition-transform duration-1000 group-hover:translate-x-6 group-hover:translate-y-6 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)]">
              <div className="p-10 h-full bg-white/40 dark:bg-slate-900/60 backdrop-blur-3xl">
                  <div className="flex items-center justify-between mb-8 border-b border-dashed border-slate-300 dark:border-slate-800 pb-8">
                      <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-2 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                            <div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded-full opacity-50"></div>
                          </div>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-[0.2em] border border-green-500/20 flex items-center gap-2">
                          <Lock className="w-3 h-3" /> Funds Active
                      </div>
                  </div>
                  <div className="space-y-6">
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
                      <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
                      <div className="h-3 w-4/6 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
                  </div>
              </div>
          </div>
       </SpotlightCard>

       {/* Tall Card: AI Pricing */}
       <SpotlightCard className="lg:row-span-2 min-h-[450px] flex flex-col justify-between !bg-gradient-to-b from-indigo-500/5 to-transparent">
          <div>
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20 shadow-glow-sm">
                  <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-4 tracking-tighter">AI Pricing Engine</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Our neural engine analyzes task complexity and market demand to suggest fair student rates in real-time.
              </p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fair Rate Guide</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹850.00</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-[85%] h-full rounded-full shimmer"></div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[10px] text-emerald-500 font-bold">98% Accuracy</span>
                <span className="text-[10px] text-slate-400">Low Volatility</span>
              </div>
          </div>
       </SpotlightCard>

       {/* Wide Card: Community */}
       <SpotlightCard id="community" className="lg:col-span-3 flex flex-col md:flex-row items-center justify-between gap-12 !py-20 scroll-mt-24">
          <div className="max-w-2xl text-center md:text-left">
             <div className="flex items-center gap-5 mb-8 justify-center md:justify-start">
                  <div className="w-16 h-16 rounded-3xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                      <Users className="w-8 h-8 text-pink-500" />
                  </div>
                  <h3 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tighter">Campus Connect.</h3>
             </div>
             <p className="text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                 The TaskLink network is exclusively for verified students. We link university ecosystems to ensure every peer interaction is built on authenticated trust.
             </p>
          </div>
          <div className="flex -space-x-6 shrink-0 pt-4 md:pt-0">
              {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-20 h-20 rounded-[1.75rem] border-4 border-white dark:border-[#020617] bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative z-10 transition-all duration-500 hover:-translate-y-4 hover:scale-110 hover:z-20 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 relative">ID-{i}0</span>
                  </div>
              ))}
              <div className="w-20 h-20 rounded-[1.75rem] border-4 border-white dark:border-[#020617] bg-primary-600 flex items-center justify-center text-white font-black text-xl shadow-2xl relative z-0">
                  +2k
              </div>
          </div>
       </SpotlightCard>
    </div>
  );
};

export const Home: React.FC<HomeProps> = ({ user, darkMode, toggleTheme }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background text-slate-900 dark:text-white selection:bg-indigo-500/30 overflow-x-hidden relative transition-colors duration-700">
      
      {/* Dynamic Ambiance */}
      <div className="bg-mesh opacity-70"></div>
      
      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-slate-200/50 dark:border-white/5 py-4 shadow-2xl' : 'bg-transparent border-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-[1.15rem] bg-gradient-to-br from-indigo-500 via-primary-500 to-purple-600 flex items-center justify-center shadow-glow-sm transition-transform duration-500 group-hover:scale-110">
                  <span className="font-black text-white font-display text-xl">TL</span>
              </div>
              <span className="font-display font-black text-2xl tracking-tighter text-slate-900 dark:text-white">TaskLink</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-12 text-[13px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="hover:text-primary-500 transition-colors">Platform</a>
                <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="hover:text-primary-500 transition-colors">Operations</a>
                <a href="#community" onClick={(e) => handleNavClick(e, 'community')} className="hover:text-primary-500 transition-colors">Community</a>
            </div>

            <div className="flex items-center gap-5">
              <button onClick={toggleTheme} className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all">
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {user ? (
                <Link to="/dashboard">
                  <button className="px-7 py-3 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-black transition-all shadow-2xl shadow-primary-500/10">
                    Console
                  </button>
                </Link>
              ) : (
                <Link to="/auth">
                  <button className="btn-shimmer px-8 py-3 rounded-2xl font-black text-sm shadow-glow transition-all hover:scale-105 active:scale-95 border border-white/20">
                    Get Started
                  </button>
                </Link>
              )}
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-48 pb-32 md:pt-64 md:pb-48 z-10">
         <div className="max-w-6xl mx-auto px-6 sm:px-10 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-xl text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] mb-12 animate-in fade-in zoom-in duration-1000">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500 shadow-glow-sm"></span>
                </span>
                <span>The Student Economy v2.1</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl md:text-9xl font-display font-black tracking-tighter mb-12 leading-[0.95] text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-white dark:to-slate-600 filter drop-shadow-2xl">
                Monetize your <br className="hidden md:block" />
                free <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-primary-500 to-purple-500">bandwidth.</span>
            </h1>
            
            <p className="text-xl md:text-3xl text-slate-600 dark:text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed font-medium tracking-tight">
                The premium ecosystem where verified students outsource complexity and build reputations. Secure, fast, and exclusive.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link to={user ? "/post" : "/auth"} className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-12 py-5 rounded-[1.75rem] font-black text-lg text-white btn-shimmer relative overflow-hidden group shadow-[0_32px_64px_-12px_rgba(99,102,241,0.5)] transition-all hover:scale-110 active:scale-95">
                        <span className="relative z-10 flex items-center justify-center gap-3 uppercase tracking-widest">
                           Launch Task <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </span>
                    </button>
                </Link>
                <Link to="/tasks" className="w-full sm:w-auto">
                     <button className="w-full sm:w-auto px-12 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-[1.75rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl backdrop-blur-2xl uppercase tracking-widest">
                        Browse Market
                     </button>
                </Link>
            </div>
         </div>
      </div>

      {/* Marquee Banner */}
      <div className="py-14 border-y border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-3xl overflow-hidden relative z-20">
         <div className="flex animate-scroll whitespace-nowrap gap-20 sm:gap-32 items-center w-max px-10">
            {[...COLLEGES, ...COLLEGES, ...COLLEGES].map((college, i) => (
                <div key={i} className="flex items-center gap-5 opacity-40 hover:opacity-100 transition-all duration-500 cursor-default grayscale hover:grayscale-0 group">
                    <School className="w-7 h-7 text-slate-900 dark:text-white group-hover:text-primary-500" />
                    <span className="text-xl sm:text-2xl font-display font-black tracking-tighter text-slate-900 dark:text-white">{college}</span>
                </div>
            ))}
         </div>
      </div>

      <FeatureBento />

      {/* Operational Flow */}
      <div id="how-it-works" className="py-32 sm:py-48 px-6 sm:px-10 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5 scroll-mt-24">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-10">
             <div>
                <h2 className="text-5xl md:text-7xl font-display font-black mb-6 text-slate-900 dark:text-white tracking-tighter">The Blueprint.</h2>
                <p className="text-2xl text-slate-500 dark:text-slate-400 max-w-md font-medium tracking-tight">Frictionless deployment from concept to completion.</p>
             </div>
             <Link to="/auth" className="text-indigo-500 font-black uppercase tracking-[0.2em] text-sm flex items-center gap-3 group">
                 Open Account <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:translate-x-2 transition-transform"><ArrowRight className="w-5 h-5" /></div>
             </Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             {[
                 { step: "Step 01", title: "Initialize Task", desc: "Define requirements. Use our Gemini-integrated AI pricing tool to verify market viability." },
                 { step: "Step 02", title: "Encapsulate Funds", desc: "Assets are locked in a secure Escrow container, ensuring collateral protection for all parties." },
                 { step: "Step 03", title: "Execute & Release", desc: "Authenticated peers deliver work. Verification leads to automated asset distribution." }
             ].map((item, i) => (
                 <div key={i} className="group cursor-default border-l-4 border-slate-200 dark:border-white/5 pl-10 py-4 transition-colors hover:border-indigo-500">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6 block">{item.step}</span>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-5 transition-transform group-hover:translate-x-2">{item.title}</h3>
                     <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed tracking-tight">
                         {item.desc}
                     </p>
                 </div>
             ))}
         </div>
      </div>

      {/* CTA Section */}
      <div className="py-40 px-6 sm:px-10 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent pointer-events-none"></div>
         <div className="max-w-5xl mx-auto text-center relative z-10 bg-white dark:bg-white/5 backdrop-blur-[60px] rounded-[3.5rem] p-16 md:p-24 border border-white dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)]">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-glow">
                <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-black mb-10 tracking-tighter text-slate-900 dark:text-white leading-[0.9]">
                Join the <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-500">Student Economy.</span>
            </h2>
            <p className="text-2xl text-slate-600 dark:text-slate-300 mb-16 max-w-2xl mx-auto font-medium tracking-tight">
                Scale your productivity or grow your capital with the most advanced campus marketplace ever built.
            </p>
            <Link to="/auth">
                <button className="px-16 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-primary-500/20 uppercase tracking-widest">
                    Entry Granted
                </button>
            </Link>
         </div>
      </div>

      {/* Modern Footer */}
      <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 backdrop-blur-3xl">
         <div className="max-w-7xl mx-auto px-6 sm:px-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
                <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-black font-display text-xl transition-transform group-hover:rotate-12">TL</div>
                    <div>
                        <span className="font-display font-black text-2xl text-slate-900 dark:text-white block tracking-tighter leading-none">TaskLink</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 block">&copy; 2025 student innovation</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-8 sm:gap-14">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500">Legal</h4>
                        <div className="flex flex-col gap-2">
                            <Link to="/terms" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">Terms of Service</Link>
                            <Link to="/privacy" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500">Safety</h4>
                        <div className="flex flex-col gap-2">
                            <Link to="/safety" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">Safety Guide</Link>
                            <a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">Report Abuse</a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-10 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Built for students, by code.</p>
                <div className="flex gap-6">
                    {/* Placeholder for social icons */}
                    <div className="w-5 h-5 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                    <div className="w-5 h-5 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                    <div className="w-5 h-5 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                </div>
            </div>
         </div>
      </footer>
    </div>
  );
};