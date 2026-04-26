// filepath: lib/store.ts
import { create } from 'zustand';
import { User, Location, TimeCard, Shift, Member, ShiftTemplate, Checklist, GlobalTask, GiftCard, Feedback, Message, Announcement, AuditLog, Event } from './types';
import { generatePeriods } from './common';
import { customConfirm, notify } from './ui-utils';
import { updateShiftAction, deleteShiftAction, bulkDeleteShiftsAction, saveTemplatesAction, deleteTemplateAction, bulkTemplatesFromShiftsAction, generateScheduleAction } from './actions';

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
  builderMode: 'live' | 'blueprint';
  setBuilderMode: (mode: 'live' | 'blueprint') => void;
  calLocFilter: number[];
  setCalLocFilter: (ids: number[]) => void;
  calEmpFilter: number[];
  setCalEmpFilter: (ids: number[]) => void;

  sidebarBuilderOpen: boolean;
  setSidebarBuilderOpen: (open: boolean) => void;
  editingShiftId: number | null;
  setEditingShiftId: (id: number | null) => void;

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
  auditLogs: AuditLog[];
  events: Event[];

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
  fetchAuditLogs: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  logAction: (action: string, details: string) => Promise<void>;
  
  // SERVER ACTIONS MIGRATED
  updateShift: (shiftId: number, startTime: string, endTime: string, userId: number | null, action?: any) => Promise<void>;
  createShift: (locationId: number, userId: number | null, startTime: string, endTime: string, tzOffset?: number) => Promise<void>;
  deleteShift: (shiftId: number) => Promise<void>;
  bulkDeleteShifts: (startDate: string, endDate: string, locationId?: number) => Promise<void>;
  saveTemplates: (data: any) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  bulkTemplatesFromShifts: (shifts: any[]) => Promise<void>;
  generateSchedule: (startDate: string, endDate: string, locationIds?: number[], tzOffset?: number) => Promise<void>;
  
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
  builderMode: 'live',
  setBuilderMode: (mode) => set({ builderMode: mode }),
  calLocFilter: [],
  setCalLocFilter: (ids) => set({ calLocFilter: ids }),
  calEmpFilter: [],
  setCalEmpFilter: (ids) => set({ calEmpFilter: ids }),

  sidebarBuilderOpen: false,
  setSidebarBuilderOpen: (open) => set({ sidebarBuilderOpen: open }),
  editingShiftId: null,
  setEditingShiftId: (id) => set({ editingShiftId: id }),

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
  auditLogs:[], events: [],

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
  
  fetchAuditLogs: async () => {
    try { 
      const res = await fetch('/api/audit?t=' + Date.now()); 
      const data = await res.json(); 
      set({ auditLogs: Array.isArray(data) ? data :[] }); 
    } catch (e) {}
  },
  fetchEvents: async () => {
    try {
      const res = await fetch('/api/events?t=' + Date.now());
      const data = await res.json();
      set({ events: Array.isArray(data) ? data : [] });
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

  updateShift: async (shiftId, startTime, endTime, userId, action = 'UPDATE') => {
    const { shifts, users } = get();
    if (userId) {
      const newStart = new Date(startTime).getTime();
      const newEnd = new Date(endTime).getTime();
      const user = users.find(u => u.id === userId);
      const overlap = shifts.find(s => {
        if (s.id === shiftId || s.userId !== userId) return false;
        const sStart = new Date(s.startTime).getTime();
        const sEnd = new Date(s.endTime).getTime();
        return (newStart < sEnd && newEnd > sStart);
      });
      if (overlap) {
        const msg = `CONFLICT: ${user?.name} is already assigned to a shift from ${new Date(overlap.startTime).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} to ${new Date(overlap.endTime).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}. Assign anyway?`;
        if (!(await customConfirm(msg, "Shift Conflict Detected", true))) return;
      }
    }
    const res = await updateShiftAction({ shiftId, userId, startTime, endTime, action });
    if (res.success) { await get().fetchShifts(); } else { notify.error(res.error || "Failed to update shift"); }
  },

  createShift: async (locationId, userId, startTime, endTime, tzOffset) => {
    const { createShiftAction } = await import('./actions');
    // Using simple defaults for single-cell manual clicks
    const res = await createShiftAction({ 
        locationIds: [locationId], 
        userId, 
        daysOfWeek: [new Date(startTime).getDay()],
        startTime: new Date(startTime).toTimeString().slice(0,5), 
        endTime: new Date(endTime).toTimeString().slice(0,5),
        weeksToRepeat: 1,
        tzOffset
    });
    if (res.success) { notify.success("Shift created!"); await get().fetchShifts(); } else { notify.error(res.error || "Failed to create shift"); }
  },

  deleteShift: async (shiftId) => {
    const res = await deleteShiftAction(shiftId);
    if (res.success) { notify.success("Shift deleted"); await get().fetchShifts(); } else { notify.error(res.error || "Failed to delete shift"); }
  },

  bulkDeleteShifts: async (startDate, endDate, locationId) => {
    const res = await bulkDeleteShiftsAction({ startDate, endDate, locationId });
    if (res.success) { notify.success(`Successfully deleted ${res.count} shifts.`); await get().fetchShifts(); } else { notify.error(res.error || "Failed to clear shifts"); }
  },

  saveTemplates: async (data) => {
    const res = await saveTemplatesAction(data);
    if (res.success) { notify.success(data.id ? "Template updated!" : "Templates created!"); await get().fetchTemplates(); } else { notify.error(res.error || "Failed to save template"); }
  },

  deleteTemplate: async (id) => {
    const { deleteTemplateAction } = await import('./actions');
    const res = await deleteTemplateAction(id);
    if (res.success) { notify.success("Template deleted"); await get().fetchTemplates(); } else { notify.error(res.error || "Failed to delete template"); }
  },

  bulkTemplatesFromShifts: async (shifts) => {
    const res = await bulkTemplatesFromShiftsAction(shifts);
    if (res.success) { notify.success(`Success! Created master templates.`); await get().fetchTemplates(); } else { notify.error(res.error || "Failed to save week as template"); }
  },

  generateSchedule: async (startDate, endDate, locationIds, tzOffset) => {
    const res = await generateScheduleAction({ startDate, endDate, locationIds, tzOffset });
    if (res.success) { notify.success(`Success! Generated ${res.count} shifts.`); await get().fetchShifts(); } else { notify.error(res.error || "Failed to generate schedule"); }
  },

  fetchManagerData: async (isManager: boolean, userId: string) => {
    const { manPeriods, manEmps } = get();
    const periodsList = generatePeriods();
    const selectedPeriods = manPeriods.map(idx => periodsList[idx]);
    let targetEmployees = manEmps;
    if (!isManager && userId) targetEmployees = [parseInt(userId)];
    try {
      const res = await fetch('/api/manager?t=' + Date.now(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periods: selectedPeriods, userIds: targetEmployees }) });
      const data = await res.json();
      set({ managerData: Array.isArray(data) ? data :[] });
    } catch (err) {}
  },

  fetchAllCoreData: async (userId: string) => {
    const { fetchUsers, fetchLocations, fetchShifts, fetchMembers, fetchTemplates, fetchChecklists, fetchGlobalTasks, fetchGiftCards, fetchFeedbacks, fetchMessages, fetchAnnouncements, fetchTimeCards, fetchEvents } = get();
    
    // 🛡️ STAGGERED FETCH (Prevents DB pool saturation on production cold starts)
    console.log("🚦 Starting Sequential Data Hydration...");
    
    // Batch 1: Crucial permission/layout data
    await fetchUsers();
    await fetchLocations();

    // Batch 2: Background infrastructure
    await fetchGlobalTasks();
    await fetchTemplates();
    await fetchEvents();

    // Batch 3: User-specific & High-volume data
    await fetchShifts();
    await fetchMembers();
    await fetchChecklists();
    await fetchGiftCards();
    await fetchFeedbacks();

    // Batch 4: Comms
    await fetchMessages(userId);
    await fetchAnnouncements(userId);
    await fetchTimeCards(userId);
    
    console.log("🏁 Data Hydration Complete.");
  }
}));

// 🧪 EXPOSE STATE FOR AUTOMATED TESTING
if (typeof window !== 'undefined') {
  (window as any).__ZUSTAND_STATE__ = useAppStore.getState();
}
