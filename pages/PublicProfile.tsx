
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, VerificationStatus } from '../types';
import { API } from '../services/api';
import { supabase } from '../services/supabase';
import { Card, Badge, StarRating, Button, Modal, TextArea } from '../components/UI';
import { Shield, School, Calendar, ArrowLeft, Star, User as UserIcon, Loader2, CheckCircle, Award, Quote, MapPin, Sparkles, MessageSquare, Send } from 'lucide-react';
import { clsx } from 'clsx';

export const PublicProfile = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<User | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Contact State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchCurrentUser = async () => {
             const user = await API.auth.getCurrentUser();
             setCurrentUser(user);
        };
        fetchCurrentUser();

        if (userId) {
            loadProfile();

            // Realtime subscription for Profile (User) and Reviews
            const channel = supabase.channel(`public:profile:${userId}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
                    (payload) => {
                        // Refresh profile data when user table updates (e.g. avatar change, bio change, rating update)
                        loadProfile(false); // Pass false to avoid full loading spinner
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'reviews', filter: `reviewee_id=eq.${userId}` },
                    () => {
                        // Refresh when new review is added
                        loadProfile(false);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [userId]);

    const loadProfile = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const user = await API.users.get(userId!);
            const userReviews = await API.users.getReviews(userId!);
            setProfile(user);
            setReviews(userReviews);
        } catch (e) {
            console.error(e);
        } finally {
            if (showLoading) setLoading(false);
        }
    }

    const handleSendMessage = async () => {
        if (!contactMessage.trim() || !currentUser || !profile) return;
        setIsSending(true);
        try {
            await API.notifications.send(
                profile.id,
                `Message from ${currentUser.name}`,
                contactMessage,
                'INFO',
                `/u/${currentUser.id}`
            );
            setShowContactModal(false);
            setContactMessage('');
            alert("Message sent successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    if (loading && !profile) return <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>;
    
    if (!profile) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center bg-surface dark:bg-slate-950 p-4">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <UserIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">User not found</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">The profile you are looking for might have been removed or is temporarily unavailable.</p>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );

    const isOwnProfile = currentUser?.id === profile.id;

    return (
        <div className="min-h-screen bg-surface dark:bg-slate-950 pb-20">
            {/* Header / Cover Area */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900"></div>
                
                {/* Abstract Patterns */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[200%] bg-white/10 rotate-12 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[150%] bg-purple-500/20 -rotate-12 blur-3xl rounded-full"></div>
                </div>

                <div className="absolute top-6 left-4 md:left-8 z-20">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md text-white transition-all text-sm font-medium border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    
                    {/* Left Column: Avatar */}
                    <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                        <div className="relative group">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] p-1 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/20 ring-1 ring-slate-100 dark:ring-slate-800 rotate-3 md:rotate-0 transition-transform duration-500 hover:rotate-2">
                                <img 
                                    src={profile.avatarUrl} 
                                    alt={profile.name} 
                                    className="w-full h-full rounded-[1.8rem] object-cover bg-slate-100 dark:bg-slate-800"
                                />
                            </div>
                            {profile.verificationStatus === VerificationStatus.VERIFIED && (
                                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-2 rounded-xl shadow-lg border-4 border-white dark:border-slate-950 flex items-center justify-center transform transition-transform hover:scale-110" title="Verified Student">
                                    <Shield className="w-5 h-5 fill-current" />
                                </div>
                            )}
                        </div>

                        {/* Mobile: Name below avatar */}
                        <div className="md:hidden text-center mt-4 mb-6">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">@{profile.username}</p>
                            {/* Mobile Avg Rating */}
                            <div className="flex items-center justify-center gap-1.5 mt-2 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-full w-fit mx-auto">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-slate-900 dark:text-white">{profile.rating.toFixed(1)}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">/ 5.0</span>
                            </div>
                            {!isOwnProfile && (
                                <div className="mt-4">
                                    <Button onClick={() => setShowContactModal(true)} size="sm">
                                        <MessageSquare className="w-4 h-4 mr-2" /> Message
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Info & Content */}
                    <div className="flex-1 w-full pt-4 md:pt-24">
                        <div className="hidden md:block mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">{profile.name}</h1>
                                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 mb-4">
                                        <span className="font-medium text-lg">@{profile.username}</span>
                                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                            <UserIcon className="w-3.5 h-3.5" />
                                            <span className="capitalize">{profile.role.toLowerCase()}</span>
                                        </span>
                                    </div>
                                    {/* Desktop Avg Rating */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 px-3 py-1.5 rounded-lg text-amber-700 dark:text-amber-400">
                                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                            <span className="font-bold text-lg">{profile.rating.toFixed(1)}</span>
                                            <span className="text-xs font-medium opacity-80">Average Rating</span>
                                        </div>
                                        <span className="text-slate-400 text-sm">based on {profile.reviewsCount} reviews</span>
                                    </div>
                                </div>
                                {!isOwnProfile && (
                                    <Button onClick={() => setShowContactModal(true)} className="shadow-lg shadow-indigo-500/20">
                                        <MessageSquare className="w-4 h-4 mr-2" /> Contact User
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            {profile.college && (
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm transition-transform hover:-translate-y-0.5">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                        <School className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{profile.college}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm transition-transform hover:-translate-y-0.5">
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <span className="font-medium">{profile.tasksCompleted} Tasks Completed</span>
                            </div>
                            {profile.verificationStatus === VerificationStatus.VERIFIED && (
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm transition-transform hover:-translate-y-0.5">
                                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                        <Award className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">Top Rated</span>
                                </div>
                            )}
                        </div>

                        {/* Reviews Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Reviews 
                                    <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full ml-2">{reviews.length}</span>
                                </h2>
                                {/* Sort dropdown could go here */}
                            </div>

                            {reviews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">No reviews yet</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs text-center mt-1">This user is new to TaskLink or hasn't received feedback yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {reviews.map((review, idx) => (
                                        <div 
                                            key={review.id} 
                                            className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/u/${review.reviewerId}`)}>
                                                    <div className="relative">
                                                        <img 
                                                            src={review.reviewerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerName}`} 
                                                            alt="reviewer" 
                                                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover ring-2 ring-white dark:ring-slate-800 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all"
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                                                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{review.reviewerName}</p>
                                                        <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                    <StarRating rating={review.rating} readOnly size="sm" />
                                                </div>
                                            </div>
                                            
                                            <div className="relative pl-8 mt-2">
                                                <Quote className="absolute top-0 left-0 w-5 h-5 text-slate-200 dark:text-slate-700 -scale-x-100" />
                                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic">
                                                    {review.comment}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title={`Message ${profile.name}`}>
                 <div className="space-y-4">
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                         Send a direct message to <b>{profile.name}</b>. They will receive a notification.
                     </p>
                     <TextArea 
                        placeholder="Hi! I saw your profile and..." 
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                     />
                     <Button 
                        onClick={handleSendMessage} 
                        className="w-full"
                        isLoading={isSending}
                        disabled={!contactMessage.trim()}
                     >
                         <Send className="w-4 h-4 mr-2" /> Send Message
                     </Button>
                 </div>
            </Modal>
        </div>
    )
}
