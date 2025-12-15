
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
  Briefcase,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Moon,
  Sun,
  Users,
  Circle
} from 'lucide-react';
import { clsx } from 'clsx';
import { User as UserType, Notification, Task, TaskStatus, OfferStatus, AvailabilityStatus } from '../types';

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

  if (!user) {
    return <>{children}</>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Browse Tasks', icon: Search, path: '/tasks' },
    { label: 'Post Task', icon: PlusCircle, path: '/post' },
    { label: 'Community', icon: Users, path: '/community' },
    { label: 'Wallet', icon: Wallet, path: '/wallet' },
    { label: 'Notifications', icon: Bell, path: '/notifications', badge: unreadCount },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ label: 'Admin', icon: ShieldCheck, path: '/admin' });
  }

  // Sidebar Tasks Logic
  const doingTasks = tasks.filter(t => t.executorId === user.id && t.status === TaskStatus.IN_PROGRESS);
  const acceptedTasks = tasks.filter(t => t.executorId === user.id && t.status === TaskStatus.ASSIGNED);
  const rejectedTasks = tasks.filter(t => 
    t.executorId !== user.id && 
    t.offers?.some(o => o.userId === user.id && o.status === OfferStatus.REJECTED)
  );
  const postedTasks = tasks.filter(t => t.posterId === user.id && t.status === TaskStatus.OPEN);

  const getStatusColor = (status: AvailabilityStatus) => {
    switch(status) {
      case AvailabilityStatus.ONLINE: return "bg-green-500";
      case AvailabilityStatus.BUSY: return "bg-red-500";
      case AvailabilityStatus.URGENT_ONLY: return "bg-amber-500";
      default: return "bg-slate-400";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-30 transition-colors duration-300">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">TL</div>
            <span className="font-bold text-lg text-slate-800 dark:text-white">TaskLink</span>
         </div>
         <div className="flex items-center gap-3">
            {toggleTheme && (
                <button onClick={toggleTheme} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            )}
            <Link to="/notifications" className="relative p-1">
               <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300" />
               {unreadCount > 0 && (
                   <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                     {unreadCount > 9 ? '9+' : unreadCount}
                   </span>
               )}
            </Link>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">₹{user.balance}</span>
            <Link to="/profile">
               <img src={user.avatarUrl} alt="profile" className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            </Link>
            <button 
                onClick={onLogout} 
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Sign Out"
            >
                <LogOut className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 transition-colors duration-300">
        <div className="p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-200 dark:shadow-none">TL</div>
                <div>
                  <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">TaskLink</h1>
                  <p className="text-xs text-slate-400 font-medium">Student Marketplace</p>
                </div>
            </div>
        </div>

        <div className="px-6 pb-4">
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className={clsx("w-2 h-2 rounded-full", getStatusColor(user.availability || AvailabilityStatus.ONLINE))}></span>
                  <span className="capitalize">{user.availability?.toLowerCase().replace('_', ' ') || 'Online'}</span>
                  <span className="ml-auto text-[10px] opacity-50">(Change in Profile)</span>
             </div>
        </div>

        <nav className="flex-1 px-4 mt-2 overflow-y-auto custom-scrollbar">
          <div className="space-y-1 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-semibold" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                      <Icon className={clsx("w-5 h-5", isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                      {item.label}
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                      </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Doing Tasks Section */}
          {doingTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Doing ({doingTasks.length})
              </h3>
              <div className="space-y-1">
                {doingTasks.map(task => (
                  <Link 
                    key={task.id} 
                    to={`/tasks/${task.id}`}
                    className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg truncate transition-colors"
                    title={task.title}
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Tasks Section */}
          {acceptedTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="px-4 text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Accepted ({acceptedTasks.length})
              </h3>
              <div className="space-y-1">
                {acceptedTasks.map(task => (
                  <Link 
                    key={task.id} 
                    to={`/tasks/${task.id}`}
                    className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-lg truncate transition-colors border-l-2 border-transparent hover:border-green-500"
                    title={task.title}
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Tasks Section */}
          {rejectedTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="px-4 text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <XCircle className="w-3 h-3" /> Rejected ({rejectedTasks.length})
              </h3>
              <div className="space-y-1">
                {rejectedTasks.map(task => (
                  <Link 
                    key={task.id} 
                    to={`/tasks/${task.id}`}
                    className="block px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg truncate transition-colors opacity-80 hover:opacity-100"
                    title={task.title}
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posted Tasks Section */}
          {postedTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers className="w-3 h-3" /> Posted ({postedTasks.length})
              </h3>
              <div className="space-y-1">
                {postedTasks.map(task => (
                  <Link 
                    key={task.id} 
                    to={`/tasks/${task.id}`}
                    className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg truncate transition-colors"
                    title={task.title}
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="px-4 pt-2">
             {toggleTheme && (
                <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
             )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Link to="/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <div className="relative">
              <img src={user.avatarUrl} alt="profile" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 object-cover" />
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.username}</p>
            </div>
          </Link>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 px-4 flex justify-between z-30 transition-colors duration-300">
        {navItems.filter(i => i.label !== 'Notifications' && i.label !== 'Admin').slice(0, 5).map((item) => {
           const Icon = item.icon;
           const isActive = location.pathname === item.path;
           return (
             <Link 
               key={item.path} 
               to={item.path} 
               className={clsx("flex flex-col items-center gap-1 p-2 rounded-lg", isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500")}
             >
               <Icon className="w-6 h-6" />
               <span className="text-[10px] font-medium">{item.label}</span>
             </Link>
           )
        })}
      </div>
    </div>
  );
};
