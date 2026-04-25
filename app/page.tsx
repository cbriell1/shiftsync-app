// filepath: app/page.tsx
"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { signOut, useSession, signIn as signInReact } from "next-auth/react";
import { signIn as signInPasskey } from "next-auth/webauthn"; 
import { useSearchParams } from 'next/navigation';
import { notify, useEscapeKey } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { getMonday } from '@/lib/common';
import { Menu, X, Clock, Calendar, FileText, Settings, Users, MessageSquare, MapPin, LayoutDashboard, CalendarDays, Gift, AlertCircle, LogOut, Smartphone, ChevronLeft, ChevronRight, BookOpen, Layout } from 'lucide-react';

import CalendarTab from './components/CalendarTab';
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
import HelpTab from './components/HelpTab';
import StadiumAssistant from './components/StadiumAssistant';

// ==================================================================
// GLOBAL LOGOUT HANDLER (Prevents Ghost Sessions)
// ==================================================================
const performSecureLogout = async (sessionData: any) => {
  if (sessionData?.sessionId) {
    try {
      await fetch('/api/admin/sessions', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ sessionToken: sessionData.sessionId }),
        keepalive: true 
      });
    } catch (e) { console.error("Cleanup error", e); }
  }
  
  setTimeout(() => {
    signOut();
  }, 200);
};

// ==================================================================
// SKELETON LOADERS
// ==================================================================
function LoginSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-8 border-b-8 border-slate-200 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="h-20 w-20 bg-slate-200 rounded-full"></div>
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-14 w-full bg-slate-200 rounded-xl"></div>
          <div className="h-14 w-full bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <div className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-8 w-8 bg-slate-800 rounded-full shrink-0"></div>
          <div className="h-6 w-32 bg-slate-800 rounded-md"></div>
        </div>
        <div className="h-10 w-full bg-slate-800 rounded-lg mb-10"></div>
        <div className="space-y-6">
          <div>
            <div className="h-3 w-20 bg-slate-800 rounded mb-4"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 w-full bg-slate-800/50 rounded-lg"></div>)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between animate-pulse">
          <div className="h-6 w-6 bg-slate-200 rounded"></div>
          <div className="h-5 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="flex-1 p-4 md:p-6 lg:p-8 animate-pulse">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-10 w-64 bg-slate-200 rounded-xl"></div>
            <div className="h-[400px] w-full bg-white border border-slate-200 rounded-2xl shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    const res = await signInPasskey("passkey", { email, action, redirect: false });
    setLoading(false);
    if (res?.error) {
      notify.error("Passkey failed. Did you register on this device?");
    } else if (res?.ok) {
      window.location.reload();
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signInReact("credentials", { email, password, redirect: false });
    setLoading(false);
    
    if (res?.error) {
      notify.error("Access Denied: Invalid Email or Secret Code.");
    } else if (res?.ok) {
      notify.success("Emergency Access Granted.");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-8 border-b-8 border-green-800 relative">
        {sessionData && (
          <button onClick={() => performSecureLogout(sessionData)} className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">
            Clear Session
          </button>
        )}
        <div className="text-center">
          <Image 
            src="/logo.png" 
            alt="Pickles & Play" 
            width={80} 
            height={80} 
            priority
            className="h-20 w-auto mx-auto mb-4" 
            style={{ width: 'auto', height: 'auto' }}
          />
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
              <button onClick={() => handlePasskeyLogin("authenticate")} disabled={!email || loading} className="w-full bg-green-800 hover:bg-green-900 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider flex justify-center items-center gap-2">
                {loading ? "..." : <><Smartphone size={18}/> Sign In with Passkey</>}
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
              <input type="password" required placeholder="Enter Emergency Password..." value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-slate-300 rounded-xl p-3.5 font-bold text-slate-900 focus:border-red-600 outline-none shadow-inner" />
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

const NavItem = ({ id, icon: Icon, label, badge = 0, activeTab, isCollapsed, setActiveTab, setSidebarOpen }: any) => (
  <button
    onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
    title={isCollapsed ? label : undefined}
    className={`relative flex items-center ${isCollapsed ? 'justify-center px-0 py-3 w-12 mx-auto' : 'justify-between px-4 py-3 w-full'} rounded-lg font-bold text-sm transition-all ${
      activeTab === id 
        ? 'bg-yellow-400 text-slate-900 shadow-md' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </div>
    {badge > 0 && (
      isCollapsed ? (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
      ) : (
        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm shrink-0">
          {badge}
        </span>
      )
    )}
  </button>
);

// ==================================================================
// 2. MAIN DASHBOARD APP
// ==================================================================
function MainDashboard({ session }: { session: any }) {
  const searchParams = useSearchParams();
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const setSidebarOpen = useAppStore(s => s.setSidebarOpen);
  const selectedUserId = useAppStore(s => s.selectedUserId);
  const setSelectedUserId = useAppStore(s => s.setSelectedUserId);
  const setBuilderWeekStart = useAppStore(s => s.setBuilderWeekStart);

  const users = useAppStore(s => s.users);
  const feedbacks = useAppStore(s => s.feedbacks);
  const messages = useAppStore(s => s.messages);
  const announcements = useAppStore(s => s.announcements);
  const managerData = useAppStore(s => s.managerData);

  const fetchAllCoreData = useAppStore(s => s.fetchAllCoreData);
  const fetchManagerData = useAppStore(s => s.fetchManagerData);

  const showChecklistModal = useAppStore(s => s.showChecklistModal);
  const setShowChecklistModal = useAppStore(s => s.setShowChecklistModal);
  
  useEscapeKey(() => setSidebarOpen(false), sidebarOpen);
  useEscapeKey(() => setShowChecklistModal(false), showChecklistModal);

  const[isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const [lastViewedFeedback, setLastViewedFeedback] = useState('1970-01-01T00:00:00.000Z');
  const[lastViewedMessages, setLastViewedMessages] = useState('1970-01-01T00:00:00.000Z');

  const reportTargetCard = useAppStore(s => s.reportTargetCard);
  const setReportTargetCard = useAppStore(s => s.setReportTargetCard);
  const editingChecklistId = useAppStore(s => s.editingChecklistId);
  const setEditingChecklistId = useAppStore(s => s.setEditingChecklistId);
  const clDynamicTasks = useAppStore(s => s.clDynamicTasks);
  const clCompletedTasks = useAppStore(s => s.clCompletedTasks);
  const setClCompletedTasks = useAppStore(s => s.setClCompletedTasks);
  const clNotes = useAppStore(s => s.clNotes);
  const setClNotes = useAppStore(s => s.setClNotes);
  const fetchTimeCards = useAppStore(s => s.fetchTimeCards);
  const fetchChecklists = useAppStore(s => s.fetchChecklists);

  useEffect(() => {
    setIsMounted(true);
    setBuilderWeekStart(getMonday(new Date()));

    if (session?.user?.id) {
      const initialId = selectedUserId || session.user.id.toString();
      if (!selectedUserId) setSelectedUserId(initialId);
      
      fetchAllCoreData(initialId);
      
      const intervalId = setInterval(() => fetchAllCoreData(initialId), 30000);
      return () => clearInterval(intervalId);
    }
  }, [session, selectedUserId]);

  const authenticatedUserId = session?.user?.id?.toString();
  const safeUsers = Array.isArray(users) ? users :[];
  const authenticatedUserObj = safeUsers.find(u => u.id.toString() === authenticatedUserId);
  const authRoles = authenticatedUserObj?.systemRoles || session?.user?.systemRoles ||[];
  
  const isRealAdmin = authRoles.includes('Administrator') || session?.user?.email === 'cbriell1@yahoo.com';
  const isRealManager = authRoles.includes('Manager') || isRealAdmin;

  const activeUserObj = safeUsers.find(u => u.id.toString() === selectedUserId);
  const activeRoles = activeUserObj?.systemRoles ||[];

  const isAdmin = activeRoles.includes('Administrator') || (selectedUserId === authenticatedUserId && isRealAdmin);
  const isManager = activeRoles.includes('Manager') || isAdmin || (selectedUserId === authenticatedUserId && isRealManager);
  const isFrontDesk = activeRoles.includes('Front Desk') || isManager || isAdmin;

  const systemHasAdmin = safeUsers.some(u => u.systemRoles && u.systemRoles.includes('Administrator'));
  
  const showDashboard = isManager || isFrontDesk; 
  const showTimesheets = isManager || isFrontDesk; 
  
  // FIX: Setup Tab now handles both Setup AND Builder
  const showSetup = isManager;
  const showStaff = isManager || isAdmin || !systemHasAdmin; 
  const showLocationsTab = isManager || isAdmin;
  const showPasses = isFrontDesk; 
  const showGiftCards = isFrontDesk;

  useEffect(() => {
    if (isMounted && authenticatedUserId) {
      // 1. Check URL Parameters for Deep Links
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      } else {
        // 2. Fallback to LocalStorage
        const savedTab = localStorage.getItem('lastActiveTab_' + authenticatedUserId);
        if (savedTab === 'builder') setActiveTab('setup');
        else if (savedTab) setActiveTab(savedTab);
      }

      const savedCollapse = localStorage.getItem('sidebarCollapsed');
      if (savedCollapse === 'true') setIsCollapsed(true);

      setLastViewedFeedback(localStorage.getItem('lastViewedFeedback_' + selectedUserId) || '1970-01-01T00:00:00.000Z');
      setLastViewedMessages(localStorage.getItem('lastViewedMessages_' + selectedUserId) || '1970-01-01T00:00:00.000Z');
    }
  },[isMounted, authenticatedUserId, selectedUserId, searchParams]);

  useEffect(() => {
    if (isMounted && authenticatedUserId && users.length > 0) {
      localStorage.setItem('lastActiveTab_' + authenticatedUserId, activeTab);
      
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
  },[activeTab, authenticatedUserId, isMounted, users.length, selectedUserId]);

  useEffect(() => {
    if (session && (activeTab === 'dashboard' || activeTab === 'timesheets')) {
      fetchManagerData(isManager, selectedUserId);
    }
  },[activeTab, selectedUserId, isManager]);

  const unreadFeedbackCount = useMemo(() => {
    return feedbacks.filter(fb => {
      const fbUpdated = new Date(fb.updatedAt || fb.createdAt).getTime();
      if (fbUpdated <= new Date(lastViewedFeedback).getTime()) return false;
      return isManager || fb.userId.toString() === selectedUserId;
    }).length;
  },[feedbacks, lastViewedFeedback, isManager, selectedUserId]);

  const unreadMessagesCount = useMemo(() => {
    return [...messages, ...announcements].filter(item => {
      const itemDate = new Date(item.createdAt).getTime();
      if (itemDate <= new Date(lastViewedMessages).getTime()) return false;
      if ('senderId' in item && item.senderId.toString() === selectedUserId) return false;
      if ('authorId' in item && item.authorId.toString() === selectedUserId) return false;
      return true;
    }).length;
  },[messages, announcements, lastViewedMessages, selectedUserId]);

  const unapprovedCount = isManager ? managerData.filter(c => (!c.status || c.status === 'PENDING') && c.clockOut).length : 0;

  const toggleChecklistTask = (taskName: string) => clCompletedTasks.includes(taskName) ? setClCompletedTasks(clCompletedTasks.filter(t => t !== taskName)) : setClCompletedTasks([...clCompletedTasks, taskName]);

  const submitShiftReport = async () => {
    const missed = clDynamicTasks.filter(t => !clCompletedTasks.includes(t));
    const body = { id: editingChecklistId, userId: reportTargetCard?.userId, locationId: reportTargetCard?.locationId, timeCardId: reportTargetCard?.id, notes: clNotes, completedTasks: clCompletedTasks, missedTasks: missed };
    await fetch('/api/checklists', { method: editingChecklistId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowChecklistModal(false); setReportTargetCard(null); setEditingChecklistId(null);
    fetchTimeCards(selectedUserId); fetchChecklists(); 
    notify.success("Report Saved!");
  };

  const toggleSidebarCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('sidebarCollapsed', newVal.toString());
  };

  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';

  if (!isMounted || users.length === 0) return <DashboardSkeleton />;

  const legacyAppStatePlaceholder = {} as any;

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Responsive Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col h-full border-r border-slate-800 ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        
        {/* Brand Header with Collapse Toggle */}
        <div className={`p-4 md:p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-800 shrink-0 transition-all`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <Image src="/logo.png" alt="Logo" width={32} height={32} priority className={`h-10 w-auto shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} style={{ width: 'auto', height: 'auto' }} />
            {!isCollapsed && (
              <h1 className="text-xl font-black sports-slant leading-[0.85] text-white">
                <span className="text-brand-yellow">Pickles</span><br/>& Play
              </h1>
            )}
          </div>
          
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>

          <button 
            className="hidden lg:flex text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors" 
            onClick={toggleSidebarCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* User Switcher */}
        <div className={`p-4 border-b border-slate-800 shrink-0 bg-slate-950/50 ${isCollapsed ? 'hidden' : 'space-y-3'}`}>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Active Profile</label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-bold outline-none cursor-pointer focus:border-yellow-500">
              {safeUsers.map((u: any) => <option key={u.id} value={u.id}>{u.id.toString() === authenticatedUserId ? `★ ${u.name} (Me)` : u.name}</option>)}
            </select>
          </div>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {/* USER PROFILE CARD (Expanded Only) */}
          {!isCollapsed && (
            <div className="mx-3 mb-8 p-5 bg-slate-800/40 rounded-[24px] border-2 border-slate-700/30 flex items-center gap-4 animate-in slide-in-from-left-4 duration-500 shadow-inner">
               <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-brand-yellow font-black shadow-2xl border-2 border-slate-700 rotate-3">
                  {authenticatedUserObj?.name?.charAt(0)}
               </div>
               <div className="flex flex-col min-w-0">
                  <span data-testid="profile-name" className="font-black text-white text-xs truncate uppercase tracking-wider">{authenticatedUserObj?.name}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter break-words whitespace-normal leading-tight mt-1 opacity-80">
                    Last Session:<br/>{authenticatedUserObj?.lastLoginAt ? new Date(authenticatedUserObj.lastLoginAt).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : 'Initializing...'}
                  </span>
               </div>
            </div>
          )}

          <div>
            {!isCollapsed ? (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-4">Your Workspace</p>
            ) : (
              <div className="w-8 h-px bg-slate-700 mx-auto mb-3"></div>
            )}
            <div className="space-y-1">
              <NavItem id="clock" icon={Clock} label="Time Clock" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
              <NavItem id="calendar" icon={Calendar} label="Schedule" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
              {showTimesheets && <NavItem id="timesheets" icon={FileText} label="My Timesheet" badge={unapprovedCount} activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />}
              {showPasses && <NavItem id="privileges" icon={Gift} label="Guest Passes" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />}
              {showGiftCards && <NavItem id="giftcards" icon={Gift} label="Gift Cards" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />}
            </div>
          </div>
          <div>
            {!isCollapsed ? (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-4">Team Comms</p>
            ) : (
              <div className="w-8 h-px bg-slate-700 mx-auto mb-3"></div>
            )}
            <div className="space-y-1">
              <NavItem id="messages" icon={MessageSquare} label="Team Chat" badge={unreadMessagesCount} activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
              <NavItem id="feedback" icon={AlertCircle} label="Dev Request" badge={unreadFeedbackCount} activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
              <NavItem id="help" icon={BookOpen} label="Help & Training" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
            </div>
          </div>
          {isManager && (
            <div>
              {!isCollapsed ? (
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-2 px-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>Manager Tools</p>
              ) : (
                <div className="w-8 h-px bg-yellow-600/30 mx-auto mb-3"></div>
              )}
              <div className="space-y-1">
                {showDashboard && <NavItem id="dashboard" icon={LayoutDashboard} label="Payroll" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />}
                {/* FIX: Setup Tab now handles Builder, Templates, and Tasks */}
                {showSetup && <NavItem id="setup" icon={CalendarDays} label="Shift Setup" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />}
                {showStaff && <NavItem id="staff" icon={Users} label="Staff" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />}
                {showLocationsTab && <NavItem id="locations" icon={MapPin} label="Locations" activeTab={activeTab} isCollapsed={isCollapsed} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 shrink-0 flex flex-col gap-2">
          {isRealManager && !isCollapsed && (
            <button onClick={async () => {
              const res = await signInPasskey("passkey", { action: "register", email: session?.user?.email || "cbriell1@yahoo.com", redirect: false });
              if (res?.error) notify.error("Failed: " + res.error); else if (res?.ok) notify.success("Device Linked!");
            }} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg font-bold text-xs transition-colors">
              <Smartphone size={14} /> Link Passkey
            </button>
          )}

          <button onClick={() => performSecureLogout(session)} title="Logout" className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-4'} gap-3 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold text-sm transition-colors`}>
            <LogOut size={16} /> {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        
        {/* Mobile Top Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900"><Menu size={24} /></button>
            <span className="font-black text-slate-900 uppercase tracking-widest text-sm">Pickles & Play</span>
          </div>
          {vercelEnv !== 'production' && <span className="bg-slate-200 text-slate-600 text-[10px] font-black uppercase px-2 py-1 rounded">Dev</span>}
        </div>

        {/* Dynamic Width Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className={`mx-auto transition-all duration-300 w-full ${isCollapsed ? 'max-w-full' : 'max-w-7xl'}`}>
            {activeTab === 'clock' && <TimeClockTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'calendar' && <CalendarTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'dashboard' && <DashboardTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'timesheets' && <TimesheetsTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'privileges' && <PrivilegesTab />}
            {activeTab === 'setup' && <SetupTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'staff' && <StaffTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'locations' && <LocationsTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'giftcards' && <GiftCardTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'feedback' && <FeedbackTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'messages' && <MessagesTab appState={legacyAppStatePlaceholder} />}
            {activeTab === 'help' && <HelpTab />}
          </div>
        </div>

      </div>

      {/* Modals */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] flex justify-center items-center p-4" onClick={(e) => { if(e.target===e.currentTarget) setShowChecklistModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">{editingChecklistId ? 'Edit Shift Report' : 'Shift Closing Checklist'}</h3>
              <button onClick={() => setShowChecklistModal(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {clDynamicTasks.map((t, i) => (
                <label key={i} className={`flex items-start space-x-3 cursor-pointer p-3 rounded-xl border-2 transition-colors ${clCompletedTasks.includes(t) ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
                  <input type="checkbox" checked={clCompletedTasks.includes(t)} onChange={() => toggleChecklistTask(t)} className="w-5 h-5 rounded mt-0.5" />
                  <span className={`text-sm font-bold ${clCompletedTasks.includes(t) ? 'text-green-900 line-through opacity-70' : 'text-slate-900'}`}>{t}</span>
                </label>
              ))}
              {clDynamicTasks.length === 0 && <p className="text-sm font-bold text-slate-500 italic">No tasks assigned for this shift.</p>}
            </div>
            <textarea value={clNotes} onChange={(e) => setClNotes(e.target.value)} rows={3} placeholder="Add any final shift notes or pass-downs..." className="w-full border-2 border-slate-300 rounded-xl p-3 mb-6 font-medium text-sm focus:border-blue-500 outline-none resize-none"></textarea>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowChecklistModal(false)} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors hover:bg-slate-300">Cancel</button>
              <button onClick={submitShiftReport} className="px-5 py-2.5 bg-slate-900 text-white font-black rounded-xl transition-colors hover:bg-black shadow-md">Save Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchedulingAppRoot() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "authenticated" && session && !session.user) {
      signOut({ redirect: false });
    }
  }, [session, status]);

  if (status === "loading") return <LoginSkeleton />;
  if (status === "unauthenticated" || !session || !session.user) return <LoginScreen sessionData={session} />;
  
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MainDashboard session={session} />
      <StadiumAssistant />
    </Suspense>
  );
}
