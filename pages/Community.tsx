
import React, { useState, useEffect } from 'react';
import { Card, Button, TextArea, Badge, Modal, Input } from '../components/UI';
import { MessageSquare, Heart, Share2, Users, School, Hash, Globe, Lock, Info, Plus } from 'lucide-react';
import { Community as CommunityType, CommunityPost } from '../types';
import { API } from '../services/api';

// --- MOCK DATA ---
const INITIAL_COMMUNITIES: CommunityType[] = [
    { id: 'c-1', name: 'IIT Bombay', description: 'Official campus group', type: 'CAMPUS', memberCount: 12500, icon: '🏛️' },
    { id: 'c-2', name: 'Delhi University', description: 'North & South campus', type: 'CAMPUS', memberCount: 45000, icon: '🎓' },
    { id: 'c-3', name: 'CS & Coding', description: 'Algorithms, Hackathons, Dev', type: 'TOPIC', memberCount: 8200, icon: '💻' },
    { id: 'c-4', name: 'Design Hub', description: 'UI/UX, Graphic, Art', type: 'TOPIC', memberCount: 3400, icon: '🎨' },
    { id: 'c-5', name: 'Internships', description: 'Opportunities & referrals', type: 'TOPIC', memberCount: 15000, icon: '💼' },
    { id: 'c-6', name: 'Confessions', description: 'Totally anonymous vent', type: 'GENERAL', memberCount: 99000, icon: '🎭' },
];

const MOCK_POSTS: CommunityPost[] = [
    { id: 'p-1', communityId: 'c-1', anonymousName: 'Anonymous Owl', anonymousAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=1', time: "2h ago", content: "Does anyone have the notes for CS302 Data Structures? The exam is tomorrow! 😭", likes: 12, comments: 4, type: "QUERY", createdAt: new Date().toISOString() },
    { id: 'p-2', communityId: 'c-3', anonymousName: 'Hidden Coder', anonymousAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=2', time: "5h ago", content: "Just deployed my first React Native app to the Play Store! Check out the screenshots attached.", likes: 45, comments: 8, type: "CELEBRATION", createdAt: new Date().toISOString() },
    { id: 'p-3', communityId: 'c-6', anonymousName: 'Secret Senior', anonymousAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=3', time: "1d ago", content: "I honestly have no idea what I'm doing in my final year project. Imposter syndrome is real.", likes: 89, comments: 22, type: "CONFESSION", createdAt: new Date().toISOString() }
] as any;

const ANIMALS = ['Owl', 'Fox', 'Tiger', 'Panda', 'Bear', 'Wolf', 'Cat', 'Dog', 'Lion', 'Hawk', 'Badger', 'Rabbit'];
const ADJECTIVES = ['Anonymous', 'Hidden', 'Secret', 'Quiet', 'Mystery', 'Ghost', 'Shadow', 'Silent'];

const generateAnonymousIdentity = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const seed = Math.random().toString(36).substring(7);
    return {
        name: `${adj} ${animal}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`
    };
};

export const Community = () => {
    const [communities, setCommunities] = useState<CommunityType[]>(INITIAL_COMMUNITIES);
    const [activeCommunityId, setActiveCommunityId] = useState<string>('c-1');
    const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS);
    const [newPost, setNewPost] = useState('');
    const [userCollege, setUserCollege] = useState<string>('');

    // Create Community State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCommName, setNewCommName] = useState('');
    const [newCommDesc, setNewCommDesc] = useState('');
    const [newCommType, setNewCommType] = useState<'CAMPUS' | 'TOPIC' | 'GENERAL'>('TOPIC');

    useEffect(() => {
        const init = async () => {
            try {
                const user = await API.auth.getCurrentUser();
                if (user) {
                    setUserCollege(user.college);
                    const campusComm = communities.find(c => c.name.includes(user.college) || user.college.includes(c.name));
                    if (campusComm) setActiveCommunityId(campusComm.id);
                }
            } catch(e) {}
        };
        init();
    }, []);

    const activeCommunity = communities.find(c => c.id === activeCommunityId) || communities[0];
    const filteredPosts = posts.filter(p => p.communityId === activeCommunityId);

    const handlePost = () => {
        if(!newPost.trim()) return;
        
        const identity = generateAnonymousIdentity();
        
        const post: CommunityPost = {
            id: `p-${Date.now()}`,
            communityId: activeCommunityId,
            content: newPost,
            anonymousName: identity.name,
            anonymousAvatar: identity.avatar,
            likes: 0,
            comments: 0,
            createdAt: new Date().toISOString(),
            type: activeCommunityId === 'c-6' ? "CONFESSION" : "QUERY"
        };
        
        setPosts([post, ...posts]);
        setNewPost('');
    };

    const handleCreateCommunity = () => {
        if (!newCommName.trim() || !newCommDesc.trim()) return;

        const newCommunity: CommunityType = {
            id: `c-${Date.now()}`,
            name: newCommName,
            description: newCommDesc,
            type: newCommType,
            memberCount: 1, // Starter count
            icon: newCommType === 'CAMPUS' ? '🏫' : newCommType === 'TOPIC' ? '💡' : '🌍'
        };

        setCommunities([...communities, newCommunity]);
        setActiveCommunityId(newCommunity.id);
        setShowCreateModal(false);
        setNewCommName('');
        setNewCommDesc('');
        setNewCommType('TOPIC');
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto pb-20 items-start">
            
            {/* Sidebar Communities */}
            <div className="w-full md:w-64 shrink-0 space-y-6">
                
                {/* Create New Button */}
                <Button 
                    variant="outline" 
                    className="w-full border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus className="w-4 h-4 mr-2" /> New Community
                </Button>

                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">Your Campus</h3>
                    <div className="space-y-1">
                        {communities.filter(c => c.type === 'CAMPUS').map(c => (
                            <button
                                key={c.id}
                                onClick={() => setActiveCommunityId(c.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${activeCommunityId === c.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="text-lg">{c.icon}</span>
                                <div className="text-left flex-1 truncate">
                                    <div>{c.name}</div>
                                    <div className={`text-[10px] ${activeCommunityId === c.id ? 'text-primary-200' : 'text-slate-400'}`}>{c.memberCount} students</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">Interests</h3>
                    <div className="space-y-1">
                        {communities.filter(c => c.type === 'TOPIC').map(c => (
                            <button
                                key={c.id}
                                onClick={() => setActiveCommunityId(c.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${activeCommunityId === c.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="text-lg">{c.icon}</span>
                                <div className="text-left flex-1 truncate">
                                    <div>{c.name}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">Explore</h3>
                    <div className="space-y-1">
                        {communities.filter(c => c.type === 'GENERAL').map(c => (
                            <button
                                key={c.id}
                                onClick={() => setActiveCommunityId(c.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${activeCommunityId === c.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="text-lg">{c.icon}</span>
                                <div className="text-left flex-1 truncate">
                                    <div>{c.name}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Feed */}
            <div className="flex-1 w-full min-w-0">
                {/* Header */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-3xl">{activeCommunity.icon}</span>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{activeCommunity.name}</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{activeCommunity.description}</p>
                    </div>
                    <div className="hidden sm:block text-right">
                        <div className="flex -space-x-2 justify-end mb-1">
                            {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900"></div>)}
                        </div>
                        <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{activeCommunity.memberCount.toLocaleString()} Members</p>
                    </div>
                </div>

                {/* Create Post */}
                <Card className="p-4 mb-6 border-primary-100 dark:border-primary-900/20 bg-gradient-to-br from-white to-primary-50/50 dark:from-slate-900 dark:to-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-200 dark:border-slate-700">
                            🕵️
                        </div>
                        <div className="flex-1">
                            <TextArea 
                                placeholder={`Post anonymously in ${activeCommunity.name}...`} 
                                rows={3} 
                                className="mb-3 border-none bg-transparent focus:ring-0 text-lg resize-none p-0"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                            />
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700/50 pt-3">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Lock className="w-3 h-3" />
                                    <span>Your identity will be hidden</span>
                                </div>
                                <Button onClick={handlePost} disabled={!newPost.trim()} size="sm" className="rounded-full px-6">
                                    Post Anonymously
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Feed */}
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-600 dark:text-slate-400">Quiet in here...</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-sm">Be the first to post anonymously!</p>
                        </div>
                    ) : (
                        filteredPosts.map((post) => (
                            <Card key={post.id} className="p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={post.anonymousAvatar} alt="Anon" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {post.anonymousName}
                                            {post.type === 'CONFESSION' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded border border-red-200">Confession</span>}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {/* Handle both relative strings and ISO dates for mock data compatibility */}
                                            {(post as any).time || new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-slate-800 dark:text-slate-200 mb-4 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
                                <div className="flex items-center gap-6 pt-3 border-t border-slate-50 dark:border-slate-800">
                                    <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors group">
                                        <Heart className="w-4 h-4 group-hover:fill-current" /> {post.likes}
                                    </button>
                                    <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500 transition-colors">
                                        <MessageSquare className="w-4 h-4" /> {post.comments}
                                    </button>
                                    <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-green-500 transition-colors ml-auto">
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Create Community Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Community">
                <div className="space-y-4">
                    <Input 
                        label="Community Name" 
                        placeholder="e.g. Photography Club" 
                        value={newCommName} 
                        onChange={(e) => setNewCommName(e.target.value)} 
                    />
                    
                    <TextArea 
                        label="Description" 
                        placeholder="What is this community about?" 
                        rows={3} 
                        value={newCommDesc} 
                        onChange={(e) => setNewCommDesc(e.target.value)} 
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Type</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            value={newCommType}
                            onChange={(e) => setNewCommType(e.target.value as any)}
                        >
                            <option value="TOPIC">Topic / Interest</option>
                            <option value="CAMPUS">Campus Group</option>
                            <option value="GENERAL">General / Public</option>
                        </select>
                    </div>

                    <Button onClick={handleCreateCommunity} disabled={!newCommName || !newCommDesc} className="w-full mt-4">
                        Create Community
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
