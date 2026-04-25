// filepath: lib/types.ts
export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string | null;
  role: Role;
  systemRoles?: string[];
  isActive?: boolean;
  locationIds?: number[];
  lastLoginAt?: string | null;
  receiveReportEmails?: boolean;
  receiveChatEmails?: boolean; // 📧 Added for Chat Notifications
  image?: string | null;
}

export interface Location {
  id: number;
  name: string;
  isActive?: boolean;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  sendReportEmails?: boolean;
}

export interface Shift {
  id: number;
  startTime: string;
  endTime: string;
  locationId: number;
  userId: number | null;
  status: 'OPEN' | 'CLAIMED' | 'COMPLETED' | 'COVERAGE_REQUESTED';
  location?: Location;
  user?: User;
  assignedTo?: User; // Legacy support for some components
}

export interface Member {
  id: number;
  name: string;
  isActive?: boolean;
  lastName: string;
  firstName: string;
  location?: string;
  family?: string | null; // 💎 Added for Family Platinum
  membershipLevel: string;
  renewalDate?: string;
  lastResetDate?: string | null;
  totalPasses: number;
  usages: PassUsage[];
  snackUsages: any[];
  lastBeverageDate?: string;
  bonusNotes?: string;
  notes?: string;
}

export interface PassUsage {
  id: number;
  memberId: number;
  dateUsed: string;
  amount: number;
  initials: string;
  description?: string | null;
}

export interface ShiftTemplate {
  id: number;
  startTime: string;
  endTime: string;
  locationId: number;
  userId: number | null;
  dayOfWeek: number;
  startDate?: string | null;
  endDate?: string | null;
  location?: Location;
  user?: User;
  checklistTasks?: string[];
}

export interface FeedbackComment {
  id: number;
  feedbackId: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: User;
}

export interface Feedback {
  id: number;
  userId: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  createdAt: string;
  updatedAt?: string;
  user?: User;
  comments?: FeedbackComment[];
  devNotes?: string;
  type?: 'BUG' | 'FEATURE';
}

export interface Message {
  id: number;
  senderId: number;
  text: string;
  content?: string; // Some components use content
  createdAt: string;
  sender?: User;
  isGlobal?: boolean;
  targetLocationIds?: number[];
  targetUserIds?: number[];
}

export interface Announcement {
  id: number;
  authorId: number;
  title: string;
  content: string;
  createdAt: string;
  author?: User;
  isGlobal?: boolean;
  targetLocationIds?: number[];
}

export interface Checklist {
  id: number;
  userId: number;
  locationId: number;
  timeCardId: number;
  notes?: string;
  completedTasks: string[];
  missedTasks: string[];
  createdAt: string;
  date?: string; // Support legacy reports
  user?: User;
  location?: Location;
  previousShiftNotes?: string;
}

export interface TimeCard {
  id: number;
  userId: number;
  locationId: number;
  clockIn: string;
  clockOut?: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  location?: Location;
  user?: User;
  totalHours?: number;
}

export interface GlobalTask {
  id: number;
  locationId: number;
  taskName: string;
  name: string;
}

export interface GiftCard {
  id: number;
  code: string;
  balance: number;
  remainingBalance: number;
  isActive: boolean;
  member?: Member;
  recipientName?: string;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  details: string;
  createdAt: string;
  user?: User;
}

export interface ErrorLog {
  id: number;
  userId: number | null;
  message: string;
  stack?: string | null;
  path?: string | null;
  severity: string;
  createdAt: string;
  user?: User;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  locationId?: number | null;
  location?: Location;
  type?: string;
  impact: 'NONE' | 'SKIP_GENERATION';
}
