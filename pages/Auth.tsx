
import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from '../components/UI';
import { User } from '../types';
import { Sun, Moon, Zap, ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { API, getErrorMessage } from '../services/api';
import { clsx } from 'clsx';

interface AuthProps {
  onLogin: (user: User, rememberMe: boolean) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, darkMode, toggleTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const isOnline = await API.auth.testConnection();
    setApiStatus(isOnline ? 'ONLINE' : 'OFFLINE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await API.auth.login(email, password);
        onLogin(user, true);
      } else {
        const result = await API.auth.register({ name, email, password, college });
        if (result.id) {
           // If direct register returns a user (demo mode), log in
           onLogin(result, true);
        } else {
           setError("Registration initialized. Check your university inbox.");
        }
      }
    } catch (err: any) {
      // getErrorMessage is now robust to handle objects
      setError(getErrorMessage(err));
      checkHealth();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      const user = await API.auth.login('alex@uni.edu', 'password123');
      onLogin(user, true);
    } catch (e) {
      setError("Demo vault inaccessible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-700 selection:bg-indigo-500/20">
      <div className="bg-mesh opacity-50"></div>
      
      {/* Absolute Header with minimal controls */}
      <div className="absolute top-10 left-10 right-10 flex justify-between items-center z-50">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-sm">TL</span>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">TaskLink OS</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 dark:border-white/5"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
      </div>

      <div className="w-full max-w-[440px] z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Sleek Form Section */}
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    {isLogin ? 'Welcome Back.' : 'Initialize Access.'}
                </h1>
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm tracking-tight">
                    {isLogin ? 'Enter your student credentials to sync with the network.' : 'Join the exclusive university task exchange.'}
                </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold leading-relaxed flex gap-3 items-center animate-in slide-in-from-top-2">
                 <ShieldCheck className="w-4 h-4 shrink-0" /> 
                 <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {!isLogin && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Name" placeholder="Alex J." value={name} onChange={e => setName(e.target.value)} required />
                      <Input label="College" placeholder="Stanford" value={college} onChange={e => setCollege(e.target.value)} required />
                    </div>
                )}
                
                <Input 
                    label="University Identity" 
                    type="email" 
                    placeholder="student@university.edu" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    icon={<Mail className="w-4 h-4" />}
                    required 
                />
                
                <Input 
                    label="Access Key" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    icon={<Lock className="w-4 h-4" />}
                    required 
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                  <Button type="submit" className="w-full h-14 !rounded-2xl text-base font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20" isLoading={loading}>
                    {isLogin ? 'Execute Login' : 'Register Account'}
                  </Button>
                  
                  {isLogin && (
                    <button 
                        type="button" 
                        onClick={handleQuickDemo}
                        className="h-12 w-full rounded-2xl border border-slate-100 dark:border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap className="w-3.5 h-3.5" /> Fast-Track Demo
                    </button>
                  )}
              </div>
            </form>

            <div className="text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-[0.3em]"
              >
                {isLogin ? "Request New Identity" : "Already Authenticated"}
              </button>
            </div>
        </div>
      </div>

      {/* Subtle Status Bar */}
      <div className="absolute bottom-10 inset-x-10 flex items-center justify-between z-10 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
            <div className={clsx(
              "w-2 h-2 rounded-full",
              apiStatus === 'ONLINE' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"
            )} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Sync Health: {apiStatus}
            </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Build 2025.1.0-STABLE
        </span>
      </div>
    </div>
  );
};
