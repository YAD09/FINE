
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, VerificationStatus } from '../types';
import { API, getIsDemoMode } from '../services/api';
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

            // Fix: Only subscribe if NOT in demo mode
            if (getIsDemoMode()) return;

            try {
                const channel = supabase.channel(`public:profile:${userId}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
                        (payload) => { loadProfile(false); }
                    )
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'reviews', filter: `reviewee_id=eq.${userId}` },
                        () => { loadProfile(false); }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            } catch (e) {}
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
            <UserIcon className="w-16 h-16 text-slate-400 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">User not found</h2>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );

    const isOwnProfile = currentUser?.id === profile.id;

    return (
        <div className="min-h-screen bg-surface dark:bg-slate-950 pb-20">
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600"></div>
                <div className="absolute top-6 left-4 md:left-8 z-20">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 text-white transition-all text-sm font-medium border border-white/10"><ArrowLeft className="w-4 h-4" /> Back</button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] p-1 bg-white dark:bg-slate-900 shadow-2xl">
                            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-[1.8rem] object-cover bg-slate-100" />
                        </div>
                    </div>

                    <div className="flex-1 w-full pt-4 md:pt-24">
                        <div className="mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{profile.name}</h1>
                                    <div className="flex items-center gap-4 text-slate-500 mb-4">
                                        <span className="font-medium text-lg">@{profile.username}</span>
                                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg text-amber-700">
                                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                            <span className="font-bold text-lg">{profile.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                                {!isOwnProfile && <Button onClick={() => setShowContactModal(true)}><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-8">
                            {profile.college && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 shadow-sm"><School className="w-4 h-4" /><span>{profile.college}</span></div>}
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 shadow-sm"><CheckCircle className="w-4 h-4" /><span>{profile.tasksCompleted} Tasks Done</span></div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reviews</h2>
                            {reviews.length === 0 ? <p className="text-slate-500">No reviews yet.</p> : (
                                <div className="grid grid-cols-1 gap-4">
                                    {reviews.map((review) => (
                                        <Card key={review.id} className="p-6">
                                            <div className="flex justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerId}`} className="w-10 h-10 rounded-full" />
                                                    <span className="font-bold">{review.reviewerId}</span>
                                                </div>
                                                <StarRating rating={review.rating} readOnly size="sm" />
                                            </div>
                                            <p className="text-slate-600 italic">"{review.comment}"</p>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title={`Message ${profile.name}`}>
                 <div className="space-y-4">
                     <TextArea placeholder="Hi! I saw your profile..." rows={4} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} />
                     <Button onClick={handleSendMessage} className="w-full" isLoading={isSending} disabled={!contactMessage.trim()}><Send className="w-4 h-4 mr-2" /> Send</Button>
                 </div>
            </Modal>
        </div>
    )
}
