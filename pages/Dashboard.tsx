
import React, { useState } from 'react';
import { Card, Button, Badge, ProgressBar } from '../components/UI';
import { User, Task, TaskStatus } from '../types';
import { Link } from 'react-router-dom';
import { Wallet, CheckCircle, Clock, ArrowRight, Briefcase, UserPlus, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardProps {
  user: User;
  tasks: Task[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks }) => {
  const [activeTab, setActiveTab] = useState<'HIRING' | 'WORKING'>('WORKING');

  const myPostedTasks = tasks.filter(t => t.posterId === user.id);
  const myActiveWorkingTasks = tasks.filter(t => t.executorId === user.id && [TaskStatus.IN_PROGRESS, TaskStatus.ASSIGNED].includes(t.status));

  const stats = [
    { label: 'Earning Potential', value: `₹${Number(user.escrowBalance || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Net Capital', value: `₹${Number(user.balance || 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Network Reliability', value: '98%', icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const nextDeadline = [...myActiveWorkingTasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tighter">Terminal</h1>
            <Badge color="indigo" className="!rounded-full px-4 py-1.5 opacity-80">Sync: Realtime</Badge>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium tracking-tight">Overview of your student economic activity.</p>
        </div>
        
        <div className="flex bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
           <button 
             onClick={() => setActiveTab('WORKING')}
             className={clsx(
               "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
               activeTab === 'WORKING' ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
             )}
           >
             Performance
           </button>
           <button 
             onClick={() => setActiveTab('HIRING')}
             className={clsx(
               "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
               activeTab === 'HIRING' ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
             )}
           >
             Recruitment
           </button>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="!p-8 group hover:border-indigo-500/30 transition-all border-transparent">
             <div className="flex justify-between items-start">
               <div>
                  <p className="label-premium mb-2">{stat.label}</p>
                  <p className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tighter leading-none">{stat.value}</p>
               </div>
               <div className={clsx("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon className="w-5 h-5" />
               </div>
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {activeTab === 'WORKING' ? (
             <section className="animate-in fade-in slide-in-from-left-6 duration-700">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Operational Queue</h2>
                   <Link to="/tasks" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">Market <ArrowRight className="inline w-3 h-3 ml-1" /></Link>
                </div>

                {myActiveWorkingTasks.length === 0 ? (
                  <div className="text-center py-24 bg-slate-50/50 dark:bg-white/2 rounded-[3rem] border-2 border-dashed border-slate-200/50 dark:border-white/5">
                      <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Standby Mode</h3>
                      <p className="text-slate-400 max-w-xs mx-auto mt-2 mb-8 text-sm">No active performance tasks detected in your queue.</p>
                      <Link to="/tasks"><Button variant="glow" size="lg">Initialize Search</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myActiveWorkingTasks.map(task => (
                      <Card key={task.id} className="!p-0 border-none group overflow-hidden">
                         <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                               <div className="flex items-center gap-4 mb-3">
                                  <Badge color={task.status === 'IN_PROGRESS' ? 'indigo' : 'yellow'} className="!rounded-full px-3 text-[9px]">{task.status.replace('_', ' ')}</Badge>
                                  <span className="label-premium">{task.category}</span>
                               </div>
                               <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-3 group-hover:text-indigo-500 transition-colors">{task.title}</h3>
                               <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
                                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(task.deadline).toLocaleDateString()}</span>
                                  <span className="font-black text-emerald-500">₹{task.budget.toLocaleString()}</span>
                               </div>
                            </div>
                            <Link to={`/tasks/${task.id}`}>
                               <Button variant="secondary" className="w-full md:w-auto px-10">Access Console</Button>
                            </Link>
                         </div>
                         <div className="px-8 pb-8">
                            <ProgressBar value={task.status === 'IN_PROGRESS' ? 65 : 15} color="bg-indigo-600" label="Execution Status" />
                         </div>
                      </Card>
                    ))}
                  </div>
                )}
             </section>
          ) : (
             <section className="animate-in fade-in slide-in-from-right-6 duration-700">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Hiring Matrix</h2>
                   <Link to="/post" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">Deploy Task <ArrowRight className="inline w-3 h-3 ml-1" /></Link>
                </div>

                {myPostedTasks.length === 0 ? (
                   <div className="text-center py-24 bg-slate-50/50 dark:bg-white/2 rounded-[3rem] border-2 border-dashed border-slate-200/50 dark:border-white/5">
                      <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserPlus className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Market Standby</h3>
                      <p className="text-slate-400 max-w-xs mx-auto mt-2 mb-8 text-sm">No recruitment sessions are currently active.</p>
                      <Link to="/post"><Button variant="glow" size="lg">Initialize Post</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPostedTasks.map(task => (
                       <Card key={task.id} className="p-8 hover:border-indigo-500/20 transition-all">
                          <div className="flex justify-between items-start mb-6">
                             <div>
                                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-2">{task.title}</h3>
                                <p className="label-premium opacity-50">Ref: {task.id.slice(0,8).toUpperCase()}</p>
                             </div>
                             <Badge color={task.status === 'OPEN' ? 'green' : 'gray'} className="!rounded-full px-3">{task.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                             <div className="flex items-center gap-10">
                                <div>
                                   <p className="label-premium mb-1">Budget</p>
                                   <p className="text-lg font-black text-slate-900 dark:text-white leading-none">₹{task.budget.toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="label-premium mb-1">Applicants</p>
                                   <p className="text-lg font-black text-indigo-500 leading-none">{task.offers?.length || 0}</p>
                                </div>
                             </div>
                             <Link to={`/tasks/${task.id}`}>
                                <Button size="sm" variant="outline" className="px-6">Control</Button>
                             </Link>
                          </div>
                       </Card>
                    ))}
                  </div>
                )}
             </section>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           {nextDeadline && (
             <Card className="p-8 !bg-rose-500/5 border-rose-500/10">
                <div className="flex items-center gap-3 mb-6 text-rose-500 animate-pulse">
                   <Clock className="w-5 h-5" />
                   <span className="label-premium !text-rose-500">Immediate Attention</span>
                </div>
                <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white tracking-tight mb-2">Priority Conflict</h4>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Task "{nextDeadline.title}" requires final execution before the deadline window closes.</p>
                <Link to={`/tasks/${nextDeadline.id}`} className="w-full">
                   <Button variant="danger" className="w-full h-14">View Details</Button>
                </Link>
             </Card>
           )}

           <Card className="p-8">
              <h4 className="label-premium mb-8">Recent Ledger</h4>
              <div className="space-y-5">
                 {[
                   { label: 'Asset Release', amount: '+₹1,200', type: 'IN' },
                   { label: 'Escrow Reserve', amount: '-₹450', type: 'OUT' },
                   { label: 'Capital Injection', amount: '+₹500', type: 'IN' },
                 ].map((flow, i) => (
                    <div key={i} className="flex justify-between items-center">
                       <span className="text-[13px] text-slate-500 font-medium">{flow.label}</span>
                       <span className={clsx("text-[13px] font-black tracking-tight", flow.type === 'IN' ? "text-emerald-500" : "text-slate-400")}>{flow.amount}</span>
                    </div>
                 ))}
              </div>
              <Link to="/wallet" className="mt-10 block">
                 <Button variant="secondary" size="sm" className="w-full">Financial Center</Button>
              </Link>
           </Card>

           <Card className="p-8 !bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-2xl shadow-indigo-600/20">
              <Sparkles className="w-8 h-8 mb-6 text-white/50" />
              <h4 className="text-xl font-display font-black tracking-tighter mb-3">Efficiency Insight</h4>
              <p className="text-white/80 text-sm font-medium leading-relaxed mb-8">
                 You are in the top 5% of responders. Maintain this velocity to unlock exclusive high-budget academic missions.
              </p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-3/4"></div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
