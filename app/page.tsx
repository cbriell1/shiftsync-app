// filepath: app/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { signOut, useSession, signIn as signInReact } from "next-auth/react";
import { signIn as signInPasskey } from "next-auth/webauthn"; 
import { notify, customConfirm } from '@/lib/ui-utils';
import { 
  User, Location, TimeCard, Shift, Member, ShiftTemplate, 
  Checklist, GlobalTask, GiftCard, Feedback, Message, Announcement, AppState 
} from './lib/types';

import CalendarTab from './components/CalendarTab';
import ScheduleBuilderTab from './components/ScheduleBuilderTab';
import TimeCardTab from './components/TimeCardTab';
import DashboardTab from './components/DashboardTab';
import TimesheetsTab from './components/TimesheetsTab';
import PrivilegesTab from './components/PrivilegesTab';
import SetupTab from './components/SetupTab';
import StaffTab from './components/StaffTab';
import LocationsTab from './components/LocationsTab';
import GiftCardTab from './components/GiftCardTab';
import FeedbackTab from './components/FeedbackTab'; 
import MessagesTab from './components/MessagesTab';
import TimeClockTab from './components/TimeClockTab';

// ==================================================================
// 1. LOGIN SCREEN COMPONENT
// ==================================================================
function LoginScreen({ sessionData }: { sessionData: any }) {
  const[email, setEmail] = useState("");
  const[password, setPassword] = useState("");
  const[loading, setLoading] = useState(false);
  const[usePassword, setUsePassword] = useState(false);

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
          <button onClick={() => signOut()} className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">
            Clear Session
          </button>
        )}
        <div className="text-center">
          <img src="/logo.png" alt="Pickles & Play" className="h-20 mx-auto mb-4" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase"><span className="text-yellow-500">Pickles</span> & Play</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Manager Access</p>
        </div>

        {!usePassword ? (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Email Address</label>
              <input type="email" placeholder="admin@picklesandplay.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 border-slate-300 rounded-xl p-3.5 font-bold text-slate-900 focus:border-green-600 outline-none shadow-inner" />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => handlePasskeyLogin("authenticate")} disabled={!email || loading} className="w-full bg-green-800 hover:bg-green-900 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider">
                {loading ? "..." : "🔐 Sign In"}
              </button>
              <button onClick={() => handlePasskeyLogin("register")} disabled={!email || loading} className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-bold text-red-800 text-center mb-4">Emergency Override Mode</div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Admin Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 border-slate-300 rounded-xl p-3.5 font-bold text-slate-900 focus:border-green-600 outline-none shadow-inner" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Server Secret (Password)</label>
              <input type="password" required placeholder="Paste AUTH_SECRET here..." value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-slate-300 rounded-xl p-3.5 font-bold text-slate-900 focus:border-red-600 outline-none shadow-inner" />
            </div>
            <div className="pt-2">
              <button type="submit" disabled={loading || !email || !password} className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider">
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
// 2. MAIN DASHBOARD APP
// ==================================================================
function MainDashboard({ session }: { session: any }) {
  const[isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('clock');
  
  const [users, setUsers] = useState<User[]>([]);
  const[locations, setLocations] = useState<Location[]>([]);
  const[timeCards, setTimeCards] = useState<TimeCard[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const[members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const[checklists, setChecklists] = useState<Checklist[]>([]);
  const[globalTasks, setGlobalTasks] = useState<GlobalTask[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const[giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const[messages, setMessages] = useState<Message[]>([]);
  const[announcements, setAnnouncements] = useState<Announcement[]>([]);

  const[isFeedbacksLoading, setIsFeedbacksLoading] = useState(true);
  const [isGiftCardsLoading, setIsGiftCardsLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState(session?.user?.id?.toString() || '');
  const[currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const[currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const[lastViewedFeedback, setLastViewedFeedback] = useState<string>('1970-01-01T00:00:00.000Z');
  const[highlightBaseline, setHighlightBaseline] = useState<string>('1970-01-01T00:00:00.000Z');
  const[lastViewedMessages, setLastViewedMessages] = useState<string>('1970-01-01T00:00:00.000Z');

  const[calLocFilter, setCalLocFilter] = useState('');
  const[calEmpFilter, setCalEmpFilter] = useState('');

  const getMonday = (d: Date) => { 
    const dt = new Date(d); 
    const day = dt.getDay(); 
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(dt.setDate(diff)).toISOString().split('T')[0]; 
  };
  const[builderWeekStart, setBuilderWeekStart] = useState(getMonday(new Date()));

  const[showChecklistModal, setShowChecklistModal] = useState(false);
  const[reportTargetCard, setReportTargetCard] = useState<TimeCard | null>(null); 
  const[editingChecklistId, setEditingChecklistId] = useState<number | null>(null); 
  const[clDynamicTasks, setClDynamicTasks] = useState<string[]>([]); 
  const[clCompletedTasks, setClCompletedTasks] = useState<string[]>([]); 
  const[clNotes, setClNotes] = useState('');

  const generatePeriods = () => {
    const p =[];
    const today = new Date();
    let curM = today.getMonth();
    let curY = today.getFullYear();
    if (today.getDate() < 28) { curM--; if(curM < 0) { curM = 11; curY--; } }
    for(let i = 0; i < 6; i++) {
      const s = new Date(curY, curM - i, 28);
      const e = new Date(curY, curM - i + 1, 27);
      p.push({ label: `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`, start: s.toISOString(), end: e.toISOString() });
    }
    return p;
  };

  const[periods] = useState(generatePeriods());
  const[manPeriods, setManPeriods] = useState<number[]>([0]); 
  const[manLocs, setManLocs] = useState<number[]>([]);
  const[manEmps, setManEmps] = useState<number[]>([]);
  const[managerData, setManagerData] = useState<TimeCard[]>([]);

  const DAYS_OF_WEEK =['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YEARS =[2025, 2026, 2027];
  const AVAILABLE_ROLES =['Administrator', 'Manager', 'Front Desk', 'Trainer'];

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

  const fetchUsers = () => fetch('/api/users?t=' + new Date().getTime()).then(res => res.json()).then(data => setUsers(Array.isArray(data) ? data :[])).catch(() => {});
  const fetchMembers = () => fetch('/api/members?t=' + new Date().getTime()).then(res => res.json()).then(data => setMembers(Array.isArray(data) ? data :[])).catch(() => {});
  const fetchShifts = () => fetch('/api/shifts?t=' + new Date().getTime()).then(res => res.json()).then(data => setShifts(Array.isArray(data) ? data :[])).catch(() => {});
  const fetchTemplates = () => fetch('/api/templates?t=' + new Date().getTime()).then(res => res.json()).then(data => setTemplates(Array.isArray(data) ? data :[])).catch(() => {});
  const fetchChecklists = () => fetch('/api/checklists?t=' + new Date().getTime()).then(res => res.json()).then(data => setChecklists(Array.isArray(data) ? data :[])).catch(() => {});
  const fetchGlobalTasks = () => fetch('/api/tasks?t=' + new Date().getTime()).then(res => res.json()).then(data => setGlobalTasks(Array.isArray(data) ? data :[])).catch(() => {});
  const fetchGiftCards = () => fetch('/api/giftcards?t=' + new Date().getTime()).then(res => res.json()).then(data => { setGiftCards(Array.isArray(data) ? data :[]); setIsGiftCardsLoading(false); }).catch(() => setIsGiftCardsLoading(false));
  const fetchFeedbacks = () => fetch('/api/feedback?t=' + new Date().getTime()).then(res => res.json()).then(data => { setFeedbacks(Array.isArray(data) ? data :[]); setIsFeedbacksLoading(false); }).catch(() => setIsFeedbacksLoading(false));
  const fetchLocations = () => fetch('/api/locations?t=' + new Date().getTime()).then(res => res.json()).then(data => setLocations(Array.isArray(data) ? data :[])).catch(() => {});
  
  const fetchTimeCards = () => {
    const id = selectedUserId || session?.user?.id?.toString();
    if (!id) return;
    fetch(`/api/timecards?userId=${id}&t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => setTimeCards(Array.isArray(data) ? data :[]))
      .catch(() => {});
  };

  const fetchMessages = () => {
    const id = selectedUserId || session?.user?.id?.toString();
    if (!id) return;
    fetch(`/api/messages?userId=${id}&t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => setMessages(Array.isArray(data) ? data :[]))
      .catch(() => {});
  };
  
  const fetchAnnouncements = () => {
    const id = selectedUserId || session?.user?.id?.toString();
    if (!id) return;
    fetch(`/api/announcements?userId=${id}&t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data :[]))
      .catch(() => {});
  };

  useEffect(() => {
    setIsMounted(true);
    if (!session) return;
    fetchUsers(); fetchMembers(); fetchTemplates(); fetchChecklists(); fetchGlobalTasks(); fetchGiftCards(); fetchFeedbacks(); fetchLocations(); fetchMessages(); fetchAnnouncements(); fetchTimeCards(); fetchShifts();
    
    if (session.user.id && !selectedUserId) {
      setSelectedUserId(session.user.id.toString());
    }

    const syncOperationalData = () => {
      if (!selectedUserId) return;
      // UPDATED: Now fetches Templates and Global Tasks in the background as well
      fetchTemplates();
      fetchGlobalTasks();
      fetchChecklists(); 
      fetchTimeCards(); 
      fetchShifts(); 
      fetchMessages(); 
      fetchAnnouncements();
    };
    const onFocus = () => syncOperationalData();
    window.addEventListener('focus', onFocus);
    const intervalId = setInterval(syncOperationalData, 30000);
    return () => { window.removeEventListener('focus', onFocus); clearInterval(intervalId); };
  },[session, selectedUserId]); 

  const safeUsers = Array.isArray(users) ? users :[];
  const activeUsers = safeUsers.filter(u => u.isActive !== false);

  const authenticatedUserId = session?.user?.id?.toString();
  const authenticatedUserObj = safeUsers.find(u => u.id.toString() === authenticatedUserId);
  const authRoles = authenticatedUserObj?.systemRoles || session?.user?.systemRoles ||[];
  
  const isRealAdmin = authRoles.includes('Administrator') || session?.user?.email === 'cbriell1@yahoo.com';
  const isRealManager = authRoles.includes('Manager') || isRealAdmin;

  const activeUserObj = safeUsers.find(u => u.id === parseInt(selectedUserId));
  const activeRoles = activeUserObj?.systemRoles ||[];

  const isAdmin = activeRoles.includes('Administrator') || (selectedUserId === authenticatedUserId && isRealAdmin);
  const isManager = activeRoles.includes('Manager') || isAdmin || (selectedUserId === authenticatedUserId && isRealManager);
  const isFrontDesk = activeRoles.includes('Front Desk') || isManager || isAdmin;

  const systemHasAdmin = safeUsers.some(u => u.systemRoles && u.systemRoles.includes('Administrator'));
  const showDashboard = isManager || isFrontDesk; 
  const showTimesheets = isManager;
  const showSetup = isManager;
  const showBuilder = isManager; 
  const showStaff = isManager || isAdmin || !systemHasAdmin; 
  const showLocationsTab = isManager || isAdmin;
  const showPasses = isFrontDesk; 
  const showGiftCards = isFrontDesk; 

  const allowedLocationIds = activeUserObj?.locationIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id) ||[];
  const visibleLocations = isAdmin 
    ? locations 
    : locations.filter(loc => allowedLocationIds.includes(loc.id));

  useEffect(() => {
    if (isMounted && authenticatedUserId) {
      const savedTab = localStorage.getItem('lastActiveTab_' + authenticatedUserId);
      if (savedTab) setActiveTab(savedTab);
    }
  },[isMounted, authenticatedUserId]);

  useEffect(() => {
    if (isMounted && authenticatedUserId && users.length > 0) {
      localStorage.setItem('lastActiveTab_' + authenticatedUserId, activeTab);
    }
  },[activeTab, authenticatedUserId, isMounted, users.length]);

  useEffect(() => {
    if (!isMounted || !session || users.length === 0) return; 
    if (activeTab === 'dashboard' && !showDashboard) setActiveTab('clock');
    if (activeTab === 'timesheets' && !showTimesheets) setActiveTab('clock');
    if (activeTab === 'builder' && !showBuilder) setActiveTab('clock');
    if (activeTab === 'privileges' && !showPasses) setActiveTab('clock');
    if (activeTab === 'giftcards' && !showGiftCards) setActiveTab('clock'); 
    if (activeTab === 'setup' && !showSetup) setActiveTab('clock');
    if (activeTab === 'staff' && !showStaff) setActiveTab('clock');
    if (activeTab === 'locations' && !showLocationsTab) setActiveTab('clock');
  },[selectedUserId, users.length, activeTab, session, isMounted, showDashboard, showTimesheets, showBuilder, showPasses, showGiftCards, showSetup, showStaff, showLocationsTab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedUserId) {
      const storedFb = localStorage.getItem('lastViewedFeedback_' + selectedUserId);
      setLastViewedFeedback(storedFb || '1970-01-01T00:00:00.000Z');
      setHighlightBaseline(storedFb || '1970-01-01T00:00:00.000Z');
      const storedMsg = localStorage.getItem('lastViewedMessages_' + selectedUserId);
      setLastViewedMessages(storedMsg || '1970-01-01T00:00:00.000Z');
    }
  },[selectedUserId]);

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
  },[activeTab, selectedUserId, feedbacks.length, messages.length, announcements.length]);

  const unreadFeedbackCount = useMemo(() => {
    return (Array.isArray(feedbacks) ? feedbacks :[]).filter(fb => {
      const fbUpdated = new Date(fb.updatedAt || fb.createdAt).getTime();
      const lastViewed = new Date(lastViewedFeedback).getTime();
      if (fbUpdated <= lastViewed) return false;
      if (isManager) return true;
      return fb.userId === parseInt(selectedUserId);
    }).length;
  },[feedbacks, lastViewedFeedback, isManager, selectedUserId]);

  const unreadMessagesCount = useMemo(() => {
    return[...(Array.isArray(messages) ? messages : []), ...(Array.isArray(announcements) ? announcements :[])].filter(item => {
      const itemDate = new Date(item.createdAt).getTime();
      const lastViewed = new Date(lastViewedMessages).getTime();
      if (itemDate <= lastViewed) return false;
      if ('senderId' in item && item.senderId === parseInt(selectedUserId)) return false;
      if ('authorId' in item && item.authorId === parseInt(selectedUserId)) return false;
      return true;
    }).length;
  },[messages, announcements, lastViewedMessages, selectedUserId]);

  const fetchManagerData = async () => {
    const selectedPeriods = manPeriods.map(idx => periods[idx]);
    let targetEmployees = manEmps;
    if (!isManager && selectedUserId) targetEmployees = [parseInt(selectedUserId)];
    const res = await fetch('/api/manager?t=' + new Date().getTime(), { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ periods: selectedPeriods, userIds: targetEmployees }) 
    }).catch(() => null);
    if(res) {
      const data = await res.json();
      setManagerData(Array.isArray(data) ? data :[]);
    }
  };

  useEffect(() => {
    if (session && (activeTab === 'dashboard' || activeTab === 'timesheets')) fetchManagerData();
  },[activeTab, manPeriods, manLocs, manEmps, selectedUserId, isManager, session]);

  const handleCreateLocation = async (payload: any) => { const res = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); fetchLocations(); return { success: res.ok }; };
  const handleUpdateLocation = async (id: number, payload: any) => { const res = await fetch('/api/locations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...payload }) }); fetchLocations(); return { success: res.ok }; };

  const handleUpdateShiftTime = async (shiftId: number, startTime: string, endTime: string, userId: number | null) => {
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, startTime, endTime, userId, status: userId === null ? 'OPEN' : 'CLAIMED' } : s));
    await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId, userId, startTime, endTime, action: 'UPDATE' }) });
    fetchShifts(); 
  };

  const handleUpdateCardStatus = async (ids: number[], status: string) => {
    await fetch('/api/timecards/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status }) });
    fetchManagerData(); fetchTimeCards();
  };

  const toggleManPeriod = (idx: number) => manPeriods.includes(idx) ? setManPeriods(manPeriods.filter(x => x !== idx)) : setManPeriods([...manPeriods, idx]);
  const toggleManLoc = (id: number) => manLocs.includes(id) ? setManLocs(manLocs.filter(x => x !== id)) : setManLocs([...manLocs, id]);
  const toggleManEmp = (id: number) => manEmps.includes(id) ? setManEmps(manEmps.filter(x => x !== id)) : setManEmps([...manEmps, id]);

  const handleAddUser = async (userData: any) => {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
    if (res.ok) { fetchUsers(); notify.success("User added successfully!"); } 
    else { const err = await res.json(); notify.error(`Failed to add user: ${err.error || 'Unknown error'}`); }
  };

  const handleRoleToggle = async (targetUserId: number, roleName: string) => {
    const targetUser = safeUsers.find(u => u.id === targetUserId);
    if (!targetUser) return;
    let currentRoles = targetUser.systemRoles ?[...targetUser.systemRoles] :[];
    if (currentRoles.includes(roleName)) currentRoles = currentRoles.filter(r => r !== roleName);
    else currentRoles.push(roleName);
    setUsers(safeUsers.map(u => u.id === targetUserId ? { ...u, systemRoles: currentRoles } : u));
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, roles: currentRoles }) });
  };

  const handleUpdateUser = async (targetUserId: number, updates: any) => {
    setUsers(safeUsers.map(u => u.id === targetUserId ? { ...u, ...updates } : u));
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, ...updates }) });
  };

  const handleMergeUsers = async (oldId: number, newId: number) => {
    const res = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'MERGE', oldId, newId }) });
    if (res.ok) { notify.success("Users merged successfully!"); fetchUsers(); fetchTimeCards(); fetchShifts(); } 
    else { const err = await res.json(); notify.error(`Merge failed: ${err.error || 'Unknown error'}`); }
  };

  const handleSeedEmployees = async () => { if(!(await customConfirm("Add all new employees?"))) return; const res = await fetch('/api/users/seed', { method: 'POST' }); const data = await res.json(); notify.success(`Success! ${data.count} new employees added.`); fetchUsers(); };
  const handleImportHistory = async () => { if(!(await customConfirm("Import Garner Schedule History?"))) return; const res = await fetch('/api/shifts/import-history', { method: 'POST' }); const data = await res.json(); notify.success(`Success! ${data.count} shifts synced.`); fetchShifts(); };
  const handleImportTimecards = async () => { if(!(await customConfirm("Import Worked Timecards?"))) return; const res = await fetch('/api/timecards/seed', { method: 'POST' }); const data = await res.json(); notify.success(`Success! ${data.count} missing timecards logged.`); fetchTimeCards(); if (activeTab === 'dashboard') fetchManagerData(); };
  const handleImportPasses = async () => { if(!(await customConfirm("Import Platinum Guest Passes?"))) return; const res = await fetch('/api/members/seed', { method: 'POST' }); const data = await res.json(); notify.success(`Success! Added ${data.members} members.`); fetchMembers(); };

  const handleClaimShift = async (shiftId: number) => { 
    if(!selectedUserId) { notify.error("Select an employee first!"); return; } 
    await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shiftId, userId: parseInt(selectedUserId), action: 'CLAIM' }) }); 
    fetchShifts(); 
    notify.success("Shift claimed!");
  };

  const handleUnclaimShift = async (shiftId: number) => { 
    if(!(await customConfirm("Unclaim this shift?"))) return; 
    await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shiftId, action: 'UNCLAIM' }) }); 
    fetchShifts(); 
    notify.success("Shift unassigned.");
  };

  const handleGenerateSchedule = async () => {
    if (templates.length === 0) { notify.error("Create templates first!"); return; }
    const res = await fetch('/api/shifts/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId: calLocFilter, month: currentMonth, year: currentYear }) });
    const data = await res.json();
    notify.success(`Success! ${data.count} new shifts generated.`);
    fetchShifts();
  };

  const handleOpenReport = (card: TimeCard) => {
    setReportTargetCard(card);
    const tcDate = new Date(card.clockIn);
    const day = tcDate.getDay();
    const mins = tcDate.getHours() * 60 + tcDate.getMinutes();
    let bestTpl: ShiftTemplate | null = null;
    templates.filter(t => t.locationId === card.locationId && t.dayOfWeek === day).forEach(t => {
      const parts = t.startTime.split(':'), tMins = parseInt(parts[0]) * 60 + parseInt(parts[1]), diff = Math.abs(mins - tMins);
      if (!bestTpl || diff < Math.abs(mins - (parseInt(bestTpl?.startTime.split(':')[0] || '0') * 60 + parseInt(bestTpl?.startTime.split(':')[1] || '0')))) bestTpl = t;
    });
    setClDynamicTasks(bestTpl?.checklistTasks ||[]);
    if (card.checklists && card.checklists.length > 0) {
      const existing = card.checklists[0];
      setEditingChecklistId(existing.id); setClCompletedTasks(existing.completedTasks ||[]); setClNotes(existing.notes || '');
    } else { setEditingChecklistId(null); setClCompletedTasks([]); setClNotes(''); }
    setShowChecklistModal(true);
  };

  const toggleChecklistTask = (taskName: string) => clCompletedTasks.includes(taskName) ? setClCompletedTasks(clCompletedTasks.filter(t => t !== taskName)) : setClCompletedTasks([...clCompletedTasks, taskName]);

  const submitShiftReport = async () => {
    const missed = clDynamicTasks.filter(t => !clCompletedTasks.includes(t));
    const body = { id: editingChecklistId, userId: reportTargetCard?.userId, locationId: reportTargetCard?.locationId, timeCardId: reportTargetCard?.id, notes: clNotes, completedTasks: clCompletedTasks, missedTasks: missed };
    await fetch('/api/checklists', { method: editingChecklistId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowChecklistModal(false); setReportTargetCard(null); setEditingChecklistId(null);
    fetchTimeCards(); fetchChecklists(); 
    notify.success("Report Saved!");
  };

  const handleExportCSV = () => { let csv = "Pay Period,Location,Employee,Hours\n"; appState.matrixRows.forEach((row: any) => { appState.activeManPeriods.forEach((p: any) => { const h = row.periodTotals.get(p.label); if (h > 0) csv += `"${p.label}","${row.locName}","${row.empName}",${h.toFixed(2)}\n`; }); }); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "Payroll.csv"; link.click(); };
  const handleIssueGiftCard = async (payload: any) => { const res = await fetch('/api/giftcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); fetchGiftCards(); if(res.ok) notify.success("Card Issued!"); return { success: res.ok }; };
  const handleRedeemCard = async (id: number, amount: number) => { const res = await fetch(`/api/giftcards/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redemptionAmount: amount }) }); fetchGiftCards(); if(res.ok) notify.success("Card Redeemed!"); return { success: res.ok }; };
  const handleSubmitFeedback = async (payload: any) => { const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); fetchFeedbacks(); if(res.ok) notify.success("Feedback Submitted!"); return { success: res.ok }; };
  const handleUpdateFeedback = async (id: number, payload: any) => { const res = await fetch(`/api/feedback/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); fetchFeedbacks(); if(res.ok) notify.success("Ticket Updated!"); return { success: res.ok }; };

  const handleSendMessage = async (content: string, isGlobal: boolean, targetUserIds: number[], targetLocationIds: number[]) => {
    const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: selectedUserId, content, isGlobal, targetUserIds, targetLocationIds }) });
    if (res.ok) fetchMessages(); return { success: res.ok };
  };

  const handleCreateAnnouncement = async (title: string, content: string, isGlobal: boolean, targetLocationIds: number[]) => {
    const res = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ authorId: selectedUserId, title, content, isGlobal, targetLocationIds }) });
    if (res.ok) { fetchAnnouncements(); notify.success("Announcement Posted!"); } return { success: res.ok };
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!(await customConfirm("Delete this announcement?"))) return { success: false };
    const res = await fetch('/api/announcements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { fetchAnnouncements(); notify.success("Announcement Deleted!"); } return { success: res.ok };
  };

  const TAB_LABELS: Record<string, string> = {
    clock: '🕐 Time Clock',
    calendar: 'Calendar', builder: 'Builder', manual: 'My Time', messages: 'Team Chat',
    timesheets: 'Timesheets', dashboard: 'Payroll', privileges: 'Passes',
    giftcards: 'Gift Cards', feedback: '💬 Feedback', setup: 'Shift Setup', staff: 'Staff', locations: 'Locations'
  };

  const generalTabs =['clock', 'calendar', 'manual', 'messages', 'privileges', 'giftcards', 'feedback'];
  const adminTabs =['builder', 'timesheets', 'dashboard', 'setup', 'staff', 'locations'];

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInM = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells =[...new Array(firstDay).fill(null), ...Array.from({ length: daysInM }, (_, i) => i + 1)];

  const { matrixRows, hiddenWarnings, activeManPeriods } = useMemo(() => {
    const activePeriods = manPeriods.map(idx => periods[idx]);
    const matrixMap = new Map();
    const hiddenMap = new Map();

    (Array.isArray(managerData) ? managerData :[]).forEach(card => {
      if (!visibleLocations.some(l => l.id === card.locationId)) return;
      if (manLocs.length > 0 && !manLocs.includes(card.locationId)) {
        if (!hiddenMap.has(card.user?.name)) hiddenMap.set(card.user?.name, new Set());
        hiddenMap.get(card.user?.name).add(card.location?.name); return;
      }
      const key = `${card.locationId}_${card.userId}`;
      if (!matrixMap.has(key)) matrixMap.set(key, { locName: card.location?.name, empName: card.user?.name, periodTotals: new Map(), totalRowHours: 0 });
      const row = matrixMap.get(key);
      activePeriods.forEach(p => {
        const cDate = new Date(card.clockIn); 
        if (cDate >= new Date(p.start) && cDate <= new Date(new Date(p.end).setHours(23,59,59))) {
          row.periodTotals.set(p.label, (row.periodTotals.get(p.label) || 0) + (card.totalHours || 0));
          row.totalRowHours += (card.totalHours || 0);
        }
      });
    });

    return {
      activeManPeriods: activePeriods,
      matrixRows: Array.from(matrixMap.values()),
      hiddenWarnings: Array.from(hiddenMap.entries()).map(([k, v]) => `${k} (${Array.from(v).join(', ')})`)
    };
  },[managerData, manPeriods, periods, visibleLocations, manLocs]);

  const { pendingCards, unapprovedCount } = useMemo(() => {
    const pending = isManager ? (Array.isArray(managerData) ? managerData :[]).filter(c => (!c.status || c.status === 'PENDING') && c.clockOut) :[];
    return { pendingCards: pending, unapprovedCount: pending.length };
  },[managerData, isManager]);

  const activeCalColor = useMemo(() => {
    return calLocFilter ? getLocationColor(calLocFilter) : { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' };
  }, [calLocFilter]);

  const activeUserTimeCards = useMemo(() => {
    return (Array.isArray(timeCards) ? timeCards :[]).filter(c => c.userId === parseInt(selectedUserId));
  }, [timeCards, selectedUserId]);

  const appState: AppState = {
    isMounted, activeTab, setActiveTab, users: safeUsers, activeUsers, locations, visibleLocations, timeCards, shifts, setShifts, members, setMembers, templates, checklists,
    selectedUserId, setSelectedUserId, currentMonth, setCurrentMonth, currentYear, setCurrentYear,
    messages, setMessages, fetchMessages, handleSendMessage,
    announcements, setAnnouncements, fetchAnnouncements, handleCreateAnnouncement, handleDeleteAnnouncement,
    calLocFilter, setCalLocFilter, calEmpFilter, setCalEmpFilter,
    manPeriods, setManPeriods, manLocs, setManLocs, manEmps, setManEmps, managerData, DAYS_OF_WEEK, MONTHS, YEARS, AVAILABLE_ROLES, formatTimeSafe, 
    formatDateSafe, getLocationColor, showDashboard, showTimesheets, showSetup, showStaff, 
    showLocations: showLocationsTab, showPasses, showBuilder, isManager, isAdmin, toggleManPeriod, toggleManLoc, toggleManEmp, 
    handleAddUser, handleRoleToggle, handleUpdateUser, handleMergeUsers, handleSeedEmployees, handleImportHistory, handleImportTimecards, handleImportPasses, handleClaimShift, 
    handleUnclaimShift, handleGenerateSchedule, handleOpenReport, toggleChecklistTask, 
    submitShiftReport, handleExportCSV, handleUpdateCardStatus, handleUpdateShiftTime,
    handleCreateLocation, handleUpdateLocation, periods, showChecklistModal, setShowChecklistModal, reportTargetCard, setReportTargetCard, editingChecklistId, setEditingChecklistId,
    clDynamicTasks, setClDynamicTasks, clCompletedTasks, setClCompletedTasks, clNotes, setClNotes,
    globalTasks, setGlobalTasks, fetchGlobalTasks, 
    giftCards, setGiftCards, fetchGiftCards, handleIssueGiftCard, handleRedeemCard, showGiftCards,
    isGiftCardsLoading, feedbacks, setFeedbacks, fetchFeedbacks, handleSubmitFeedback, handleUpdateFeedback, 
    isFeedbacksLoading, highlightBaseline, calendarCells, 
    activeCalColor, activeManPeriods, matrixRows, hiddenWarnings,
    missingPunches:[], activeUserTimeCards,
    unapprovedCount, pendingCards, builderWeekStart, setBuilderWeekStart, unreadFeedbackCount, unreadMessagesCount, fetchChecklists, fetchTimeCards
  };

  if (!isMounted) return <div className="p-10 text-center font-bold">Loading Workspace...</div>;

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
        <div className="bg-slate-900 px-4 py-3 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-3"><img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto" /><h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-widest leading-none"><span className="text-yellow-400">Pickles</span> & Play</h1></div>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner w-fit ml-1">
              <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">Logged in as:</span>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="bg-yellow-400 text-slate-900 rounded px-1.5 py-0.5 text-xs font-black outline-none cursor-pointer max-w-[140px] truncate">
                {safeUsers.map(u => <option key={u.id} value={u.id}>{u.id.toString() === authenticatedUserId ? `★ ${u.name} (Me)` : u.name}</option>)}
              </select>
              {isRealManager && (
                <button onClick={async () => {
                  const res = await signInPasskey("passkey", { action: "register", email: session?.user?.email || "cbriell1@yahoo.com", redirect: false });
                  if (res?.error) notify.error("Failed: " + res.error); else if (res?.ok) notify.success("Device Linked!");
                }} className="ml-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-800 bg-yellow-400 px-2 py-1 rounded transition">📱 Link Device</button>
              )}
              <button onClick={() => signOut()} className="ml-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white bg-red-600 px-2 py-1 rounded transition">Logout</button>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end items-center bg-slate-800/50 p-1.5 rounded-xl w-full lg:w-auto">
              {isManager && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:block px-2">Staff Space</span>}
              {generalTabs.map(tab => {
                const visible = (tab === 'clock' || tab === 'calendar' || tab === 'manual' || tab === 'feedback' || tab === 'messages') || (tab === 'privileges' && showPasses) || (tab === 'giftcards' && showGiftCards);
                if (!visible) return null;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-3 py-1.5 rounded-lg font-black uppercase text-[10px] md:text-xs transition shadow-sm ${activeTab === tab ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>
                    {TAB_LABELS[tab]}
                    {tab === 'feedback' && unreadFeedbackCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-md">{unreadFeedbackCount}</span>}
                    {tab === 'messages' && unreadMessagesCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-md">{unreadMessagesCount}</span>}
                  </button>
                );
              })}
            </div>
            {isManager && (
              <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shadow-inner w-full lg:w-auto">
                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest hidden md:block px-2">Manager Space</span>
                {adminTabs.map(tab => {
                  const visible = (tab === 'builder' && showDashboard) || (tab === 'dashboard' && showDashboard) || (tab === 'timesheets' && showTimesheets) || (tab === 'setup' && showSetup) || (tab === 'locations' && showLocationsTab) || (tab === 'staff' && showStaff);
                  if (!visible) return null;
                  return <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-3 py-1.5 rounded-lg font-black uppercase text-[10px] md:text-xs transition shadow-sm ${activeTab === tab ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>{TAB_LABELS[tab]} {tab === 'timesheets' && unapprovedCount > 0 && isManager && <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">{unapprovedCount}</span>}</button>
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 md:p-6 bg-gray-50">
          {activeTab === 'clock' && <TimeClockTab appState={appState} />}
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

export default function SchedulingAppRoot() {
  const { data: session, status } = useSession();
  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white font-bold text-xl animate-pulse">Checking credentials...</div></div>;
  if (status === "unauthenticated" || !session) return <LoginScreen sessionData={session} />;
  return <MainDashboard session={session} />;
}