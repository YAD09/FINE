
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum TaskType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE'
}

export enum VerificationStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum AvailabilityStatus {
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  URGENT_ONLY = 'URGENT_ONLY'
}

export enum ServiceTier {
  STANDARD = 'STANDARD',
  URGENT = 'URGENT', // 1.5x
  OVERNIGHT = 'OVERNIGHT' // 2.0x
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  college: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationDocUrl?: string;
  role: UserRole;
  balance: number;
  escrowBalance: number;
  rating: number;
  reviewsCount: number;
  tasksCompleted: number;
  avatarUrl?: string;
  availability: AvailabilityStatus;
  skills?: string[]; // For Match Score
  portfolio?: string[]; // IDs of tasks in portfolio
}

export interface Comment {
  id: string;
  taskId?: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  taskId: string;
  userId: string;
  doerName: string;
  doerRating: number;
  message: string;
  price: number;
  status: OfferStatus;
  createdAt: string;
  matchScore?: number; // AI Skill Match Score
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'IMAGE' | 'DOCUMENT' | 'AUDIO';
  isVerified?: boolean; // Virus scan check
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Task {
  id: string;
  posterId: string;
  posterName: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: TaskStatus;
  type: TaskType;
  serviceTier: ServiceTier;
  location?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  tags: string[];
  executorId?: string;
  submissionUrl?: string;
  voiceNoteUrl?: string; // Voice instruction
  offers: Offer[];
  comments: Comment[];
  attachments?: Attachment[];
  reviews?: Review[];
  plagiarismScore?: number; // 0-100 (Low is good)
  proofs?: {
    draft?: Attachment[];
    final?: Attachment[];
  };
}

export interface Community {
  id: string;
  name: string;
  description: string;
  type: 'CAMPUS' | 'TOPIC' | 'GENERAL';
  memberCount: number;
  icon?: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  content: string;
  anonymousName: string; // "Anonymous Fox"
  anonymousAvatar: string; // Random generated avatar
  likes: number;
  comments: number;
  createdAt: string;
  type: 'QUERY' | 'CELEBRATION' | 'OPPORTUNITY' | 'CONFESSION';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_LOCK' | 'PAYMENT_RELEASE' | 'REFUND' | 'DISPUTE_RESOLUTION';
  amount: number;
  date: string;
  description: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
