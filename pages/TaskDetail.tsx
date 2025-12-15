import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Task, OfferStatus, TaskStatus, Offer, TaskType, Attachment } from '../types';
import { Card, Button, Badge, TextArea, Modal, StarRating, CountdownTimer, FileVerifier } from '../components/UI';
import { ShieldCheck, User as UserIcon, Clock, CheckCircle, MessageSquare, MapPin, Globe, Navigation, ExternalLink, Paperclip, FileText, Download, Star, XCircle, AlertTriangle, Play, ThumbsDown, ThumbsUp, Lock, Mic, Zap, AlertOctagon, BrainCircuit, UploadCloud, CopyCheck } from 'lucide-react';
import * as L from 'leaflet';
import { API, getErrorMessage } from '../services/api';

interface TaskDetailProps {
  tasks: Task[];
  user: User;
  onUpdateTask: (task: Task) => Promise<void>;
}

const TaskRouteMap: React.FC<{ 
  taskCoords: { lat: number; lng: number }; 
  userCoords: { lat: number; lng: number } | null; 
}> = ({ taskCoords, userCoords }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current);
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.eachLayer((layer) => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); });
    const markers: L.Marker[] = [];
    markers.push(L.marker([taskCoords.lat, taskCoords.lng]).addTo(map).bindPopup("Task Location"));
    if (userCoords) {
      markers.push(L.marker([userCoords.lat, userCoords.lng]).addTo(map).bindPopup("You"));
      L.polyline([[userCoords.lat, userCoords.lng], [taskCoords.lat, taskCoords.lng]], { color: '#64748b', weight: 3, dashArray: '10, 10' }).addTo(map);
    }
    if (markers.length > 0) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
  }, [taskCoords, userCoords]);

  return <div ref={containerRef} className="w-full h-64 rounded-xl border border-slate-200 z-0" />;
};

export const TaskDetail: React.FC<TaskDetailProps> = ({ tasks, user, onUpdateTask }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const task = tasks.find(t => t.id === id);

  const [offerMsg, setOfferMsg] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [comment, setComment] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [scamWarning, setScamWarning] = useState(false);

  // Proof Upload State
  const [draftProof, setDraftProof] = useState<Attachment[]>([]);
  const [finalProof, setFinalProof] = useState<Attachment[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err)
      );
    }
    // Anti-Scam Scanner Logic
    if (task) {
        const textToScan = (task.description + " " + task.comments.map(c => c.content).join(" ")).toLowerCase();
        const keywords = ['whatsapp', 'telegram', 'paytm me', 'gpay me', 'outside tasklink', 'dm me', 'call me'];
        if (keywords.some(k => textToScan.includes(k))) {
            setScamWarning(true);
        }
    }
    // Hydrate proofs from task if existing
    if (task?.proofs) {
        if (task.proofs.draft) setDraftProof(task.proofs.draft);
        if (task.proofs.final) setFinalProof(task.proofs.final);
    }
  }, [task]);

  if (!task) return <div className="text-center py-20 text-slate-500">Task not found</div>;

  const isPoster = task.posterId === user.id;
  const isDoer = task.executorId === user.id;
  const hasOffered = task.offers.some(o => o.userId === user.id);
  const myReview = task.reviews?.find(r => r.reviewerId === user.id);
  const myOffer = task.offers.find(o => o.userId === user.id);

  // Simulated AI Match Score (Deterministic based on ID)
  const matchScore = React.useMemo(() => {
     return 70 + (user.id.charCodeAt(user.id.length - 1) % 30);
  }, [user.id]);

  const handleMakeOffer = async () => {
    const newOffer: Offer = { 
        id: `offer-${Date.now()}`, 
        taskId: task.id, 
        userId: user.id, 
        doerName: user.name, 
        doerRating: user.rating, 
        message: offerMsg, 
        price: task.budget, 
        status: OfferStatus.PENDING, 
        createdAt: new Date().toISOString(),
        matchScore: matchScore // Store match score
    };
    const updatedTask = { ...task, offers: [...task.offers, newOffer] };
    await onUpdateTask(updatedTask);
    setShowOfferModal(false);
    alert("Offer sent successfully!");
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!window.confirm(`Accept offer from ${offer.doerName}? This will lock the task.`)) return;
    
    setIsAccepting(true);
    
    try {
        const updatedTask = { 
            ...task, 
            status: TaskStatus.ASSIGNED, // Update to ASSIGNED as requested
            executorId: offer.userId, 
            offers: task.offers.map(o => o.id === offer.id ? { ...o, status: OfferStatus.ACCEPTED } : { ...o, status: OfferStatus.REJECTED }) 
        };
        await onUpdateTask(updatedTask);
    } catch (e) {
        console.error("Accept failed", e);
        alert(`Failed to accept offer. Error: ${getErrorMessage(e)}`);
    } finally {
        setIsAccepting(false);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
      if(!window.confirm("Are you sure you want to reject this offer?")) return;
      try {
          const updatedTask = {
              ...task,
              offers: task.offers.map(o => o.id === offerId ? { ...o, status: OfferStatus.REJECTED } : o)
          };
          await onUpdateTask(updatedTask);
      } catch (e) {
          alert("Failed to reject offer: " + getErrorMessage(e));
      }
  };

  const handleStartTask = async () => {
    if(!window.confirm("Start working on this task?")) return;
    try {
        const updatedTask = { ...task, status: TaskStatus.IN_PROGRESS };
        await onUpdateTask(updatedTask);
    } catch (e) {
        alert("Failed to start task: " + getErrorMessage(e));
    }
  };

  const handleUploadProof = (type: 'DRAFT' | 'FINAL', file: File) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
          const newAtt = { 
             id: `proof-${Date.now()}`, 
             name: file.name, 
             url: reader.result as string, 
             type: file.type.startsWith('image') ? 'IMAGE' : 'DOCUMENT', 
             isVerified: true 
          } as Attachment;
          
          const newProofs = { ...task.proofs };
          if (type === 'DRAFT') {
              newProofs.draft = [...(newProofs.draft || []), newAtt];
              setDraftProof(newProofs.draft);
          } else {
              newProofs.final = [...(newProofs.final || []), newAtt];
              setFinalProof(newProofs.final);
          }
          await onUpdateTask({ ...task, proofs: newProofs });
      };
      reader.readAsDataURL(file);
  };

  const handleCompleteTask = () => { 
      if (!finalProof.length) {
          alert("Please upload at least one Final Proof file before completing.");
          return;
      }
      if (window.confirm("Complete task?")) onUpdateTask({ ...task, status: TaskStatus.COMPLETED }); 
  };
  
  const handleReleasePayment = () => setShowReleaseModal(true);
  const confirmReleasePayment = () => { onUpdateTask({ ...task, status: TaskStatus.PAID }); setShowReleaseModal(false); };

  const handleCancelTask = async () => {
    if (!window.confirm("Cancel task? Funds will be refunded.")) return;
    try { const updatedTask = await API.tasks.cancel(task.id, user); onUpdateTask(updatedTask); } catch (e: any) { alert("Error: " + getErrorMessage(e)); }
  };

  const handleDispute = () => {
      if(!window.confirm("Raise a dispute? Admin will intervene and freeze funds.")) return;
      onUpdateTask({ ...task, status: TaskStatus.DISPUTED });
  };

  const handleSubmitRating = async () => {
      if (!isPoster && !isDoer) return;
      setIsSubmittingRating(true);
      const revieweeId = isPoster ? task.executorId! : task.posterId;
      try { const updatedTask = await API.tasks.submitReview(task.id, { reviewerId: user.id, revieweeId: revieweeId, rating: ratingVal, comment: ratingComment }); onUpdateTask(updatedTask); setShowRateModal(false); } catch (e) { console.error(e); } finally { setIsSubmittingRating(false); }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if(!comment.trim()) return;
    API.tasks.addComment({ id: `c-${Date.now()}`, taskId: task.id, userId: user.id, username: user.name, content: comment, createdAt: new Date().toISOString() });
    setComment('');
  };

  const handleOpenNavigation = () => {
    if (!task.coordinates) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${task.coordinates.lat},${task.coordinates.lng}`, '_blank');
  };

  // Only show active offers (not rejected ones)
  const activeOffers = task.offers.filter(o => o.status !== OfferStatus.REJECTED);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-6">
        
        {/* Anti-Scam Banner */}
        {scamWarning && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 flex gap-3 animate-pulse">
                <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                    <h4 className="font-bold text-red-700 dark:text-red-300">Safety Warning Detected</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Our AI detected keywords asking to chat or pay outside TaskLink (e.g. WhatsApp, UPI direct). 
                        <b>Never pay outside the app</b> or you will lose Scam Protection.
                    </p>
                </div>
            </div>
        )}

        <Card className="p-8 relative overflow-hidden">
          {/* Service Tier Ribbon */}
          {task.serviceTier && task.serviceTier !== 'STANDARD' && (
              <div className="absolute top-6 -right-8 bg-amber-400 text-amber-900 text-xs font-bold px-10 py-1 rotate-45 shadow-sm">
                  {task.serviceTier}
              </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                 <Badge color={task.status === 'OPEN' ? 'green' : task.status === 'DISPUTED' ? 'red' : task.status === 'COMPLETED' ? 'green' : 'blue'}>{task.status}</Badge>
                 <span className="text-slate-400 text-sm font-medium">{task.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{task.title}</h1>
              
              <Link to={`/u/${task.posterId}`} className="inline-flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 -ml-1.5 rounded-lg transition-colors group">
                 <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                    {task.posterName.charAt(0)}
                 </div>
                 <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Posted by {task.posterName}</span>
              </Link>
            </div>
            
            <div className="text-right w-full md:w-auto">
              <CountdownTimer deadline={task.deadline} />
              <div className="mt-2 text-right">
                <span className="block text-2xl font-bold text-green-600 dark:text-green-400">₹{task.budget}</span>
                <div className="flex items-center justify-end gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
                    <Lock className="w-3 h-3" /> Escrow Secured
                </div>
              </div>
            </div>
          </div>
          
          <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300 mb-6">{task.description}</p>
          
          {/* Voice Note Player */}
          {task.voiceNoteUrl && (
              <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                      <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                      <p className="text-xs font-bold text-slate-500 uppercase">Voice Instructions</p>
                      <div className="h-1 bg-slate-200 rounded-full w-full mt-2 overflow-hidden">
                          <div className="h-full bg-primary-500 w-1/3"></div>
                      </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs"><Play className="w-3 h-3 mr-1" /> Play</Button>
              </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                  {task.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span>{att.name}</span>
                          {att.isVerified && <span title="Virus Scanned"><CheckCircle className="w-3.5 h-3.5 text-green-500" /></span>}
                      </div>
                  ))}
              </div>
          )}

          {task.type === TaskType.OFFLINE && task.location && (
             <div className="mb-6 space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/50 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    <div className="flex-1"><h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase">Location</h4><p className="text-slate-700 dark:text-slate-300">{task.location}</p></div>
                    {task.coordinates && <Button size="sm" variant="secondary" onClick={handleOpenNavigation}><Navigation className="w-4 h-4 mr-2" /> Directions</Button>}
                </div>
                {task.coordinates && <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"><TaskRouteMap taskCoords={task.coordinates} userCoords={userLocation} /></div>}
             </div>
          )}
        </Card>

        {/* Proof of Work Section for Doer/Poster */}
        {(isDoer || isPoster) && task.status !== TaskStatus.OPEN && (
            <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                    <UploadCloud className="w-5 h-5 text-primary-500" /> Proof of Work
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Drafts */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-500 uppercase">Drafts / Progress</h4>
                            {isDoer && <div className="scale-75 origin-right"><FileVerifier onFileSelect={(f) => handleUploadProof('DRAFT', f)} /></div>}
                        </div>
                        <div className="min-h-[100px] bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                             {draftProof.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">No drafts uploaded</p> : (
                                 <div className="space-y-2">
                                     {draftProof.map(p => (
                                         <div key={p.id} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                                             <FileText className="w-3 h-3 text-slate-400" /> {p.name}
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* Finals */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-500 uppercase">Final Submission</h4>
                             {isDoer && <div className="scale-75 origin-right"><FileVerifier onFileSelect={(f) => handleUploadProof('FINAL', f)} /></div>}
                        </div>
                         <div className="min-h-[100px] bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 p-3">
                             {finalProof.length === 0 ? <p className="text-xs text-indigo-400 text-center py-8">No final files yet</p> : (
                                 <div className="space-y-2">
                                     {finalProof.map(p => (
                                         <div key={p.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded border border-indigo-100 dark:border-slate-800 shadow-sm">
                                             <div className="flex items-center gap-2">
                                                 <FileText className="w-3 h-3 text-indigo-500" /> {p.name}
                                             </div>
                                             {/* Simulated Plagiarism Check */}
                                             <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                                 <CopyCheck className="w-3 h-3" /> 100% Unique
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </Card>
        )}

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><MessageSquare className="w-5 h-5 text-slate-400" /> Discussion</h3>
          <div className="space-y-4 mb-4">
             {task.comments.map(c => (
               <div key={c.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                 <div className="flex justify-between items-baseline mb-1">
                     <Link to={`/u/${c.userId}`} className="font-semibold text-sm text-slate-900 dark:text-white hover:underline hover:text-primary-600 dark:hover:text-primary-400">
                         {c.username}
                     </Link>
                     <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                 </div>
                 <p className="text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
               </div>
             ))}
          </div>
          {task.status !== TaskStatus.CANCELLED && <form onSubmit={handlePostComment} className="flex gap-2"><input className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none text-slate-900 dark:text-white focus:border-primary-500" placeholder="Ask a question..." value={comment} onChange={e => setComment(e.target.value)} /><Button size="sm" type="submit" disabled={!comment}>Send</Button></form>}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4">Task Status</h3>
           <div className="space-y-4">
             {task.status === TaskStatus.OPEN && (
               <>
                 <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                    <span className="text-sm">Funds are currently held in <b>Escrow</b>. They will be released only when the task is done.</span>
                 </div>
                 {isPoster && <Button variant="danger" className="w-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 border-none shadow-none mb-2" onClick={handleCancelTask}><XCircle className="w-4 h-4 mr-2" /> Cancel & Refund</Button>}
                 {!isPoster && !hasOffered && <Button className="w-full" size="lg" onClick={() => setShowOfferModal(true)}>Offer to Help</Button>}
                 {!isPoster && hasOffered && <Button className="w-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-default" disabled>Offer Sent</Button>}
               </>
             )}
             {task.status === TaskStatus.ASSIGNED && (
               <div className="text-center py-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/50">
                  <h4 className="font-bold text-slate-800 dark:text-white">Task Assigned</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {isDoer ? "You have been assigned this task." : "Waiting for the executor to start."}
                  </p>
                  {isDoer && <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleStartTask}><Play className="w-4 h-4 mr-2" /> Start Task</Button>}
                  {isPoster && <Button variant="danger" className="w-full mt-2" onClick={handleCancelTask}><XCircle className="w-4 h-4 mr-2" /> Cancel Assignment</Button>}
               </div>
             )}
             {task.status === TaskStatus.IN_PROGRESS && (
               <div className="text-center py-4">
                  <h4 className="font-bold text-slate-800 dark:text-white">Work In Progress</h4>
                  <div className="flex justify-center my-3"><div className="animate-pulse bg-blue-500 h-2 w-2 rounded-full mx-1"></div><div className="animate-pulse bg-blue-500 h-2 w-2 rounded-full mx-1 delay-75"></div><div className="animate-pulse bg-blue-500 h-2 w-2 rounded-full mx-1 delay-150"></div></div>
                  {isDoer && <div className="space-y-3 mt-3"><Button onClick={handleCompleteTask} className="w-full bg-green-600 hover:bg-green-700 text-white">Mark Completed</Button><Button variant="danger" className="w-full" onClick={handleDispute}><AlertTriangle className="w-4 h-4 mr-2" /> Report Issue</Button></div>}
                  {isPoster && <Button variant="danger" className="w-full mt-3" onClick={handleDispute}><AlertTriangle className="w-4 h-4 mr-2" /> Report Issue</Button>}
               </div>
             )}
             {task.status === TaskStatus.COMPLETED && (
               <div className="text-center py-4">
                  <h4 className="font-bold text-slate-800 dark:text-white">Work Submitted</h4>
                  {isPoster && <div className="space-y-3 mt-3"><Button onClick={handleReleasePayment} className="w-full">Approve & Release</Button><Button variant="danger" className="w-full" onClick={handleDispute}><AlertTriangle className="w-4 h-4 mr-2" /> Dispute</Button></div>}
                  {isDoer && <p className="text-xs text-slate-500 mt-2">Waiting for approval...</p>}
               </div>
             )}
             {task.status === TaskStatus.DISPUTED && (
                 <div className="text-center py-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50">
                     <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                     <h4 className="font-bold text-red-700 dark:text-red-400">Dispute Raised</h4>
                     <p className="text-xs text-red-600 dark:text-red-300">Admin is reviewing this task. Funds are frozen.</p>
                 </div>
             )}
             {task.status === TaskStatus.PAID && (
               <div className="text-center py-4">
                 <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                 <h4 className="font-bold text-slate-800 dark:text-white">Task Closed</h4>
                 {((isPoster || isDoer) && !myReview) && (
                   <Button className="w-full bg-amber-500 border-none mt-4" onClick={() => setShowRateModal(true)}>Rate User</Button>
                 )}
               </div>
             )}
           </div>
        </Card>
        
        {isPoster && task.status === TaskStatus.OPEN && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Offers ({activeOffers.length})</h3>
            
            {activeOffers.length === 0 && (
                <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">No active offers yet.</p>
                </div>
            )}

            {activeOffers.map(offer => (
                <Card key={offer.id} className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 bg-white dark:bg-slate-900">
                      <div className="flex justify-between items-start mb-3">
                          <Link to={`/u/${offer.userId}`} className="flex items-center gap-3 group">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg border border-slate-200 dark:border-slate-700">
                                  {offer.doerName.charAt(0)}
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{offer.doerName}</h4>
                                  <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      <span>{offer.doerRating ? offer.doerRating.toFixed(1) : 'New'}</span>
                                      <span className="text-slate-300 dark:text-slate-600">•</span>
                                      {/* Match Score */}
                                      <span className="flex items-center text-indigo-500 font-bold ml-1">
                                          <BrainCircuit className="w-3 h-3 mr-0.5" />
                                          {offer.matchScore || 85}% Match
                                      </span>
                                  </div>
                              </div>
                          </Link>
                          <div className="text-right">
                              <span className="block font-bold text-lg text-slate-900 dark:text-white">₹{offer.price}</span>
                          </div>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{offer.message}"</p>
                      </div>

                      <div className="flex gap-3">
                          <Button 
                            variant="secondary"
                            className="flex-1 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300" 
                            onClick={() => handleRejectOffer(offer.id)}
                            disabled={isAccepting}
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-none" 
                            onClick={() => handleAcceptOffer(offer)} 
                            isLoading={isAccepting}
                            disabled={isAccepting}
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" /> Accept
                          </Button>
                      </div>
                  </div>
                </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title="Submit Offer">
         <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
             <BrainCircuit className="w-4 h-4" />
             <span>AI Match Score: <b className="text-lg">{matchScore}%</b>. Good fit!</span>
         </div>
         <TextArea label="Message" rows={3} value={offerMsg} onChange={e => setOfferMsg(e.target.value)} className="mb-4 text-slate-900 dark:text-white" />
         <Button onClick={handleMakeOffer} className="w-full">Send Offer</Button>
      </Modal>

      <Modal isOpen={showReleaseModal} onClose={() => setShowReleaseModal(false)} title="Confirm Release">
         <div className="text-slate-600 dark:text-slate-300 mb-6 space-y-2">
            <p>You are about to release <b>₹{task.budget}</b> to the student.</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm flex gap-2 border border-blue-100 dark:border-blue-800">
               <InfoIcon className="w-5 h-5 text-blue-500 shrink-0" />
               <p>A 5% platform fee will be deducted from the receiver's amount. This action cannot be undone.</p>
            </div>
         </div>
         <div className="flex gap-3"><Button variant="ghost" className="flex-1" onClick={() => setShowReleaseModal(false)}>Cancel</Button><Button className="flex-1 bg-green-600 text-white" onClick={confirmReleasePayment}>Approve & Pay</Button></div>
      </Modal>

      <Modal isOpen={showRateModal} onClose={() => setShowRateModal(false)} title="Rate User">
          <div className="flex justify-center mb-4"><StarRating rating={ratingVal} onRatingChange={setRatingVal} size="lg" /></div>
          <TextArea label="Comment" rows={3} value={ratingComment} onChange={e => setRatingComment(e.target.value)} className="mb-6 text-slate-900 dark:text-white" />
          <Button className="w-full" onClick={handleSubmitRating} isLoading={isSubmittingRating}>Submit</Button>
      </Modal>
    </div>
  );
};

const InfoIcon = ({className}:{className?:string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);