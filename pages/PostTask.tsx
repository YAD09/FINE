import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, TextArea, VoiceRecorder, FileVerifier } from '../components/UI';
import { Task, TaskStatus, User, TaskType, Attachment, ServiceTier } from '../types';
import { useNavigate } from 'react-router-dom';
import { refineTaskDescription, suggestPricing, PricingSuggestion } from '../services/gemini';
import { Wand2, Sparkles, MapPin, Globe, Crosshair, Loader2, Paperclip, X, FileText, Image as ImageIcon, ChevronDown, ChevronUp, Check, Zap, Clock, Moon } from 'lucide-react';
import * as L from 'leaflet';
import { getErrorMessage } from '../services/api';

const CATEGORIES = ['Academic', 'Design', 'Programming', 'Errands', 'Writing', 'Other'];

interface PostTaskProps {
  user: User;
  onPost: (task: Task) => void;
}

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  postcode: string;
  formatted: string;
}

const getAddressDetails = async (lat: number, lng: number): Promise<AddressComponents> => {
  const result: AddressComponents = { street: '', city: '', state: '', postcode: '', formatted: '' };
  
  if (!lat || !lng) return result;

  // 1. Try Nominatim (OpenStreetMap)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 

    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, 
        { 
            signal: controller.signal,
            headers: { 'Accept-Language': 'en-US,en;q=0.9' }
        }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      
      // Extract logic
      result.street = [addr.house_number, addr.building, addr.road, addr.pedestrian, addr.suburb]
        .filter(Boolean).join(', ');
      
      result.city = addr.city || addr.town || addr.village || addr.county || '';
      result.state = addr.state || addr.region || '';
      result.postcode = addr.postcode || '';
      result.formatted = data.display_name;
      
      return result;
    }
  } catch (error) {
    console.warn("Nominatim geocoding failed, trying fallback...", error);
  }

  // 2. Fallback: BigDataCloud
  try {
    const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (response.ok) {
        const data = await response.json();
        result.street = data.locality || '';
        result.city = data.city || '';
        result.state = data.principalSubdivision || '';
        result.postcode = data.postcode || '';
        result.formatted = [result.street, result.city, result.state].filter(Boolean).join(', ');
        return result;
    }
  } catch (error) {
    console.error("All geocoding services failed:", error);
  }

  result.formatted = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  return result;
};

const LocationPickerMap: React.FC<{ 
  position: { lat: number; lng: number } | undefined; 
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default: New Delhi coordinates
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    const initialCenter: L.LatLngExpression = position ? [position.lat, position.lng] : [defaultLat, defaultLng];
    
    const map = L.map(containerRef.current).setView(initialCenter, 13);
    mapRef.current = map;
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
        attribution: '&copy; OpenStreetMap &copy; CARTO' 
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onPositionChange(lat, lng);
    });

    // FIX: Invalidate size to ensure map renders correctly if container was hidden/animated
    setTimeout(() => {
        map.invalidateSize();
    }, 200);

    return () => { 
        map.off();
        map.remove(); 
        mapRef.current = null; 
    };
  }, []);

  // Update Marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    if (position) {
      const { lat, lng } = position;
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-pin',
                html: `<div style="background-color: #005BFF; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);
      }
      
      // Pan to new position
      map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [position]);

  return <div ref={containerRef} className="w-full h-64 rounded-xl border border-slate-200 z-0 mt-2 bg-slate-100 dark:bg-slate-800" />;
};

export const PostTask: React.FC<PostTaskProps> = ({ user, onPost }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);
  
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

  // Detailed Location State
  const [coords, setCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // AI
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomCategory = !CATEGORIES.slice(0, -1).includes(category);

  // --- Handlers ---

  const handleRefine = async () => {
    if (!description) return;
    setIsRefining(true);
    if (process.env.API_KEY) {
        const refined = await refineTaskDescription(description, category);
        setDescription(refined);
    } else {
        setTimeout(() => {
            setDescription(description + "\n\n(Formatted for clarity)");
            setIsRefining(false);
        }, 800);
        return;
    }
    setIsRefining(false);
  };

  const handleSuggestPrice = async () => {
    if (!title && !description) {
      alert("Please enter a title or description first for better accuracy.");
      return;
    }
    setIsSuggestingPrice(true);
    setSuggestion(null);

    try {
      if (process.env.API_KEY) {
        const result = await suggestPricing(title, description, category);
        if (result) {
            setSuggestion(result);
            setShowBreakdown(true);
        }
      } else {
        setTimeout(() => {
           setSuggestion({
               price: 650,
               confidence: 85,
               reasoning: "Based on ₹400 standard rate for academic help, plus a 1.5x multiplier for the urgent deadline.",
               breakdown: {
                   base: 400,
                   difficulty: 50,
                   urgencyMultiplier: 1.5,
                   lengthFee: 0
               }
           });
           setShowBreakdown(true);
           setIsSuggestingPrice(false);
        }, 1200);
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const applySuggestedPrice = () => {
      if (!suggestion) return;
      setBudget(suggestion.price.toString());
      setSuggestion(null);
  };

  const updateAddressFields = async (lat: number, lng: number) => {
      const details = await getAddressDetails(lat, lng);
      setStreet(details.street);
      setCity(details.city);
      setState(details.state);
      setPincode(details.postcode);
  };

  const handleAutoDetectLocation = () => {
      if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
      setIsDetectingLoc(true);
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const { latitude, longitude } = position.coords;
              setCoords({ lat: latitude, lng: longitude });
              await updateAddressFields(latitude, longitude);
              setIsDetectingLoc(false);
          },
          (error) => { console.error(error); setIsDetectingLoc(false); }
      );
  };

  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    await updateAddressFields(lat, lng);
  };

  const handleVerifiedFileSelect = (file: File) => {
     const reader = new FileReader();
     reader.onloadend = () => {
         setAttachments(prev => [...prev, { 
             id: `att-${Date.now()}-${Math.random()}`, 
             name: file.name, 
             url: reader.result as string, 
             type: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
             isVerified: true // Set verified flag
         }]);
     };
     reader.readAsDataURL(file);
  };

  const removeAttachment = (id: string) => { setAttachments(prev => prev.filter(a => a.id !== id)); };

  const getMultiplier = (tier: ServiceTier) => {
      if (tier === ServiceTier.URGENT) return 1.5;
      if (tier === ServiceTier.OVERNIGHT) return 2.0;
      return 1.0;
  }

  const getTotalBudget = () => {
      const base = Number(budget) || 0;
      return Math.round(base * getMultiplier(serviceTier));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLocation = undefined;
    
    if (taskType === TaskType.OFFLINE) {
        if (!street || !city) { alert("Please provide at least Street and City for In-Person tasks"); return; }
        if (!coords) { alert("Please set coordinates on the map"); return; }
        
        // Construct the full address string for the existing 'location' field
        const parts = [street, city, state, pincode].filter(Boolean);
        finalLocation = parts.join(', ');
    }

    if (!category.trim()) { alert("Please specify a category"); return; }

    setIsLoading(true);
    const newTask: Task = { 
        id: '', 
        posterId: user.id, 
        posterName: user.name, 
        title, 
        description, 
        category, 
        type: taskType, 
        serviceTier,
        location: finalLocation, 
        coordinates: taskType === TaskType.OFFLINE ? coords : undefined, 
        budget: getTotalBudget(), 
        deadline, 
        status: TaskStatus.OPEN, 
        createdAt: new Date().toISOString(), 
        tags: [category.toLowerCase()], 
        offers: [], 
        comments: [], 
        attachments: attachments,
        voiceNoteUrl: voiceNote
    };

    try { 
        await onPost(newTask); 
        navigate('/tasks'); 
    } catch (e) { 
        alert(getErrorMessage(e)); 
    } finally { 
        setIsLoading(false); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Post a Task</h1>
        <p className="text-slate-500 dark:text-slate-400">Describe what you need help with. Funds will be held in escrow.</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Task Title" placeholder="e.g. Calculus Help" value={title} onChange={(e) => setTitle(e.target.value)} required />
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Task Mode</label>
            <div className="flex gap-4">
                <button type="button" onClick={() => setTaskType(TaskType.ONLINE)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${taskType === TaskType.ONLINE ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-300'}`}><Globe className="w-5 h-5" />Remote</button>
                <button type="button" onClick={() => setTaskType(TaskType.OFFLINE)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${taskType === TaskType.OFFLINE ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-300'}`}><MapPin className="w-5 h-5" />In-Person</button>
            </div>
          </div>

          {taskType === TaskType.OFFLINE && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-4 border-l-2 border-primary-200 dark:border-primary-800 pl-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Task Location</h3>
                    <button type="button" onClick={handleAutoDetectLocation} className="text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center gap-1 hover:underline" disabled={isDetectingLoc}>
                        {isDetectingLoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />} Auto Detect
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                      <Input label="Street Address" placeholder="Building, Street, Area" value={street} onChange={(e) => setStreet(e.target.value)} required />
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="City" placeholder="Mumbai" value={city} onChange={(e) => setCity(e.target.value)} required />
                        <Input label="Pincode" placeholder="400001" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                      </div>
                      <Input label="State" placeholder="Maharashtra" value={state} onChange={(e) => setState(e.target.value)} required />
                  </div>

                  <div>
                     <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Pinpoint on Map</label>
                     <LocationPickerMap position={coords} onPositionChange={handleMapLocationSelect} />
                     <p className="text-[10px] text-slate-400 mt-1">*Tap on map to auto-fill address details.</p>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                  value={isCustomCategory ? 'Other' : category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Other') setCategory('');
                    else setCategory(val);
                  }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {isCustomCategory && (
                   <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                      <Input 
                        placeholder="Enter custom category..." 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                        autoFocus
                      />
                   </div>
                )}
             </div>
             <Input type="date" label="Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          </div>

          <div className="relative">
            <TextArea label="Description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
            <div className="absolute right-2 bottom-2 flex gap-2">
                <button type="button" onClick={handleRefine} disabled={isRefining || !description} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Refine
                </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Record Voice Instructions</label>
            <VoiceRecorder onRecordComplete={(url) => setVoiceNote(url)} />
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Attachments</label>
             <div className="space-y-2">
                 {/* Replaced standard file input with Verified checker */}
                 <FileVerifier onFileSelect={handleVerifiedFileSelect} />
                 
                 {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                      {attachments.map(att => (
                          <div key={att.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm dark:text-slate-300">
                              {att.type === 'IMAGE' ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-slate-500" />}
                              <span className="truncate max-w-[150px]">{att.name}</span>
                              {att.isVerified && <span title="Verified Safe"><Check className="w-3 h-3 text-green-500" /></span>}
                              <button type="button" onClick={() => removeAttachment(att.id)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                          </div>
                      ))}
                  </div>
                 )}
             </div>
          </div>

          <div>
             <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Base Budget (₹)</label>
                <button 
                    type="button" 
                    onClick={handleSuggestPrice}
                    disabled={isSuggestingPrice} 
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                    {isSuggestingPrice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Suggest price with AI
                </button>
             </div>
             
             <div className="relative">
               <span className="absolute left-4 top-2.5 text-slate-400 font-medium">₹</span>
               <input type="number" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="500" value={budget} onChange={(e) => setBudget(e.target.value)} min="5" required />
             </div>

             {/* AI Suggestion Box */}
             {suggestion && (
                <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4">
                        <div className="flex justify-between items-start gap-4">
                           <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                   <span className="font-bold text-slate-700 dark:text-slate-200">Suggested: ₹{suggestion.price}</span>
                                   <span className="text-xs text-slate-500 dark:text-slate-400">(Confidence {suggestion.confidence}%)</span>
                               </div>
                               <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                                   {suggestion.reasoning}
                               </p>
                               <button 
                                 type="button"
                                 onClick={() => setShowBreakdown(!showBreakdown)}
                                 className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 font-medium"
                               >
                                   {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                   {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
                               </button>
                           </div>
                           <button
                             type="button"
                             onClick={applySuggestedPrice}
                             className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
                           >
                               <Check className="w-4 h-4" /> Apply
                           </button>
                        </div>
                    </div>
                    
                    {showBreakdown && (
                        <div className="border-t border-indigo-100 dark:border-indigo-900/30 bg-indigo-100/30 dark:bg-indigo-900/20 p-4">
                            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Base Price:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">₹{suggestion.breakdown.base}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Urgency:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">x{suggestion.breakdown.urgencyMultiplier}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Difficulty Fee:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">+₹{suggestion.breakdown.difficulty}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Length Fee:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">+₹{suggestion.breakdown.lengthFee}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
             )}
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Service Tier (Urgency)</label>
             <div className="grid grid-cols-3 gap-3">
                 {[
                     { id: ServiceTier.STANDARD, label: 'Standard', mult: '1x', icon: Clock },
                     { id: ServiceTier.URGENT, label: 'Urgent', mult: '1.5x', icon: Zap },
                     { id: ServiceTier.OVERNIGHT, label: 'Overnight', mult: '2x', icon: Moon },
                 ].map((tier) => (
                     <button
                        key={tier.id}
                        type="button"
                        onClick={() => setServiceTier(tier.id)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${serviceTier === tier.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                     >
                         <tier.icon className="w-5 h-5 mb-1" />
                         <span className="text-sm font-bold">{tier.label}</span>
                         <span className="text-xs opacity-70">Price x{tier.mult}</span>
                     </button>
                 ))}
             </div>
             <p className="text-center mt-3 text-sm font-bold text-slate-700 dark:text-white">
                 Total Budget: <span className="text-green-600 text-lg">₹{getTotalBudget()}</span>
             </p>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
             <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
             <Button type="submit" isLoading={isLoading} className="px-8">Post & Fund</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};