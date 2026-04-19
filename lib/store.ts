// filepath: lib/store.ts
import { create } from 'zustand';
import { User, Location, TimeCard, Shift, Member, ShiftTemplate, Checklist, GlobalTask, GiftCard, Feedback, Message, Announcement, AuditLog } from './types';
import { generatePeriods } from './common';

interface AppStore {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  
  currentMonth: number;
  setCurrentMonth: (m: number) => void;
  currentYear: number;
  setCurrentYear: (y: number) => void;
  builderWeekStart: string;
  setBuilderWeekStart: (d: string) => void;
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

  showChecklistModal: boolean;
  setShowChecklistModal: (show: boolean) => void;
  reportTargetCard: TimeCard | null;
  setReportTargetCard: (card: TimeCard | null) => void;
  editingChecklistId: number | null;
  setEditingChecklistId: (id: number | null) => void;
  clDynamicTasks: string[];
  setClDynamicTasks: (tasks: string[]) => void;
  clCompletedTasks: string[];
  setClCompletedTasks: (tasks: string[]) => void;
  clNotes: string;
  setClNotes: (notes: string) => void;

  users: User[];
  locations: Location[];
  timeCards: TimeCard[];
  shifts: Shift[];
  members: Member[];
  templates: ShiftTemplate[];
  checklists: Checklist[];
  globalTasks: GlobalTask[];
  giftCards: GiftCard[];
  feedbacks: Feedback[];
  messages: Message[];
  announcements: Announcement[];
  managerData: TimeCard[];
  auditLogs: AuditLog[]; // NEW

  isFeedbacksLoading: boolean;
  isGiftCardsLoading: boolean;

  fetchUsers: () => Promise<void>;
  fetchLocations: () => Promise<void>;
  fetchShifts: () => Promise<void>;
  fetchMembers: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchChecklists: () => Promise<void>;
  fetchGlobalTasks: () => Promise<void>;
  fetchGiftCards: () => Promise<void>;
  fetchFeedbacks: () => Promise<void>;
  fetchMessages: (userId: string) => Promise<void>;
  fetchAnnouncements: (userId: string) => Promise<void>;
  fetchTimeCards: (userId: string) => Promise<void>;
  fetchManagerData: (isManager: boolean, userId: string) => Promise<void>;
  fetchAuditLogs: () => Promise<void>; // NEW
  logAction: (action: string, details: string) => Promise<void>; // NEW
  
  fetchAllCoreData: (userId: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  activeTab: 'clock',
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedUserId: '',
  setSelectedUserId: (id) => set({ selectedUserId: id }),

  currentMonth: new Date().getMonth(),
  setCurrentMonth: (m) => set({ currentMonth: m }),
  currentYear: new Date().getFullYear(),
  setCurrentYear: (y) => set({ currentYear: y }),
  builderWeekStart: '', 
  setBuilderWeekStart: (d) => set({ builderWeekStart: d }),
  calLocFilter: '',
  setCalLocFilter: (id) => set({ calLocFilter: id }),
  calEmpFilter: '',
  setCalEmpFilter: (id) => set({ calEmpFilter: id }),

  manPeriods: [0],
  setManPeriods: (ids) => set({ manPeriods: ids }),
  manLocs:[],
  setManLocs: (ids) => set({ manLocs: ids }),
  manEmps:[],
  setManEmps: (ids) => set({ manEmps: ids }),

  showChecklistModal: false,
  setShowChecklistModal: (show) => set({ showChecklistModal: show }),
  reportTargetCard: null,
  setReportTargetCard: (card) => set({ reportTargetCard: card }),
  editingChecklistId: null,
  setEditingChecklistId: (id) => set({ editingChecklistId: id }),
  clDynamicTasks:[],
  setClDynamicTasks: (tasks) => set({ clDynamicTasks: tasks }),
  clCompletedTasks:[],
  setClCompletedTasks: (tasks) => set({ clCompletedTasks: tasks }),
  clNotes: '',
  setClNotes: (notes) => set({ clNotes: notes }),

  users: [], locations:[], timeCards: [], shifts: [], members: [],
  templates: [], checklists:[], globalTasks: [], giftCards:[],
  feedbacks: [], messages: [], announcements: [], managerData:[],
  auditLogs:[],

  isFeedbacksLoading: true,
  isGiftCardsLoading: true,

  fetchUsers: async () => { try { const res = await fetch('/api/users?t=' + Date.now()); const data = await res.json(); set({ users: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchLocations: async () => { try { const res = await fetch('/api/locations?t=' + Date.now()); const data = await res.json(); set({ locations: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchShifts: async () => { try { const res = await fetch('/api/shifts?t=' + Date.now()); const data = await res.json(); set({ shifts: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchMembers: async () => { try { const res = await fetch('/api/members?t=' + Date.now()); const data = await res.json(); set({ members: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchTemplates: async () => { try { const res = await fetch('/api/templates?t=' + Date.now()); const data = await res.json(); set({ templates: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchChecklists: async () => { try { const res = await fetch('/api/checklists?t=' + Date.now()); const data = await res.json(); set({ checklists: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchGlobalTasks: async () => { try { const res = await fetch('/api/tasks?t=' + Date.now()); const data = await res.json(); set({ globalTasks: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchGiftCards: async () => { try { const res = await fetch('/api/giftcards?t=' + Date.now()); const data = await res.json(); set({ giftCards: Array.isArray(data) ? data :[], isGiftCardsLoading: false }); } catch (e) { set({ isGiftCardsLoading: false }); } },
  fetchFeedbacks: async () => { try { const res = await fetch('/api/feedback?t=' + Date.now()); const data = await res.json(); set({ feedbacks: Array.isArray(data) ? data :[], isFeedbacksLoading: false }); } catch (e) { set({ isFeedbacksLoading: false }); } },
  fetchMessages: async (userId: string) => { if (!userId) return; try { const res = await fetch(`/api/messages?userId=${userId}&t=${Date.now()}`); const data = await res.json(); set({ messages: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchAnnouncements: async (userId: string) => { if (!userId) return; try { const res = await fetch(`/api/announcements?userId=${userId}&t=${Date.now()}`); const data = await res.json(); set({ announcements: Array.isArray(data) ? data :[] }); } catch (e) {} },
  fetchTimeCards: async (userId: string) => { if (!userId) return; try { const res = await fetch(`/api/timecards?userId=${userId}&t=${Date.now()}`); const data = await res.json(); set({ timeCards: Array.isArray(data) ? data :[] }); } catch (e) {} },
  
  // NEW: Fetch and Log Audit Actions
  fetchAuditLogs: async () => {
    try { 
      const res = await fetch('/api/audit?t=' + Date.now()); 
      const data = await res.json(); 
      set({ auditLogs: Array.isArray(data) ? data :[] }); 
    } catch (e) {}
  },
  logAction: async (action: string, details: string) => {
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details })
      });
    } catch (e) {}
  },

  updateShift: async (shiftId, startTime, endTime, userId) => {
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId, userId, startTime, endTime, action: 'UPDATE' })
      });
      if (res.ok) {
        await get().fetchShifts();
      }
    } catch (e) {}
  },

  fetchManagerData: async (isManager: boolean, userId: string) => {
    const { manPeriods, manEmps } = get();
    const periodsList = generatePeriods();
    const selectedPeriods = manPeriods.map(idx => periodsList[idx]);
    let targetEmployees = manEmps;
    if (!isManager && userId) targetEmployees = [parseInt(userId)];
    
    try {
      const res = await fetch('/api/manager?t=' + Date.now(), { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ periods: selectedPeriods, userIds: targetEmployees }) 
      });
      const data = await res.json();
      set({ managerData: Array.isArray(data) ? data :[] });
    } catch (err) {}
  },

  fetchAllCoreData: async (userId: string) => {
    const { fetchUsers, fetchLocations, fetchShifts, fetchMembers, fetchTemplates, fetchChecklists, fetchGlobalTasks, fetchGiftCards, fetchFeedbacks, fetchMessages, fetchAnnouncements, fetchTimeCards } = get();
    await Promise.all([
      fetchUsers(), fetchLocations(), fetchShifts(), fetchMembers(), fetchTemplates(),
      fetchChecklists(), fetchGlobalTasks(), fetchGiftCards(), fetchFeedbacks(),
      fetchMessages(userId), fetchAnnouncements(userId), fetchTimeCards(userId)
    ]);
  }
}));