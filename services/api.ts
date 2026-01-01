import { supabase } from './supabase';
import { User, Task, TaskStatus, Notification, Transaction, UserRole, Offer, Comment, Review, VerificationStatus, AvailabilityStatus, TaskType, ServiceTier, OfferStatus } from '../types';
import { StorageService } from './storage';

/**
 * PRODUCTION SECURITY NOTE:
 * Razorpay Secret Key (e.g., 'lyQiKHAdwZuMP5zB7dO6tzFV') must NEVER be exposed 
 * in frontend code or client-side files like this one.
 * 
 * Exact Placement:
 * 1. Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets/Env Vars
 * 2. Backend Server .env file (if using Node.js/Python/Go)
 * 3. Use the Secret Key only to verify webhook signatures or initiate Payouts via RazorpayX.
 */

StorageService.init();

let isDemoMode = false;

const setDemoMode = (val: boolean) => {
    if (val && !isDemoMode) {
        console.warn("🌐 Network Failover: Demo Mode Enabled.");
        isDemoMode = true;
    } else if (!val) {
        isDemoMode = false;
    }
};

export const getIsDemoMode = () => isDemoMode;

export const getErrorMessage = (error: any): string => {
  if (!error) return "Unknown Error.";
  if (typeof error === 'string') return error;
  const msg = (error.message || "").toLowerCase();
  if (msg.includes('failed to fetch')) { setDemoMode(true); return "Network Failure: Offline Mode Active."; }
  return error.message || "Protocol Error.";
};

async function safeQuery<T>(queryFn: () => Promise<T>, fallbackFn: () => T | Promise<T>): Promise<T> {
    if (isDemoMode) return await fallbackFn();
    try { return await queryFn(); } catch (e) { const err = getErrorMessage(e); if (err.includes("Network")) return await fallbackFn(); throw e; }
}

const mapUser = (row: any): User => ({
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    college: row.college,
    verified: row.verification_status === 'VERIFIED',
    verificationStatus: (row.verification_status as VerificationStatus) || VerificationStatus.NONE,
    role: (row.role as UserRole) || UserRole.STUDENT,
    balance: Number(row.balance || 0),
    escrowBalance: Number(row.escrow_balance || 0),
    rating: Number(row.rating || 5.0),
    reviewsCount: row.reviews_count || 0,
    tasksCompleted: row.tasks_completed || 0,
    avatarUrl: row.avatar_url,
    availability: (row.availability as AvailabilityStatus) || AvailabilityStatus.ONLINE,
});

const mapTask = (t: any): Task => ({
    ...t,
    budget: Number(t.budget || 0),
    offers: t.offers || [],
    comments: t.comments || [],
    proofs: t.proofs || {}
});

export const API = {
  auth: {
    testConnection: async () => { try { await supabase.from('users').select('id').limit(1); setDemoMode(false); return true; } catch { setDemoMode(true); return false; } },
    getCurrentUser: async () => safeQuery(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        return mapUser(data);
    }, () => StorageService.getUsers()[0] || null),
    login: async (email, password) => safeQuery(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        return mapUser(profile);
    }, () => {
        const u = StorageService.getUsers().find(x => x.email === email);
        if (u) return u;
        throw new Error("Invalid credentials.");
    }),
    // Added register method to resolve Auth.tsx error
    register: async ({ name, email, password, college }: any) => safeQuery(async () => {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, college } } });
        if (error) throw error;
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user!.id).single();
        return mapUser(profile);
    }, () => {
        const newUser: User = {
            id: `u-${Date.now()}`,
            name, username: `TaskUser-${Date.now()}`, email, college,
            verified: false, verificationStatus: VerificationStatus.NONE,
            role: UserRole.STUDENT, balance: 0, escrowBalance: 0,
            rating: 5.0, reviewsCount: 0, tasksCompleted: 0,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            availability: AvailabilityStatus.ONLINE
        };
        StorageService.addUser(newUser);
        return newUser;
    }),
    updateProfile: async (user: User) => safeQuery(async () => {
        await supabase.from('users').update({ name: user.name, availability: user.availability }).eq('id', user.id);
        return user;
    }, () => { StorageService.updateUser(user); return user; }),
    // Added submitVerification method to resolve Profile.tsx error
    submitVerification: async (userId: string, docUrl: string) => safeQuery(async () => {
        await supabase.from('users').update({ verification_status: 'PENDING', verification_doc_url: docUrl }).eq('id', userId);
        const { data } = await supabase.from('users').select('*').eq('id', userId).single();
        return mapUser(data);
    }, () => {
        const user = StorageService.getUserById(userId);
        if (user) {
            user.verificationStatus = VerificationStatus.PENDING;
            user.verificationDocUrl = docUrl;
            StorageService.updateUser(user);
        }
        return user!;
    }),
    logout: async () => { if (!isDemoMode) await supabase.auth.signOut(); }
  },

  tasks: {
    list: async () => safeQuery(async () => {
        const { data } = await supabase.from('tasks').select('*, offers(*), comments(*)').order('created_at', { ascending: false });
        return (data || []).map(mapTask);
    }, () => StorageService.getTasks()),

    create: async (task: Task, user: User) => {
        if (user.balance < task.budget) throw new Error("Insufficient Balance for Escrow.");
        
        return await safeQuery(async () => {
            const { data, error } = await supabase.from('tasks').insert({
                poster_id: user.id, poster_name: user.name, title: task.title, 
                description: task.description, budget: task.budget, status: TaskStatus.OPEN
            }).select().single();
            if (error) throw error;
            
            // ATOMIC LEDGER MOVE
            await supabase.rpc('lock_escrow', { user_id: user.id, amount: task.budget });
            return mapTask(data);
        }, () => {
            const id = `t-${Date.now()}`;
            const newTask = { ...task, id };
            StorageService.saveTask(newTask);
            
            const updatedUser = { 
                ...user, 
                balance: user.balance - task.budget, 
                escrowBalance: user.escrowBalance + task.budget 
            };
            StorageService.updateUser(updatedUser);
            StorageService.addTransaction({
                id: `tx-${Date.now()}`, userId: user.id, type: 'ESCROW_LOCK',
                amount: task.budget, date: new Date().toISOString(),
                description: `Escrow Lock: ${task.title}`, status: 'SUCCESS', idempotencyKey: `lock-${id}`
            });
            return newTask;
        });
    },

    releasePayment: async (task: Task, giver: User) => {
        if (task.status !== TaskStatus.COMPLETED) throw new Error("Task not in completed state.");
        
        return await safeQuery(async () => {
            // Complex multi-table update logic would be a DB function in production
            await supabase.rpc('release_escrow', { task_id: task.id, giver_id: giver.id, helper_id: task.executorId });
            return { ...task, status: TaskStatus.PAID };
        }, async () => {
            const helper = StorageService.getUserById(task.executorId!);
            if (!helper) throw new Error("Helper not found.");

            const fee = task.budget * 0.05;
            const netAmount = task.budget - fee;

            const updatedGiver = { ...giver, escrowBalance: giver.escrowBalance - task.budget };
            const updatedHelper = { ...helper, balance: helper.balance + netAmount, tasksCompleted: helper.tasksCompleted + 1 };
            
            StorageService.updateUser(updatedGiver);
            StorageService.updateUser(updatedHelper);
            
            const updatedTask = { ...task, status: TaskStatus.PAID };
            StorageService.updateTask(updatedTask);
            
            StorageService.addTransaction({
                id: `tx-rel-${Date.now()}`, userId: giver.id, targetUserId: helper.id,
                type: 'PAYMENT_RELEASE', amount: task.budget, fee,
                date: new Date().toISOString(), description: `Payment Released: ${task.title}`,
                status: 'SUCCESS', idempotencyKey: `rel-${task.id}`
            });
            
            return updatedTask;
        });
    },

    update: async (task: Task, user: User) => safeQuery(async () => {
        await supabase.from('tasks').update({ status: task.status, proofs: task.proofs, executor_id: task.executorId }).eq('id', task.id);
        return task;
    }, () => { StorageService.updateTask(task); return task; }),

    addOffer: async (offer: Offer) => safeQuery(async () => {
        const { data } = await supabase.from('offers').insert(offer).select().single();
        return data;
    }, () => { 
        const tasks = StorageService.getTasks();
        const t = tasks.find(x => x.id === offer.taskId);
        if (t) { t.offers.push(offer); StorageService.updateTask(t); }
        return offer;
    })
  },

  wallet: {
    getTransactions: async (userId: string) => safeQuery(async () => {
        const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map(t => ({ ...t, date: t.created_at }));
    }, () => StorageService.getTransactions(userId)),

    addFunds: async (user: User, amount: number, method: string) => safeQuery(async () => {
        const newBalance = user.balance + amount;
        await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
        await supabase.from('transactions').insert({ user_id: user.id, type: 'DEPOSIT', amount, description: `Razorpay: ${method}` });
        return { ...user, balance: newBalance };
    }, () => {
        const updatedUser = { ...user, balance: user.balance + amount };
        StorageService.updateUser(updatedUser);
        StorageService.addTransaction({
            id: `tx-dep-${Date.now()}`, userId: user.id, type: 'DEPOSIT', amount,
            date: new Date().toISOString(), description: `Razorpay: ${method}`,
            status: 'SUCCESS', idempotencyKey: `dep-${Date.now()}`
        });
        return updatedUser;
    }),
    // Added withdrawFunds method to resolve Wallet.tsx error
    withdrawFunds: async (user: User, amount: number, method: string, details: string, instant: boolean) => safeQuery(async () => {
        const fee = instant ? amount * 0.02 : 0;
        const total = amount + fee;
        if (user.balance < total) throw new Error("Insufficient Balance");
        const newBalance = user.balance - total;
        await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
        await supabase.from('transactions').insert({ user_id: user.id, type: 'WITHDRAWAL', amount, fee, description: `Withdrawal (${method}): ${details}` });
        return { ...user, balance: newBalance };
    }, () => {
        const fee = instant ? amount * 0.02 : 0;
        const total = amount + fee;
        const updatedUser = { ...user, balance: user.balance - total };
        StorageService.updateUser(updatedUser);
        StorageService.addTransaction({
            id: `tx-wd-${Date.now()}`, userId: user.id, type: 'WITHDRAWAL', amount, fee,
            date: new Date().toISOString(), description: `Withdrawal (${method}): ${details}`,
            status: 'SUCCESS', idempotencyKey: `wd-${Date.now()}`
        });
        return updatedUser;
    })
  },

  notifications: {
    fetchReal: async (userId: string) => safeQuery(async () => {
        const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map(n => ({ ...n, createdAt: n.created_at, isRead: n.is_read }));
    }, () => StorageService.getNotifications(userId)),
    // Added link parameter to resolve PublicProfile.tsx argument error
    send: async (userId: string, title: string, message: string, type: string, link?: string) => safeQuery(async () => {
        await supabase.from('notifications').insert({ user_id: userId, title, message, type, link });
    }, () => {
        StorageService.addNotification({ id: `n-${Date.now()}`, userId, title, message, type: type as any, link, isRead: false, createdAt: new Date().toISOString() });
    }),
    // Added markAllRead method to resolve App.tsx error
    markAllRead: async (userId: string) => safeQuery(async () => {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    }, () => {
        StorageService.markAllNotificationsRead(userId);
    })
  },

  // Added admin object to resolve Admin.tsx error
  admin: {
    getDisputedTasks: async () => safeQuery(async () => {
        const { data } = await supabase.from('tasks').select('*, offers(*)').eq('status', TaskStatus.DISPUTED);
        return (data || []).map(mapTask);
    }, () => StorageService.getTasks().filter(t => t.status === TaskStatus.DISPUTED)),
    getPendingVerifications: async () => safeQuery(async () => {
        const { data } = await supabase.from('users').select('*').eq('verification_status', 'PENDING');
        return (data || []).map(mapUser);
    }, () => StorageService.getUsers().filter(u => u.verificationStatus === VerificationStatus.PENDING)),
    verifyUser: async (userId: string, approve: boolean) => safeQuery(async () => {
        const status = approve ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
        await supabase.from('users').update({ verification_status: status }).eq('id', userId);
    }, () => {
        const user = StorageService.getUserById(userId);
        if (user) {
            user.verificationStatus = approve ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
            user.verified = approve;
            StorageService.updateUser(user);
        }
    }),
    resolveDispute: async (taskId: string, decision: 'REFUND_POSTER' | 'PAY_EXECUTOR') => safeQuery(async () => {
        // Production logic would involve atomic RPC
        const status = decision === 'REFUND_POSTER' ? TaskStatus.CANCELLED : TaskStatus.PAID;
        await supabase.from('tasks').update({ status }).eq('id', taskId);
    }, () => {
        const tasks = StorageService.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = decision === 'REFUND_POSTER' ? TaskStatus.CANCELLED : TaskStatus.PAID;
            StorageService.updateTask(task);
        }
    })
  },

  // Added users object to resolve PublicProfile.tsx error
  users: {
    get: async (userId: string) => safeQuery(async () => {
        const { data } = await supabase.from('users').select('*').eq('id', userId).single();
        return mapUser(data);
    }, () => StorageService.getUserById(userId)!),
    getReviews: async (userId: string) => safeQuery(async () => {
        const { data } = await supabase.from('reviews').select('*').eq('reviewee_id', userId);
        return data || [];
    }, () => [])
  }
};