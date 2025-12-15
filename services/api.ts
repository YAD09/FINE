
import { supabase } from './supabase';
import { User, Task, TaskStatus, Notification, Transaction, UserRole, Offer, Comment, Review, VerificationStatus } from '../types';

// Helper to mask PII
const sanitizeContent = (text: string): string => {
    const phoneRegex = /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.replace(phoneRegex, '[PHONE HIDDEN]').replace(emailRegex, '[EMAIL HIDDEN]');
};

// Helper to safely extract error message
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) return String((error as any).message);
    if ('error_description' in error) return String((error as any).error_description);
    if ('details' in error) return String((error as any).details);
    if ('code' in error) return `Database Error: ${(error as any).code} - ${(error as any).message}`;
  }
  return 'An unexpected error occurred';
};

const mapUser = (row: any): User => {
    if (!row) return null as any;
    return {
        ...row,
        balance: Number(row.balance || 0),
        escrowBalance: Number(row.escrow_balance || 0),
        rating: Number(row.rating || 0),
        verified: row.verification_status === 'VERIFIED',
        verificationStatus: (row.verification_status as VerificationStatus) || VerificationStatus.NONE,
        verificationDocUrl: row.verification_doc_url,
        avatarUrl: row.avatar_url,
        reviewsCount: row.reviews_count || 0,
        tasksCompleted: row.tasks_completed || 0
    };
};

const _createProfile = async (id: string, email: string, meta: any): Promise<User> => {
    const { data: existing } = await supabase.from('users').select('*').eq('id', id).single();
    if (existing) return mapUser(existing);

    const newUser = {
        id,
        email,
        name: meta.name || 'Student',
        username: meta.username || `User${Math.floor(Math.random()*10000)}`,
        college: meta.college || 'University',
        role: 'STUDENT',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${meta.name || 'user'}`
    };

    try {
        const { error } = await supabase.from('users').insert(newUser);
        if (error) {
            console.warn("Initial profile creation failed, trying minimal insert...", error.message);
            const minimalUser = { id, email, name: newUser.name, username: newUser.username };
            const { error: minError } = await supabase.from('users').insert(minimalUser);
            if (minError) throw minError;
        }
    } catch (e) {
        console.error("Critical error creating profile:", e);
        throw e;
    }
    
    try {
        await API.notifications.send(id, "Welcome to TaskLink!", "Start browsing tasks or post one today.", "SUCCESS");
    } catch (e) { }

    return mapUser({ 
        ...newUser, 
        verification_status: 'NONE',
        reviews_count: 0,
        tasks_completed: 0,
        balance: 0,
        escrow_balance: 0,
        rating: 5.0
    });
};

export const API = {
  auth: {
    getCurrentUser: async (): Promise<User | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        try {
            const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
            if (profile) return mapUser(profile);
        } catch (e) { console.warn("Error fetching profile", e); }
        return await _createProfile(session.user.id, session.user.email!, session.user.user_metadata);
    },

    login: async (email: string, password: string): Promise<User> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (profile) return mapUser(profile);
        return await _createProfile(data.user.id, data.user.email!, data.user.user_metadata);
    },

    register: async (userData: Partial<User> & { password: string }): Promise<any> => {
        const { data, error } = await supabase.auth.signUp({
            email: userData.email!,
            password: userData.password,
            options: {
                data: {
                    name: userData.name,
                    username: `TaskUser#${Math.floor(1000 + Math.random() * 9000)}`,
                    college: userData.college
                }
            }
        });
        if (error) throw error;
        if (data.session) return await _createProfile(data.user!.id, data.user!.email!, data.user!.user_metadata);
        return { requiresOtp: true };
    },

    verifySignup: async (email: string, token: string, pendingUser: Partial<User>): Promise<User> => {
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
        if (error) throw error;
        if (data.user) {
             const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
             if (profile) return mapUser(profile);
             return await _createProfile(data.user.id, data.user.email!, { name: pendingUser.name, college: pendingUser.college });
        }
        throw new Error("Verification successful but user session missing.");
    },

    googleLogin: async (): Promise<User> => {
        const fakeEmail = "alex.google@gmail.com";
        const { data, error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: 'password123' });
        if (error) return await API.auth.register({ name: "Alex Google", email: fakeEmail, password: "password123", college: "Tech University" });
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        return mapUser(profile);
    },

    updateProfile: async (user: User): Promise<User> => {
        await supabase.from('users').update({ name: user.name, college: user.college, avatar_url: user.avatarUrl }).eq('id', user.id);
        return user;
    },

    submitVerification: async (userId: string, docUrl: string): Promise<User> => {
        await supabase.from('users').update({ verification_doc_url: docUrl, verification_status: 'PENDING' }).eq('id', userId);
        const user = await API.auth.getCurrentUser();
        return { ...user!, verificationDocUrl: docUrl, verificationStatus: VerificationStatus.PENDING };
    },

    logout: async () => { await supabase.auth.signOut(); }
  },

  users: {
      get: async (userId: string): Promise<User | null> => {
          const { data } = await supabase.from('users').select('*').eq('id', userId).single();
          if (!data) return null;
          return mapUser(data);
      },
      getReviews: async (userId: string) => {
          // Attempt to join with reviewer info. If FK is missing or fails, we gracefully degrade.
          try {
              const { data } = await supabase
                  .from('reviews')
                  .select('*, reviewer:reviewer_id(name, avatar_url)')
                  .eq('reviewee_id', userId)
                  .order('created_at', { ascending: false });
              
              return (data || []).map((r: any) => ({
                  id: r.id,
                  rating: r.rating,
                  comment: r.comment,
                  createdAt: r.created_at,
                  reviewerId: r.reviewer_id,
                  reviewerName: r.reviewer?.name || 'Unknown User',
                  reviewerAvatar: r.reviewer?.avatar_url
              }));
          } catch (e) {
              // Fallback simple fetch
              const { data } = await supabase.from('reviews').select('*').eq('reviewee_id', userId);
               return (data || []).map((r: any) => ({
                  id: r.id,
                  rating: r.rating,
                  comment: r.comment,
                  createdAt: r.created_at,
                  reviewerId: r.reviewer_id,
                  reviewerName: 'User',
                  reviewerAvatar: null
              }));
          }
      }
  },

  tasks: {
    list: async (): Promise<Task[]> => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, attachments(*), offers(*)')
            .order('created_at', { ascending: false });
        
        if (error) return [];
        
        return (data || []).map((t: any) => ({
            ...t,
            posterId: t.poster_id,
            executorId: t.executor_id,
            posterName: t.poster_name || 'User',
            budget: Number(t.budget || 0),
            createdAt: t.created_at,
            offers: (t.offers || []).map((o: any) => ({
                id: o.id,
                taskId: o.task_id,
                userId: o.user_id,
                doerName: o.doer_name,
                doerRating: o.doer_rating,
                message: o.message,
                price: o.price,
                status: o.status,
                createdAt: o.created_at
            })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            comments: t.comments || [],
            tags: t.tags || [],
            attachments: t.attachments || [],
            reviews: [] 
        }));
    },

    create: async (task: Task, user: User): Promise<Task> => {
        if (user.balance < task.budget) throw new Error('Insufficient funds. Please add money to your wallet.');

        // 1. Create Task
        const { data: taskData, error: taskError } = await supabase.from('tasks').insert({
            poster_id: user.id,
            poster_name: user.name,
            title: task.title,
            description: task.description,
            category: task.category,
            budget: task.budget,
            deadline: task.deadline,
            status: 'OPEN',
            type: task.type,
            location: task.location,
            coordinates: task.coordinates,
            tags: task.tags
        }).select().single();
        if (taskError) throw taskError;

        // 2. Add Attachments
        if (task.attachments && task.attachments.length > 0) {
            await supabase.from('attachments').insert(task.attachments.map(att => ({
                task_id: taskData.id,
                name: att.name,
                url: att.url,
                type: att.type
            })));
        }

        // 3. Deduct Balance (Move to Escrow)
        await supabase.from('users').update({ 
            balance: user.balance - task.budget,
            escrow_balance: user.escrowBalance + task.budget 
        }).eq('id', user.id);

        await API.wallet.addTransaction({
            userId: user.id,
            type: 'ESCROW_LOCK',
            amount: task.budget,
            description: `Escrow Lock: ${task.title}`
        });

        return { ...task, id: taskData.id }; 
    },

    update: async (updatedTask: Task, user: User): Promise<Task> => {
        const { data: currentTask } = await supabase.from('tasks').select('status, poster_id').eq('id', updatedTask.id).single();
        
        // --- LOGIC: ACCEPT TASK / OFFER ---
        // Transitions OPEN -> ASSIGNED
        if (updatedTask.status === 'ASSIGNED' && currentTask?.status === 'OPEN' && updatedTask.executorId) {
            // 1. Update Task Status & Executor
            const { error } = await supabase.from('tasks').update({
                status: 'ASSIGNED',
                executor_id: updatedTask.executorId
            }).eq('id', updatedTask.id);
            if (error) throw error;

            // 2. Mark specific offer ACCEPTED
            await supabase.from('offers').update({ status: 'ACCEPTED' })
                .eq('task_id', updatedTask.id)
                .eq('user_id', updatedTask.executorId);

            // 3. Mark all other offers REJECTED
            await supabase.from('offers').update({ status: 'REJECTED' })
                .eq('task_id', updatedTask.id)
                .neq('user_id', updatedTask.executorId);

            // 4. Notify Executor
            await API.notifications.send(updatedTask.executorId, "Offer Accepted! 🎉", `Your offer for "${updatedTask.title}" was accepted. Please start work.`, "SUCCESS", `/tasks/${updatedTask.id}`);
            
            return updatedTask;
        }

        // --- LOGIC: REJECT TASK / OFFER ---
        // If task status implies rejection or specific offers are rejected while task remains OPEN
        if (updatedTask.status === currentTask?.status) {
             for (const offer of updatedTask.offers) {
                 if (offer.status === 'REJECTED') {
                      await supabase.from('offers').update({ status: 'REJECTED' }).eq('id', offer.id);
                 }
             }
             return updatedTask;
        }

        // --- GENERAL STATUS UPDATE (IN_PROGRESS, COMPLETED, PAID) ---
        const { error } = await supabase.from('tasks').update({
            status: updatedTask.status,
            executor_id: updatedTask.executorId
        }).eq('id', updatedTask.id);
        if (error) throw error;

        // Notifications & Payouts
        if (currentTask && updatedTask.status === 'IN_PROGRESS') {
             await API.notifications.send(updatedTask.posterId, "Work Started 🚀", `Executor started "${updatedTask.title}".`, "INFO", `/tasks/${updatedTask.id}`);
        }
        if (currentTask && updatedTask.status === 'COMPLETED') {
             await API.notifications.send(updatedTask.posterId, "Task Completed ✅", `Please review and release payment for "${updatedTask.title}".`, "SUCCESS", `/tasks/${updatedTask.id}`);
        }
        if (currentTask && updatedTask.status === 'PAID') {
            await API.admin.payoutExecutor(updatedTask);
        }

        return updatedTask;
    },

    cancel: async (taskId: string, user: User): Promise<Task> => {
        // --- LOGIC: CANCEL AND REFUND ---
        // 1. Get Task details to verify amount
        const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
        if (!task) throw new Error("Task not found");
        if (task.status === 'CANCELLED') throw new Error("Already cancelled");
        if (task.status === 'COMPLETED' || task.status === 'PAID') throw new Error("Cannot cancel completed tasks");

        // 2. Update Status to CANCELLED
        const { error } = await supabase.from('tasks').update({ status: 'CANCELLED' }).eq('id', taskId);
        if (error) throw error;

        // 3. Process Refund to Poster
        // We need to fetch the poster's current balance to update it safely
        const { data: poster } = await supabase.from('users').select('*').eq('id', task.poster_id).single();
        const refundAmount = Number(task.budget);

        await supabase.from('users').update({
            balance: Number(poster.balance) + refundAmount,
            escrow_balance: Number(poster.escrow_balance) - refundAmount
        }).eq('id', task.poster_id);

        // 4. Record Transaction
        await API.wallet.addTransaction({
            userId: task.poster_id,
            type: 'REFUND',
            amount: refundAmount,
            description: `Refund: ${task.title}`
        });

        await API.notifications.send(task.poster_id, "Funds Refunded", `₹${refundAmount} has been returned to your wallet.`, "INFO");

        return { ...task, status: TaskStatus.CANCELLED } as any;
    },

    addOffer: async (offer: Offer) => {
        const { data: task } = await supabase.from('tasks').select('poster_id').eq('id', offer.taskId).single();
        if (task) {
            const { error } = await supabase.from('offers').insert({
                task_id: offer.taskId,
                user_id: offer.userId,
                doer_name: offer.doerName,
                doer_rating: offer.doerRating,
                message: offer.message,
                price: offer.price,
                status: 'PENDING'
            });
            if (error) throw error;
            await API.notifications.send(task.poster_id, "New Offer", `${offer.doerName} sent an offer for ₹${offer.price}`, "INFO");
        }
    },

    addComment: async (comment: Comment) => {
        const { error } = await supabase.from('comments').insert({
            task_id: comment.taskId,
            user_id: comment.userId,
            username: comment.username,
            content: sanitizeContent(comment.content)
        });
        if (error) console.error("Add comment failed", error);
    },

    submitReview: async (taskId: string, review: Omit<Review, 'id' | 'createdAt'>) => {
        await supabase.from('reviews').insert({
            task_id: taskId,
            reviewer_id: review.reviewerId,
            reviewee_id: review.revieweeId,
            rating: review.rating,
            comment: review.comment
        });

        // Recalculate Average Rating
        const { data: reviews } = await supabase.from('reviews').select('rating').eq('reviewee_id', review.revieweeId);
        if (reviews && reviews.length > 0) {
            const total = reviews.reduce((acc, r) => acc + r.rating, 0);
            const avg = total / reviews.length;
            await supabase.from('users').update({ rating: avg, reviews_count: reviews.length }).eq('id', review.revieweeId);
        }
        
        await API.notifications.send(review.revieweeId, "New Review", `You received a ${review.rating}-star rating!`, "SUCCESS");
        return { id: taskId } as any; 
    },
  },

  wallet: {
      getTransactions: async (userId: string): Promise<Transaction[]> => {
          const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
          return (data || []).map((t: any) => ({
              id: t.id,
              userId: t.user_id,
              type: t.type,
              amount: Number(t.amount || 0),
              date: t.created_at,
              description: t.description,
              status: t.status
          }));
      },

      addTransaction: async (tx: Partial<Transaction>) => {
          await supabase.from('transactions').insert({
              user_id: tx.userId,
              type: tx.type,
              amount: tx.amount,
              description: tx.description,
              status: tx.status || 'SUCCESS'
          });
      },

      addFunds: async (user: User, amount: number, method: string): Promise<User> => {
          const newBalance = user.balance + amount;
          await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
          await API.wallet.addTransaction({
              userId: user.id,
              type: 'DEPOSIT',
              amount,
              description: `Added via ${method}`
          });
          return { ...user, balance: newBalance };
      },

      withdrawFunds: async (user: User, amount: number, method: string, details: string, isInstant: boolean): Promise<User> => {
        // Logic:
        // Standard: User withdraws 500, Balance -500. User gets 500.
        // Instant: User withdraws 500, Balance -500. User gets 490 (2% fee).
        // Platform keeps fee.
        
        if (user.balance < amount) throw new Error("Insufficient funds");
        
        const newBalance = user.balance - amount;
        const fee = isInstant ? amount * 0.02 : 0; // 2% Instant Fee
        const payoutAmount = amount - fee;
        
        await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
        
        await API.wallet.addTransaction({
            userId: user.id,
            type: 'WITHDRAWAL',
            amount,
            description: `Withdrawal to ${method}${isInstant ? ' (Instant - 2% Fee)' : ''}`,
            status: 'SUCCESS'
        });
        
        return { ...user, balance: newBalance };
      }
  },

  admin: {
      getPendingVerifications: async () => {
         const { data } = await supabase.from('users').select('*').eq('verification_status', 'PENDING');
         return (data || []).map(mapUser);
      },
      
      verifyUser: async (userId: string, approve: boolean) => {
          await supabase.from('users').update({ verification_status: approve ? 'VERIFIED' : 'REJECTED' }).eq('id', userId);
          await API.notifications.send(userId, "Verification Update", approve ? "Identity Verified" : "Verification Rejected", approve ? "SUCCESS" : "ERROR");
      },

      getDisputedTasks: async () => {
        const { data } = await supabase.from('tasks').select('*, offers(*)').eq('status', 'DISPUTED');
        return (data || []).map((t:any) => ({ ...t, budget: Number(t.budget), offers: t.offers || [], posterName: t.poster_name || 'User' }));
      },

      resolveDispute: async (taskId: string, decision: 'REFUND_POSTER' | 'PAY_EXECUTOR') => {
          const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
          if (!task) return;

          const status = decision === 'REFUND_POSTER' ? 'CANCELLED' : 'PAID';
          await supabase.from('tasks').update({ status }).eq('id', taskId);

          if (decision === 'REFUND_POSTER') {
             const { data: poster } = await supabase.from('users').select('*').eq('id', task.poster_id).single();
             await supabase.from('users').update({
                balance: Number(poster.balance) + Number(task.budget),
                escrow_balance: Number(poster.escrow_balance) - Number(task.budget)
             }).eq('id', task.poster_id);
             
             await API.wallet.addTransaction({
                 userId: task.poster_id,
                 type: 'DISPUTE_RESOLUTION',
                 amount: Number(task.budget),
                 description: `Dispute Refund: ${task.title}`
             });
          } else {
             await API.admin.payoutExecutor({ ...task, budget: Number(task.budget), posterId: task.poster_id, executorId: task.executor_id });
          }
      },

      payoutExecutor: async (task: Task) => {
          // Platform Revenue: 5% Commission
          const commissionRate = 0.05;
          const commission = task.budget * commissionRate;
          const payout = task.budget - commission;

          const { data: executor } = await supabase.from('users').select('*').eq('id', task.executorId).single();
          const { data: poster } = await supabase.from('users').select('*').eq('id', task.posterId).single();

          // 1. Credit Executor (Net Amount)
          await supabase.from('users').update({
              balance: Number(executor.balance) + payout,
              tasks_completed: (executor.tasks_completed || 0) + 1
          }).eq('id', task.executorId);

          await API.wallet.addTransaction({
              userId: task.executorId!,
              type: 'PAYMENT_RELEASE',
              amount: payout,
              description: `Payment: ${task.title} (5% Platform Fee deducted)`
          });

          // 2. Clear Poster Escrow (Gross Amount)
          await supabase.from('users').update({
              escrow_balance: Number(poster.escrow_balance) - task.budget
          }).eq('id', task.posterId);

          await API.notifications.send(task.executorId!, "Payment Received", `₹${payout} added to wallet (5% platform fee deducted).`, "SUCCESS");
      }
  },

  notifications: {
      fetchReal: async (userId: string): Promise<Notification[]> => {
        const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            isRead: n.is_read,
            createdAt: n.created_at
        }));
      },
      markAllRead: async (userId: string) => { await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId); },
      send: async (userId: string, title: string, message: string, type: string, link?: string) => {
        await supabase.from('notifications').insert({ user_id: userId, title, message, type, link });
      }
  }
};
