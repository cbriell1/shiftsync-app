"use client";
import React, { useState, useEffect } from 'react';

import CalendarTab from './components/CalendarTab';
import TimeCardTab from './components/TimeCardTab';
import DashboardTab from './components/DashboardTab';
import ManagerTab from './components/ManagerTab';
import PrivilegesTab from './components/PrivilegesTab';
import ReportsTab from './components/ReportsTab';
import SetupTab from './components/SetupTab';
import StaffTab from './components/StaffTab';
import GiftCardTab from './components/GiftCardTab'; // NEW: Gift Card Component

export default function SchedulingApp() {
  const { 0: isMounted, 1: setIsMounted } = useState(false);
  const { 0: activeTab, 1: setActiveTab } = useState('setup'); 
  
  const { 0: users, 1: setUsers } = useState(new Array());
  const { 0: locations, 1: setLocations } = useState(new Array());
  const { 0: timeCards, 1: setTimeCards } = useState(new Array());
  const { 0: shifts, 1: setShifts } = useState(new Array());
  const { 0: members, 1: setMembers } = useState(new Array());
  const { 0: templates, 1: setTemplates } = useState(new Array());
  const { 0: checklists, 1: setChecklists } = useState(new Array());
  const { 0: globalTasks, 1: setGlobalTasks } = useState(new Array());
  
  // NEW: Gift Card State
  const { 0: giftCards, 1: setGiftCards } = useState(new Array());
  const { 0: isGiftCardsLoading, 1: setIsGiftCardsLoading } = useState(true);

  const { 0: selectedUserId, 1: setSelectedUserId } = useState('');
  const { 0: currentMonth, 1: setCurrentMonth } = useState(new Date().getMonth());
  const { 0: currentYear, 1: setCurrentYear } = useState(new Date().getFullYear());
  
  const { 0: calLocFilter, 1: setCalLocFilter } = useState('');
  const { 0: calEmpFilter, 1: setCalEmpFilter } = useState('');

  const { 0: editingCardId, 1: setEditingCardId } = useState(null);
  const { 0: formDate, 1: setFormDate } = useState('');
  const { 0: formStartTime, 1: setFormStartTime } = useState('');
  const { 0: formEndTime, 1: setFormEndTime } = useState('');
  const { 0: selectedLocation, 1: setSelectedLocation } = useState('');

  const { 0: showChecklistModal, 1: setShowChecklistModal } = useState(false);
  const { 0: reportTargetCard, 1: setReportTargetCard } = useState(null); 
  const { 0: editingChecklistId, 1: setEditingChecklistId } = useState(null); 
  const { 0: clDynamicTasks, 1: setClDynamicTasks } = useState(new Array()); 
  const { 0: clCompletedTasks, 1: setClCompletedTasks } = useState(new Array()); 
  const { 0: clNotes, 1: setClNotes } = useState('');

  const { 0: passSearch, 1: setPassSearch } = useState('');
  const { 0: expandedMember, 1: setExpandedMember } = useState(null);
  const { 0: pDate, 1: setPDate } = useState('');
  const { 0: pAmt, 1: setPAmt } = useState(1);
  const { 0: pInitials, 1: setPInitials } = useState('');
  const { 0: editingRenewalId, 1: setEditingRenewalId } = useState(null);
  const { 0: newRenewalDate, 1: setNewRenewalDate } = useState('');
  const { 0: editingTotalId, 1: setEditingTotalId } = useState(null);
  const { 0: newTotalVal, 1: setNewTotalVal } = useState(12);
  const { 0: newBonusNotes, 1: setNewBonusNotes } = useState('');

  const { 0: editingTplId, 1: setEditingTplId } = useState(null); 
  const { 0: tplLocs, 1: setTplLocs } = useState(new Array());
  const { 0: tplDays, 1: setTplDays } = useState(new Array());
  const { 0: tplStart, 1: setTplStart } = useState('');
  const { 0: tplEnd, 1: setTplEnd } = useState('');
  const { 0: tplStartDate, 1: setTplStartDate } = useState(''); 
  const { 0: tplEndDate, 1: setTplEndDate } = useState('');     
  const { 0: tplTasks, 1: setTplTasks } = useState(new Array()); 
  const { 0: newTaskStr, 1: setNewTaskStr } = useState(''); 
  const { 0: tplUserId, 1: setTplUserId } = useState(''); 

  const { 0: tplViewLocs, 1: setTplViewLocs } = useState(new Array());
  const { 0: tplViewDays, 1: setTplViewDays } = useState(new Array());

  const generatePeriods = () => {
    const p = new Array();
    const today = new Date();
    let curM = today.getMonth();
    let curY = today.getFullYear();
    if (today.getDate() < 28) { curM--; if(curM < 0) { curM = 11; curY--; } }
    for(let i=0; i<6; i++) {
      const s = new Date(curY, curM - i, 28);
      const e = new Date(curY, curM - i + 1, 27);
      p.push({ label: s.toLocaleDateString() + ' - ' + e.toLocaleDateString(), start: s.toISOString(), end: e.toISOString() });
    }
    return p;
  };

  const { 0: periods } = useState(generatePeriods());
  const { 0: dashPeriodIndex, 1: setDashPeriodIndex } = useState(0);
  const { 0: dashLocs, 1: setDashLocs } = useState(new Array()); 
  const { 0: dashEmployees, 1: setDashEmployees } = useState(new Array());
  const { 0: dashData, 1: setDashData } = useState({ totals: new Array(), timeCards: new Array() });

  const { 0: manPeriods, 1: setManPeriods } = useState(new Array().concat(0)); 
  const { 0: manLocs, 1: setManLocs } = useState(new Array());
  const { 0: manEmps, 1: setManEmps } = useState(new Array());
  const { 0: managerData, 1: setManagerData } = useState(new Array());

  const DAYS_OF_WEEK = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
  const MONTHS = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
  const YEARS = new Array(2025, 2026, 2027);
  const AVAILABLE_ROLES = new Array('Administrator', 'Manager', 'Front Desk', 'Trainer');

  const formatTimeSafe = (dStr) => {
    if (!dStr) return 'Active';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return 'Active';
    return d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
  };

  const formatDateSafe = (dStr) => {
    if (!dStr) return 'Unknown';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getLocationColor = (locId) => {
    const colors = new Array(
      { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900', claim: 'bg-blue-600 hover:bg-blue-700', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
      { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900', claim: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
      { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900', claim: 'bg-orange-600 hover:bg-orange-700', badge: 'bg-orange-100 text-orange-900 border-orange-300' },
      { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-900', claim: 'bg-teal-600 hover:bg-teal-700', badge: 'bg-teal-100 text-teal-900 border-teal-300' },
      { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-900', claim: 'bg-pink-600 hover:bg-pink-700', badge: 'bg-pink-100 text-pink-900 border-pink-300' }
    );
    if(!locId) return colors.at(0);
    const index = parseInt(locId) % colors.length;
    return colors.at(index);
  };

  const fetchUsers = () => fetch('/api/users?t=' + new Date().getTime()).then(res => res.json()).then(data => { setUsers(data); if(data && data.length > 0 && !selectedUserId) setSelectedUserId(data.at(0).id); });
  const fetchMembers = () => fetch('/api/members?t=' + new Date().getTime()).then(res => res.json()).then(data => setMembers(data));
  const fetchShifts = () => fetch('/api/shifts?t=' + new Date().getTime()).then(res => res.json()).then(data => setShifts(data));
  const fetchTemplates = () => fetch('/api/templates?t=' + new Date().getTime()).then(res => res.json()).then(data => setTemplates(data));
  const fetchChecklists = () => fetch('/api/checklists?t=' + new Date().getTime()).then(res => res.json()).then(data => setChecklists(data));
  const fetchGlobalTasks = () => fetch('/api/tasks?t=' + new Date().getTime()).then(res => res.json()).then(data => setGlobalTasks(data));
  
  // NEW: Fetch Gift Cards
  const fetchGiftCards = () => fetch('/api/giftcards?t=' + new Date().getTime()).then(res => res.json()).then(data => { setGiftCards(data); setIsGiftCardsLoading(false); }).catch(() => setIsGiftCardsLoading(false));

  useEffect(() => {
    setIsMounted(true);
    fetchUsers();
    fetchMembers();
    fetchTemplates();
    fetchChecklists(); 
    fetchGlobalTasks();
    fetchGiftCards(); // Trigger Gift Card Fetch
    fetch('/api/locations?t=' + new Date().getTime()).then(res => res.json()).then(data => { setLocations(data); if(data && data.length > 0) setSelectedLocation(data.at(0).id); });
    fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(data));
    fetchShifts();
  }, new Array());

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'manager') fetchManagerData();
  }, new Array(activeTab, dashPeriodIndex, dashLocs, dashEmployees, manPeriods, manLocs, manEmps, selectedUserId));

  const activeUserObj = users.find(u => u.id === parseInt(selectedUserId));
  const activeRoles = activeUserObj && activeUserObj.systemRoles ? activeUserObj.systemRoles : new Array();

  const hasRole = (roleName) => activeRoles.includes(roleName);
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
  const showGiftCards = isFrontDesk; // NEW: Permissions for Gift Cards

  useEffect(() => {
    if (!isMounted) return;
    if (activeTab === 'dashboard' && !showDashboard) setActiveTab('calendar');
    if (activeTab === 'manager' && !showManagerView) setActiveTab('calendar');
    if (activeTab === 'privileges' && !showPasses) setActiveTab('calendar');
    if (activeTab === 'giftcards' && !showGiftCards) setActiveTab('calendar'); // NEW: Protection check
    if (activeTab === 'setup' && !showSetup) setActiveTab('calendar');
    if (activeTab === 'staff' && !showStaff) setActiveTab('calendar');
    if (activeTab === 'reports' && !showReports) setActiveTab('calendar');
  }, new Array(selectedUserId, users, activeTab));

  const fetchDashboard = async () => {
    const p = periods.at(dashPeriodIndex);
    let targetEmployees = dashEmployees;
    if (!isManager && selectedUserId) targetEmployees = new Array().concat(parseInt(selectedUserId));
    const res = await fetch('/api/dashboard?t=' + new Date().getTime(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate: p.start, endDate: p.end, userIds: targetEmployees, locationIds: dashLocs }) });
    const data = await res.json();
    setDashData(data); 
  };

  const fetchManagerData = async () => {
    const selectedPeriods = new Array();
    manPeriods.forEach(idx => selectedPeriods.push(periods.at(idx)));
    const res = await fetch('/api/manager?t=' + new Date().getTime(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periods: selectedPeriods, userIds: manEmps }) });
    const data = await res.json();
    setManagerData(data);
  };

  const toggleDashLoc = (id) => dashLocs.includes(id) ? setDashLocs(dashLocs.filter(x => x !== id)) : setDashLocs(dashLocs.concat(id));
  const toggleDashEmp = (id) => dashEmployees.includes(id) ? setDashEmployees(dashEmployees.filter(x => x !== id)) : setDashEmployees(dashEmployees.concat(id));
  const toggleManPeriod = (idx) => manPeriods.includes(idx) ? setManPeriods(manPeriods.filter(x => x !== idx)) : setManPeriods(manPeriods.concat(idx));
  const toggleManLoc = (id) => manLocs.includes(id) ? setManLocs(manLocs.filter(x => x !== id)) : setManLocs(manLocs.concat(id));
  const toggleManEmp = (id) => manEmps.includes(id) ? setManEmps(manEmps.filter(x => x !== id)) : setManEmps(manEmps.concat(id));
  const toggleTplLoc = (id) => { if (editingTplId) return setTplLocs(new Array().concat(id)); tplLocs.includes(id) ? setTplLocs(tplLocs.filter(x => x !== id)) : setTplLocs(tplLocs.concat(id)); };
  const toggleTplDay = (idx) => { if (editingTplId) return setTplDays(new Array().concat(idx)); tplDays.includes(idx) ? setTplDays(tplDays.filter(x => x !== idx)) : setTplDays(tplDays.concat(idx)); };
  const toggleTplViewLoc = (id) => tplViewLocs.includes(id) ? setTplViewLocs(tplViewLocs.filter(x => x !== id)) : setTplViewLocs(tplViewLocs.concat(id));
  const toggleTplViewDay = (idx) => tplViewDays.includes(idx) ? setTplViewDays(tplViewDays.filter(x => x !== idx)) : setTplViewDays(tplViewDays.concat(idx));
  const toggleTplTask = (taskName) => { if (tplTasks.includes(taskName)) setTplTasks(tplTasks.filter(t => t !== taskName)); else setTplTasks(tplTasks.concat(taskName)); };

  const handleRoleToggle = async (targetUserId, roleName) => {
    const targetUser = users.find(u => u.id === targetUserId);
    let currentRoles = targetUser.systemRoles ? new Array().concat(targetUser.systemRoles) : new Array();
    if (currentRoles.includes(roleName)) currentRoles = currentRoles.filter(r => r !== roleName);
    else currentRoles.push(roleName);
    setUsers(users.map(u => u.id === targetUserId ? { ...u, systemRoles: currentRoles } : u));
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, roles: currentRoles }) });
  };

  const handleUpdateUser = async (targetUserId, updates) => {
    setUsers(users.map(u => u.id === targetUserId ? { ...u, ...updates } : u));
    await fetch('/api/users', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id: targetUserId, ...updates }) 
    });
  };

  // NEW: Gift Card Handlers
  const handleIssueGiftCard = async (payload) => {
    try {
      const res = await fetch('/api/giftcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API Error");
      fetchGiftCards();
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  const handleRedeemCard = async (cardId, amount) => {
    try {
      const res = await fetch(`/api/giftcards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionAmount: amount }),
      });
      if (!res.ok) throw new Error("API Error");
      fetchGiftCards();
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  const handleSeedEmployees = async () => { if(!confirm("Add all new employees to the database?")) return; const res = await fetch('/api/users/seed', { method: 'POST' }); const data = await res.json(); alert("Success! " + data.count + " new employees added."); fetchUsers(); };
  const handleImportHistory = async () => { if(!confirm("Import the Garner Schedule History?")) return; const res = await fetch('/api/shifts/import-history', { method: 'POST' }); const data = await res.json(); alert("Success! " + data.count + " shifts synced."); fetchShifts(); };
  const handleImportTimecards = async () => { if(!confirm("Import the actual Worked Timecards for Jan/Feb?")) return; const res = await fetch('/api/timecards/seed', { method: 'POST' }); const data = await res.json(); alert("Success! " + data.count + " missing timecards logged."); fetch('/api/timecards?t=' + new Date().getTime()).then(r => r.json()).then(d => setTimeCards(d)); if (activeTab === 'dashboard') fetchDashboard(); };
  const handleImportPasses = async () => { if(!confirm("Import the Platinum Guest Passes CSV?")) return; const res = await fetch('/api/members/seed', { method: 'POST' }); const data = await res.json(); alert("Success! Added " + data.members + " members and " + data.usages + " usages."); fetchMembers(); };

  const handleClaimShift = async (shiftId) => { if(!selectedUserId) return alert("Select an active employee at the top first!"); await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shiftId, userId: parseInt(selectedUserId), action: 'CLAIM' }) }); fetchShifts(); };
  const handleUnclaimShift = async (shiftId) => { if(!confirm("Are you sure you want to unclaim this shift?")) return; await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shiftId, action: 'UNCLAIM' }) }); fetchShifts(); };

  const handleGenerateSchedule = async () => {
    if (templates.length === 0) return alert("Error: You must create Shift Templates in the 'Shift Setup' tab first before generating a schedule!");
    let msg = "Generate schedule from Templates for ALL locations?";
    if (calLocFilter) { const locName = locations.find(l => l.id === parseInt(calLocFilter))?.name; msg = "Generate schedule from Templates for " + locName + " only?"; }
    const monthName = MONTHS.at(currentMonth);
    msg += "\n\n(Generating for the Pay Period ending in " + monthName + " " + currentYear + ")";
    if(!confirm(msg)) return;
    const res = await fetch('/api/shifts/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId: calLocFilter, month: currentMonth, year: currentYear }) });
    const data = await res.json();
    alert("Success! " + data.count + " new shifts generated from templates.");
    fetchShifts();
  };

  // CORRECTED BUG: Safely checks if End Time is blank to prevent Invalid Date crashes
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if(!selectedUserId) return alert("Select an active employee at the top!");
    
    const clockInDateTime = new Date(formDate + 'T' + formStartTime);
    const clockOutDateTime = formEndTime ? new Date(formDate + 'T' + formEndTime) : null;

    if (editingCardId) {
      await fetch('/api/timecards', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          id: editingCardId, 
          userId: selectedUserId, 
          locationId: selectedLocation, 
          clockIn: clockInDateTime.toISOString(), 
          clockOut: clockOutDateTime ? clockOutDateTime.toISOString() : null 
        }) 
      });
      alert("Updated!");
      setEditingCardId(null);
    } else {
      await fetch('/api/timecards', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          userId: selectedUserId, 
          locationId: selectedLocation, 
          clockIn: clockInDateTime.toISOString(), 
          clockOut: clockOutDateTime ? clockOutDateTime.toISOString() : null 
        }) 
      });
      alert("Time Entry Saved!");
    }
    setFormStartTime('');
    setFormEndTime('');
    fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(data));
  };

  const handleOpenReport = (card) => {
    setReportTargetCard(card);
    const tcDate = new Date(card.clockIn);
    const day = tcDate.getDay();
    const mins = tcDate.getHours() * 60 + tcDate.getMinutes();

    let bestTpl = null;
    let minDiff = 9999;
    templates.filter(t => t.locationId === card.locationId && t.dayOfWeek === day).forEach(t => {
      const parts = t.startTime.split(':');
      const tMins = parseInt(parts.at(0)) * 60 + parseInt(parts.at(1));
      const diff = Math.abs(mins - tMins);
      if (diff < minDiff && diff <= 180) { minDiff = diff; bestTpl = t; }
    });

    if (bestTpl && bestTpl.checklistTasks) setClDynamicTasks(bestTpl.checklistTasks);
    else setClDynamicTasks(new Array());

    if (card.checklists && card.checklists.length > 0) {
      const existingReport = card.checklists.at(0);
      setEditingChecklistId(existingReport.id);
      setClCompletedTasks(existingReport.completedTasks || new Array());
      setClNotes(existingReport.notes || '');
    } else {
      setEditingChecklistId(null);
      setClCompletedTasks(new Array());
      setClNotes('');
    }
    setShowChecklistModal(true);
  };

  const toggleChecklistTask = (taskName) => {
    if (clCompletedTasks.includes(taskName)) setClCompletedTasks(clCompletedTasks.filter(t => t !== taskName));
    else setClCompletedTasks(clCompletedTasks.concat(taskName));
  };

  const submitShiftReport = async () => {
    const missedTasks = clDynamicTasks.filter(t => !clCompletedTasks.includes(t));
    if (editingChecklistId) {
      await fetch('/api/checklists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingChecklistId, notes: clNotes, completedTasks: clCompletedTasks, missedTasks: missedTasks }) });
      alert("Shift Report Updated successfully!");
    } else {
      await fetch('/api/checklists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: reportTargetCard.userId, locationId: reportTargetCard.locationId, timeCardId: reportTargetCard.id, notes: clNotes, completedTasks: clCompletedTasks, missedTasks: missedTasks }) });
      alert("Shift Report Submitted successfully!");
    }
    setShowChecklistModal(false);
    setReportTargetCard(null);
    setEditingChecklistId(null);
    fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(data));
    fetchChecklists(); 
  };

  const handleAddTplTask = () => { if (newTaskStr.trim() !== '') { setTplTasks(tplTasks.concat(newTaskStr.trim())); setNewTaskStr(''); } };
  const handleRemoveTplTask = (idx) => setTplTasks(tplTasks.filter((_, i) => i !== idx));

  const handleEditTemplate = (t) => {
    setEditingTplId(t.id);
    setTplLocs(new Array().concat(t.locationId));
    setTplDays(new Array().concat(t.dayOfWeek));
    setTplStart(t.startTime);
    setTplEnd(t.endTime);
    setTplStartDate(t.startDate || '');
    setTplEndDate(t.endDate || '');
    setTplTasks(t.checklistTasks || new Array());
    setTplUserId(t.userId || ''); 
    window.scrollTo(0, 0);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if(tplLocs.length === 0) return alert("Select at least one Location!");
    if(tplDays.length === 0) return alert("Select at least one Day of the Week!");

    const payload = { locationIds: tplLocs, daysOfWeek: tplDays, startTime: tplStart, endTime: tplEnd, startDate: tplStartDate || null, endDate: tplEndDate || null, checklistTasks: tplTasks, userId: tplUserId || null };
    
    if (editingTplId) {
      payload.id = editingTplId;
      await fetch('/api/templates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      alert("Template Updated!"); setEditingTplId(null);
    } else {
      await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      alert("Templates Created!");
    }
    setTplLocs(new Array()); setTplDays(new Array()); setTplStart(''); setTplEnd(''); setTplStartDate(''); setTplEndDate(''); setTplTasks(new Array()); setTplUserId('');
    fetchTemplates();
  };

  const handleDeleteTemplate = async (id) => { if(!confirm("Delete this template?")) return; await fetch('/api/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) }); fetchTemplates(); };
  const handleRedeemBeverage = async (memberId) => { if(!confirm("Log 1 free beverage/snack for this month?")) return; const res = await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: memberId, action: 'LOG_BEVERAGE' }) }); if (res.ok) fetchMembers(); };
  const handleLogPass = async (e, memberId) => { e.preventDefault(); const res = await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: memberId, dateUsed: pDate, amount: pAmt, initials: pInitials }) }); if (res.ok) { alert("Success! Pass usage logged."); setPDate(''); setPAmt(1); setPInitials(''); fetchMembers(); } };
  
  const handleEditClick = (card) => {
    const inD = new Date(card.clockIn);
    const outD = new Date(card.clockOut);
    const yyyy = inD.getFullYear();
    const mm = String(inD.getMonth() + 1).padStart(2, '0');
    const dd = String(inD.getDate()).padStart(2, '0');
    setFormDate(yyyy + '-' + mm + '-' + dd);
    setFormStartTime(inD.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    if (card.clockOut && !isNaN(outD.getTime())) setFormEndTime(outD.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    else setFormEndTime('');
    setSelectedLocation(card.locationId);
    setSelectedUserId(card.userId);
    setEditingCardId(card.id);
    setActiveTab('manual');
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = async (cardId) => { if(!confirm("Delete this entry?")) return; await fetch('/api/timecards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cardId }) }); fetch('/api/timecards?t=' + new Date().getTime()).then(res => res.json()).then(data => setTimeCards(data)); };

  const handleExportCSV = () => {
    let csvContent = "Pay Period,Location,Employee Name,Total Hours\n";
    matrixRows.forEach(row => {
      activeManPeriods.forEach(p => {
        const hours = row.periodTotals.get(p.label);
        if (hours > 0) csvContent += '"' + p.label + '","' + row.locName + '","' + row.empName + '",' + hours.toFixed(2) + '\n';
      });
    });
    const blob = new Blob(new Array(csvContent), { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Pickles_And_Play_Payroll.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DATA BUNDLER FOR COMPONENTS ---
  const appState = {
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
    submitShiftReport, handleEditTemplate, handleSaveTemplate, handleDeleteTemplate, handleRedeemBeverage, 
    handleLogPass, handleEditClick, handleDeleteClick, handleExportCSV, periods, dashData, showChecklistModal, 
    setShowChecklistModal, reportTargetCard, setReportTargetCard, editingChecklistId, setEditingChecklistId,
    clDynamicTasks, setClDynamicTasks, clCompletedTasks, setClCompletedTasks, clNotes, setClNotes,
    globalTasks, setGlobalTasks, fetchGlobalTasks, editingRenewalId, setEditingRenewalId, newRenewalDate, setNewRenewalDate,
    editingTotalId, setEditingTotalId, newTotalVal, setNewTotalVal, newBonusNotes, setNewBonusNotes,
    
    // NEW BUNDLE ITEMS: Gift Cards
    giftCards, setGiftCards, fetchGiftCards, handleIssueGiftCard, handleRedeemCard, showGiftCards,
    isLoading: isGiftCardsLoading
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const blanks = new Array(firstDayOfMonth).fill(null);
  const days = new Array(daysInMonth).fill(0).map((_, i) => i + 1);
  appState.calendarCells = blanks.concat(days);
  appState.activeCalColor = calLocFilter ? getLocationColor(calLocFilter) : { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' };

  appState.activeManPeriods = new Array();
  manPeriods.forEach(idx => appState.activeManPeriods.push(periods.at(idx)));

  const matrixMap = new Map();
  const hiddenWarningsMap = new Map(); 

  managerData.forEach(card => {
    if (manLocs.length > 0 && !manLocs.includes(card.locationId)) {
      const empName = card.user?.name || 'Unknown';
      const locName = card.location?.name || 'Unknown';
      if (!hiddenWarningsMap.has(empName)) hiddenWarningsMap.set(empName, new Set());
      hiddenWarningsMap.get(empName).add(locName);
      return; 
    }
    const key = card.locationId + '_' + card.userId;
    if (!matrixMap.has(key)) {
      const pTotals = new Map();
      appState.activeManPeriods.forEach(p => pTotals.set(p.label, 0));
      matrixMap.set(key, { locName: card.location?.name, empName: card.user?.name, periodTotals: pTotals, totalRowHours: 0 });
    }
    const row = matrixMap.get(key);
    const cDate = new Date(card.clockIn);
    appState.activeManPeriods.forEach(p => {
      const s = new Date(p.start);
      const e = new Date(p.end);
      e.setHours(23, 59, 59, 999);
      if (cDate >= s && cDate <= e) {
        const curr = row.periodTotals.get(p.label);
        row.periodTotals.set(p.label, curr + card.totalHours);
        row.totalRowHours += card.totalHours;
      }
    });
  });

  appState.matrixRows = new Array();
  matrixMap.forEach(val => appState.matrixRows.push(val));
  appState.matrixRows.sort((a, b) => {
    if (a.locName === b.locName) return a.empName.localeCompare(b.empName);
    return a.locName.localeCompare(b.locName);
  });

  appState.hiddenWarnings = new Array();
  hiddenWarningsMap.forEach((locSet, empName) => {
    const locArray = new Array();
    locSet.forEach(l => locArray.push(l));
    appState.hiddenWarnings.push(empName + ' (' + locArray.join(', ') + ')');
  });

  appState.missingPunches = new Array();
  const rightNow = new Date();
  const activeDashP = periods.at(dashPeriodIndex);
  const dpStart = new Date(activeDashP.start);
  const dpEnd = new Date(activeDashP.end);
  dpEnd.setHours(23, 59, 59, 999);
  
  shifts.forEach(shift => {
    if (shift.status === 'CLAIMED') {
      if (!isManager && shift.userId !== parseInt(selectedUserId)) return; 
      const eTime = new Date(shift.endTime);
      const sTime = new Date(shift.startTime);
      if (eTime < rightNow && sTime >= dpStart && sTime <= dpEnd) {
        let locMatch = true;
        if (dashLocs.length > 0) locMatch = dashLocs.includes(shift.locationId);
        let empMatch = true;
        if (dashEmployees.length > 0) empMatch = dashEmployees.includes(shift.userId);

        if (locMatch && empMatch) {
          let foundMatch = false;
          timeCards.forEach(tc => {
             const tcDate = new Date(tc.clockIn);
             if (tc.userId === shift.userId && tcDate.getDate() === sTime.getDate() && tcDate.getMonth() === sTime.getMonth() && tcDate.getFullYear() === sTime.getFullYear()) {
                 foundMatch = true;
             }
          });
          if (!foundMatch) appState.missingPunches.push(shift);
        }
      }
    }
  });

  appState.dashVisibleData = new Array();
  appState.dashHiddenWarnings = new Array();
  const dashHiddenWarningsMap = new Map();
  const dashUserMap = new Map();

  if (dashData.timeCards) {
    dashData.timeCards.forEach(card => {
      if (dashLocs.length > 0 && !dashLocs.includes(card.locationId)) {
        const empName = card.user?.name || 'Unknown';
        const locName = card.location?.name || 'Unknown';
        if (!dashHiddenWarningsMap.has(empName)) dashHiddenWarningsMap.set(empName, new Set());
        dashHiddenWarningsMap.get(empName).add(locName);
        return;
      }
      if (!dashUserMap.has(card.userId)) {
        dashUserMap.set(card.userId, { userId: card.userId, name: card.user?.name || 'Unknown', totalHours: 0, cards: new Array() });
      }
      const uData = dashUserMap.get(card.userId);
      uData.totalHours += card.totalHours;
      uData.totalHours = Math.round(uData.totalHours * 100) / 100;
      uData.cards.push(card);
    });
  }

  dashUserMap.forEach(val => appState.dashVisibleData.push(val));
  appState.dashVisibleData.sort((a, b) => a.name.localeCompare(b.name));

  dashHiddenWarningsMap.forEach((locSet, empName) => {
    const locArray = new Array();
    locSet.forEach(l => locArray.push(l));
    appState.dashHiddenWarnings.push(empName + ' (' + locArray.join(', ') + ')');
  });

  appState.activeUserTimeCards = selectedUserId ? timeCards.filter(c => c.userId === parseInt(selectedUserId)) : new Array();
  appState.filteredMembers = members.filter(m => m.lastName.toLowerCase().includes(passSearch.toLowerCase()) || (m.location && m.location.toLowerCase().includes(passSearch.toLowerCase())));
  appState.filteredTemplates = templates.filter(t => {
    let locMatch = true;
    if (tplViewLocs.length > 0) locMatch = tplViewLocs.includes(t.locationId);
    let dayMatch = true;
    if (tplViewDays.length > 0) dayMatch = tplViewDays.includes(t.dayOfWeek);
    return locMatch && dayMatch;
  });

  if (!isMounted) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold' }}>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6 font-sans relative">
      
      {showChecklistModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full transform transition-all">
            <div className="mb-6 border-b border-gray-200 pb-4">
              <h3 className="text-2xl font-black text-slate-900">{editingChecklistId ? 'Edit Shift Report' : 'Shift Closing Checklist'}</h3>
              <p className="text-sm font-bold text-slate-500 mt-1">Please verify the following facility tasks for this shift:</p>
            </div>
            
            <div className="space-y-4 mb-8 max-h-60 overflow-y-auto">
              {clDynamicTasks.length === 0 ? (
                <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm font-bold text-slate-600 italic text-center">No specific tasks were assigned to this shift template. Please leave any standard closing notes below.</p>
                </div>
              ) : (
                clDynamicTasks.map((taskStr, i) => (
                  <label key={i} className="flex items-center space-x-3 cursor-pointer bg-slate-50 p-3 rounded-lg border border-gray-200 shadow-sm hover:bg-slate-100 transition">
                    <input type="checkbox" checked={clCompletedTasks.includes(taskStr)} onChange={() => toggleChecklistTask(taskStr)} className="w-6 h-6 text-green-700 rounded border-gray-400 focus:ring-green-600" />
                    <span className="font-black text-slate-800 leading-tight">{taskStr}</span>
                  </label>
                ))
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-black text-slate-800 mb-2">Notes to Manager <span className="text-gray-500 font-bold italic">(Required if skipping tasks)</span></label>
              <textarea value={clNotes} onChange={(e) => setClNotes(e.target.value)} rows={3} placeholder="We ran out of trash bags in the back room..." className="w-full border border-gray-400 rounded-lg p-3 text-slate-900 font-bold outline-none shadow-inner"></textarea>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button onClick={() => { setShowChecklistModal(false); setReportTargetCard(null); setEditingChecklistId(null); }} className="px-6 py-3 bg-gray-200 text-slate-800 font-bold rounded-lg hover:bg-gray-300 transition w-full sm:w-auto text-center shadow-sm">Cancel</button>
              <button onClick={submitShiftReport} className={`px-6 py-3 font-bold rounded-lg transition w-full sm:w-auto text-center shadow-md ${editingChecklistId ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-800 hover:bg-green-900 text-white'}`}>{editingChecklistId ? 'Update Report' : 'Submit Report'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-300">
        
        <div className="bg-slate-900 p-4 md:p-6 text-white flex flex-col xl:flex-row justify-between items-center gap-4 border-b-4 border-green-800">
          <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 w-full xl:w-auto">
            <img src="/logo.png" alt="Pickles & Play Logo" className="h-16 w-auto object-contain drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div className="flex flex-col items-center sm:items-start leading-tight">
              <h1 className="text-2xl md:text-3xl font-black tracking-widest text-white uppercase italic drop-shadow-sm"><span className="text-yellow-400">Pickles</span> & Play</h1>
              <p className="text-xs text-gray-300 tracking-widest uppercase mt-1 font-bold">ShiftSync Dashboard</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-800 p-2 rounded-lg shadow-inner border border-slate-700 w-full xl:w-auto justify-center">
            <span className="text-xs md:text-sm font-bold whitespace-nowrap text-gray-200">Active Employee:</span>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="text-slate-900 rounded p-1.5 text-xs md:text-sm font-black bg-white outline-none w-full sm:w-auto shadow-sm">
              <option value="">-- Select --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 justify-center w-full xl:w-auto text-xs md:text-sm">
            <button onClick={() => setActiveTab('calendar')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'calendar' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Calendar</button>
            <button onClick={() => setActiveTab('manual')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'manual' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Time Cards</button>
            {showDashboard && <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'dashboard' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Dashboard</button>}
            {showManagerView && <button onClick={() => setActiveTab('manager')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'manager' ? 'bg-orange-500 text-white' : 'bg-slate-800 hover:bg-orange-500 text-white'}`}>Manager</button>}
            {showPasses && <button onClick={() => setActiveTab('privileges')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'privileges' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Passes</button>}
            
            {/* NEW: Gift Cards Navigation Tab */}
            {showGiftCards && <button onClick={() => setActiveTab('giftcards')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'giftcards' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Gift Cards</button>}

            {showReports && <button onClick={() => setActiveTab('reports')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'reports' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Reports</button>}
            {showSetup && <button onClick={() => setActiveTab('setup')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'setup' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Shift Setup</button>}
            {showStaff && <button onClick={() => setActiveTab('staff')} className={`px-3 py-2 rounded-lg font-bold transition shadow-sm flex-grow sm:flex-grow-0 ${activeTab === 'staff' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 hover:bg-green-800 text-white'}`}>Staff</button>}
          </div>
        </div>

        <div className="p-4 md:p-8 overflow-hidden bg-gray-50">
          {activeTab === 'calendar' && <CalendarTab appState={appState} />}
          {activeTab === 'manual' && <TimeCardTab appState={appState} />}
          {activeTab === 'dashboard' && <DashboardTab appState={appState} />}
          {activeTab === 'manager' && <ManagerTab appState={appState} />}
          {activeTab === 'privileges' && <PrivilegesTab appState={appState} />}
          {activeTab === 'reports' && <ReportsTab appState={appState} />}
          {activeTab === 'setup' && <SetupTab appState={appState} />}
          {activeTab === 'staff' && <StaffTab appState={appState} />}
          
          {/* NEW: Render Gift Cards View */}
          {activeTab === 'giftcards' && <GiftCardTab appState={appState} />}
        </div>
      </div>
    </div>
  );
}