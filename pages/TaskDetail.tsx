
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Task, OfferStatus, TaskStatus, Offer } from '../types';
import { Card, Button, Badge, Modal, TextArea, FileVerifier } from '../components/UI';
import { ShieldCheck, Clock, CheckCircle, Lock, Zap, AlertTriangle, UploadCloud, ThumbsUp, ThumbsDown } from 'lucide-react';
import { API, getErrorMessage } from '../services/api';

interface TaskDetailProps {
  tasks: Task[];
  user: User;
  onUpdateTask: (task: Task) => Promise<void>;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ tasks, user, onUpdateTask }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const task = tasks.find(t => t.id === id);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerMsg, setOfferMsg] = useState('');

  if (!task) return <div className="text-center py-20 text-slate-500">Task Protocol Unavailable</div>;

  const isPoster = task.posterId === user.id;
  const isExecutor = task.executorId === user.id;
  const hasOffered = task.offers.some(o => o.userId === user.id);

  const handleAcceptOffer = async (offer: Offer) => {
    if (!window.confirm(`Escrow funds will be linked to ${offer.doerName}. Proceed?`)) return;
    setIsProcessing(true);
    try {
      const updatedTask = { 
        ...task, 
        status: TaskStatus.ASSIGNED, 
        executorId: offer.userId,
        offers: task.offers.map(o => o.id === offer.id ? { ...o, status: OfferStatus.ACCEPTED } : { ...o, status: OfferStatus.REJECTED })
      };
      await onUpdateTask(updatedTask);
    } finally { setIsProcessing(false); }
  };

  const handleStartWork = async () => {
    await onUpdateTask({ ...task, status: TaskStatus.IN_PROGRESS });
  };

  const handleFinishWork = async () => {
    if (!task.proofs?.final?.length) return alert("Final proof required for escrow eligibility.");
    // Auto-approve in 72h
    const autoDate = new Date();
    autoDate.setHours(autoDate.getHours() + 72);
    await onUpdateTask({ ...task, status: TaskStatus.COMPLETED, autoApproveAt: autoDate.toISOString() });
  };

  const handleApproveAndRelease = async () => {
    if (!window.confirm("This will release locked funds from Escrow to the Helper. This is irreversible.")) return;
    setIsProcessing(true);
    try {
      const updated = await API.tasks.releasePayment(task, user);
      await onUpdateTask(updated);
      alert("Escrow Released. Funds credited to student wallet.");
    } catch (e) {
      alert(getErrorMessage(e));
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-24">
      <div className="lg:col-span-2 space-y-8">
        <Card className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge color={task.status === 'PAID' ? 'green' : 'blue'}>{task.status.replace('_', ' ')}</Badge>
                <span className="label-premium opacity-50">{task.category}</span>
              </div>
              <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tighter">{task.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-3xl font-display font-black text-indigo-600 dark:text-indigo-400">₹{task.budget}</p>
              <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected
              </div>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10 text-lg">{task.description}</p>

          {/* Escrow Status Banner */}
          <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-center">
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Lock className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Financial State: {task.status === 'PAID' ? 'Released' : 'Locked'}</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {task.status === 'OPEN' ? "Funds are secured in TaskLink Treasury waiting for assignment." : 
                   task.status === 'PAID' ? "Assets successfully distributed to executor." :
                   "Funds linked to executor. Release triggered on approval."}
                </p>
             </div>
          </div>
        </Card>

        {/* Proof Section */}
        {(isExecutor || isPoster) && task.status !== 'OPEN' && (
          <Card className="p-10">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                   <UploadCloud className="w-6 h-6 text-indigo-500" /> Deliverables
                </h3>
             </div>
             
             <div className="space-y-6">
                <div className="p-8 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center">
                   {task.proofs?.final?.length ? (
                     <div className="space-y-4 w-full">
                        {task.proofs.final.map(f => (
                          <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                             <span className="text-sm font-bold text-slate-900 dark:text-white">{f.name}</span>
                             <Badge color="green">Verified Safe</Badge>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <p className="text-slate-400 text-sm font-medium">No files submitted yet.</p>
                   )}
                   {isExecutor && task.status === 'IN_PROGRESS' && (
                     <div className="mt-6 w-full">
                        <FileVerifier onFileSelect={(file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const newProof = { id: `f-${Date.now()}`, name: file.name, url: reader.result as string, type: 'DOCUMENT' as any };
                            onUpdateTask({ ...task, proofs: { ...task.proofs, final: [...(task.proofs?.final || []), newProof] } });
                          };
                          reader.readAsDataURL(file);
                        }} />
                     </div>
                   )}
                </div>
             </div>
          </Card>
        )}
      </div>

      {/* Control Sidebar */}
      <div className="space-y-6">
        <Card className="p-8">
           <h4 className="label-premium mb-6">Actions</h4>
           
           {task.status === 'OPEN' && !isPoster && !hasOffered && (
             <Button className="w-full h-14" onClick={() => setShowOfferModal(true)}>Initiate Offer</Button>
           )}

           {task.status === 'ASSIGNED' && isExecutor && (
             <Button className="w-full h-14" variant="glow" onClick={handleStartWork}>Start Execution</Button>
           )}

           {task.status === 'IN_PROGRESS' && isExecutor && (
             <Button className="w-full h-14" variant="success" onClick={handleFinishWork} disabled={!task.proofs?.final?.length}>Submit for Payout</Button>
           )}

           {task.status === 'COMPLETED' && isPoster && (
             <div className="space-y-3">
                <Button className="w-full h-14" variant="glow" onClick={handleApproveAndRelease} isLoading={isProcessing}>Approve & Release ₹{task.budget}</Button>
                <Button className="w-full" variant="outline" onClick={() => onUpdateTask({...task, status: TaskStatus.DISPUTED})}>Raise Dispute</Button>
                <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 mt-4">
                   <Clock className="w-4 h-4 text-amber-500" />
                   <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Auto-release in 72h</p>
                </div>
             </div>
           )}

           {task.status === 'PAID' && (
             <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                   <CheckCircle className="w-8 h-8" />
                </div>
                <h5 className="font-display font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Lifecycle Complete</h5>
             </div>
           )}
        </Card>

        {isPoster && task.status === 'OPEN' && (
          <div className="space-y-4">
             <h4 className="label-premium px-2">Applicant Matrix</h4>
             {task.offers.map(offer => (
               <Card key={offer.id} className="p-6 hover:border-indigo-500/20 transition-all">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm">{offer.doerName}</p>
                        <p className="text-[10px] font-bold text-indigo-500 mt-0.5">{offer.matchScore}% AI Match</p>
                     </div>
                     <span className="font-black text-slate-900 dark:text-white">₹{offer.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-6 italic">"{offer.message}"</p>
                  <Button size="sm" className="w-full" onClick={() => handleAcceptOffer(offer)} isLoading={isProcessing}>Accept & Lock</Button>
               </Card>
             ))}
          </div>
        )}
      </div>

      <Modal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title="Market Proposal">
         <div className="space-y-6 p-4">
            <TextArea label="Proposal Detail" placeholder="Explain why you are the best fit..." value={offerMsg} onChange={e => setOfferMsg(e.target.value)} />
            <Button className="w-full h-14" onClick={async () => {
              const offer: Offer = { id: `o-${Date.now()}`, taskId: task.id, userId: user.id, doerName: user.name, doerRating: user.rating, message: offerMsg, price: task.budget, status: OfferStatus.PENDING, createdAt: new Date().toISOString(), matchScore: 85 };
              await API.tasks.addOffer(offer);
              setShowOfferModal(false);
              alert("Offer submitted to campus matrix.");
            }}>Submit Offer</Button>
         </div>
      </Modal>
    </div>
  );
};
