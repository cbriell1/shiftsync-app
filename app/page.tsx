"use client";
import React, { useState, useEffect } from 'react';
import { 
  User, Location, TimeCard, Shift, Member, ShiftTemplate, 
  Checklist, GlobalTask, GiftCard, Feedback, AppState 
} from '../lib/types';

import CalendarTab from './components/CalendarTab';
import TimeCardTab from './components/TimeCardTab';
import DashboardTab from './components/DashboardTab';
import ManagerTab from './components/ManagerTab';
import PrivilegesTab from './components/PrivilegesTab';
import ReportsTab from './components/ReportsTab';
import SetupTab from './components/SetupTab';
import StaffTab from './components/StaffTab';
import GiftCardTab from './components/GiftCardTab';
import FeedbackTab from './components/FeedbackTab'; 

export default function SchedulingApp() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('setup'); 
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const[timeCards, setTimeCards] = useState<TimeCard[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [globalTasks, setGlobalTasks] = useState<GlobalTask[]>([]);
  
  const[feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isFeedbacksLoading, setIsFeedbacksLoading] = useState(true);

  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [isGiftCardsLoading, setIsGiftCardsLoading] = useState(true);

  const[selectedUserId, setSelectedUserId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const[calLocFilter, setCalLocFilter] = useState('');
  const [calEmpFilter, setCalEmpFilter] = useState('');

  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const[formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const[formEndTime, setFormEndTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const[showChecklistModal, setShowChecklistModal] = useState(false);
  const [reportTargetCard, setReportTargetCard] = useState<TimeCard | null>(null); 
  const[editingChecklistId, setEditingChecklistId] = useState<number | null>(null); 
  const[clDynamicTasks, setClDynamicTasks] = useState<string[]>([]); 
  const [clCompletedTasks, setClCompletedTasks] = useState<string[]>([]); 
  const [clNotes, setClNotes] = useState('');

  const[passSearch, setPassSearch] = useState('');
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const[pDate, setPDate] = useState('');
  const [pAmt, setPAmt] = useState<number | string>(1);
  const [pInitials, setPInitials] = useState('');
  const [editingRenewalId, setEditingRenewalId] = useState<number | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const[editingTotalId, setEditingTotalId] = useState<number | null>(null);
  const[newTotalVal, setNewTotalVal] = useState<number | string>(12);
  const[newBonusNotes, setNewBonusNotes] = useState('');

  const [editingTplId, setEditingTplId] = useState<number | null>(null); 
  const [tplLocs, setTplLocs] = useState<number[]>([]);
  const [tplDays, setTplDays] = useState<(string | number)[]>([]);
  const [tplStart, setTplStart] = useState('');
  const [tplEnd, setTplEnd] = useState('');
  const [tplStartDate, setTplStartDate] = useState(''); 
  const [tplEndDate, setTplEndDate] = useState('');     
  const [tplTasks, setTplTasks] = useState<string[]>([]); 
  const [newTaskStr, setNewTaskStr] = useState(''); 
  const[tplUserId, setTplUserId] = useState(''); 

  const [tplViewLocs, setTplViewLocs] = useState<number[]>([]);
  const [tplViewDays, setTplViewDays] = useState<number[]>([]);

  const generatePeriods = () => {
    const p =[];
    const today = new Date();
    let curM = today.getMonth();
    let curY = today.getFullYear();
    if (today.getDate() < 28) { curM--; if(curM < 0) { curM = 11; curY--; } }
    for(let i=0; i<6; i++) {
      const s = new Date(curY, curM - i, 28);
      const e = new Date(curY, curM - i + 1, 27);
      p.push({ label: `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`, start: s.toISOString(), end: e.toISOString() });
    }
    return p;
  };

  const [periods] = useState(generatePeriods());
  const [dashPeriodIndex, setDashPeriodIndex] = useState(0);
  const[dashLocs, setDashLocs] = useState<number[]>([]); 
  const [dashEmployees, setDashEmployees] = useState<number[]>([]);
  const [dashData, setDashData] = useState<any>({ totals: [], timeCards:[] });

  const [manPeriods, setManPeriods] = useState<number[]>([0]); 
  const[manLocs, setManLocs] = useState<number[]>([]);
  const[manEmps, setManEmps] = useState<number[]>([]);
  const [managerData, setManagerData] = useState<TimeCard[]>([]);

  const DAYS_OF_WEEK =['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YEARS = [2025, 2026, 2027];
  const AVAILABLE_ROLES = ['Administrator', 'Manager', 'Front Desk', 'Trainer'];

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

  const fetchUsers = () => fetch('/api/users?t=' + new Date().getTime()).then(res => res.json()).then(data => { setUsers(data); if(data && data.length > 0 && !selectedUserId) setSelectedUserId(data[0].id.toString()); });
  const fetchMembers = () => fetch('/api/members?t=' + new Date().getTime()).then(res => res.json()).then(data => setMembers(data));
  const fetchShifts = () => fetch('/api/shifts?t=' + new Date().getTime()).then(res => res.json()).then(data => setShifts(data));
  const fetchTemplates = () => fetch('/api/templates?t=' + new Date().getTime()).then(res => res.json()).then(data => setTemplates(data));
  const fetchChecklists = () => fetch('/api/checklists?t=' + new Date().getTime()).then(res => res.json()).then(data => setChecklists(data));
  const fetchGlobalTasks = () => fetch('/api/tasks?t=' + new Date().getTime()).then(res => res.json()).then(data => setGlobalTasks(data));
  const fetchGiftCards = () => fetch('/api/giftcards?t=' + new Date().getTime()).then(res => res.json()).then(data => { setGiftCards(data); setIsGiftCardsLoading(false); }).catch(() => setIsGiftCardsLoading(false));
  const fetchFeedbacks = () => fetch('/api/feedback?t=' + new Date().getTime()).then(res => res.json()).then(data => { setFeedbacks(data); setIsFeedbacksLoading(false); }).catch(() => setIsFeedbacksLoading(false));

  useEffect(() => {
    setIsMounted(true);
    fetchUsers();
    fetchMembers();
    fetchTemplates();
    fetchChecklists(); 
    fetchGlobalTasks();
    fetchGiftCards(); 
    fetchFeedbacks();
    fetch('/api/locations?t=' + new Date().getTime()).then(res => res.json()).then(data => { setLocations(data); if(data && data.length > 0) setSelectedLocation(data[0].id.toString()); });
    fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(data));
    fetchShifts();
  },[]);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'manager') fetchManagerData();
  },[activeTab, dashPeriodIndex, dashLocs, dashEmployees, manPeriods, manLocs, manEmps, selectedUserId]);

  const activeUserObj = users.find(u => u.id === parseInt(selectedUserId));
  const activeRoles = activeUserObj && activeUserObj.systemRoles ? activeUserObj.systemRoles :[];

  const hasRole = (roleName: string) => activeRoles.includes(roleName);
  const isAdmin = hasRole('Administrator');
  const isManager = hasRole('Manager') || isAdmin;
  const isFrontDesk = hasRole('Front Desk') || isManager || isAdmin;

  const systemHasAdmin = users.some(u => u.systemRoles && u.systemRoles.includes('Administrator'));
  const showDashboard = isManager || isFrontDesk; 
  const showManagerView = isManager;
  const showSetup = isManager;
  const showReports = isManager; 
  const showStaff = isAdmin || !systemHasAdmin;
  const showPasses = isFrontDesk; 
  const showGiftCards = isFrontDesk; 

  useEffect(() => {
    if (!isMounted) return;
    if (activeTab === 'dashboard' && !showDashboard) setActiveTab('calendar');
    if (activeTab === 'manager' && !showManagerView) setActiveTab('calendar');
    if (activeTab === 'privileges' && !showPasses) setActiveTab('calendar');
    if (activeTab === 'giftcards' && !showGiftCards) setActiveTab('calendar'); 
    if (activeTab === 'setup' && !showSetup) setActiveTab('calendar');
    if (activeTab === 'staff' && !showStaff) setActiveTab('calendar');
    if (activeTab === 'reports' && !showReports) setActiveTab('calendar');
  },[selectedUserId, users, activeTab]);

  const fetchDashboard = async () => {
    const p = periods[dashPeriodIndex];
    let targetEmployees = dashEmployees;
    if (!isManager && selectedUserId) targetEmployees = [parseInt(selectedUserId)];
    const res = await fetch('/api/dashboard?t=' + new Date().getTime(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate: p.start, endDate: p.end, userIds: targetEmployees, locationIds: dashLocs }) });
    const data = await res.json();
    setDashData(data); 
  };

  const fetchManagerData = async () => {
    const selectedPeriods = manPeriods.map(idx => periods[idx]);
    const res = await fetch('/api/manager?t=' + new Date().getTime(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periods: selectedPeriods, userIds: manEmps }) });
    const data = await res.json();
    setManagerData(data);
  };

  const toggleDashLoc = (id: number) => dashLocs.includes(id) ? setDashLocs(dashLocs.filter(x => x !== id)) : setDashLocs([...dashLocs, id]);
  const toggleDashEmp = (id: number) => dashEmployees.includes(id) ? setDashEmployees(dashEmployees.filter(x => x !== id)) : setDashEmployees([...dashEmployees, id]);
  const toggleManPeriod = (idx: number) => manPeriods.includes(idx) ? setManPeriods(manPeriods.filter(x => x !== idx)) : setManPeriods([...manPeriods, idx]);
  const toggleManLoc = (id: number) => manLocs.includes(id) ? setManLocs(manLocs.filter(x => x !== id)) : setManLocs([...manLocs, id]);
  const toggleManEmp = (id: number) => manEmps.includes(id) ? setManEmps(manEmps.filter(x => x !== id)) : setManEmps([...manEmps, id]);
  const toggleTplLoc = (id: number) => { if (editingTplId) return setTplLocs([id]); tplLocs.includes(id) ? setTplLocs(tplLocs.filter(x => x !== id)) : setTplLocs([...tplLocs, id]); };
  const toggleTplDay = (idx: string | number) => { if (editingTplId) return setTplDays([idx]); tplDays.includes(idx) ? setTplDays(tplDays.filter(x => x !== idx)) : setTplDays([...tplDays, idx]); };
  const toggleTplViewLoc = (id: number) => tplViewLocs.includes(id) ? setTplViewLocs(tplViewLocs.filter(x => x !== id)) : setTplViewLocs([...tplViewLocs, id]);
  const toggleTplViewDay = (idx: number) => tplViewDays.includes(idx) ? setTplViewDays(tplViewDays.filter(x => x !== idx)) : setTplViewDays([...tplViewDays, idx]);
  const toggleTplTask = (taskName: string) => { if (tplTasks.includes(taskName)) setTplTasks(tplTasks.filter(t => t !== taskName)); else setTplTasks([...tplTasks, taskName]); };

  const handleRoleToggle = async (targetUserId: number, roleName: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;
    let currentRoles = targetUser.systemRoles ? [...targetUser.systemRoles] :[];
    if (currentRoles.includes(roleName)) currentRoles = currentRoles.filter(r => r !== roleName);
    else currentRoles.push(roleName);
    setUsers(users.map(u => u.id === targetUserId ? { ...u, systemRoles: currentRoles } : u));
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, roles: currentRoles }) });
  };

  const handleUpdateUser = async (targetUserId: number, updates: any) => {
    setUsers(users.map(u => u.id === targetUserId ? { ...u, ...updates } : u));
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, ...updates }) });
  };

  const handleSeedEmployees = async () => { if(!confirm("Add all new employees?")) return; const res = await fetch('/api/users/seed', { method: 'POST' }); const data = await res.json(); alert(`Success! ${data.count} new employees added.`); fetchUsers(); };
  const handleImportHistory = async () => { if(!confirm("Import Garner Schedule History?")) return; const res = await fetch('/api/shifts/import-history', { method: 'POST' }); const data = await res.json(); alert(`Success! ${data.count} shifts synced.`); fetchShifts(); };
  const handleImportTimecards = async () => { if(!confirm("Import Jan/Feb Worked Timecards?")) return; const res = await fetch('/api/timecards/seed', { method: 'POST' }); const data = await res.json(); alert(`Success! ${data.count} missing timecards logged.`); fetch('/api/timecards').then(r => r.json()).then(d => setTimeCards(d)); if (activeTab === 'dashboard') fetchDashboard(); };
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
    if(!selectedUserId) return alert("Select an employee!");
    const clockInDateTime = new Date(`${formDate}T${formStartTime}`);
    const clockOutDateTime = formEndTime ? new Date(`${formDate}T${formEndTime}`) : null;
    const body = { id: editingCardId, userId: selectedUserId, locationId: selectedLocation, clockIn: clockInDateTime.toISOString(), clockOut: clockOutDateTime?.toISOString() || null };
    await fetch('/api/timecards', { method: editingCardId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setEditingCardId(null); setFormStartTime(''); setFormEndTime('');
    fetch('/api/timecards').then(res => res.json()).then(data => setTimeCards(data));
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
    setClDynamicTasks(bestTpl?.checklistTasks ||[]);
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
    fetch('/api/timecards').then(res => res.json()).then(data => setTimeCards(data));
    fetchChecklists(); 
  };

  const handleAddMasterTask = async () => {
    if (!newTaskStr.trim()) return;
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTaskStr.trim() }) });
    if (res.ok) {
      setNewTaskStr('');
      fetchGlobalTasks();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add task.");
    }
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
    setSelectedLocation(card.locationId.toString()); setSelectedUserId(card.userId.toString()); setEditingCardId(card.id); setActiveTab('manual'); window.scrollTo(0, 0);
  };

  const handleDeleteClick = async (cardId: number) => { if(!confirm("Delete?")) return; await fetch('/api/timecards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cardId }) }); fetch('/api/timecards').then(res => res.json()).then(data => setTimeCards(data)); };

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

  // --- TAB LABELS MAPPING ---
  // This explicitly sets what the buttons should say to avoid user confusion
  const TAB_LABELS: Record<string, string> = {
    calendar: 'Calendar',
    manual: 'Time Cards',     // <-- This maps the internal key "manual" to the beautiful "Time Cards" label
    dashboard: 'Dashboard',
    manager: 'Manager',
    privileges: 'Passes',
    giftcards: 'Gift Cards',
    feedback: '💬 Feedback',
    reports: 'Reports',
    setup: 'Shift Setup',
    staff: 'Staff'
  };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInM = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells =[...new Array(firstDay).fill(null), ...Array.from({ length: daysInM }, (_, i) => i + 1)];

  const matrixMap = new Map();
  const hiddenWarningsMap = new Map();
  const activeManPeriods = manPeriods.map(idx => periods[idx]);

  managerData.forEach(card => {
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

  const appState: AppState = {
    isMounted, activeTab, setActiveTab, users, locations, timeCards, shifts, members, templates, checklists,
    selectedUserId, setSelectedUserId, currentMonth, setCurrentMonth, currentYear, setCurrentYear,
    calLocFilter, setCalLocFilter, calEmpFilter, setCalEmpFilter, editingCardId, setEditingCardId,
    formDate, setFormDate, formStartTime, setFormStartTime, formEndTime, setFormEndTime,
    selectedLocation, setSelectedLocation, passSearch, setPassSearch, expandedMember, setExpandedMember,
    pDate, setPDate, pAmt, setPAmt, pInitials, setPInitials, editingTplId, setEditingTplId,
    tplLocs, setTplLocs, tplDays, setTplDays, tplStart, setTplStart, tplEnd, setTplEnd,
    tplStartDate, setTplStartDate, tplEndDate, setTplEndDate, tplTasks, setTplTasks, tplUserId, setTplUserId,
    tplViewLocs, setTplViewLocs, tplViewDays, setTplViewDays, dashPeriodIndex, setDashPeriodIndex, 
    dashLocs, setDashLocs, dashEmployees, setDashEmployees, manPeriods, setManPeriods, manLocs, setManLocs, 
    manEmps, setManEmps, managerData, DAYS_OF_WEEK, MONTHS, YEARS, AVAILABLE_ROLES, formatTimeSafe, 
    formatDateSafe, getLocationColor, showDashboard, showManagerView, showSetup, showReports, showStaff, 
    showPasses, isManager, isAdmin, toggleDashLoc, toggleDashEmp, toggleManPeriod, toggleManLoc, toggleManEmp, 
    toggleTplLoc, toggleTplDay, toggleTplViewLoc, toggleTplViewDay, toggleTplTask, handleRoleToggle, 
    handleUpdateUser, handleSeedEmployees, handleImportHistory, handleImportTimecards, handleImportPasses, handleClaimShift, 
    handleUnclaimShift, handleGenerateSchedule, handleManualSubmit, handleOpenReport, toggleChecklistTask, 
    submitShiftReport, handleAddMasterTask, handleDeleteMasterTask, handleEditTemplate, handleSaveTemplate, handleDeleteTemplate, handleRedeemBeverage, 
    handleLogPass, handleEditClick, handleDeleteClick, handleExportCSV, periods, 
    dashData: { timeCards: dashData.timeCards ||[] }, showChecklistModal, 
    setShowChecklistModal, reportTargetCard, setReportTargetCard, editingChecklistId, setEditingChecklistId,
    clDynamicTasks, setClDynamicTasks, clCompletedTasks, setClCompletedTasks, clNotes, setClNotes,
    globalTasks, setGlobalTasks, fetchGlobalTasks, editingRenewalId, setEditingRenewalId, newRenewalDate, setNewRenewalDate,
    editingTotalId, setEditingTotalId, newTotalVal, setNewTotalVal, newBonusNotes, setNewBonusNotes,
    giftCards, setGiftCards, fetchGiftCards, handleIssueGiftCard, handleRedeemCard, showGiftCards,
    isGiftCardsLoading, feedbacks, setFeedbacks, fetchFeedbacks, handleSubmitFeedback, handleUpdateFeedback, 
    isFeedbacksLoading, calendarCells, 
    activeCalColor: calLocFilter ? getLocationColor(calLocFilter) : { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
    activeManPeriods, matrixRows: Array.from(matrixMap.values()), hiddenWarnings: Array.from(hiddenWarningsMap.entries()).map(([k, v]) => `${k} (${Array.from(v).join(', ')})`),
    missingPunches: [], dashVisibleData: [], dashHiddenWarnings:[],
    activeUserTimeCards: timeCards.filter(c => c.userId === parseInt(selectedUserId)),
    filteredMembers: members.filter(m => m.lastName.toLowerCase().includes(passSearch.toLowerCase())),
    filteredTemplates: templates
  };

  if (!isMounted) return <div className="p-10 text-center font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6 font-sans relative">
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
        
        <div className="bg-slate-900 p-6 text-white flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
            <h1 className="text-3xl font-black italic uppercase tracking-widest"><span className="text-yellow-400">Pickles</span> & Play</h1>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
            <span className="text-sm font-bold">Employee:</span>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="text-slate-900 rounded p-1.5 text-sm font-black bg-white">
              <option value="">-- Select --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {['calendar', 'manual', 'dashboard', 'manager', 'privileges', 'giftcards', 'feedback', 'reports', 'setup', 'staff'].map(tab => {
              
              // Only render the tabs the current user has access to see
              const visible = (tab === 'calendar' || tab === 'manual' || tab === 'feedback') || 
                              (tab === 'dashboard' && showDashboard) || 
                              (tab === 'manager' && showManagerView) || 
                              (tab === 'privileges' && showPasses) || 
                              (tab === 'giftcards' && showGiftCards) || 
                              (tab === 'reports' && showReports) || 
                              (tab === 'setup' && showSetup) || 
                              (tab === 'staff' && showStaff);
              
              if (!visible) return null;
              
              return (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-3 py-2 rounded-lg font-black uppercase text-xs transition shadow-sm ${
                    activeTab === tab 
                      ? 'bg-yellow-400 text-slate-900' 
                      : 'bg-slate-800 hover:bg-green-800 text-white'
                  }`}
                >
                  {/* Maps internal key "manual" to output "Time Cards" visually! */}
                  {TAB_LABELS[tab]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 md:p-8 bg-gray-50">
          {activeTab === 'calendar' && <CalendarTab appState={appState} />}
          {activeTab === 'manual' && <TimeCardTab appState={appState} />}
          {activeTab === 'dashboard' && <DashboardTab appState={appState} />}
          {activeTab === 'manager' && <ManagerTab appState={appState} />}
          {activeTab === 'privileges' && <PrivilegesTab appState={appState} />}
          {activeTab === 'reports' && <ReportsTab appState={appState} />}
          {activeTab === 'setup' && <SetupTab appState={appState} />}
          {activeTab === 'staff' && <StaffTab appState={appState} />}
          {activeTab === 'giftcards' && <GiftCardTab appState={appState} />}
          {activeTab === 'feedback' && <FeedbackTab appState={appState} />}
        </div>
      </div>
    </div>
  );
}