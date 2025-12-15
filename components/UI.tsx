
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Loader2, Star, Mic, Square, Play, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
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
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-none",
    secondary: "bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 border border-primary-100 dark:border-slate-700 shadow-sm",
    outline: "bg-transparent border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-500 hover:bg-primary-50 dark:hover:bg-slate-800",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200 dark:shadow-none",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button 
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// --- CARD ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <div onClick={onClick} className={clsx("bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-200 overflow-hidden", className)}>
    {children}
  </div>
);

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input 
        className={clsx(
          "w-full py-2.5 rounded-xl border bg-white dark:bg-slate-800 transition-colors outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
          icon ? "pl-10 pr-4" : "px-4",
          error ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900",
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// --- TEXTAREA ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</label>}
    <textarea 
      className={clsx(
        "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 transition-colors outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
        error ? "border-red-300 focus:border-red-500" : "border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
            "transition-colors",
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star 
            className={clsx(
              sizeClasses[size], 
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300 dark:text-slate-600"
            )} 
          />
        </button>
      ))}
    </div>
  );
};

// --- BADGE ---
export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' }> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    yellow: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    gray: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  };
  
  return (
    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-semibold", colors[color])}>
      {children}
    </span>
  );
};

// --- MODAL ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
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
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

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
      // Stop
      setIsRecording(false);
      // Simulate Blob
      const mockUrl = "mock_audio_blob";
      setRecordedUrl(mockUrl);
      onRecordComplete(mockUrl);
    } else {
      // Start
      setIsRecording(true);
      setRecordedUrl(null);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <button 
        type="button"
        onClick={handleToggleRecord}
        className={clsx(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
          isRecording ? "bg-red-100 text-red-600 animate-pulse" : "bg-primary-100 text-primary-600"
        )}
      >
        {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
      </button>
      
      <div className="flex-1">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{formatTime(duration)}</span>
            <span className="text-xs text-slate-400">Recording...</span>
          </div>
        ) : recordedUrl ? (
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <Play className="w-3 h-3 fill-current" />
             </div>
             <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Voice Note Recorded</span>
             <button type="button" onClick={() => {setRecordedUrl(null); onRecordComplete('');}} className="text-xs text-red-500 hover:underline ml-2">Delete</button>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Tap microphone to record instructions</p>
        )}
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
        setTimeLeft(null); // Expired
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return <Badge color="red">Deadline Passed</Badge>;

  const isUrgent = timeLeft.h < 24;

  return (
    <div className={clsx(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
      isUrgent ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
    )}>
      <Clock className="w-4 h-4 animate-pulse" />
      <span className="font-mono font-bold text-sm">
        {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s
      </span>
      {isUrgent && <span className="text-[10px] uppercase font-bold ml-1">Urgent</span>}
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
      // Simulate scan
      setTimeout(() => {
        if (file.name.includes('virus')) setStatus('DANGER');
        else {
           setStatus('SAFE');
           onFileSelect(file);
        }
      }, 1500);
    }
  };

  return (
    <div>
      <input type="file" ref={inputRef} onChange={handleFile} accept={accept} className="hidden" />
      <button 
        type="button" 
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all",
          status === 'IDLE' && "border-slate-300 dark:border-slate-700 hover:border-primary-500",
          status === 'SCANNING' && "border-blue-300 bg-blue-50 dark:bg-blue-900/10",
          status === 'SAFE' && "border-green-300 bg-green-50 dark:bg-green-900/10",
          status === 'DANGER' && "border-red-300 bg-red-50 dark:bg-red-900/10"
        )}
      >
        {status === 'IDLE' && <span className="text-sm text-slate-500">Click to upload (Auto-Scanned)</span>}
        {status === 'SCANNING' && <div className="flex items-center gap-2 text-blue-600 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Scanning for viruses...</div>}
        {status === 'SAFE' && <div className="flex items-center gap-2 text-green-600 text-sm"><ShieldCheck className="w-4 h-4" /> Verified Safe</div>}
        {status === 'DANGER' && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertTriangle className="w-4 h-4" /> Threat Detected</div>}
      </button>
    </div>
  );
};
