
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../components/UI';
import { User, Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Lock, CreditCard, Smartphone, Building, Wallet as WalletIcon, CheckCircle2, Filter, RefreshCw, AlertCircle, Clock, Zap } from 'lucide-react';
import { API, getErrorMessage } from '../services/api';
import { supabase } from '../services/supabase';

interface WalletProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const Wallet: React.FC<WalletProps> = ({ user, onUpdateUser }) => {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  
  // Withdrawal State
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [withdrawSpeed, setWithdrawSpeed] = useState<'STANDARD' | 'INSTANT'>('STANDARD');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | null>(null);
  
  // Payment Form State
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentStep, setPaymentStep] = useState<'FORM' | 'PROCESSING' | 'SUCCESS'>('FORM');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  useEffect(() => {
    loadTransactions();

    // Subscribe to realtime transaction updates
    const channel = supabase.channel(`realtime:transactions:${user.id}`)
        .on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
            (payload) => {
                loadTransactions();
            }
        )
        .subscribe();
        
    return () => {
        supabase.removeChannel(channel);
    };
  }, [user.id]);

  const loadTransactions = async () => {
      setIsLoadingHistory(true);
      try {
        const txs = await API.wallet.getTransactions(user.id);
        setTransactions(txs);
      } catch (e) {
          console.error("Failed to load transactions", e);
      } finally {
          setIsLoadingHistory(false);
      }
  };

  const handleAddFunds = async () => {
    if (!amountToAdd || isNaN(Number(amountToAdd)) || !selectedMethod) return;
    
    setPaymentStep('PROCESSING');
    setIsProcessing(true);

    // Simulate Payment Gateway Delay
    setTimeout(async () => {
        try {
            const amount = parseFloat(amountToAdd);
            const updatedUser = await API.wallet.addFunds(user, amount, selectedMethod);
            
            await API.notifications.send(
                user.id,
                "Funds Added",
                `₹${amount} added successfully via ${selectedMethod}.`,
                "SUCCESS",
                "/wallet"
            );

            onUpdateUser(updatedUser);
            await loadTransactions();
            
            setPaymentStep('SUCCESS');
            setIsProcessing(false);
            
            // Auto close after success
            setTimeout(() => {
                setShowAddFunds(false);
                setPaymentStep('FORM');
                setAmountToAdd('');
                setSelectedMethod(null);
                setUpiId(''); setCardNumber(''); setExpiry(''); setCvv(''); setSelectedBank('');
            }, 2000);
            
        } catch (error) {
            console.error(error);
            alert(`Transaction failed: ${getErrorMessage(error)}`);
            setPaymentStep('FORM');
            setIsProcessing(false);
        }
    }, 2000);
  };

  const handleWithdraw = async () => {
      if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;
      if (Number(withdrawAmount) > user.balance) { alert('Insufficient balance'); return; }
      if (!withdrawDetails) { alert('Please enter withdrawal details'); return; }
      
      setIsWithdrawing(true);
      try {
          const isInstant = withdrawSpeed === 'INSTANT';
          const updatedUser = await API.wallet.withdrawFunds(user, Number(withdrawAmount), withdrawMethod, withdrawDetails, isInstant);
          
          await API.notifications.send(
              user.id,
              "Withdrawal Requested",
              `Withdrawal of ₹${withdrawAmount} via ${withdrawMethod} initiated.`,
              "INFO",
              "/wallet"
          );

          onUpdateUser(updatedUser);
          await loadTransactions();
          
          setShowWithdraw(false);
          setWithdrawAmount('');
          setWithdrawDetails('');
          setWithdrawSpeed('STANDARD');
          alert('Withdrawal request successful!');
      } catch (e) {
          alert('Withdrawal failed: ' + getErrorMessage(e));
      } finally {
          setIsWithdrawing(false);
      }
  };

  const isAddFormValid = () => {
      if (!amountToAdd || isNaN(Number(amountToAdd))) return false;
      if (!selectedMethod) return false;
      if (selectedMethod === 'UPI') return upiId.includes('@');
      if (selectedMethod === 'CARD') return cardNumber.length >= 12 && expiry.length >= 4 && cvv.length >= 3;
      if (selectedMethod === 'NETBANKING') return selectedBank !== '';
      return false;
  };

  // --- Logic for displaying transactions ---
  const isIncoming = (type: string) => {
      return ['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND', 'DISPUTE_RESOLUTION'].includes(type);
  };

  const getTransactionConfig = (type: string) => {
      if (isIncoming(type)) {
          return {
              icon: ArrowDownLeft,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-100 dark:bg-emerald-900/20',
              sign: '+',
              label: type.replace(/_/g, ' ')
          };
      } else {
          // Outgoing: WITHDRAWAL, ESCROW_LOCK
          const isWithdrawal = type === 'WITHDRAWAL';
          return {
              icon: ArrowUpRight,
              color: isWithdrawal ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300',
              bg: isWithdrawal ? 'bg-red-100 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800',
              sign: '-',
              label: type.replace(/_/g, ' ')
          };
      }
  };

  const filteredTransactions = transactions.filter(tx => {
      if (historyFilter === 'ALL') return true;
      if (historyFilter === 'INCOME') return isIncoming(tx.type);
      if (historyFilter === 'EXPENSE') return !isIncoming(tx.type);
      return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Balance Card */}
        <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-200 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          
          <p className="text-primary-100 font-medium mb-1">Available Balance</p>
          <h2 className="text-4xl font-bold mb-8">₹{Number(user.balance || 0).toFixed(2)}</h2>
          
          <div className="flex gap-3">
             <button 
                onClick={() => setShowAddFunds(true)}
                className="flex-1 bg-white text-primary-600 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
             >
               <ArrowDownLeft className="w-4 h-4" /> Add Funds
             </button>
             <button 
                onClick={() => setShowWithdraw(true)}
                className="flex-1 bg-primary-700 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary-800 transition-colors flex items-center justify-center gap-2"
             >
               <ArrowUpRight className="w-4 h-4" /> Withdraw
             </button>
          </div>
        </div>

        {/* Escrow Card */}
        <Card className="p-6 flex flex-col justify-center relative overflow-hidden bg-amber-50 dark:bg-slate-800 border-amber-200 dark:border-slate-700">
           <div className="absolute right-0 top-0 p-20 bg-amber-100 dark:bg-amber-900/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
           <div className="flex items-center gap-3 mb-2 relative z-10">
             <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
               <Lock className="w-5 h-5" />
             </div>
             <span className="font-bold text-slate-700 dark:text-slate-200">Locked in Escrow</span>
           </div>
           <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">₹{Number(user.escrowBalance || 0).toFixed(2)}</p>
           <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Funds are held safely here until tasks are completed or refunded.</p>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Transaction History</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setHistoryFilter('ALL')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${historyFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setHistoryFilter('INCOME')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${historyFilter === 'INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Income
                </button>
                <button 
                    onClick={() => setHistoryFilter('EXPENSE')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${historyFilter === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-red-500 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Expense
                </button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[250px]">
          {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-sm">Loading transactions...</p>
              </div>
          ) : filteredTransactions.length === 0 ? (
             <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-[250px]">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                     <WalletIcon className="w-6 h-6 opacity-50" />
                 </div>
                 <p className="font-medium">No transactions found</p>
                 {historyFilter !== 'ALL' && <p className="text-xs mt-1">Try changing the filter</p>}
             </div>
          ) : (
             filteredTransactions.map((tx, idx) => {
                const config = getTransactionConfig(tx.type);
                const Icon = config.icon;
                return (
                    <div key={tx.id} className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx !== filteredTransactions.length -1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-full shrink-0 ${config.bg} ${config.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-white line-clamp-1">{tx.description}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span className={`font-bold text-lg ${config.color} whitespace-nowrap`}>
                            {config.sign}₹{Number(tx.amount || 0).toFixed(2)}
                        </span>
                    </div>
                );
             })
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      <Modal isOpen={showAddFunds} onClose={() => { if(paymentStep === 'FORM') setShowAddFunds(false); }} title="Add Funds to Wallet">
         {paymentStep === 'FORM' && (
            <div className="space-y-6 animate-in fade-in">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                        <input 
                            type="number" 
                            value={amountToAdd}
                            onChange={(e) => setAmountToAdd(e.target.value)}
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none font-bold text-xl text-slate-900 dark:text-white"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Payment Method</label>
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={() => setSelectedMethod('UPI')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedMethod === 'UPI' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Smartphone className="w-6 h-6" />
                            <span className="text-xs font-bold">UPI</span>
                        </button>
                        <button 
                            onClick={() => setSelectedMethod('CARD')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedMethod === 'CARD' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <CreditCard className="w-6 h-6" />
                            <span className="text-xs font-bold">Card</span>
                        </button>
                        <button 
                            onClick={() => setSelectedMethod('NETBANKING')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedMethod === 'NETBANKING' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Building className="w-6 h-6" />
                            <span className="text-xs font-bold">Net Banking</span>
                        </button>
                    </div>
                </div>

                {/* Dynamic Inputs */}
                {selectedMethod && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2">
                        {selectedMethod === 'UPI' && (
                            <div>
                                <Input label="UPI ID" placeholder="e.g. user@oksbi" value={upiId} onChange={e => setUpiId(e.target.value)} />
                            </div>
                        )}
                        {selectedMethod === 'CARD' && (
                            <div className="space-y-3">
                                <Input label="Card Number" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
                                    <Input placeholder="CVV" type="password" value={cvv} onChange={e => setCvv(e.target.value)} maxLength={3} />
                                </div>
                            </div>
                        )}
                        {selectedMethod === 'NETBANKING' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Select Bank</label>
                                <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                                    <option value="">-- Choose Bank --</option>
                                    <option value="sbi">State Bank of India</option>
                                    <option value="hdfc">HDFC Bank</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                <Button className="w-full h-12 text-lg" onClick={handleAddFunds} disabled={!isAddFormValid()}>
                    Pay ₹{amountToAdd || '0'}
                </Button>
            </div>
         )}
         
         {paymentStep === 'PROCESSING' && (
             <div className="flex flex-col items-center justify-center py-10 animate-in fade-in">
                 <RefreshCw className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Processing Payment</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-center">Please wait while we securely add funds to your wallet...</p>
             </div>
         )}

         {paymentStep === 'SUCCESS' && (
             <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in">
                 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-center">Funds have been added to your wallet.</p>
             </div>
         )}
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw Funds">
         <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 flex justify-between items-center">
                <span>Available Balance:</span>
                <span className="font-bold text-lg">₹{user.balance.toFixed(2)}</span>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Amount to Withdraw</label>
                <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                    <input 
                        type="number" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none font-bold text-xl text-slate-900 dark:text-white"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => setWithdrawSpeed('STANDARD')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${withdrawSpeed === 'STANDARD' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700'}`}
               >
                   <div className="flex items-center gap-2 mb-1">
                       <Clock className="w-4 h-4 text-primary-500" />
                       <span className="font-bold text-sm text-slate-800 dark:text-white">Standard</span>
                   </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">24-48 Hours</p>
                   <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">Free</p>
               </button>
               <button 
                  onClick={() => setWithdrawSpeed('INSTANT')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${withdrawSpeed === 'INSTANT' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700'}`}
               >
                   <div className="flex items-center gap-2 mb-1">
                       <Zap className="w-4 h-4 text-amber-500" />
                       <span className="font-bold text-sm text-slate-800 dark:text-white">Instant</span>
                   </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Within 5 mins</p>
                   <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">2% Fee</p>
               </button>
            </div>

            {withdrawSpeed === 'INSTANT' && withdrawAmount && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl flex justify-between items-center text-sm text-amber-800 dark:text-amber-300">
                    <span>Processing Fee (2%):</span>
                    <span className="font-bold">-₹{(Number(withdrawAmount) * 0.02).toFixed(2)}</span>
                </div>
            )}

            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Withdraw To</label>
                <div className="flex gap-3 mb-4">
                    <button 
                        onClick={() => setWithdrawMethod('UPI')} 
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${withdrawMethod === 'UPI' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        UPI Transfer
                    </button>
                    <button 
                        onClick={() => setWithdrawMethod('BANK')} 
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${withdrawMethod === 'BANK' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Bank Transfer
                    </button>
                </div>
                
                <Input 
                    label={withdrawMethod === 'UPI' ? 'UPI ID / VPA' : 'Account Number & IFSC'} 
                    placeholder={withdrawMethod === 'UPI' ? 'username@upi' : 'Account No - IFSC Code'} 
                    value={withdrawDetails}
                    onChange={e => setWithdrawDetails(e.target.value)}
                />
            </div>

            <Button className="w-full h-12 text-lg" onClick={handleWithdraw} isLoading={isWithdrawing} disabled={!withdrawAmount || !withdrawDetails || Number(withdrawAmount) > user.balance}>
                {withdrawSpeed === 'INSTANT' ? `Instant Withdraw ₹${(Number(withdrawAmount) * 0.98).toFixed(2)}` : `Withdraw ₹${withdrawAmount}`}
            </Button>
         </div>
      </Modal>
    </div>
  );
};
