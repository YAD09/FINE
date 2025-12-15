
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Button, Badge, Input } from '../components/UI';
import { Task, TaskStatus, TaskType } from '../types';
import { Link } from 'react-router-dom';
import { Filter, Search, IndianRupee, Calendar, MapPin, Globe, Navigation, Crosshair, ShieldCheck } from 'lucide-react';
import * as L from 'leaflet';
import { API } from '../services/api';

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

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => { detectLocation(); }, []);

  // Scroll to highlighted task
  useEffect(() => {
      if (highlightedTaskId && cardRefs.current[highlightedTaskId]) {
          cardRefs.current[highlightedTaskId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Clear highlight after animation roughly
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
        (error) => { console.error("Error getting location", error); setIsLoadingLocation(false); }
    );
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === TaskStatus.OPEN)
      .filter(t => typeFilter === 'ALL' ? true : t.type === typeFilter)
      .filter(t => filter === 'All' ? true : t.category === filter)
      .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, filter, search, typeFilter, verifiedOnly]);

  const nearbyTasks = tasks.filter(t => t.type === TaskType.OFFLINE && t.status === TaskStatus.OPEN);
  const categories = ['All', 'Academic', 'Design', 'Programming', 'Errands', 'Writing'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Browse Tasks</h1>
           <p className="text-slate-500 dark:text-slate-400">Find tasks that match your skills and earn money.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
         <div className="flex flex-wrap gap-3 items-center">
             <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button onClick={() => setTypeFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${typeFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>All</button>
                <button onClick={() => setTypeFilter('ONLINE')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${typeFilter === 'ONLINE' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><Globe className="w-3.5 h-3.5" /> Remote</button>
                <button onClick={() => setTypeFilter('OFFLINE')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${typeFilter === 'OFFLINE' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><MapPin className="w-3.5 h-3.5" /> In-Person</button>
             </div>
             
             <button 
               onClick={() => setVerifiedOnly(!verifiedOnly)}
               className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-all ${verifiedOnly ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
             >
                <ShieldCheck className="w-4 h-4" /> Verified Only
             </button>
         </div>

         {(typeFilter === 'ALL' || typeFilter === 'OFFLINE') && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-2">
                   <MapPin className="w-5 h-5 text-primary-600" />
                   <h2 className="font-bold text-slate-800 dark:text-white">Nearby Tasks</h2>
                   <Badge color="gray">{nearbyTasks.length} available</Badge>
                 </div>
                 <Button size="sm" variant="secondary" className="text-xs" onClick={detectLocation} isLoading={isLoadingLocation}>
                   <Crosshair className="w-3 h-3 mr-1" /> {userLocation ? 'Update' : 'Locate Me'}
                 </Button>
              </div>
              <div className="h-64 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                 <TaskMap 
                    tasks={nearbyTasks} 
                    userLocation={userLocation} 
                    onMarkerClick={(id) => setHighlightedTaskId(id)}
                 />
              </div>
            </div>
         )}

         <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                type="text" 
                placeholder="Search tasks..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filter === cat ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                    {cat}
                </button>
                ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div 
                key={task.id} 
                ref={(el) => { cardRefs.current[task.id] = el; }}
                className={`transition-all duration-300 rounded-2xl ${
                    highlightedTaskId === task.id ? 'ring-4 ring-primary-300 dark:ring-primary-700 transform scale-[1.02] shadow-xl' : ''
                }`}
            >
                <Card className="flex flex-col h-full hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                        <Badge color="blue">{task.category}</Badge>
                        {task.type === TaskType.OFFLINE ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><MapPin className="w-3 h-3 mr-1" />In-Person</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800"><Globe className="w-3 h-3 mr-1" />Remote</span>}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 line-clamp-2">{task.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-4">{task.description}</p>
                    {task.tags.length > 0 && <div className="flex gap-2 mb-4 flex-wrap">{task.tags.map(tag => (<span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md uppercase tracking-wide">{tag}</span>))}</div>}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold"><IndianRupee className="w-4 h-4 mr-0.5 text-green-600 dark:text-green-500" />{task.budget}</div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400"><Calendar className="w-3 h-3 mr-1" />{new Date(task.deadline).toLocaleDateString()}</div>
                    </div>
                    <Link to={`/tasks/${task.id}`}><Button size="sm">View</Button></Link>
                </div>
                </Card>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No tasks found</h3>
            <p className="text-slate-500 dark:text-slate-500">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
