
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { TaskFeed } from './pages/TaskFeed';
import { PostTask } from './pages/PostTask';
import { TaskDetail } from './pages/TaskDetail';
import { Wallet } from './pages/Wallet';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';
import { PublicProfile } from './pages/PublicProfile';
import { Notifications } from './pages/Notifications';
import { Community } from './pages/Community';
import { Home } from './pages/Home';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Safety } from './pages/Safety';
import { User, Task, Notification } from './types';
import { API, getErrorMessage } from './services/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Initialize
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
        const currentUser = await API.auth.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            loadData(currentUser.id);
        }
    } catch (e) {
        console.error("Session check error:", getErrorMessage(e));
    } finally {
        setLoading(false);
    }
  };

  const loadData = async (userId: string) => {
    const taskData = await API.tasks.list();
    setTasks(taskData);
    const notifData = await API.notifications.fetchReal(userId);
    setNotifications(notifData);
  };

  // Poll for updates (Simulation of Realtime Subscription) AND Cross-tab sync
  useEffect(() => {
    if (!user) return;

    // 1. Polling fallback
    const interval = setInterval(() => {
        loadData(user.id);
    }, 5000);

    // 2. Real-time Cross-tab Sync
    const handleStorageChange = () => {
      loadData(user.id);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const handleLogin = (newUser: User, rememberMe: boolean) => {
    setUser(newUser);
    loadData(newUser.id);
  };

  const handleLogout = async () => {
    await API.auth.logout();
    setUser(null);
  };

  const handlePostTask = async (newTask: Task) => {
      if(!user) return;
      try {
          await API.tasks.create(newTask, user);
          // Optimistic update
          setUser({ ...user, balance: user.balance - newTask.budget, escrowBalance: user.escrowBalance + newTask.budget });
          loadData(user.id);
      } catch (e: any) {
          alert(getErrorMessage(e));
      }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
      if(!user) return;
      try {
          // Check if it's an offer being made (simple heuristic: offers count increased)
          const oldTask = tasks.find(t => t.id === updatedTask.id);
          
          if (oldTask && updatedTask.offers.length > oldTask.offers.length) {
               const newOffer = updatedTask.offers[updatedTask.offers.length - 1];
               await API.tasks.addOffer(newOffer);
               // Notification is handled inside API.tasks.addOffer
          } else {
             await API.tasks.update(updatedTask, user);
          }
          // Always reload data after update to ensure sync
          await loadData(user.id);
      } catch (e: any) {
          console.error("Task update failed", e);
          // Re-throw so component can handle it if needed
          throw e;
      }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    await API.auth.updateProfile(updatedUser);
    setUser(updatedUser);
  };

  const handleMarkAllRead = async () => {
    if (user) {
        await API.notifications.markAllRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-400">Loading TaskLink...</div>;

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home user={user} darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/auth" element={!user ? <Auth onLogin={handleLogin} darkMode={darkMode} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/safety" element={<Safety />} />
      </Routes>

      {/* Active User Routes with Sidebar Layout */}
      {user && (
         <Routes>
            <Route path="/dashboard" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><Dashboard user={user} tasks={tasks} /></Layout>} />
            <Route path="/tasks" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><TaskFeed tasks={tasks} /></Layout>} />
            <Route path="/tasks/:id" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><TaskDetail tasks={tasks} user={user} onUpdateTask={handleUpdateTask} /></Layout>} />
            <Route path="/post" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><PostTask user={user} onPost={handlePostTask} /></Layout>} />
            <Route path="/community" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><Community /></Layout>} />
            <Route path="/wallet" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><Wallet user={user} onUpdateUser={handleUpdateUser} /></Layout>} />
            <Route path="/profile" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><Profile user={user} onUpdateProfile={handleUpdateUser} /></Layout>} />
            <Route path="/u/:userId" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><PublicProfile /></Layout>} />
            <Route path="/notifications" element={<Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><Notifications notifications={notifications} onMarkAllRead={handleMarkAllRead} /></Layout>} />
            <Route path="/admin" element={user?.role === 'ADMIN' ? <Layout user={user} tasks={tasks} notifications={notifications} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme}><Admin /></Layout> : <Navigate to="/" />} />
         </Routes>
      )}
    </Router>
  );
}

export default App;
