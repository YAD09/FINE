
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card } from '../components/UI';
import { User, UserRole } from '../types';
import { RefreshCw, CheckSquare, Square, MailWarning, Sun, Moon } from 'lucide-react';
import { API, getErrorMessage } from '../services/api';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: (user: User, rememberMe: boolean) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, darkMode, toggleTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New Features State
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // OTP State (for when email confirmation is ENABLED)
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingUser, setPendingUser] = useState<Partial<User> | null>(null);

  // Initialize Captcha
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Listen for Magic Link clicks in other tabs
  useEffect(() => {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
              setLoading(true);
              try {
                  const user = await API.auth.getCurrentUser();
                  if (user) onLogin(user, true);
              } catch (e) {
                  console.error(e);
              } finally {
                  setLoading(false);
              }
          }
      });
      return () => authListener.subscription.unsubscribe();
  }, []);

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaValue(result);
    setCaptchaInput('');
    setCaptchaError(false);
    drawCaptcha(result);
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dark mode awareness for captcha bg
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#1e293b' : '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = `rgba(100, 116, 139, ${Math.random()})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(15 + i * 20, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  };

  // Re-draw captcha when theme changes
  useEffect(() => {
      if (captchaValue) drawCaptcha(captchaValue);
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Skip Captcha for OTP step
    if (!showOtp && captchaInput.toUpperCase() !== captchaValue) {
      setCaptchaError(true);
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const user = await API.auth.login(email, password);
        onLogin(user, rememberMe);
      } else if (showOtp) {
        // Step 2: Verify OTP
        const user = await API.auth.verifySignup(email, otpCode, pendingUser!);
        onLogin(user, rememberMe);
      } else {
        // Step 1: Initial Register
        const result = await API.auth.register({ name, email, password, college });
        if (result.requiresOtp) {
            setShowOtp(true);
            setPendingUser({ name, email, college });
            setError(''); 
        } else {
            // Logged in immediately (Email Confirmation Disabled)
            onLogin(result, rememberMe);
        }
      }
    } catch (err: any) {
        let msg = getErrorMessage(err);
        // Helpful hint for Supabase Email Limits
        if (msg.toLowerCase().includes('sending confirmation email')) {
             msg = "Supabase Email Error: Please go to your Supabase Dashboard > Authentication > Providers > Email and DISABLE 'Confirm email'.";
        }
        setError(msg);
        generateCaptcha();
    } finally {
        setLoading(false);
    }
  };

  const handleManualVerificationCheck = async () => {
      setLoading(true);
      try {
          // Force a session check
          const { data } = await supabase.auth.refreshSession();
          if (data.session) {
              const user = await API.auth.getCurrentUser();
              if (user) onLogin(user, true);
          } else {
              setError("Email not verified yet. Please click the link in your inbox.");
          }
      } catch (e) {
          setError("Verification check failed.");
      } finally {
          setLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await API.auth.googleLogin();
      onLogin(user, rememberMe);
    } catch (err: any) {
        let msg = getErrorMessage(err);
        if (msg.toLowerCase().includes('sending confirmation email')) {
             msg = "Setup Required: Please disable 'Confirm email' in Supabase Dashboard for this demo to work.";
        }
        setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 transition-colors duration-300 relative">
      <button 
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 z-50"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="mb-8 text-center">
        {/* Logo Image */}
        <img 
            src="https://i.ibb.co/31c963L/Task-Link.png" 
            alt="TaskLink Logo" 
            className="h-16 mx-auto mb-4 object-contain"
        />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">TaskLink</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The student marketplace for getting things done.</p>
      </div>

      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
            {showOtp ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Create Account')}
        </h2>
        
        {error && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 flex gap-2 items-start ${error.includes('Supabase Dashboard') ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-600'}`}>
                <MailWarning className="w-5 h-5 shrink-0" />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* OTP / Verification View */}
          {showOtp ? (
              <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-300 text-sm">
                      We sent a verification link/code to <b>{email}</b>.
                      <br/><br/>
                      <strong>Option 1:</strong> Click the link in your email (easiest).
                      <br/>
                      <strong>Option 2:</strong> Enter the code below.
                  </div>
                  
                  <Input 
                    label="Verification Code" 
                    placeholder="123456" 
                    value={otpCode} 
                    onChange={e => setOtpCode(e.target.value)} 
                    className="text-center text-2xl tracking-widest font-bold text-slate-900 dark:text-white" 
                  />
                  
                  <Button type="submit" className="w-full h-12" isLoading={loading}>Verify Code</Button>
                  
                  <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">OR</span>
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  </div>

                  <Button type="button" variant="secondary" className="w-full" onClick={handleManualVerificationCheck} isLoading={loading}>
                      I've Verified My Email (Click Here)
                  </Button>
                  
                  <button type="button" onClick={() => setShowOtp(false)} className="text-sm text-slate-500 hover:underline w-full text-center mt-2">Back to Signup</button>
              </div>
          ) : (
              // Standard Login/Signup View
              <>
                {!isLogin && (
                    <>
                    <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    <Input placeholder="College / University" value={college} onChange={e => setCollege(e.target.value)} required />
                    </>
                )}
                <Input type="email" label="Email Address" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input type="password" label="Password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />

                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Security Check</label>
                    <div className="flex gap-2 mb-2">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 select-none">
                        <canvas ref={canvasRef} width={140} height={42} className="cursor-pointer" onClick={generateCaptcha} title="Click to refresh" />
                    </div>
                    <button type="button" onClick={generateCaptcha} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    </div>
                    <Input 
                    placeholder="Enter characters above" 
                    value={captchaInput}
                    onChange={e => { setCaptchaInput(e.target.value); setCaptchaError(false); }}
                    error={captchaError ? "Incorrect captcha. Please try again." : undefined}
                    className="uppercase tracking-widest font-mono"
                    required
                    />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                    <button type="button" onClick={() => setRememberMe(!rememberMe)} className={`w-5 h-5 flex items-center justify-center rounded border transition-all ${rememberMe ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent'}`}>
                        <CheckSquare className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 select-none">Remember me</span>
                    </label>
                    {isLogin && <a href="#" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">Forgot Password?</a>}
                </div>
                
                <Button type="submit" className="w-full h-12 text-lg mt-2" isLoading={loading}>
                    {isLogin ? 'Sign In' : 'Join TaskLink'}
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-900 text-slate-400">Or continue with</span></div>
                </div>

                <Button type="button" variant="secondary" className="w-full relative" onClick={handleGoogleLogin} disabled={loading}>
                    <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </Button>
              </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {isLogin ? "New to TaskLink?" : "Already have an account?"}{' '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setShowOtp(false); }} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </p>
      </Card>
    </div>
  );
};
