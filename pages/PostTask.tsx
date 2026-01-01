
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, TextArea, VoiceRecorder, FileVerifier, Badge } from '../components/UI';
import { Task, TaskStatus, User, TaskType, Attachment, ServiceTier } from '../types';
import { useNavigate } from 'react-router-dom';
import { refineTaskDescription, suggestPricing, PricingSuggestion } from '../services/gemini';
// Fixed: Added missing ShieldCheck import from lucide-react
import { Wand2, Sparkles, MapPin, Globe, Crosshair, Loader2, Paperclip, X, FileText, Image as ImageIcon, ChevronDown, ChevronUp, Check, Zap, Clock, Moon, ArrowRight, BrainCircuit, Rocket, ShieldCheck } from 'lucide-react';
import * as L from 'leaflet';
import { getErrorMessage } from '../services/api';
import { clsx } from 'clsx';

const CATEGORIES = ['Academic', 'Design', 'Programming', 'Errands', 'Writing', 'Other'];

interface PostTaskProps {
  user: User;
  onPost: (task: Task) => void;
}

const LocationPickerMap: React.FC<{ 
  position: { lat: number; lng: number } | undefined; 
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    const initialCenter: L.LatLngExpression = position ? [position.lat, position.lng] : [defaultLat, defaultLng];
    const map = L.map(containerRef.current).setView(initialCenter, 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
    map.on('click', (e) => onPositionChange(e.latlng.lat, e.latlng.lng));
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.off(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !position) return;
    mapRef.current.flyTo([position.lat, position.lng], 13);
    L.marker([position.lat, position.lng]).addTo(mapRef.current);
  }, [position]);

  return <div ref={containerRef} className="w-full h-48 rounded-2xl border border-slate-200 z-0 bg-slate-100 dark:bg-slate-800 shadow-inner" />;
};

export const PostTask: React.FC<PostTaskProps> = ({ user, onPost }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.ONLINE);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [voiceNote, setVoiceNote] = useState<string | undefined>(undefined);
  const [serviceTier, setServiceTier] = useState<ServiceTier>(ServiceTier.STANDARD);

  const [coords, setCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');

  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);

  const handleRefine = async () => {
    if (!description) return;
    setIsRefining(true);
    const refined = await refineTaskDescription(description, category);
    setDescription(refined);
    setIsRefining(false);
  };

  const handleSuggestPrice = async () => {
    if (!title && !description) return;
    setIsSuggestingPrice(true);
    const result = await suggestPricing(title, description, category);
    if (result) setSuggestion(result);
    setIsSuggestingPrice(false);
  };

  const getTotalBudget = () => {
      const base = Number(budget) || 0;
      const multi = serviceTier === ServiceTier.URGENT ? 1.5 : serviceTier === ServiceTier.OVERNIGHT ? 2.0 : 1.0;
      return Math.round(base * multi);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newTask: Task = { 
        id: '', posterId: user.id, posterName: user.name, title, description, category, 
        type: taskType, serviceTier, budget: getTotalBudget(), deadline, status: TaskStatus.OPEN, 
        createdAt: new Date().toISOString(), tags: [category.toLowerCase()], offers: [], comments: [], 
        attachments, voiceNoteUrl: voiceNote, coordinates: coords, location: street ? `${street}, ${city}` : undefined
    };
    try { await onPost(newTask); navigate('/dashboard'); } catch (e) { alert(getErrorMessage(e)); } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tighter mb-2">Initiate Deployment</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Describe your requirements to the campus network.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Section 1: Context */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-black">01</div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Core Requirements</h2>
                    </div>
                    
                    <Input label="Short Title" placeholder="e.g. Calculus II Peer Tutoring" value={title} onChange={(e) => setTitle(e.target.value)} required hint="Keep it brief and descriptive" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Category</label>
                            <select 
                                className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <Input type="date" label="Hard Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
                    </div>

                    <div className="relative">
                        <TextArea label="Full Scope" placeholder="What exactly needs to be done?" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} required />
                        <button type="button" onClick={handleRefine} disabled={isRefining || !description} className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                            {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Refine
                        </button>
                    </div>
                </div>

                {/* Section 2: Execution */}
                <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-black">02</div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Fulfillment Details</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => setTaskType(TaskType.ONLINE)} className={clsx("flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all", taskType === TaskType.ONLINE ? "border-primary-500 bg-primary-500/5 text-primary-600 shadow-xl shadow-primary-500/10" : "border-slate-100 dark:border-white/5 text-slate-400 opacity-60")}>
                            <Globe className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-widest">Remote / Online</span>
                        </button>
                        <button type="button" onClick={() => setTaskType(TaskType.OFFLINE)} className={clsx("flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all", taskType === TaskType.OFFLINE ? "border-amber-500 bg-amber-500/5 text-amber-600 shadow-xl shadow-amber-500/10" : "border-slate-100 dark:border-white/5 text-slate-400 opacity-60")}>
                            <MapPin className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-widest">In-Person / Local</span>
                        </button>
                    </div>

                    {taskType === TaskType.OFFLINE && (
                        <div className="space-y-4 animate-in slide-in-from-top-4">
                            <Input label="Meeting Point" placeholder="Building, Wing, or Landmark" value={street} onChange={(e) => setStreet(e.target.value)} required />
                            <LocationPickerMap position={coords} onPositionChange={(lat, lng) => setCoords({lat, lng})} />
                        </div>
                    )}
                    
                    <VoiceRecorder onRecordComplete={(url) => setVoiceNote(url)} />
                    <FileVerifier onFileSelect={(file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => setAttachments([...attachments, { id: `a-${Date.now()}`, name: file.name, url: reader.result as string, type: 'DOCUMENT' }]);
                        reader.readAsDataURL(file);
                    }} />
                </div>

                {/* Section 3: Value */}
                <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-black">03</div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Budget & Incentives</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Base Compensation (₹)</label>
                              <button type="button" onClick={handleSuggestPrice} disabled={isSuggestingPrice || !title} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-600">
                                 {isSuggestingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />} AI Suggest
                              </button>
                           </div>
                           <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">₹</span>
                              <input type="number" className="w-full pl-12 pr-6 py-5 rounded-[1.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 text-2xl font-black tracking-tighter outline-none focus:ring-4 focus:ring-primary-500/10" placeholder="0" value={budget} onChange={(e) => setBudget(e.target.value)} required />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Service Tier</label>
                           <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: ServiceTier.STANDARD, label: 'Std', icon: Clock },
                                { id: ServiceTier.URGENT, label: 'Hot', icon: Zap },
                                { id: ServiceTier.OVERNIGHT, label: 'Moon', icon: Moon },
                              ].map(tier => (
                                <button key={tier.id} type="button" onClick={() => setServiceTier(tier.id)} className={clsx("flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all", serviceTier === tier.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xl" : "border-slate-100 dark:border-white/5 text-slate-400 opacity-60")}>
                                  <tier.icon className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">{tier.label}</span>
                                </button>
                              ))}
                           </div>
                        </div>
                    </div>

                    {suggestion && (
                        <Card className="p-4 !bg-indigo-500 text-white border-none animate-in zoom-in-95">
                           <div className="flex gap-4">
                              <BrainCircuit className="w-8 h-8 shrink-0" />
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Gemini Intelligence Suggestion</p>
                                 <p className="text-sm font-medium leading-relaxed mb-3">"{suggestion.reasoning}"</p>
                                 <Button size="sm" variant="secondary" onClick={() => setBudget(suggestion.price.toString())}>Apply ₹{suggestion.price}</Button>
                              </div>
                           </div>
                        </Card>
                    )}
                </div>

                <div className="pt-10 flex gap-4">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => navigate(-1)}>Abort</Button>
                    <Button type="submit" isLoading={isLoading} className="flex-[2] h-14 text-lg">
                        <Rocket className="w-5 h-5 mr-2" /> Launch Task & Fund
                    </Button>
                </div>
            </form>
        </div>

        {/* Live Preview Sidebar */}
        <div className="hidden lg:block space-y-6">
            <div className="sticky top-28">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Deployment Preview</h4>
               <Card className="p-0 overflow-hidden opacity-60 pointer-events-none scale-95 origin-top border-dashed border-2">
                  <div className="p-8">
                     <div className="flex justify-between mb-4">
                        <Badge color="blue">{category}</Badge>
                        <div className="text-slate-300 font-black text-[10px] uppercase tracking-widest border border-slate-100 px-2 py-1 rounded-lg">{taskType}</div>
                     </div>
                     <h3 className="text-xl font-display font-black text-slate-400 mb-2 truncate">{title || 'Your Title Here'}</h3>
                     <p className="text-slate-300 text-sm line-clamp-3 mb-6 leading-relaxed italic">{description || 'Task overview description...'}</p>
                     <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                        <div>
                           <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Total Value</p>
                           <p className="text-2xl font-display font-black text-slate-400 tracking-tighter">₹{getTotalBudget()}</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                     </div>
                  </div>
               </Card>
               
               <div className="mt-8 p-6 bg-slate-50/50 dark:bg-white/2 rounded-[2rem] border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-4 text-emerald-500">
                     <ShieldCheck className="w-6 h-6" />
                     <h5 className="text-xs font-black uppercase tracking-widest">Scam Protection Active</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                     Once launched, your funds will be held in a secure student vault (Escrow). Payment is only released to the peer when you mark the task as complete.
                  </p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};
