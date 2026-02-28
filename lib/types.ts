export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Location {
  id: number;
  name: string;
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
  userId: number;
  user?: User;
  locationId: number;
  location?: Location;
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
}

export interface AppState {
  isMounted: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  users: User[];
  locations: Location[];
  timeCards: TimeCard[];
  shifts: Shift[];
  members: Member[];
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
  editingCardId: number | null;
  setEditingCardId: (id: number | null) => void;
  formDate: string;
  setFormDate: (d: string) => void;
  formStartTime: string;
  setFormStartTime: (t: string) => void;
  formEndTime: string;
  setFormEndTime: (t: string) => void;
  selectedLocation: string;
  setSelectedLocation: (id: string) => void;
  passSearch: string;
  setPassSearch: (s: string) => void;
  expandedMember: number | null;
  setExpandedMember: (id: number | null) => void;
  pDate: string;
  setPDate: (d: string) => void;
  pAmt: number | string;
  setPAmt: (a: number | string) => void;
  pInitials: string;
  setPInitials: (i: string) => void;
  editingTplId: number | null;
  setEditingTplId: (id: number | null) => void;
  tplLocs: number[];
  setTplLocs: (ids: number[]) => void;
  tplDays: (string | number)[];
  setTplDays: (days: (string | number)[]) => void;
  tplStart: string;
  setTplStart: (t: string) => void;
  tplEnd: string;
  setTplEnd: (t: string) => void;
  tplStartDate: string;
  setTplStartDate: (d: string) => void;
  tplEndDate: string;
  setTplEndDate: (d: string) => void;
  tplTasks: string[];
  setTplTasks: (tasks: string[]) => void;
  tplUserId: string;
  setTplUserId: (id: string) => void;
  tplViewLocs: number[];
  setTplViewLocs: (ids: number[]) => void;
  tplViewDays: number[];
  setTplViewDays: (days: number[]) => void;
  dashPeriodIndex: number;
  setDashPeriodIndex: (i: number) => void;
  dashLocs: number[];
  setDashLocs: (ids: number[]) => void;
  dashEmployees: number[];
  setDashEmployees: (ids: number[]) => void;
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
  showManagerView: boolean;
  showSetup: boolean;
  showReports: boolean;
  showStaff: boolean;
  showPasses: boolean;
  isManager: boolean;
  isAdmin: boolean;
  toggleDashLoc: (id: number) => void;
  toggleDashEmp: (id: number) => void;
  toggleManPeriod: (idx: number) => void;
  toggleManLoc: (id: number) => void;
  toggleManEmp: (id: number) => void;
  toggleTplLoc: (id: number) => void;
  toggleTplDay: (idx: string | number) => void;
  toggleTplViewLoc: (id: number) => void;
  toggleTplViewDay: (idx: number) => void;
  toggleTplTask: (taskName: string) => void;
  handleRoleToggle: (userId: number, role: string) => Promise<void>;
  handleUpdateUser: (userId: number, updates: any) => Promise<void>;
  handleSeedEmployees: () => Promise<void>;
  handleImportHistory: () => Promise<void>;
  handleImportTimecards: () => Promise<void>;
  handleImportPasses: () => Promise<void>;
  handleClaimShift: (shiftId: number) => Promise<void>;
  handleUnclaimShift: (shiftId: number) => Promise<void>;
  handleGenerateSchedule: () => Promise<void>;
  handleManualSubmit: (e: React.FormEvent) => Promise<void>;
  handleOpenReport: (card: TimeCard) => void;
  toggleChecklistTask: (taskName: string) => void;
  submitShiftReport: () => Promise<void>;
  handleEditTemplate: (t: ShiftTemplate) => void;
  handleSaveTemplate: (e: React.FormEvent) => Promise<void>;
  handleDeleteTemplate: (id: number) => Promise<void>;
  handleRedeemBeverage: (memberId: number) => Promise<void>;
  handleLogPass: (e: React.FormEvent, memberId: number) => Promise<void>;
  handleEditClick: (card: TimeCard) => void;
  handleDeleteClick: (cardId: number) => Promise<void>;
  handleExportCSV: () => void;
  periods: { label: string; start: string; end: string }[];
  dashData: { timeCards: TimeCard[] };
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
  editingRenewalId: number | null;
  setEditingRenewalId: (id: number | null) => void;
  newRenewalDate: string;
  setNewRenewalDate: (d: string) => void;
  editingTotalId: number | null;
  setEditingTotalId: (id: number | null) => void;
  newTotalVal: number | string;
  setNewTotalVal: (v: number | string) => void;
  newBonusNotes: string;
  setNewBonusNotes: (n: string) => void;
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
  calendarCells: (number | null)[];
  activeCalColor: any;
  activeManPeriods: { label: string; start: string; end: string }[];
  matrixRows: any[];
  hiddenWarnings: string[];
  missingPunches: Shift[];
  dashVisibleData: any[];
  dashHiddenWarnings: string[];
  activeUserTimeCards: TimeCard[];
  filteredMembers: Member[];
  filteredTemplates: ShiftTemplate[];
}