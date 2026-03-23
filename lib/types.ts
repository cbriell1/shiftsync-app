// filepath: lib/types.ts
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Location {
  id: number;
  name: string;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
  sendReportEmails?: boolean; 
}

export interface User {
  id: number;
  name: string;
  pinCode?: string | null;
  role: Role;
  systemRoles: string[];
  locationId?: number | null;
  locationIds?: number[];
  location?: Location;
  courtReserveId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  emailVerified?: Date | string | null;
  image?: string | null;
  isActive?: boolean;
  receiveReportEmails?: boolean; 
  lastLoginAt?: string | null; 
}

export interface Shift {
  id: number;
  startTime: string;
  endTime: string;
  status: 'OPEN' | 'CLAIMED' | 'COVERAGE_REQUESTED';
  locationId: number;
  location?: Location;
  userId?: number | null;
  assignedTo?: User | null;
}

export interface TimeCard {
  id: number;
  clockIn: string;
  clockOut?: string | null;
  totalHours?: number | null;
  status?: string;
  userId: number;
  user?: User;
  locationId: number;
  location?: Location;
  payPeriodId?: number | null;
  payPeriod?: any | null;
  checklists?: Checklist[];
}

export interface Checklist {
  id: number;
  date: string;
  userId: number;
  user?: User;
  locationId: number;
  location?: Location;
  timeCardId?: number | null;
  notes?: string | null;
  previousShiftNotes?: string | null; 
  completedTasks: string[];
  missedTasks: string[];
  photoUrls?: string[];
}

export interface Member {
  id: number;
  lastName: string;
  firstName: string;
  location?: string | null;
  notes?: string | null;
  bonusNotes?: string | null;
  family?: string | null;
  renewalDate?: string | null;
  totalPasses: number;
  lastBeverageDate?: string | null;
  usages: PassUsage[];
}

export interface PassUsage {
  id: number;
  dateUsed: string;
  amount: number;
  initials?: string | null;
  memberId: number;
}

export interface GiftCard {
  id: number;
  code: string;
  initialAmount: number;
  remainingBalance: number;
  recipientName?: string | null;
  memberId?: number | null;
  member?: { firstName: string; lastName: string };
  issuedAt: string;
}

export interface ShiftTemplate {
  id: number;
  locationId: number;
  location?: Location;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate?: string | null;
  endDate?: string | null;
  checklistTasks: string[];
  userId?: number | null;
  user?: User;
}

export interface GlobalTask {
  id: number;
  name: string;
}

export interface Feedback {
  id: number;
  userId: number;
  user?: User;
  type: string;
  description: string;
  status: 'OPEN' | 'IN PROGRESS' | 'COMPLETED';
  devNotes?: string | null;
  createdAt: string;
  updatedAt?: string; 
}

export interface Message {
  id: number;
  content: string;
  senderId: number;
  sender?: User;
  isGlobal: boolean;
  targetUserIds: number[];
  targetLocationIds: number[];
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: number;
  author?: User;
  isGlobal: boolean;
  targetLocationIds: number[];
  createdAt: string;
}

// NEW: Audit Log Interface
export interface AuditLog {
  id: number;
  userId?: number | null;
  user?: { name: string; email: string | null } | null;
  action: string;
  details: string;
  createdAt: string;
}

export interface AppState {
  [key: string]: any; // Legacy catch-all for old components transitioning to Zustand
}