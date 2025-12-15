
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/UI';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, 
  CheckCircle2, Wallet,
  Search, Star, MapPin, Sparkles, BookOpen, 
  PenTool, Coffee, Code, GraduationCap,
  School,
  MessageCircle, Users, Layout, CreditCard,
  ChevronRight, Lock
} from 'lucide-react';
import { User } from '../types';

interface HomeProps {
  user: User | null;
  darkMode: boolean;
  toggleTheme: () => void;
}

const COLLEGES = ["IIT Bombay", "Delhi University", "BITS Pilani", "VIT Vellore", "SRM", "Manipal", "Amity", "Christ", "NIFT", "IIT Delhi"];

// --- Components ---

const SpotlightCard = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => {
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
      className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B101B] p-8 shadow-sm ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300 opacity-0 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(56, 189, 248, 0.1), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const FeatureBento = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 py-24">
       {/* Large Card */}
       <SpotlightCard className="md:col-span-2 md:row-span-2 !p-0 overflow-hidden group">
          <div className="p-10 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-500/30">
                  <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Escrow Secured Payments</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md">
                  We hold the funds safely until the work is approved. Neither party can scam the other.
              </p>
          </div>
          <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-t from-indigo-50 to-transparent dark:from-indigo-950/50 border-t border-l border-slate-100 dark:border-slate-800 rounded-tl-3xl overflow-hidden translate-y-4 translate-x-4 transition-transform group-hover:translate-x-2 group-hover:translate-y-2">
              <div className="p-6">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                          <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      <div className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-500/30">
                          Funds Locked
                      </div>
                  </div>
                  <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
              </div>
          </div>
       </SpotlightCard>

       {/* Tall Card */}
       <SpotlightCard className="md:row-span-2 border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-[#0B101B] dark:to-[#050912]">
          <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-500/30">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Pricing</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 flex-1">
                  Our Gemini AI analyzes task complexity to suggest fair market rates instantly.
              </p>
              
              <div className="mt-auto bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500">Suggested</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">₹850</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 w-3/4 h-full rounded-full"></div>
                  </div>
              </div>
          </div>
       </SpotlightCard>

       {/* Wide Card */}
       <SpotlightCard className="md:col-span-3 flex flex-col md:flex-row items-center justify-between gap-8 !py-12">
          <div className="max-w-xl">
             <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-500/20 flex items-center justify-center border border-pink-100 dark:border-pink-500/30">
                      <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Verified Campus Community</h3>
             </div>
             <p className="text-slate-600 dark:text-slate-400">
                 Connect exclusively with students. We verify university IDs to keep the platform safe and high-quality. No bots, no spam.
             </p>
          </div>
          <div className="flex -space-x-4">
              {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-14 h-14 rounded-full border-4 border-white dark:border-[#0B101B] bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-lg">
                      <span className="text-xs text-slate-500">ID</span>
                  </div>
              ))}
              <div className="w-14 h-14 rounded-full border-4 border-white dark:border-[#0B101B] bg-slate-800 dark:bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
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
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 selection:text-indigo-800 dark:selection:text-indigo-200 overflow-x-hidden relative transition-colors duration-300">
      
      {/* Premium Grid Background */}
      <div className="fixed inset-0 z-0 bg-grid-premium opacity-60 dark:opacity-40 pointer-events-none"></div>
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50 dark:from-[#030712] to-transparent z-10 pointer-events-none transition-colors duration-300"></div>

      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-slate-200 dark:border-white/5 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <span className="font-bold text-white text-sm">TL</span>
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">TaskLink</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">How it works</a>
                <a href="#community" className="hover:text-slate-900 dark:hover:text-white transition-colors">Community</a>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  {darkMode ? '☀️' : '🌙'}
              </button>
              {user ? (
                <Link to="/dashboard">
                  <button className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white text-sm font-medium transition-colors border border-transparent dark:border-white/5">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/auth" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
                  <Link to="/auth">
                    <button className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-200 dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      Get Started
                    </button>
                  </Link>
                </>
              )}
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 z-10 overflow-hidden">
         {/* Abstract Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-[100%] blur-[120px] -z-10 opacity-60 dark:opacity-30"></div>
         
         <div className="max-w-4xl mx-auto px-6 text-center relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-300 text-xs font-medium mb-8 backdrop-blur-sm animate-fade-in hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-default shadow-sm dark:shadow-none">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></span>
                <span>The Student Economy v2.0 is here</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1] text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-white dark:to-slate-400">
                Turn your free time <br/>
                into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:text-white">income.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                The premium marketplace for students. Outsource tasks securely, find verified peers, and build your reputation on campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to={user ? "/post" : "/auth"} className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm text-white btn-shimmer relative overflow-hidden group border border-transparent dark:border-white/10 shadow-xl shadow-indigo-500/20 dark:shadow-none">
                        <span className="relative z-10 flex items-center justify-center gap-2">
                           Start Earning Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </Link>
                <Link to="/tasks" className="w-full sm:w-auto">
                     <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#0B101B] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm dark:shadow-none">
                        Browse Tasks
                     </button>
                </Link>
            </div>
         </div>
      </div>

      {/* Marquee */}
      <div className="py-12 border-y border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#030712]/50 backdrop-blur-sm overflow-hidden relative z-20">
         <div className="flex animate-scroll whitespace-nowrap gap-20 items-center">
            {[...COLLEGES, ...COLLEGES].map((college, i) => (
                <div key={i} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                    <School className="w-5 h-5 text-slate-900 dark:text-white" />
                    <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{college}</span>
                </div>
            ))}
         </div>
      </div>

      {/* Features Bento Grid */}
      <FeatureBento />

      {/* Steps / Process */}
      <div className="py-32 px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5">
         <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
             <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">How it works</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">Simple, secure, and designed for student life.</p>
             </div>
             <Link to="/auth" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-2 text-sm font-bold">
                 Get Started <ArrowRight className="w-4 h-4" />
             </Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
                 { step: "01", title: "Post a Task", desc: "Describe what you need. Our AI helps you price it fairly in seconds." },
                 { step: "02", title: "Secure Funds", desc: "Deposit money into escrow. It stays safe until you're 100% satisfied." },
                 { step: "03", title: "Get it Done", desc: "Verified students complete the work. Approve and release payment." }
             ].map((item, i) => (
                 <div key={i} className="border-t border-slate-200 dark:border-slate-800 pt-8 group cursor-default">
                     <span className="text-xs font-mono text-indigo-600 dark:text-indigo-500 mb-4 block group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{item.step}</span>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:translate-x-2 transition-transform">{item.title}</h3>
                     <p className="text-slate-600 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-400 transition-colors leading-relaxed">
                         {item.desc}
                     </p>
                 </div>
             ))}
         </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 px-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50 dark:via-indigo-950/20 to-transparent pointer-events-none"></div>
         <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
                <Sparkles className="w-8 h-8 text-indigo-600 dark:text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight text-slate-900 dark:text-white">
                Ready to join the <br/>
                <span className="text-indigo-600 dark:text-indigo-400">TaskLink</span> network?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto">
                Join thousands of students earning money and getting things done on the most secure campus marketplace.
            </p>
            <Link to="/auth">
                <button className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-base hover:bg-slate-800 dark:hover:bg-slate-200 transition-all hover:scale-105 shadow-xl shadow-slate-200 dark:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                    Join for Free
                </button>
            </Link>
         </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#030712]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-white/10 shadow-sm">TL</div>
                  <span className="font-bold text-sm text-slate-600 dark:text-slate-300">TaskLink &copy; 2024</span>
             </div>
             <div className="flex gap-8 text-sm font-medium text-slate-500 dark:text-slate-500">
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Safety Guide</a>
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
             </div>
         </div>
      </footer>
    </div>
  );
};
