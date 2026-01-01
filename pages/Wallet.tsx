import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../components/UI';
import { User, Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Lock, CreditCard, Smartphone, Building, Wallet as WalletIcon, RefreshCw, AlertCircle, Plus, ShieldCheck, Zap } from 'lucide-react';
import { API, getErrorMessage, getIsDemoMode } from '../services/api';
import { clsx } from 'clsx';

// Type declaration for Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface WalletProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const Wallet: React.FC<WalletProps> = ({ user, onUpdateUser }) => {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [withdrawSpeed, setWithdrawSpeed] = useState<'STANDARD' | 'INSTANT'>('STANDARD');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'RAZORPAY' | null>('RAZORPAY');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  useEffect(() => {
    loadTransactions();
  }, [user.id]);

  const loadTransactions = async () => {
      setIsLoadingHistory(true);
      try {
        const txs = await API.wallet.getTransactions(user.id);
        setTransactions(txs);
      } catch (e) {
          console.error("Ledger Load Failure:", getErrorMessage(e));
      } finally {
          setIsLoadingHistory(false);
      }
  };

  const initializeRazorpayPayment = () => {
    if (!amountToAdd || isNaN(Number(amountToAdd))) return;
    
    setIsProcessing(true);
    const amountInPaise = Math.round(parseFloat(amountToAdd) * 100);

    const options = {
      // Razorpay Key ID provided by the user
      key: "rzp_test_RycOZpKplMZ1ri", 
      amount: amountInPaise,
      currency: "INR",
      name: "TaskLink Wallet",
      description: "Wallet Refill - Secure Student Transaction",
      image: "https://api.dicebear.com/7.x/initials/svg?seed=TL",
      handler: async function (response: any) {
        // This callback executes on successful payment
        try {
          const updatedUser = await API.wallet.addFunds(
            user, 
            parseFloat(amountToAdd), 
            `Razorpay: ${response.razorpay_payment_id}`
          );
          onUpdateUser(updatedUser);
          await loadTransactions();
          setShowAddFunds(false);
          alert(`Success! Payment ID: ${response.razorpay_payment_id}`);
        } catch (error) {
          alert("Wallet update failed: " + getErrorMessage(error));
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: "" 
      },
      notes: {
        userId: user.id,
        purpose: "wallet_deposit"
      },
      theme: {
        color: "#6366f1"
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleWithdraw = async () => {
      if (!withdrawAmount || Number(withdrawAmount) > user.balance) return;
      setIsWithdrawing(true);
      try {
          const updatedUser = await API.wallet.withdrawFunds(user, Number(withdrawAmount), withdrawMethod, withdrawDetails, withdrawSpeed === 'INSTANT');
          onUpdateUser(updatedUser);
          await loadTransactions();
          setShowWithdraw(false);
          alert("Withdrawal request initiated via RazorpayX Payouts.");
      } catch (e) {
          alert(getErrorMessage(e));
      } finally {
          setIsWithdrawing(false);
      }
  };

  const isIncoming = (type: string) => ['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND', 'DISPUTE_RESOLUTION'].includes(type);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tighter mb-2">Assets</h1>
              <p className="text-slate-400 font-medium">Manage your capital and escrowed funds via Razorpay.</p>
          </div>
          <button onClick={() => loadTransactions()} className="p-3 text-slate-400 hover:text-indigo-500 transition-colors">
              <RefreshCw className={clsx("w-5 h-5", isLoadingHistory && "animate-spin")} />
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative h-64 rounded-[2.5rem] bg-indigo-600 p-10 text-white shadow-2xl shadow-indigo-600/30 overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none group-hover:bg-white/20 transition-all"></div>
          
          <div className="relative z-10">
              <p className="label-premium !text-white/60 mb-2">Available Capital</p>
              <h2 className="text-5xl font-display font-black tracking-tighter">₹{user.balance.toLocaleString()}</h2>
          </div>

          <div className="flex gap-4 relative z-10">
             <button onClick={() => setShowAddFunds(true)} className="flex-1 bg-white text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
               <Plus className="w-4 h-4" /> Add Cash
             </button>
             <button onClick={() => setShowWithdraw(true)} className="flex-1 bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-800 transition-all flex items-center justify-center gap-2 border border-white/10">
               <ArrowUpRight className="w-4 h-4" /> Withdraw
             </button>
          </div>
        </div>

        <Card className="!p-10 flex flex-col justify-between border-transparent !bg-amber-500/5 hover:border-amber-500/20 transition-all">
           <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="label-premium !text-amber-600">Escrow Containment</span>
              </div>
              <p className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tighter mb-2">₹{user.escrowBalance.toLocaleString()}</p>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Secured in student smart vault. Protected by Escrow Protocol.</p>
           </div>
           <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-amber-500 w-1/3"></div>
           </div>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-10">
            <h3 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Financial Ledger</h3>
            <div className="flex bg-slate-100/50 dark:bg-white/5 p-1 rounded-xl">
                {['ALL', 'INCOME', 'EXPENSE'].map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f as any)} className={clsx("px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", historyFilter === f ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400')}>{f}</button>
                ))}
            </div>
        </div>

        <div className="space-y-3">
          {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin opacity-30" />
                  <p className="label-premium">Syncing Ledger...</p>
              </div>
          ) : transactions.length === 0 ? (
             <div className="py-24 text-center glass-panel border-dashed rounded-[3rem] border-slate-200 dark:border-white/5">
                 <WalletIcon className="w-12 h-12 text-slate-200 dark:text-white/10 mx-auto mb-6" />
                 <p className="label-premium">No Transactions Yet</p>
             </div>
          ) : (
             transactions.filter(tx => historyFilter === 'ALL' || (historyFilter === 'INCOME' ? isIncoming(tx.type) : !isIncoming(tx.type))).map((tx) => {
                const incoming = isIncoming(tx.type);
                return (
                    <Card key={tx.id} className="!p-5 hover:border-indigo-500/10 transition-all border-transparent flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                            <div className={clsx("p-3 rounded-2xl shrink-0 transition-all group-hover:scale-110", incoming ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-white/5 text-slate-500")}>
                                {incoming ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-slate-800 dark:text-white tracking-tight">{tx.description}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{tx.type.replace(/_/g, ' ')}</span>
                                    <span className="text-[9px] text-slate-300 dark:text-slate-600 uppercase font-bold">{new Date(tx.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <span className={clsx("text-xl font-display font-black tracking-tight", incoming ? "text-emerald-500" : "text-slate-900 dark:text-white")}>
                            {incoming ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </span>
                    </Card>
                );
             })
          )}
        </div>
      </div>

      <Modal isOpen={showAddFunds} onClose={() => !isProcessing && setShowAddFunds(false)} title="Capital Deposit">
         <div className="space-y-8 p-4">
            <div className="space-y-2">
                <label className="label-premium">Deposit Amount (₹)</label>
                <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300">₹</span>
                    <input type="number" className="w-full pl-8 text-4xl font-display font-black text-slate-900 dark:text-white bg-transparent outline-none focus:text-indigo-600 transition-colors" placeholder="0.00" value={amountToAdd} onChange={e => setAmountToAdd(e.target.value)} />
                </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Razorpay Secured</p>
                    <p className="text-[10px] text-slate-400 font-medium">Cards, UPI, and Netbanking supported.</p>
                </div>
            </div>

            <Button className="w-full h-16 text-lg" onClick={initializeRazorpayPayment} disabled={!amountToAdd || Number(amountToAdd) <= 0} isLoading={isProcessing}>
                <Zap className="w-5 h-5 mr-2" /> Pay with Razorpay
            </Button>
         </div>
      </Modal>

      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Secure Withdrawal">
         <div className="space-y-8 p-4">
            <div className="space-y-2 text-center">
                <label className="label-premium block mb-4">Transfer Amount</label>
                <input type="number" className="w-full text-5xl font-display font-black text-slate-900 dark:text-white bg-transparent outline-none text-center focus:text-indigo-600 transition-colors" placeholder="0.00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">Available: ₹{user.balance.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setWithdrawMethod('UPI')} className={clsx("p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", withdrawMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-white' : 'border-slate-100 dark:border-white/5 text-slate-400')}>
                        <Smartphone className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">UPI Transfer</span>
                    </button>
                    <button onClick={() => setWithdrawMethod('BANK')} className={clsx("p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", withdrawMethod === 'BANK' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-white' : 'border-slate-100 dark:border-white/5 text-slate-400')}>
                        <Building className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Bank NEFT</span>
                    </button>
                </div>

                <Input 
                    label={withdrawMethod === 'UPI' ? "UPI VPA (example@upi)" : "Account Number & IFSC"} 
                    placeholder={withdrawMethod === 'UPI' ? "student@okaxis" : "12345678, SBIN000..."} 
                    value={withdrawDetails} 
                    onChange={e => setWithdrawDetails(e.target.value)} 
                />

                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setWithdrawSpeed('STANDARD')} className={clsx("p-4 rounded-2xl border-2 text-left transition-all", withdrawSpeed === 'STANDARD' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-white/5')}>
                      <span className="block font-black text-xs uppercase tracking-widest mb-1 text-slate-900 dark:text-white">Standard</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">24-48h • ₹0 Fee</span>
                   </button>
                   <button onClick={() => setWithdrawSpeed('INSTANT')} className={clsx("p-4 rounded-2xl border-2 text-left transition-all", withdrawSpeed === 'INSTANT' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-white/5')}>
                      <span className="block font-black text-xs uppercase tracking-widest mb-1 text-slate-900 dark:text-white">IMPS Instant</span>
                      <span className="text-[10px] text-indigo-500 uppercase font-bold tracking-tight">5m • 2% Fee</span>
                   </button>
                </div>
            </div>

            <Button className="w-full h-16 text-lg" variant="glow" onClick={handleWithdraw} isLoading={isWithdrawing} disabled={!withdrawAmount || !withdrawDetails || Number(withdrawAmount) > user.balance}>
                Confirm Payout
            </Button>
         </div>
      </Modal>
    </div>
  );
};