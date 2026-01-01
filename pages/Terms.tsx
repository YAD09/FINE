
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/UI';
import { ArrowLeft, ShieldCheck, Scale, FileText } from 'lucide-react';

export const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background pb-20 pt-12 px-4 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to TaskLink
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20 shadow-glow-sm">
            <Scale className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
            <p className="text-slate-500 dark:text-slate-400">Last updated: January 2025</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                By accessing TaskLink, you agree to be bound by these Terms of Service. This platform is designed exclusively for verified students. Any misuse of the platform or violation of these terms may result in immediate account suspension.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3">2. Escrow & Payments</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                TaskLink operates an Escrow-based payment system. When a task is posted, funds are locked in our secure vault. Funds are released to the executor only upon the poster's approval of the completed work. TaskLink takes a 5% service fee on all successful transactions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3">3. User Verification</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                To maintain a safe campus community, users must provide valid University ID documentation. You agree that all information provided is accurate. Falsifying identity is strictly prohibited and will be reported to relevant authorities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3">4. Conduct & Deliverables</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                TaskLink does not tolerate plagiarism, harassment, or illegal activities. Users are responsible for the quality of their work and the fulfillment of their task descriptions. Disputed tasks are reviewed by our admin team whose decision is final.
              </p>
            </section>

            <div className="pt-6 border-t border-slate-100 dark:border-white/5">
              <p className="text-sm text-slate-400">
                Questions about our terms? Contact our legal team at legal@tasklink.edu
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
