
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { API } from '../services/api';
import { Task, User, TaskStatus, VerificationStatus } from '../types';
import { AlertTriangle, Check, X, ShieldAlert, Eye } from 'lucide-react';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DISPUTES' | 'VERIFICATIONS'>('OVERVIEW');
  const [disputedTasks, setDisputedTasks] = useState<Task[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
      setIsLoading(true);
      if (activeTab === 'DISPUTES') {
          const tasks = await API.admin.getDisputedTasks();
          setDisputedTasks(tasks);
      } else if (activeTab === 'VERIFICATIONS') {
          const users = await API.admin.getPendingVerifications();
          setPendingVerifications(users);
      }
      setIsLoading(false);
  };

  const handleVerify = async (userId: string, approve: boolean) => {
      await API.admin.verifyUser(userId, approve);
      loadAdminData();
  };

  const handleResolveDispute = async (taskId: string, decision: 'REFUND_POSTER' | 'PAY_EXECUTOR') => {
      if(!window.confirm(`Are you sure you want to ${decision === 'REFUND_POSTER' ? 'Refund Poster' : 'Pay Executor'}?`)) return;
      await API.admin.resolveDispute(taskId, decision);
      loadAdminData();
  };

  const data = [
    { name: 'Mon', tasks: 4, value: 2400 },
    { name: 'Tue', tasks: 3, value: 1390 },
    { name: 'Wed', tasks: 9, value: 9800 },
    { name: 'Thu', tasks: 12, value: 3900 },
    { name: 'Fri', tasks: 8, value: 4800 },
    { name: 'Sat', tasks: 15, value: 3800 },
    { name: 'Sun', tasks: 10, value: 4300 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            {['OVERVIEW', 'DISPUTES', 'VERIFICATIONS'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </div>
      
      {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <Card className="p-6 h-80">
            <h3 className="font-bold text-slate-700 mb-4">Task Volume (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </Card>

            <Card className="p-6 h-80">
            <h3 className="font-bold text-slate-700 mb-4">Transaction Volume (₹)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="value" stroke="#005BFF" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
            </ResponsiveContainer>
            </Card>
          </div>
      )}

      {activeTab === 'DISPUTES' && (
          <div className="space-y-4 animate-in fade-in">
              {disputedTasks.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed text-slate-400">
                      No active disputes.
                  </div>
              ) : (
                  disputedTasks.map(task => (
                      <Card key={task.id} className="p-6 border-l-4 border-l-red-500">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <Badge color="red">DISPUTED</Badge>
                                      <span className="text-sm font-mono text-slate-400">ID: {task.id}</span>
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                                  <p className="text-slate-500 text-sm">Escrow Amount: <span className="font-bold text-green-600">₹{task.budget}</span></p>
                              </div>
                              <div className="text-right text-sm">
                                  <p>Poster: <span className="font-semibold">{task.posterName}</span></p>
                                  <p>Executor: <span className="font-semibold">{task.offers.find(o => o.userId === task.executorId)?.doerName}</span></p>
                              </div>
                          </div>
                          
                          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                              <Button size="sm" variant="outline" onClick={() => handleResolveDispute(task.id, 'REFUND_POSTER')}>
                                  Refund Poster
                              </Button>
                              <Button size="sm" onClick={() => handleResolveDispute(task.id, 'PAY_EXECUTOR')}>
                                  Release to Executor
                              </Button>
                          </div>
                      </Card>
                  ))
              )}
          </div>
      )}

      {activeTab === 'VERIFICATIONS' && (
          <div className="space-y-4 animate-in fade-in">
              {pendingVerifications.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed text-slate-400">
                      No pending verifications.
                  </div>
              ) : (
                  pendingVerifications.map(user => (
                      <Card key={user.id} className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                              <div className="w-full md:w-1/3 bg-slate-100 rounded-lg h-48 flex items-center justify-center overflow-hidden border border-slate-200">
                                  {user.verificationDocUrl ? (
                                      <img src={user.verificationDocUrl} alt="ID Doc" className="w-full h-full object-contain" />
                                  ) : (
                                      <span className="text-slate-400 text-xs">No Image</span>
                                  )}
                              </div>
                              <div className="flex-1">
                                  <h3 className="font-bold text-lg text-slate-900 mb-1">{user.name}</h3>
                                  <p className="text-sm text-slate-500 mb-4">{user.college} • {user.email}</p>
                                  
                                  <div className="flex gap-3">
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerify(user.id, true)}>
                                          <Check className="w-4 h-4 mr-2" /> Approve
                                      </Button>
                                      <Button size="sm" variant="danger" onClick={() => handleVerify(user.id, false)}>
                                          <X className="w-4 h-4 mr-2" /> Reject
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      </Card>
                  ))
              )}
          </div>
      )}
    </div>
  );
};
