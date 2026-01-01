
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge } from '../components/UI';
import { ArrowLeft, ShieldCheck, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Safety: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background pb-20 pt-12 px-4 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-glow-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Safety Guide</h1>
            <p className="text-slate-500 dark:text-slate-400">Keep your earning experience safe and secure.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2 mb-4">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                 <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Use Escrow</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Always keep your transactions within TaskLink. Our escrow system ensures you get paid for your work and the poster gets what they paid for.
              </p>
            </Card>

            <Card className="p-6 border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-4">
                 <MapPin className="w-5 h-5 text-blue-500" />
                 <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Public Meetings</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                For in-person tasks, always meet in well-lit, public campus locations (libraries, cafeterias, student centers). Tell a friend where you are going.
              </p>
            </Card>
          </div>

          <Card className="p-8 border-red-100 dark:border-red-900/30 bg-red-50/10">
            <h2 className="text-xl font-display font-bold text-red-700 dark:text-red-400 mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" /> Red Flags to Watch For
            </h2>
            <ul className="space-y-4">
              {[
                "Anyone asking to communicate outside the platform (WhatsApp, Telegram).",
                "Requests for direct bank transfers or UPI payments outside our escrow.",
                "Users with suspicious, unverified, or incomplete profiles.",
                "Task descriptions that sound too good to be true or involve illegal acts."
              ].map((flag, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 p-4 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50">
               <p className="text-sm font-bold text-slate-800 dark:text-white">
                 See something suspicious? Report it immediately via the 'Dispute' or 'Report' buttons on any task.
               </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
