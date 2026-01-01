
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
  URGENT = 'URGENT', 
  OVERNIGHT = 'OVERNIGHT'
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
  skills?: string[];
  portfolio?: string[];
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
  matchScore?: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'IMAGE' | 'DOCUMENT' | 'AUDIO';
  isVerified?: boolean;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
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
  voiceNoteUrl?: string;
  offers: Offer[];
  comments: Comment[];
  attachments?: Attachment[];
  reviews?: Review[];
  plagiarismScore?: number;
  proofs?: {
    draft?: Attachment[];
    final?: Attachment[];
  };
  autoApproveAt?: string; // ISO string for auto-payout
}

export interface Transaction {
  id: string;
  userId: string;
  targetUserId?: string; // For transfers
  taskId?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_LOCK' | 'PAYMENT_RELEASE' | 'REFUND' | 'DISPUTE_RESOLUTION';
  amount: number;
  fee?: number;
  date: string;
  description: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  idempotencyKey: string; // Prevents double spending
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

// Added Community interface to resolve errors in Community.tsx
export interface Community {
  id: string;
  name: string;
  description: string;
  type: 'CAMPUS' | 'TOPIC' | 'GENERAL';
  memberCount: number;
  icon: string;
}

// Added CommunityPost interface to resolve errors in Community.tsx
export interface CommunityPost {
  id: string;
  communityId: string;
  content: string;
  anonymousName: string;
  anonymousAvatar: string;
  likes: number;
  comments: number;
  type: 'QUERY' | 'CELEBRATION' | 'CONFESSION';
  createdAt: string;
}
