
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI';
import { ArrowLeft, Lock, Eye, Fingerprint } from 'lucide-react';

export const Privacy: React.FC = () => {
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
          <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20 shadow-glow-sm">
            <Fingerprint className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
            <p className="text-slate-500 dark:text-slate-400">Your data belongs to you. Period.</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-8 space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Data Collection</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                We collect your name, university email, and ID for verification purposes only. Your location data is used solely to show you nearby tasks and is never sold to third parties.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Data Usage</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your profile information is visible to other students on the platform to build trust. Private documents (IDs, proof of work) are encrypted and accessible only to you and necessary admin oversight during disputes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3">Security</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                All transactions are processed through secure gateways. We use enterprise-grade encryption for all user data and regularly perform safety audits on our database.
              </p>
            </section>

            <div className="pt-6 border-t border-slate-100 dark:border-white/5 text-center">
              <p className="text-sm text-slate-400 italic">
                TaskLink complies with major data protection regulations. You can request your data deletion at any time from your profile settings.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
