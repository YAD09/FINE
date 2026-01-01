
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Button, Badge, Input } from '../components/UI';
import { Task, TaskStatus, TaskType } from '../types';
import { Link } from 'react-router-dom';
import { Filter, Search, IndianRupee, Calendar, MapPin, Globe, Navigation, Crosshair, ShieldCheck, LayoutGrid, List, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import * as L from 'leaflet';
import { API } from '../services/api';
import { clsx } from 'clsx';

interface TaskFeedProps {
  tasks: Task[];
}

// Simple Map Component
const TaskMap: React.FC<{ 
    tasks: Task[]; 
    userLocation: { lat: number; lng: number } | null;
    onMarkerClick?: (taskId: string) => void;
}> = ({ tasks, userLocation, onMarkerClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initialLat = userLocation ? userLocation.lat : 28.59;
    const initialLng = userLocation ? userLocation.lng : 77.21;
    const map = L.map(containerRef.current).setView([initialLat, initialLng], 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const map = mapRef.current;
    map.flyTo([userLocation.lat, userLocation.lng], 14);
    if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
                className: 'user-pin',
                html: `<div style="background-color: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #3B82F6, 0 4px 6px rgba(0,0,0,0.2);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(map);
        userMarkerRef.current.bindPopup("You are here").openPopup();
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
        map.removeLayer(layer);
      }
    });
    tasks.forEach(task => {
      if (task.coordinates) {
        const marker = L.marker([task.coordinates.lat, task.coordinates.lng], {
          icon: L.divIcon({
            className: 'custom-pin',
            html: `<div style="background-color: ${task.type === 'OFFLINE' ? '#F59E0B' : '#005BFF'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);
        marker.bindPopup(`<b>${task.title}</b><br>₹${task.budget}`);
        marker.on('click', () => {
            if (onMarkerClick) onMarkerClick(task.id);
        });
      }
    });
  }, [tasks, onMarkerClick]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export const TaskFeed: React.FC<TaskFeedProps> = ({ tasks }) => {
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => { detectLocation(); }, []);

  useEffect(() => {
      if (highlightedTaskId && cardRefs.current[highlightedTaskId]) {
          cardRefs.current[highlightedTaskId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const timer = setTimeout(() => setHighlightedTaskId(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [highlightedTaskId]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setIsLoadingLocation(false);
        },
        () => setIsLoadingLocation(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === TaskStatus.OPEN)
      .filter(t => typeFilter === 'ALL' ? true : t.type === typeFilter)
      .filter(t => filter === 'All' ? true : t.category === filter)
      .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, filter, search, typeFilter, verifiedOnly]);

  const categories = ['All', 'Academic', 'Design', 'Programming', 'Errands', 'Writing'];

  return (
    <div className="space-y-8 pb-20">
      
      {/* Search & Filter Header */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tighter">Marketplace</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{filteredTasks.length} active opportunities found.</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-inner">
               <button onClick={() => setViewMode('GRID')} className={clsx("p-2 rounded-xl transition-all", viewMode === 'GRID' ? "bg-white dark:bg-white/10 text-primary-500 shadow-lg" : "text-slate-400")}><LayoutGrid className="w-5 h-5" /></button>
               <button onClick={() => setViewMode('LIST')} className={clsx("p-2 rounded-xl transition-all", viewMode === 'LIST' ? "bg-white dark:bg-white/10 text-primary-500 shadow-lg" : "text-slate-400")}><List className="w-5 h-5" /></button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-primary-500" />
              <input 
                type="text" 
                placeholder="Search by keyword, skill, or college..." 
                className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400/60 font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           
           <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={clsx(
                      "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                      filter === cat 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl" 
                        : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                    )}
                >
                    {cat}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Main Feed */}
        <div className="md:col-span-3 space-y-6">
           <div className={clsx(
             viewMode === 'GRID' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"
           )}>
              {filteredTasks.map(task => (
                <div 
                    key={task.id} 
                    ref={(el) => { cardRefs.current[task.id] = el; }}
                    className={clsx(
                      "transition-all duration-500 rounded-[2.5rem]",
                      highlightedTaskId === task.id ? "ring-4 ring-primary-500/50 scale-[1.02] shadow-2xl" : ""
                    )}
                >
                    <Link to={`/tasks/${task.id}`}>
                      <Card className="h-full !p-0 hover:border-primary-500 group border-transparent">
                          <div className="p-8">
                             <div className="flex justify-between items-start mb-4">
                                <Badge color={task.category === 'Academic' ? 'indigo' : 'purple'}>{task.category}</Badge>
                                {task.type === TaskType.OFFLINE ? (
                                   <div className="flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-lg">
                                      <MapPin className="w-3 h-3" /> In-Person
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-1.5 text-primary-500 font-black text-[10px] uppercase tracking-widest bg-primary-500/10 px-2 py-1 rounded-lg">
                                      <Globe className="w-3 h-3" /> Remote
                                   </div>
                                )}
                             </div>
                             
                             <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3 group-hover:text-primary-500 transition-colors">{task.title}</h3>
                             <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{task.description}</p>
                             
                             <div className="flex items-center gap-2 mb-8">
                                {task.tags.slice(0,3).map(tag => (
                                  <span key={tag} className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/5 text-slate-400 px-2 py-1 rounded-md">#{tag}</span>
                                ))}
                             </div>

                             <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-6">
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Value</p>
                                      <p className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tighter">₹{task.budget}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                                      <p className="font-black text-red-500 tracking-tight">2d left</p>
                                   </div>
                                </div>
                                <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12 group-hover:scale-110 shadow-xl shadow-slate-900/20 dark:shadow-white/10">
                                   <ArrowUpRight className="w-6 h-6" />
                                </div>
                             </div>
                          </div>
                      </Card>
                    </Link>
                </div>
              ))}
           </div>
        </div>

        {/* Filters Sidebar */}
        <div className="space-y-6">
           <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                 <SlidersHorizontal className="w-5 h-5 text-primary-500" />
                 <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Refine Gigs</h4>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Task Mode</label>
                    <div className="flex flex-col gap-2">
                       {['ALL', 'ONLINE', 'OFFLINE'].map(t => (
                         <button 
                            key={t}
                            onClick={() => setTypeFilter(t as any)}
                            className={clsx(
                              "text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                              typeFilter === t ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-100 dark:border-primary-900/50" : "text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                            )}
                         >
                           {t.charAt(0) + t.slice(1).toLowerCase()}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                    <button 
                       onClick={() => setVerifiedOnly(!verifiedOnly)}
                       className={clsx(
                         "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                         verifiedOnly ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-600" : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                       )}
                    >
                       <span className="text-xs font-black uppercase tracking-widest">Verified Only</span>
                       <ShieldCheck className={clsx("w-5 h-5", verifiedOnly ? "text-emerald-500" : "text-slate-300")} />
                    </button>
                 </div>
              </div>
           </Card>

           <Card className="p-0 border-none !bg-slate-900 text-white shadow-2xl overflow-hidden relative min-h-[300px]">
              <div className="absolute inset-0 z-0">
                 <TaskMap tasks={tasks.filter(t => t.type === TaskType.OFFLINE)} userLocation={userLocation} onMarkerClick={setHighlightedTaskId} />
              </div>
              <div className="absolute top-4 left-4 z-10">
                 <Badge color="indigo">Live Map</Badge>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6 z-10 bg-gradient-to-t from-slate-950 to-transparent">
                 <Button size="sm" variant="glow" className="w-full" onClick={detectLocation}>
                    <Crosshair className="w-4 h-4 mr-2" /> Sync Location
                 </Button>
              </div>
           </Card>
        </div>

      </div>
    </div>
  );
};
