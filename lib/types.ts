// filepath: lib/types.ts
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Location {
  id: number;
  name: string;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
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
  payPeriodId?: Int | null;
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

export interface AppState {
  isMounted: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  users: User[];
  activeUsers: User[];
  locations: Location[];
  visibleLocations: Location[];
  timeCards: TimeCard[];
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  members: Member[];
  setMembers: (m: Member[]) => void;
  templates: ShiftTemplate[];
  checklists: Checklist[];
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  currentMonth: number;
  setCurrentMonth: (m: number) => void;
  currentYear: number;
  setCurrentYear: (y: number) => void;
  calLocFilter: string;
  setCalLocFilter: (id: string) => void;
  calEmpFilter: string;
  setCalEmpFilter: (id: string) => void;

  manPeriods: number[];
  setManPeriods: (ids: number[]) => void;
  manLocs: number[];
  setManLocs: (ids: number[]) => void;
  manEmps: number[];
  setManEmps: (ids: number[]) => void;
  managerData: TimeCard[];

  DAYS_OF_WEEK: string[];
  MONTHS: string[];
  YEARS: number[];
  AVAILABLE_ROLES: string[];
  formatTimeSafe: (dStr: string) => string;
  formatDateSafe: (dStr: string) => string;
  getLocationColor: (locId: number | string) => any;
  showDashboard: boolean;
  showTimesheets: boolean;
  showSetup: boolean;
  showStaff: boolean;
  showLocations: boolean;
  showPasses: boolean;
  showBuilder: boolean;
  isManager: boolean;
  isAdmin: boolean;

  toggleManPeriod: (idx: number) => void;
  toggleManLoc: (id: number) => void;
  toggleManEmp: (id: number) => void;
  
  handleAddUser: (userData: any) => Promise<void>;
  handleRoleToggle: (userId: number, role: string) => Promise<void>;
  handleUpdateUser: (userId: number, updates: any) => Promise<void>;
  handleMergeUsers: (oldId: number, newId: number) => Promise<void>;
  handleSeedEmployees: () => Promise<void>;
  handleImportHistory: () => Promise<void>;
  handleImportTimecards: () => Promise<void>;
  handleImportPasses: () => Promise<void>;
  handleClaimShift: (shiftId: number) => Promise<void>;
  handleUnclaimShift: (shiftId: number) => Promise<void>;
  handleGenerateSchedule: () => Promise<void>;
  handleOpenReport: (card: TimeCard) => void;
  toggleChecklistTask: (taskName: string) => void;
  submitShiftReport: () => Promise<void>;
  handleExportCSV: () => void;
  handleUpdateCardStatus: (ids: number[], status: string) => Promise<void>;
  handleUpdateShiftTime: (shiftId: number, startTime: string, endTime: string, userId: number | null) => Promise<void>;
  handleCreateLocation: (payload: any) => Promise<{ success: boolean }>;
  handleUpdateLocation: (id: number, payload: any) => Promise<{ success: boolean }>;
  
  periods: { label: string; start: string; end: string }[];
  showChecklistModal: boolean;
  setShowChecklistModal: (s: boolean) => void;
  reportTargetCard: TimeCard | null;
  setReportTargetCard: (c: TimeCard | null) => void;
  editingChecklistId: number | null;
  setEditingChecklistId: (id: number | null) => void;
  clDynamicTasks: string[];
  setClDynamicTasks: (t: string[]) => void;
  clCompletedTasks: string[];
  setClCompletedTasks: (t: string[]) => void;
  clNotes: string;
  setClNotes: (n: string) => void;
  globalTasks: GlobalTask[];
  setGlobalTasks: (t: GlobalTask[]) => void;
  fetchGlobalTasks: () => void;

  giftCards: GiftCard[];
  setGiftCards: (g: GiftCard[]) => void;
  fetchGiftCards: () => void;
  handleIssueGiftCard: (payload: any) => Promise<{ success: boolean }>;
  handleRedeemCard: (id: number, amount: number) => Promise<{ success: boolean }>;
  showGiftCards: boolean;
  isGiftCardsLoading: boolean;
  
  feedbacks: Feedback[];
  setFeedbacks: (f: Feedback[]) => void;
  fetchFeedbacks: () => void;
  handleSubmitFeedback: (payload: any) => Promise<{ success: boolean }>;
  handleUpdateFeedback: (id: number, payload: any) => Promise<{ success: boolean }>;
  isFeedbacksLoading: boolean;
  highlightBaseline: string;
  
  calendarCells: (number | null)[];
  activeCalColor: any;
  activeManPeriods: { label: string; start: string; end: string }[];
  matrixRows: any[];
  hiddenWarnings: string[];
  missingPunches: Shift[];
  activeUserTimeCards: TimeCard[];
  unapprovedCount: number;
  pendingCards: TimeCard[];
  builderWeekStart: string;
  setBuilderWeekStart: (d: string) => void;
  unreadFeedbackCount: number;
  unreadMessagesCount: number;
  fetchChecklists: () => void;
  
  messages: Message[];
  setMessages: (m: Message[]) => void;
  fetchMessages: () => void;
  handleSendMessage: (content: string, isGlobal: boolean, targetUserIds: number[], targetLocationIds: number[]) => Promise<{ success: boolean }>;
  
  announcements: Announcement[];
  setAnnouncements: (a: Announcement[]) => void;
  fetchAnnouncements: () => void;
  handleCreateAnnouncement: (title: string, content: string, isGlobal: boolean, targetLocationIds: number[]) => Promise<{ success: boolean }>;
  handleDeleteAnnouncement: (id: number) => Promise<{ success: boolean }>;
}

type Int = number;