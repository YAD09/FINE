
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Search, 
  Wallet, 
  User, 
  LogOut,
  ShieldCheck,
  Bell,
  WifiOff,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { User as UserType, Notification, Task, TaskStatus, AvailabilityStatus } from '../types';
import { Badge } from './UI';
import { getIsDemoMode } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  user: UserType | null;
  tasks?: Task[];
  notifications?: Notification[];
  onLogout: () => void;
  darkMode?: boolean;
  toggleTheme?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, tasks = [], notifications = [], onLogout, darkMode, toggleTheme }) => {
  const location = useLocation();
  const isDemo = getIsDemoMode();

  if (!user) {
    return <>{children}</>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Browse', icon: Search, path: '/tasks' },
    { label: 'Post Task', icon: PlusCircle, path: '/post' },
    { label: 'Community', icon: Users, path: '/community' },
    { label: 'Wallet', icon: Wallet, path: '/wallet' },
    { label: 'Inbox', icon: Bell, path: '/notifications', badge: unreadCount },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ label: 'Admin', icon: ShieldCheck, path: '/admin' });
  }

  const activeTasksCount = tasks.filter(t => t.executorId === user.id && [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS].includes(t.status)).length;

  const getStatusColor = (status: AvailabilityStatus) => {
    switch(status) {
      case AvailabilityStatus.ONLINE: return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
      case AvailabilityStatus.BUSY: return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]";
      case AvailabilityStatus.URGENT_ONLY: return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]";
      default: return "bg-slate-400";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col md:flex-row transition-colors duration-700">
      <div className="bg-mesh"></div>
      <div className="bg-grain"></div>

      {/* Modern Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[280px] h-screen sticky top-0 p-6 z-20">
        <div className="glass-panel h-full rounded-[2.5rem] flex flex-col overflow-hidden border-white/20 shadow-2xl">
            
            {/* Logo Section */}
            <div className="p-10 pb-6 shrink-0">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-display font-black text-xl shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)]">TL</div>
                    <div>
                      <h1 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tighter leading-none">TaskLink</h1>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500/80 mt-1 block">Student OS</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 backdrop-blur-xl">
                      <div className={clsx("w-2 h-2 rounded-full shrink-0", getStatusColor(user.availability))}></div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{user.availability?.replace('_', ' ')}</span>
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        "flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 group relative",
                        isActive 
                          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                          <Icon className={clsx("w-4.5 h-4.5", isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100")} />
                          <span className="text-[12px] font-black uppercase tracking-widest">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg">
                              {item.badge}
                          </span>
                      )}
                    </Link>
                  );
                })}
            </nav>

            {/* User Profile Area */}
            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/10">
                <div className="flex items-center gap-4 mb-6">
                     <Link to="/profile" className="relative shrink-0">
                        <img src={user.avatarUrl} alt="profile" className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 object-cover ring-2 ring-white dark:ring-slate-800 shadow-lg" />
                        {user.verified && (
                            <div className="absolute -top-1 -right-1 bg-indigo-500 border-2 border-white dark:border-slate-900 rounded-full p-0.5">
                                <ShieldCheck className="w-2.5 h-2.5 text-white" />
                            </div>
                        )}
                     </Link>
                     <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-slate-800 dark:text-white truncate tracking-tight">{user.name}</p>
                        <p className="text-[11px] font-bold text-indigo-500 mt-0.5">₹{user.balance.toLocaleString()}</p>
                     </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleTheme} className="flex-1 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-indigo-500 transition-all flex items-center justify-center">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button onClick={onLogout} className="flex-1 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </aside>

      {/* Content Viewport */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 z-10 custom-scrollbar">
        {isDemo && (
          <div className="sticky top-0 z-30 bg-amber-500/10 backdrop-blur-md border-b border-amber-500/20 py-2 px-6 flex items-center justify-center gap-3">
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Local Sandbox Mode Active</span>
          </div>
        )}
        <div className="max-w-6xl mx-auto p-8 md:p-14 lg:p-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {children}
        </div>
      </main>

      {/* Mobile Floating Bottom Nav */}
      <div className="md:hidden fixed bottom-6 inset-x-6 z-40">
        <div className="glass-panel border-white/20 rounded-3xl py-4 px-8 flex justify-between items-center shadow-2xl">
            {navItems.slice(0, 4).map((item) => {
               const Icon = item.icon;
               const isActive = location.pathname === item.path;
               return (
                 <Link 
                   key={item.path} 
                   to={item.path} 
                   className={clsx("transition-all duration-300", isActive ? "text-indigo-600 scale-125" : "text-slate-400")}
                 >
                   <Icon className="w-5 h-5" />
                 </Link>
               )
            })}
        </div>
      </div>
    </div>
  );
};
