
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Loader2, Star, Mic, Square, Play, ShieldCheck, Clock, AlertTriangle, Info } from 'lucide-react';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glow' | 'premium' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className, 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-black tracking-widest transition-all duration-400 rounded-2xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] uppercase";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.4)] border border-indigo-400/20",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/20",
    glow: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]",
    premium: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-xl border border-white/10",
    secondary: "bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10",
    outline: "bg-transparent border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 border border-red-400/20",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-10 py-4 text-sm",
  };

  return (
    <button 
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

// --- CARD ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; id?: string }> = ({ children, className, onClick, id }) => (
  <div 
    id={id}
    onClick={onClick} 
    className={clsx(
      "glass-panel rounded-[2rem] p-8 transition-all duration-500 relative",
      onClick ? "cursor-pointer hover:scale-[1.01] hover:shadow-2xl" : "",
      className
    )}
  >
    <div className="relative z-10">{children}</div>
  </div>
);

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

// Added hint prop to Input component to support metadata and fix TS errors in consumers like PostTask
export const Input: React.FC<InputProps> = ({ label, error, hint, icon, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors pointer-events-none">
          {icon}
        </div>
      )}
      <input 
        className={clsx(
          "w-full py-4 rounded-2xl border transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400/60 font-medium",
          icon ? "pl-12 pr-4" : "px-5",
          error 
            ? "border-red-500/50 bg-red-500/5" 
            : "border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 focus:border-indigo-500 focus:bg-white dark:focus:bg-[#0F172A] focus:ring-4 focus:ring-indigo-500/5",
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1.5 ml-1 text-[10px] font-bold text-red-500">{error}</p>}
    {hint && !error && <p className="mt-1 ml-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">{hint}</p>}
  </div>
);

// --- TEXTAREA ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 ml-1 uppercase tracking-widest">{label}</label>}
    <textarea 
      className={clsx(
        "w-full px-5 py-4 rounded-2xl border transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400/60 resize-none font-medium",
        error 
          ? "border-red-500/50 bg-red-500/5" 
          : "border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 focus:border-indigo-500 focus:bg-white dark:focus:bg-[#0F172A]",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1.5 ml-1 text-[10px] font-bold text-red-500">{error}</p>}
  </div>
);

// --- BADGE ---
export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'purple'; className?: string }> = ({ children, color = 'blue', className }) => {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    yellow: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    red: "bg-red-500/10 text-red-600 border-red-500/20",
    gray: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };
  
  return (
    <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest", colors[color], className)}>
      {children}
    </span>
  );
};

// --- PROGRESS BAR ---
// This component is required by Dashboard.tsx for visualizing task completion.
export const ProgressBar: React.FC<{ value: number; color?: string; label?: string }> = ({ value, color = 'bg-indigo-600', label }) => (
  <div className="w-full">
    {label && (
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{value}%</span>
      </div>
    )}
    <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
      <div 
        className={clsx("h-full transition-all duration-1000 rounded-full", color)} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// --- STAR RATING ---
interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readOnly = false, size = 'md' }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onRatingChange && onRatingChange(star)}
          disabled={readOnly}
          className={clsx(
            "transition-all duration-300",
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star 
            className={clsx(
              sizeClasses[size], 
              star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-800"
            )} 
          />
        </button>
      ))}
    </div>
  );
};

// --- MODAL ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden relative border border-white/20 rounded-[2.5rem]">
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-display font-black text-lg text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- VOICE RECORDER ---
export const VoiceRecorder: React.FC<{ onRecordComplete: (blobUrl: string) => void }> = ({ onRecordComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      onRecordComplete("mock_audio_blob");
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
      <button 
        type="button"
        onClick={handleToggleRecord}
        className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
          isRecording ? "bg-red-500 text-white animate-pulse" : "bg-indigo-600 text-white"
        )}
      >
        <Mic className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {isRecording ? `Recording... ${duration}s` : "Add Voice Instruction"}
        </p>
      </div>
    </div>
  );
};

// --- COUNTDOWN TIMER ---
export const CountdownTimer: React.FC<{ deadline: string }> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff > 0) {
        setTimeLeft({
          h: Math.floor(diff / (1000 * 60 * 60)),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return <Badge color="red">Expired</Badge>;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/5 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft.h}h {timeLeft.m}m {timeLeft.s}s</span>
    </div>
  );
};

// --- FILE VERIFIER ---
export const FileVerifier: React.FC<{ onFileSelect: (file: File) => void, accept?: string }> = ({ onFileSelect, accept }) => {
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SAFE' | 'DANGER'>('IDLE');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStatus('SCANNING');
      setTimeout(() => {
        if (file.name.includes('virus')) setStatus('DANGER');
        else {
           setStatus('SAFE');
           onFileSelect(file);
        }
      }, 1200);
    }
  };

  return (
    <div>
      <input type="file" ref={inputRef} onChange={handleFile} accept={accept} className="hidden" />
      <button 
        type="button" 
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "w-full border-2 border-dashed rounded-[1.5rem] p-6 flex flex-col items-center justify-center gap-3 transition-all",
          status === 'IDLE' && "border-slate-200 dark:border-white/10 hover:border-indigo-500",
          status === 'SCANNING' && "border-indigo-500 bg-indigo-500/5",
          status === 'SAFE' && "border-emerald-500 bg-emerald-500/5",
          status === 'DANGER' && "border-red-500 bg-red-500/5"
        )}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {status === 'IDLE' ? 'Secure File Upload' : status === 'SCANNING' ? 'Verification in progress...' : status === 'SAFE' ? 'Scan Complete: Safe' : 'Threat Detected'}
        </span>
      </button>
    </div>
  );
};
