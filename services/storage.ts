
import { Task, User, TaskStatus, TaskType, UserRole, Notification, Transaction, VerificationStatus, AvailabilityStatus, ServiceTier } from '../types';

const KEYS = {
  USERS: 'tasklink_db_users',
  TASKS: 'tasklink_db_tasks',
  NOTIFICATIONS: 'tasklink_db_notifications',
  TRANSACTIONS: 'tasklink_db_transactions',
  CURRENT_USER: 'tasklink_user' // Session user
};

// Seed Data for initial load
const SEED_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Alex Student',
    username: 'TaskUser#1001',
    email: 'alex@uni.edu',
    password: 'password123',
    college: 'Tech University',
    verified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    role: UserRole.STUDENT,
    balance: 1250.00,
    escrowBalance: 0,
    rating: 4.8,
    reviewsCount: 10,
    tasksCompleted: 12,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    availability: AvailabilityStatus.ONLINE
  },
  {
    id: 'u-2',
    name: 'Sarah Jenkins',
    username: 'TaskUser#1002',
    email: 'sarah@art.edu',
    password: 'password123',
    college: 'College of Arts',
    verified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    role: UserRole.STUDENT,
    balance: 450.00,
    escrowBalance: 4500.00,
    rating: 4.9,
    reviewsCount: 5,
    tasksCompleted: 3,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    availability: AvailabilityStatus.BUSY
  }
];

const SEED_TASKS: Task[] = [
  {
    id: 't-101',
    posterId: 'u-2',
    posterName: 'Sarah Jenkins',
    title: 'Need help designing a logo for my startup',
    description: 'I need a minimalist logo for a coffee shop project. Should use earth tones. Need SVG and PNG files.',
    category: 'Design',
    budget: 4500.00,
    deadline: '2023-11-15',
    status: TaskStatus.OPEN,
    type: TaskType.ONLINE,
    createdAt: '2023-11-01T10:00:00Z',
    tags: ['logo', 'illustrator'],
    offers: [],
    comments: [],
    reviews: [],
    serviceTier: ServiceTier.STANDARD
  },
  {
    id: 't-103',
    posterId: 'u-1',
    posterName: 'Alex Student',
    title: 'Submit Assignment at Admin Block',
    description: 'I am out of town. Need someone to print and submit my assignment to the Registrar office before 2 PM today. I will send the PDF.',
    category: 'Errands',
    budget: 150.00,
    deadline: '2023-11-05',
    status: TaskStatus.OPEN,
    type: TaskType.OFFLINE,
    location: 'Admin Block, University Campus',
    coordinates: { lat: 28.5900, lng: 77.2200 }, 
    createdAt: '2023-11-05T08:00:00Z',
    tags: ['errand', 'urgent', 'printing'],
    offers: [],
    comments: [],
    reviews: [],
    serviceTier: ServiceTier.URGENT
  }
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', userId: 'u-1', type: 'DEPOSIT', amount: 5000.00, date: '2023-10-01T10:00:00Z', description: 'Initial Deposit', status: 'SUCCESS' },
  { id: 'tx-2', userId: 'u-2', type: 'ESCROW_LOCK', amount: 4500.00, date: '2023-11-01T10:00:00Z', description: 'Task: Logo Design', status: 'SUCCESS' }
];

export const StorageService = {
  // Initialize DB if empty
  init: () => {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(KEYS.TASKS)) {
      localStorage.setItem(KEYS.TASKS, JSON.stringify(SEED_TASKS));
    }
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
    }
  },

  // --- Users ---
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  addUser: (user: User) => {
    const users = StorageService.getUsers();
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  updateUser: (updatedUser: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
  },

  getUserById: (id: string): User | undefined => {
    const users = StorageService.getUsers();
    return users.find(u => u.id === id);
  },

  // --- Tasks ---
  getTasks: (): Task[] => {
    const data = localStorage.getItem(KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  },

  saveTask: (task: Task) => {
    const tasks = StorageService.getTasks();
    tasks.unshift(task); // Add to top
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    window.dispatchEvent(new Event('storage'));
  },

  updateTask: (updatedTask: Task) => {
    const tasks = StorageService.getTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // --- Notifications ---
  getNotifications: (userId: string): Notification[] => {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    const allNotifs: Notification[] = data ? JSON.parse(data) : [];
    return allNotifs.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addNotification: (notif: Notification) => {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    const allNotifs: Notification[] = data ? JSON.parse(data) : [];
    allNotifs.unshift(notif);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(allNotifs));
    window.dispatchEvent(new Event('storage'));
  },

  markAllNotificationsRead: (userId: string) => {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    let allNotifs: Notification[] = data ? JSON.parse(data) : [];
    allNotifs = allNotifs.map(n => {
      if (n.userId === userId) return { ...n, isRead: true };
      return n;
    });
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(allNotifs));
    window.dispatchEvent(new Event('storage'));
  },

  // --- Transactions ---
  getTransactions: (userId: string): Transaction[] => {
     const data = localStorage.getItem(KEYS.TRANSACTIONS);
     let allTx: Transaction[] = data ? JSON.parse(data) : [];
     // Filter by userId
     return allTx.filter(tx => tx.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addTransaction: (tx: Transaction) => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    const allTx: Transaction[] = data ? JSON.parse(data) : [];
    allTx.unshift(tx);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(allTx));
  }
};