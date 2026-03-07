"use client";
import React, { useState, useEffect } from 'react';
import { signOut, useSession, signIn as signInReact } from "next-auth/react";
import { signIn as signInPasskey } from "next-auth/webauthn"; 
import { 
  User, Location, TimeCard, Shift, Member, ShiftTemplate, 
  Checklist, GlobalTask, GiftCard, Feedback, Message, Announcement, AppState 
} from '../lib/types';

import CalendarTab from './components/CalendarTab';
import ScheduleBuilderTab from './components/ScheduleBuilderTab';
import TimeCardTab from './components/TimeCardTab';
import DashboardTab from './components/DashboardTab';
import TimesheetsTab from './components/TimesheetsTab';
import PrivilegesTab from './components/PrivilegesTab';
import SetupTab from './components/SetupTab';
import StaffTab from './components/StaffTab';
import GiftCardTab from './components/GiftCardTab';
import FeedbackTab from './components/FeedbackTab'; 
import LocationsTab from './components/LocationsTab';
import MessagesTab from './components/MessagesTab';

// ==================================================================
// 1. LOGIN SCREEN COMPONENT
// ==================================================================
function LoginScreen({ sessionData }: { sessionData: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

  const handlePasskeyLogin = async (action: "authenticate" | "register") => {
    setLoading(true);
    await signInPasskey("passkey", { email, action, callbackUrl: "/" });
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signInReact("credentials", { email, password, callbackUrl: "/" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-8 border-b-8 border-green-800 relative">
        
        {sessionData && (
          <button 
            onClick={() => signOut()}
            className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
          >
            Clear Session
          </button>
        )}

        <div className="text-center">
          <img src="/logo.png" alt="Pickles & Play" className="h-20 mx-auto mb-4" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase">
            <span className="text-yellow-500">Pickles</span> & Play
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Manager Access</p>
        </div>

        {!usePassword ? (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Email Address</label>
              <input 
                type="email" 
                placeholder="admin@picklesandplay.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-slate-300 rounded-xl p-3.5 font-bold text-slate-900 focus:border-green-600 outline-none shadow-inner"
              />
            </div>
            
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => handlePasskeyLogin("authenticate")}
                disabled={!email || loading}
                className="w-full bg-green-800 hover:bg-green-900 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider"
              >
                {loading ? "..." : "🔐 Sign In"}
              </button>
              <button 
                onClick={() => handlePasskeyLogin("register")}
                disabled={!email || loading}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm"
              >
                ➕ Register new Passkey
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button onClick={() => setUsePassword(true)} className="text-xs font-black text-blue-600 hover:text-blue-800 transition-colors">
                Lost Device or Changed Domains? Use Emergency Login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-bold text-red-800 text-center mb-4">
              Emergency Override Mode
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Admin Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-slate-300 rounded-xl p-3.5 font-bold text-slate-900 focus:border-red-600 outline-none shadow-inner"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Server Secret (Password)</label>
              <input 
                type="password" 
                required
                placeholder="Paste AUTH_SECRET here..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-slate-300 rounded-xl p-3.5 font-bold text-slate-900 focus:border-red-600 outline-none shadow-inner"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider"
              >
                {loading ? "Authenticating..." : "⚠️ Force Login"}
              </button>
            </div>

            <div className="pt-4 text-center">
              <button type="button" onClick={() => setUsePassword(false)} className="text-xs font-black text-slate-500 hover:text-slate-800 transition-colors">
                ← Back to Passkeys
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==================================================================
// 2. MAIN DASHBOARD APP (Requires Authentication)
// ==================================================================
function MainDashboard({ session }: { session: any }) {
  // --- UI & Global App State ---
  const[isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('setup'); 
  
  // --- Data States ---
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const[timeCards, setTimeCards] = useState<TimeCard[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [globalTasks, setGlobalTasks] = useState<GlobalTask[]>([]);
  const[feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // --- Loading States ---
  const [isFeedbacksLoading, setIsFeedbacksLoading] = useState(true);
  const[isGiftCardsLoading, setIsGiftCardsLoading] = useState(true);

  // --- User & Date Context ---
  const[selectedUserId, setSelectedUserId] = useState(session?.user?.id?.toString() || '');
  const[currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // --- Notifications & Local Storage Trackers ---
  const[lastViewedFeedback, setLastViewedFeedback] = useState<string>('1970-01-01T00:00:00.000Z');
  const [highlightBaseline, setHighlightBaseline] = useState<string>('1970-01-01T00:00:00.000Z');
  const [lastViewedMessages, setLastViewedMessages] = useState<string>('1970-01-01T00:00:00.000Z');

  // --- Calendar & Filter States ---
  const [calLocFilter, setCalLocFilter] = useState('');
  const[calEmpFilter, setCalEmpFilter] = useState('');

  const getMonday = (d: Date) => { 
    const dt = new Date(d); 
    const day = dt.getDay(); 
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(dt.setDate(diff)).toISOString().split('T')[0]; 
  };
  const [builderWeekStart, setBuilderWeekStart] = useState(getMonday(new Date()));

  // --- Form States (Timecards) ---
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [formUserId, setFormUserId] = useState<string>(''); 
  const[formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const[formEndTime, setFormEndTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // --- Form States (Checklists & Reports) ---
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [reportTargetCard, setReportTargetCard] = useState<TimeCard | null>(null); 
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null); 
  const [clDynamicTasks, setClDynamicTasks] = useState<string[]>([]); 
  const [clCompletedTasks, setClCompletedTasks] = useState<string[]>([]); 
  const[clNotes, setClNotes] = useState('');

  // --- Form States (Members/Passes) ---
  const[passSearch, setPassSearch] = useState('');
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const [pDate, setPDate] = useState('');
  const [pAmt, setPAmt] = useState<number | string>(1);
  const [pInitials, setPInitials] = useState('');
  const[editingRenewalId, setEditingRenewalId] = useState<number | null>(null);
  const[newRenewalDate, setNewRenewalDate] = useState('');
  const [editingTotalId, setEditingTotalId] = useState<number | null>(null);
  const [newTotalVal, setNewTotalVal] = useState<number | string>(12);
  const [newBonusNotes, setNewBonusNotes] = useState('');

  // --- Form States (Templates) ---
  const [editingTplId, setEditingTplId] = useState<number | null>(null); 
  const[tplLocs, setTplLocs] = useState<number[]>([]);
  const[tplDays, setTplDays] = useState<(string | number)[]>([]);
  const[tplStart, setTplStart] = useState('');
  const [tplEnd, setTplEnd] = useState('');
  const[tplStartDate, setTplStartDate] = useState(''); 
  const [tplEndDate, setTplEndDate] = useState('');     
  const[tplTasks, setTplTasks] = useState<string[]>([]); 
  const[newTaskStr, setNewTaskStr] = useState(''); 
  const [tplUserId, setTplUserId] = useState(''); 
  const [tplViewLocs, setTplViewLocs] = useState<number[]>([]);
  const[tplViewDays, setTplViewDays] = useState<number[]>([]);

  // --- Constants & Generators ---
  const generatePeriods = () => {
    const p =[];
    const today = new Date();
    let curM = today.getMonth();
    let curY = today.getFullYear();
    if (today.getDate() < 28) { 
      curM--; 
      if(curM < 0) { curM = 11; curY--; } 
    }
    for(let i = 0; i < 6; i++) {
      const s = new Date(curY, curM - i, 28);
      const e = new Date(curY, curM - i + 1, 27);
      p.push({ label: `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`, start: s.toISOString(), end: e.toISOString() });
    }
    return p;
  };

  const [periods] = useState(generatePeriods());
  const [manPeriods, setManPeriods] = useState<number[]>([0]); 
  const[manLocs, setManLocs] = useState<number[]>([]);
  const[manEmps, setManEmps] = useState<number[]>([]);
  const [managerData, setManagerData] = useState<TimeCard[]>([]);

  const DAYS_OF_WEEK =['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YEARS = [2025, 2026, 2027];
  const AVAILABLE_ROLES = ['Administrator', 'Manager', 'Front Desk', 'Trainer'];

  // --- Utilities ---
  const formatTimeSafe = (dStr: string) => {
    if (!dStr) return 'Active';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return 'Active';
    return d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
  };

  const formatDateSafe = (dStr: string) => {
    if (!dStr) return 'Unknown';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getLocationColor = (locId: number | string) => {
    const colors =[
      { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900', claim: 'bg-blue-600 hover:bg-blue-700', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
      { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900', claim: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
      { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900', claim: 'bg-orange-600 hover:bg-orange-700', badge: 'bg-orange-100 text-orange-900 border-orange-300' },
      { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-900', claim: 'bg-teal-600 hover:bg-teal-700', badge: 'bg-teal-100 text-teal-900 border-teal-300' },
      { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-900', claim: 'bg-pink-600 hover:bg-pink-700', badge: 'bg-pink-100 text-pink-900 border-pink-300' }
    ];
    const id = typeof locId === 'string' ? parseInt(locId) : locId;
    if(!id) return colors[0];
    const index = id % colors.length;
    return colors[index];
  };

  // --- Initial Data Fetching ---
  useEffect(() => {
    if (session?.user?.id && !selectedUserId) {
      setSelectedUserId(session.user.id.toString());
    }
  }, [session?.user?.id]);

  const fetchUsers = () => fetch('/api/users?t=' + new Date().getTime()).then(res => res.json()).then(data => setUsers(Array.isArray(data) ? data :[]));
  const fetchMembers = () => fetch('/api/members?t=' + new Date().getTime()).then(res => res.json()).then(data => setMembers(Array.isArray(data) ? data :[]));
  const fetchShifts = () => fetch('/api/shifts?t=' + new Date().getTime()).then(res => res.json()).then(data => setShifts(Array.isArray(data) ? data :[]));
  const fetchTemplates = () => fetch('/api/templates?t=' + new Date().getTime()).then(res => res.json()).then(data => setTemplates(Array.isArray(data) ? data :[]));
  const fetchChecklists = () => fetch('/api/checklists?t=' + new Date().getTime()).then(res => res.json()).then(data => setChecklists(Array.isArray(data) ? data :[]));
  const fetchGlobalTasks = () => fetch('/api/tasks?t=' + new Date().getTime()).then(res => res.json()).then(data => setGlobalTasks(Array.isArray(data) ? data :[]));
  const fetchGiftCards = () => fetch('/api/giftcards?t=' + new Date().getTime()).then(res => res.json()).then(data => { setGiftCards(Array.isArray(data) ? data :[]); setIsGiftCardsLoading(false); }).catch(() => setIsGiftCardsLoading(false));
  const fetchFeedbacks = () => fetch('/api/feedback?t=' + new Date().getTime()).then(res => res.json()).then(data => { setFeedbacks(Array.isArray(data) ? data :[]); setIsFeedbacksLoading(false); }).catch(() => setIsFeedbacksLoading(false));
  
  const fetchLocations = () => fetch('/api/locations?t=' + new Date().getTime()).then(res => res.json()).then(data => { 
    setLocations(Array.isArray(data) ? data :[]); 
    if(Array.isArray(data) && data.length > 0 && !selectedLocation) setSelectedLocation(data[0].id.toString()); 
  });
  
  const fetchMessages = () => {
    const id = selectedUserId || session?.user?.id?.toString();
    if (!id) return;
    fetch(`/api/messages?userId=${id}&t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => setMessages(Array.isArray(data) ? data :[]));
  };
  
  const fetchAnnouncements = () => {
    const id = selectedUserId || session?.user?.id?.toString();
    if (!id) return;
    fetch(`/api/announcements?userId=${id}&t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data :[]));
  };

  useEffect(() => {
    setIsMounted(true);
    if (session) {
      fetchUsers();
      fetchMembers();
      fetchTemplates();
      fetchChecklists(); 
      fetchGlobalTasks();
      fetchGiftCards(); 
      fetchFeedbacks();
      fetchLocations();
      fetchMessages();
      fetchAnnouncements();
      fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(Array.isArray(data) ? data : []));
      fetchShifts();
    }
  }, [session]);

  // Auto-refresh personal messages when the active user identity changes (Manager Dropdown)
  useEffect(() => {
    if (isMounted && session && selectedUserId) {
      fetchMessages();
      fetchAnnouncements();
    }
  }, [selectedUserId]);

  // --- Auth & Access Control Logic ---
  const safeUsers = Array.isArray(users) ? users :[];
  const authenticatedUserId = session?.user?.id?.toString();
  const authenticatedUserObj = safeUsers.find(u => u.id.toString() === authenticatedUserId);
  const authRoles = authenticatedUserObj?.systemRoles || session?.user?.systemRoles ||[];
  
  const isRealAdmin = authRoles.includes('Administrator');
  const isRealManager = authRoles.includes('Manager') || isRealAdmin;

  const activeUserObj = safeUsers.find(u => u.id === parseInt(selectedUserId));
  const activeRoles = activeUserObj?.systemRoles ||[];

  const hasRole = (roleName: string) => activeRoles.includes(roleName);
  
  const isAdmin = hasRole('Administrator');
  const isManager = hasRole('Manager') || isAdmin;
  const isFrontDesk = hasRole('Front Desk') || isManager || isAdmin;

  const systemHasAdmin = safeUsers.some(u => u.systemRoles && u.systemRoles.includes('Administrator'));
  const showDashboard = isManager || isFrontDesk; 
  const showTimesheets = isManager;
  const showSetup = isManager;
  const showBuilder = isManager; 
  const showStaff = isManager || isAdmin || !systemHasAdmin; 
  const showLocationsTab = isManager || isAdmin;
  const showPasses = isFrontDesk; 
  const showGiftCards = isFrontDesk; 

  // --- Lifecycle Effects ---
  useEffect(() => {
    if (session && (activeTab === 'dashboard' || activeTab === 'timesheets')) {
      fetchManagerData();
    }
  }, [activeTab, manPeriods, manLocs, manEmps, selectedUserId, isManager, session]);

  useEffect(() => {
    if (!isMounted || !session) return;
    if (activeTab === 'dashboard' && !showDashboard) setActiveTab('calendar');
    if (activeTab === 'timesheets' && !showTimesheets) setActiveTab('calendar');
    if (activeTab === 'builder' && !showBuilder) setActiveTab('calendar');
    if (activeTab === 'privileges' && !showPasses) setActiveTab('calendar');
    if (activeTab === 'giftcards' && !showGiftCards) setActiveTab('calendar'); 
    if (activeTab === 'setup' && !showSetup) setActiveTab('calendar');
    if (activeTab === 'staff' && !showStaff) setActiveTab('calendar');
    if (activeTab === 'locations' && !showLocationsTab) setActiveTab('calendar');
  },[selectedUserId, users, activeTab, session, isMounted, showDashboard, showTimesheets, showBuilder, showPasses, showGiftCards, showSetup, showStaff, showLocationsTab]);

  // --- Notification / LocalStorage Logic ---
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedUserId) {
      // Sync Feedback Tracking
      const storedFb = localStorage.getItem('lastViewedFeedback_' + selectedUserId);
      setLastViewedFeedback(storedFb || '1970-01-01T00:00:00.000Z');
      setHighlightBaseline(storedFb || '1970-01-01T00:00:00.000Z');

      // Sync Messages Tracking
      const storedMsg = localStorage.getItem('lastViewedMessages_' + selectedUserId);
      setLastViewedMessages(storedMsg || '1970-01-01T00:00:00.000Z');
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedUserId) {
      const now = new Date().toISOString();
      if (activeTab === 'feedback') {
        localStorage.setItem('lastViewedFeedback_' + selectedUserId, now);
        setLastViewedFeedback(now);
      }
      if (activeTab === 'messages') {
        localStorage.setItem('lastViewedMessages_' + selectedUserId, now);
        setLastViewedMessages(now);
      }
    }
  }, [activeTab, selectedUserId, feedbacks, messages, announcements]);

  const unreadFeedbackCount = (Array.isArray(feedbacks) ? feedbacks :[]).filter(fb => {
    const fbUpdated = new Date(fb.updatedAt || fb.createdAt).getTime();
    const lastViewed = new Date(lastViewedFeedback).getTime();
    if (fbUpdated <= lastViewed) return false;
    if (isManager) return true;
    return fb.userId === parseInt(selectedUserId);
  }).length;

  const unreadMessagesCount = [...(Array.isArray(messages) ? messages : []), ...(Array.isArray(announcements) ? announcements :[])].filter(item => {
    const itemDate = new Date(item.createdAt).getTime();
    const lastViewed = new Date(lastViewedMessages).getTime();
    if (itemDate <= lastViewed) return false;
    if ('senderId' in item && item.senderId === parseInt(selectedUserId)) return false;
    if ('authorId' in item && item.authorId === parseInt(selectedUserId)) return false;
    return true;
  }).length;

  // --- API / Handler Functions ---
  const fetchManagerData = async () => {
    const selectedPeriods = manPeriods.map(idx => periods[idx]);
    let targetEmployees = manEmps;
    if (!isManager && selectedUserId) {
      targetEmployees = [parseInt(selectedUserId)];
    }
    const res = await fetch('/api/manager?t=' + new Date().getTime(), { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ periods: selectedPeriods, userIds: targetEmployees }) 
    });
    const data = await res.json();
    setManagerData(Array.isArray(data) ? data :[]);
  };

  const handleCreateLocation = async (payload: any) => {
    const res = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    fetchLocations(); return { success: res.ok };
  };

  const handleUpdateLocation = async (id: number, payload: any) => {
    const res = await fetch('/api/locations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...payload }) });
    fetchLocations(); return { success: res.ok };
  };

  const handleUpdateShiftTime = async (shiftId: number, startTime: string, endTime: string, userId: number | null) => {
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, startTime, endTime, userId, status: userId === null ? 'OPEN' : 'CLAIMED' } : s));
    await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId, userId, startTime, endTime, action: 'UPDATE' }) });
    fetchShifts(); 
  };

  const handleUpdateCardStatus = async (ids: number[], status: string) => {
    await fetch('/api/timecards/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status }) });
    fetchManagerData();
    fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(Array.isArray(data) ? data :[]));
  };

  // Toggles
  const toggleManPeriod = (idx: number) => manPeriods.includes(idx) ? setManPeriods(manPeriods.filter(x => x !== idx)) : setManPeriods([...manPeriods, idx]);
  const toggleManLoc = (id: number) => manLocs.includes(id) ? setManLocs(manLocs.filter(x => x !== id)) : setManLocs([...manLocs, id]);
  const toggleManEmp = (id: number) => manEmps.includes(id) ? setManEmps(manEmps.filter(x => x !== id)) : setManEmps([...manEmps, id]);
  const toggleTplLoc = (id: number) => { if (editingTplId) return setTplLocs([id]); tplLocs.includes(id) ? setTplLocs(tplLocs.filter(x => x !== id)) : setTplLocs([...tplLocs, id]); };
  const toggleTplDay = (idx: string | number) => { if (editingTplId) return setTplDays([idx]); tplDays.includes(idx) ? setTplDays(tplDays.filter(x => x !== idx)) : setTplDays([...tplDays, idx]); };
  const toggleTplViewLoc = (id: number) => tplViewLocs.includes(id) ? setTplViewLocs(tplViewLocs.filter(x => x !== id)) : setTplViewLocs([...tplViewLocs, id]);
  const toggleTplViewDay = (idx: number) => tplViewDays.includes(idx) ? setTplViewDays(tplViewDays.filter(x => x !== idx)) : setTplViewDays([...tplViewDays, idx]);
  const toggleTplTask = (taskName: string) => { if (tplTasks.includes(taskName)) setTplTasks(tplTasks.filter(t => t !== taskName)); else setTplTasks([...tplTasks, taskName]); };

  const handleAddUser = async (userData: any) => {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
    if (res.ok) fetchUsers(); else { const err = await res.json(); alert(`Failed to add user: ${err.error || 'Unknown error'}`); }
  };

  const handleRoleToggle = async (targetUserId: number, roleName: string) => {
    const targetUser = safeUsers.find(u => u.id === targetUserId);
    if (!targetUser) return;
    let currentRoles = targetUser.systemRoles ? [...targetUser.systemRoles] :[];
    if (currentRoles.includes(roleName)) currentRoles = currentRoles.filter(r => r !== roleName);
    else currentRoles.push(roleName);
    setUsers(safeUsers.map(u => u.id === targetUserId ? { ...u, systemRoles: currentRoles } : u));
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, roles: currentRoles }) });
  };

  const handleUpdateUser = async (targetUserId: number, updates: any) => {
    setUsers(safeUsers.map(u => u.id === targetUserId ? { ...u, ...updates } : u));
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, ...updates }) });
  };

  const handleSeedEmployees = async () => { if(!confirm("Add all new employees?")) return; const res = await fetch('/api/users/seed', { method: 'POST' }); const data = await res.json(); alert(`Success! ${data.count} new employees added.`); fetchUsers(); };
  const handleImportHistory = async () => { if(!confirm("Import Garner Schedule History?")) return; const res = await fetch('/api/shifts/import-history', { method: 'POST' }); const data = await res.json(); alert(`Success! ${data.count} shifts synced.`); fetchShifts(); };
  const handleImportTimecards = async () => { if(!confirm("Import Jan/Feb Worked Timecards?")) return; const res = await fetch('/api/timecards/seed', { method: 'POST' }); const data = await res.json(); alert(`Success! ${data.count} missing timecards logged.`); fetch('/api/timecards').then(r => r.json()).then(d => setTimeCards(Array.isArray(d) ? d :[])); if (activeTab === 'dashboard') fetchManagerData(); };
  const handleImportPasses = async () => { if(!confirm("Import Platinum Guest Passes CSV?")) return; const res = await fetch('/api/members/seed', { method: 'POST' }); const data = await res.json(); alert(`Success! Added ${data.members} members.`); fetchMembers(); };

  const handleClaimShift = async (shiftId: number) => { if(!selectedUserId) return alert("Select an employee first!"); await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shiftId, userId: parseInt(selectedUserId), action: 'CLAIM' }) }); fetchShifts(); };
  const handleUnclaimShift = async (shiftId: number) => { if(!confirm("Unclaim this shift?")) return; await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shiftId, action: 'UNCLAIM' }) }); fetchShifts(); };

  const handleGenerateSchedule = async () => {
    if (templates.length === 0) return alert("Create templates first!");
    const res = await fetch('/api/shifts/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId: calLocFilter, month: currentMonth, year: currentYear }) });
    const data = await res.json();
    alert(`Success! ${data.count} new shifts generated.`);
    fetchShifts();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId) return alert("Select an employee for the timecard!");
    if (!selectedLocation) return alert("Select a location!");
    if (!formDate || !formStartTime) return alert("Date and Start Time are required!");

    const clockInDateTime = new Date(`${formDate}T${formStartTime}`);
    let clockOutDateTime = null;
    
    if (formEndTime) {
      clockOutDateTime = new Date(`${formDate}T${formEndTime}`);
      if (clockOutDateTime < clockInDateTime) {
        clockOutDateTime.setDate(clockOutDateTime.getDate() + 1);
      }
    }

    const body: any = { 
      userId: formUserId, 
      locationId: selectedLocation, 
      clockIn: clockInDateTime.toISOString(), 
      clockOut: clockOutDateTime?.toISOString() || null 
    };

    if (editingCardId) {
      body.id = editingCardId;
    }

    try {
      const res = await fetch('/api/timecards', { 
        method: editingCardId ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Timecard save error:", err);
        alert("Failed to save timecard. Please check inputs.");
        return;
      }

      setEditingCardId(null); 
      setFormStartTime(''); 
      setFormEndTime(''); 
      setFormUserId('');
      setFormDate('');
      setSelectedLocation('');

      fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(Array.isArray(data) ? data :[]));
      await fetchManagerData(); 
      setActiveTab('timesheets');
    } catch (err) {
      console.error("Fetch Exception:", err);
      alert("An unexpected network error occurred.");
    }
  };

  const handleOpenReport = (card: TimeCard) => {
    setReportTargetCard(card);
    const tcDate = new Date(card.clockIn);
    const day = tcDate.getDay();
    const mins = tcDate.getHours() * 60 + tcDate.getMinutes();
    let bestTpl: ShiftTemplate | null = null;
    let minDiff = 9999;
    templates.filter(t => t.locationId === card.locationId && t.dayOfWeek === day).forEach(t => {
      const parts = t.startTime.split(':');
      const tMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      const diff = Math.abs(mins - tMins);
      if (diff < minDiff && diff <= 180) { minDiff = diff; bestTpl = t; }
    });
    setClDynamicTasks(bestTpl?.checklistTasks || []);
    if (card.checklists && card.checklists.length > 0) {
      const existing = card.checklists[0];
      setEditingChecklistId(existing.id); setClCompletedTasks(existing.completedTasks ||[]); setClNotes(existing.notes || '');
    } else {
      setEditingChecklistId(null); setClCompletedTasks([]); setClNotes('');
    }
    setShowChecklistModal(true);
  };

  const toggleChecklistTask = (taskName: string) => clCompletedTasks.includes(taskName) ? setClCompletedTasks(clCompletedTasks.filter(t => t !== taskName)) : setClCompletedTasks([...clCompletedTasks, taskName]);

  const submitShiftReport = async () => {
    const missed = clDynamicTasks.filter(t => !clCompletedTasks.includes(t));
    const body = { id: editingChecklistId, userId: reportTargetCard?.userId, locationId: reportTargetCard?.locationId, timeCardId: reportTargetCard?.id, notes: clNotes, completedTasks: clCompletedTasks, missedTasks: missed };
    await fetch('/api/checklists', { method: editingChecklistId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowChecklistModal(false); setReportTargetCard(null); setEditingChecklistId(null);
    fetch('/api/timecards').then(res => res.json()).then(data => setTimeCards(Array.isArray(data) ? data :[]));
    fetchChecklists(); 
  };

  const handleAddMasterTask = async () => {
    if (!newTaskStr.trim()) return;
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTaskStr.trim() }) });
    if (res.ok) { setNewTaskStr(''); fetchGlobalTasks(); } else { const data = await res.json(); alert(data.error || "Failed to add task."); }
  };

  const handleEditMasterTask = async (id: number, newName: string) => {
    const res = await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: newName }) });
    if (res.ok) { fetchGlobalTasks(); fetchTemplates(); } else { const data = await res.json(); alert(data.error || "Failed to edit task."); }
  };

  const handleDeleteMasterTask = async (taskId: number) => {
    if(!confirm("Delete this master task completely?")) return;
    const res = await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId }) });
    if (res.ok) fetchGlobalTasks();
  };

  const handleEditTemplate = (t: ShiftTemplate) => {
    setEditingTplId(t.id); setTplLocs([t.locationId]); setTplDays([t.dayOfWeek]); setTplStart(t.startTime); setTplEnd(t.endTime); setTplStartDate(t.startDate || ''); setTplEndDate(t.endDate || ''); setTplTasks(t.checklistTasks ||[]); setTplUserId(t.userId?.toString() || ''); window.scrollTo(0, 0);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { id: editingTplId, locationIds: tplLocs, daysOfWeek: tplDays, startTime: tplStart, endTime: tplEnd, startDate: tplStartDate || null, endDate: tplEndDate || null, checklistTasks: tplTasks, userId: tplUserId || null };
    await fetch('/api/templates', { method: editingTplId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setEditingTplId(null); setTplLocs([]); setTplDays([]); setTplStart(''); setTplEnd(''); setTplStartDate(''); setTplEndDate(''); setTplTasks([]); setTplUserId('');
    fetchTemplates();
  };

  const handleDeleteTemplate = async (id: number) => { if(!confirm("Delete?")) return; await fetch('/api/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); fetchTemplates(); };
  const handleRedeemBeverage = async (memberId: number) => { await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, action: 'LOG_BEVERAGE' }) }); fetchMembers(); };
  const handleLogPass = async (e: React.FormEvent, memberId: number) => { e.preventDefault(); const res = await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, dateUsed: pDate, amount: pAmt, initials: pInitials }) }); if (res.ok) { setPDate(''); setPAmt(1); setPInitials(''); fetchMembers(); } };
  
  const handleEditClick = (card: TimeCard) => {
    const inD = new Date(card.clockIn);
    setFormDate(inD.toISOString().split('T')[0]); setFormStartTime(inD.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    if (card.clockOut) setFormEndTime(new Date(card.clockOut).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    else setFormEndTime('');
    setSelectedLocation(card.locationId.toString()); setFormUserId(card.userId.toString()); setEditingCardId(card.id); setActiveTab('timesheets'); window.scrollTo(0, 0);
  };

  const handleDeleteClick = async (cardId: number) => { if(!confirm("Delete?")) return; await fetch('/api/timecards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cardId }) }); fetch('/api/timecards').then(res => res.json()).then(data => setTimeCards(Array.isArray(data) ? data :[])); fetchManagerData(); };

  const handleExportCSV = () => {
    let csv = "Pay Period,Location,Employee,Hours\n";
    appState.matrixRows.forEach((row: any) => { appState.activeManPeriods.forEach((p: any) => { const h = row.periodTotals.get(p.label); if (h > 0) csv += `"${p.label}","${row.locName}","${row.empName}",${h.toFixed(2)}\n`; }); });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "Payroll.csv"; link.click();
  };

  const handleIssueGiftCard = async (payload: any) => {
    const res = await fetch('/api/giftcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    fetchGiftCards(); return { success: res.ok };
  };

  const handleRedeemCard = async (id: number, amount: number) => {
    const res = await fetch(`/api/giftcards/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redemptionAmount: amount }) });
    fetchGiftCards(); return { success: res.ok };
  };

  const handleSubmitFeedback = async (payload: any) => {
    const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    fetchFeedbacks(); return { success: res.ok };
  };

  const handleUpdateFeedback = async (id: number, payload: any) => {
    const res = await fetch(`/api/feedback/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    fetchFeedbacks(); return { success: res.ok };
  };

  const handleSendMessage = async (content: string, isGlobal: boolean, targetUserIds: number[], targetLocationIds: number[]) => {
    const res = await fetch('/api/messages', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ senderId: selectedUserId, content, isGlobal, targetUserIds, targetLocationIds }) 
    });
    if (res.ok) fetchMessages();
    return { success: res.ok };
  };

  const handleCreateAnnouncement = async (title: string, content: string, isGlobal: boolean, targetLocationIds: number[]) => {
    const res = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ authorId: selectedUserId, title, content, isGlobal, targetLocationIds }) });
    if (res.ok) fetchAnnouncements();
    return { success: res.ok };
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Delete this announcement?")) return { success: false };
    const res = await fetch('/api/announcements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) fetchAnnouncements();
    return { success: res.ok };
  };

  const TAB_LABELS: Record<string, string> = {
    calendar: 'Calendar',
    builder: 'Builder', 
    manual: 'My Time', 
    messages: 'Team Chat',
    timesheets: 'Timesheets',
    dashboard: 'Payroll',
    privileges: 'Passes',
    giftcards: 'Gift Cards',
    feedback: '💬 Feedback',
    setup: 'Shift Setup',
    staff: 'Staff',
    locations: 'Locations'
  };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInM = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells =[...new Array(firstDay).fill(null), ...Array.from({ length: daysInM }, (_, i) => i + 1)];

  const matrixMap = new Map();
  const hiddenWarningsMap = new Map();
  const activeManPeriods = manPeriods.map(idx => periods[idx]);

  (Array.isArray(managerData) ? managerData :[]).forEach(card => {
    if (manLocs.length > 0 && !manLocs.includes(card.locationId)) {
      if (!hiddenWarningsMap.has(card.user?.name)) hiddenWarningsMap.set(card.user?.name, new Set());
      hiddenWarningsMap.get(card.user?.name).add(card.location?.name); return;
    }
    const key = `${card.locationId}_${card.userId}`;
    if (!matrixMap.has(key)) matrixMap.set(key, { locName: card.location?.name, empName: card.user?.name, periodTotals: new Map(), totalRowHours: 0 });
    const row = matrixMap.get(key);
    activeManPeriods.forEach(p => {
      const cDate = new Date(card.clockIn); if (cDate >= new Date(p.start) && cDate <= new Date(new Date(p.end).setHours(23,59,59))) {
        row.periodTotals.set(p.label, (row.periodTotals.get(p.label) || 0) + (card.totalHours || 0));
        row.totalRowHours += (card.totalHours || 0);
      }
    });
  });

  const pendingCards = isManager ? (Array.isArray(managerData) ? managerData :[]).filter(c => (!c.status || c.status === 'PENDING') && c.clockOut) :[];
  const unapprovedCount = pendingCards.length;

  // --- Build Master AppState Prop ---
  const appState: AppState = {
    isMounted, activeTab, setActiveTab, users: safeUsers, locations, timeCards, shifts, setShifts, members, templates, checklists,
    selectedUserId, setSelectedUserId, currentMonth, setCurrentMonth, currentYear, setCurrentYear,
    messages, setMessages, fetchMessages, handleSendMessage,
    announcements, setAnnouncements, fetchAnnouncements, handleCreateAnnouncement, handleDeleteAnnouncement,
    calLocFilter, setCalLocFilter, calEmpFilter, setCalEmpFilter, editingCardId, setEditingCardId,
    formUserId, setFormUserId,
    formDate, setFormDate, formStartTime, setFormStartTime, formEndTime, setFormEndTime,
    selectedLocation, setSelectedLocation, passSearch, setPassSearch, expandedMember, setExpandedMember,
    pDate, setPDate, pAmt, setPAmt, pInitials, setPInitials, editingTplId, setEditingTplId,
    tplLocs, setTplLocs, tplDays, setTplDays, tplStart, setTplStart, tplEnd, setTplEnd,
    tplStartDate, setTplStartDate, tplEndDate, setTplEndDate, tplTasks, setTplTasks, tplUserId, setTplUserId,
    tplViewLocs, setTplViewLocs, tplViewDays, setTplViewDays,
    manPeriods, setManPeriods, manLocs, setManLocs, 
    manEmps, setManEmps, managerData, DAYS_OF_WEEK, MONTHS, YEARS, AVAILABLE_ROLES, formatTimeSafe, 
    formatDateSafe, getLocationColor, showDashboard, showTimesheets, showSetup, showStaff, 
    showLocations: showLocationsTab, showPasses, showBuilder, isManager, isAdmin, toggleManPeriod, toggleManLoc, toggleManEmp, 
    toggleTplLoc, toggleTplDay, toggleTplViewLoc, toggleTplViewDay, toggleTplTask, 
    handleAddUser, handleRoleToggle, 
    handleUpdateUser, handleSeedEmployees, handleImportHistory, handleImportTimecards, handleImportPasses, handleClaimShift, 
    handleUnclaimShift, handleGenerateSchedule, handleManualSubmit, handleOpenReport, toggleChecklistTask, 
    submitShiftReport, handleAddMasterTask, handleEditMasterTask, handleDeleteMasterTask, handleEditTemplate, handleSaveTemplate, handleDeleteTemplate, handleRedeemBeverage, 
    handleLogPass, handleEditClick, handleDeleteClick, handleExportCSV, handleUpdateCardStatus, handleUpdateShiftTime,
    handleCreateLocation, handleUpdateLocation, periods, 
    showChecklistModal, 
    setShowChecklistModal, reportTargetCard, setReportTargetCard, editingChecklistId, setEditingChecklistId,
    clDynamicTasks, setClDynamicTasks, clCompletedTasks, setClCompletedTasks, clNotes, setClNotes,
    globalTasks, setGlobalTasks, fetchGlobalTasks, editingRenewalId, setEditingRenewalId, newRenewalDate, setNewRenewalDate,
    editingTotalId, setEditingTotalId, newTotalVal, setNewTotalVal, newBonusNotes, setNewBonusNotes,
    giftCards, setGiftCards, fetchGiftCards, handleIssueGiftCard, handleRedeemCard, showGiftCards,
    isGiftCardsLoading, feedbacks, setFeedbacks, fetchFeedbacks, handleSubmitFeedback, handleUpdateFeedback, 
    isFeedbacksLoading, highlightBaseline, calendarCells, 
    activeCalColor: calLocFilter ? getLocationColor(calLocFilter) : { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
    activeManPeriods, matrixRows: Array.from(matrixMap.values()), hiddenWarnings: Array.from(hiddenWarningsMap.entries()).map(([k, v]) => `${k} (${Array.from(v).join(', ')})`),
    missingPunches:[],
    activeUserTimeCards: (Array.isArray(timeCards) ? timeCards :[]).filter(c => c.userId === parseInt(selectedUserId)),
    filteredMembers: (Array.isArray(members) ? members :[]).filter(m => m.lastName.toLowerCase().includes(passSearch.toLowerCase())),
    filteredTemplates: Array.isArray(templates) ? templates :[],
    unapprovedCount, pendingCards, builderWeekStart, setBuilderWeekStart, unreadFeedbackCount, unreadMessagesCount
  };

  if (!isMounted) return <div className="p-10 text-center font-bold">Loading Workspace...</div>;

  const generalTabs = ['calendar', 'manual', 'messages', 'privileges', 'giftcards', 'feedback'];
  const adminTabs = ['builder', 'timesheets', 'dashboard', 'setup', 'staff', 'locations'];

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-4 font-sans relative">
      {showChecklistModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-black mb-6">{editingChecklistId ? 'Edit Shift Report' : 'Shift Closing Checklist'}</h3>
            <div className="space-y-4 mb-8 max-h-60 overflow-y-auto">
              {clDynamicTasks.map((t, i) => (
                <label key={i} className="flex items-center space-x-3 cursor-pointer bg-slate-50 p-3 rounded-lg border">
                  <input type="checkbox" checked={clCompletedTasks.includes(t)} onChange={() => toggleChecklistTask(t)} className="w-6 h-6" />
                  <span className="font-bold">{t}</span>
                </label>
              ))}
            </div>
            <textarea value={clNotes} onChange={(e) => setClNotes(e.target.value)} rows={3} placeholder="Notes..." className="w-full border rounded-lg p-3 mb-6"></textarea>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowChecklistModal(false)} className="px-6 py-3 bg-gray-200 font-bold rounded-lg">Cancel</button>
              <button onClick={submitShiftReport} className="px-6 py-3 bg-green-800 text-white font-bold rounded-lg">Submit</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-300">
        
        {/* --- OPTIMIZED HEADER --- */}
        <div className="bg-slate-900 px-4 py-3 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Left Column: Logo & Profile Stacked */}
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto" />
              <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-widest leading-none">
                <span className="text-yellow-400">Pickles</span> & Play
              </h1>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner w-fit ml-1">
              <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">Logged in as:</span>
              
              {/* 🔥 THE MAGIC DROPDOWN 🔥 */}
              {isRealManager ? (
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-yellow-400 text-slate-900 rounded px-1.5 py-0.5 text-xs font-black outline-none cursor-pointer max-w-[140px] truncate"
                >
                  {safeUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.id.toString() === authenticatedUserId ? `★ ${u.name} (Me)` : u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-yellow-400 font-black px-1 text-xs truncate max-w-[140px]">{activeUserObj?.name || session?.user?.email}</span>
              )}

              {isRealManager && (
                <button 
                  onClick={async () => {
                    try {
                      const res = await signInPasskey("passkey", { 
                        action: "register", 
                        email: session?.user?.email || "cbriell1@yahoo.com",
                        redirect: false
                      });
                      if (res?.error) {
                        alert("Failed to link device: " + res.error);
                      } else if (res?.ok) {
                        alert("Device linked successfully!");
                      }
                    } catch (err) {
                      alert("Network error linking device.");
                      console.error(err);
                    }
                  }}
                  className="ml-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-800 bg-yellow-400 hover:bg-yellow-500 px-2 py-1 rounded transition shadow-sm"
                  title="Register this device's Passkey for this domain"
                >
                  📱 Link Device
                </button>
              )}

              <button 
                onClick={() => signOut()} 
                className="ml-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Right Column: Navigation Tabs */}
          <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto mt-2 lg:mt-0">
            
            <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end items-center bg-slate-800/50 p-1.5 rounded-xl w-full lg:w-auto">
              {isManager && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:block px-2">Staff Space</span>}
              {generalTabs.map(tab => {
                const visible = (tab === 'calendar' || tab === 'manual' || tab === 'feedback' || tab === 'messages') || 
                                (tab === 'privileges' && showPasses) || 
                                (tab === 'giftcards' && showGiftCards);
                if (!visible) return null;
                
                return (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    className={`relative px-3 py-1.5 rounded-lg font-black uppercase text-[10px] md:text-xs transition shadow-sm ${
                      activeTab === tab ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'
                    }`}
                  >
                    {TAB_LABELS[tab]}
                    {tab === 'feedback' && unreadFeedbackCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-md">
                        {unreadFeedbackCount}
                      </span>
                    )}
                    {tab === 'messages' && unreadMessagesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-md">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {isManager && (
              <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shadow-inner w-full lg:w-auto">
                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest hidden md:block px-2">Manager Space</span>
                {adminTabs.map(tab => {
                  const visible = (tab === 'builder' && showDashboard) || 
                                  (tab === 'dashboard' && showDashboard) || 
                                  (tab === 'timesheets' && showTimesheets) || 
                                  (tab === 'setup' && showSetup) || 
                                  (tab === 'locations' && showLocationsTab) ||
                                  (tab === 'staff' && showStaff);
                  if (!visible) return null;
                  
                  return (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)} 
                      className={`relative px-3 py-1.5 rounded-lg font-black uppercase text-[10px] md:text-xs transition shadow-sm ${
                        activeTab === tab ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'
                      }`}
                    >
                      {TAB_LABELS[tab]}
                      {tab === 'timesheets' && unapprovedCount > 0 && isManager && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">
                          {unapprovedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className="p-3 md:p-6 bg-gray-50">
          {activeTab === 'calendar' && <CalendarTab appState={appState} />}
          {activeTab === 'builder' && <ScheduleBuilderTab appState={appState} />}
          {activeTab === 'manual' && <TimeCardTab appState={appState} />}
          {activeTab === 'dashboard' && <DashboardTab appState={appState} />}
          {activeTab === 'timesheets' && <TimesheetsTab appState={appState} />}
          {activeTab === 'privileges' && <PrivilegesTab appState={appState} />}
          {activeTab === 'setup' && <SetupTab appState={appState} />}
          {activeTab === 'staff' && <StaffTab appState={appState} />}
          {activeTab === 'locations' && <LocationsTab appState={appState} />}
          {activeTab === 'giftcards' && <GiftCardTab appState={appState} />}
          {activeTab === 'feedback' && <FeedbackTab appState={appState} />}
          {activeTab === 'messages' && <MessagesTab appState={appState} />}
        </div>
      </div>
    </div>
  );
}

// ==================================================================
// 3. SECURITY GUARD LAYER
// ==================================================================
export default function SchedulingAppRoot() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white font-bold text-xl animate-pulse">Checking credentials...</div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return <LoginScreen sessionData={session} />;
  }

  return <MainDashboard session={session} />;
}