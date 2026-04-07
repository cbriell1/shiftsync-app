// filepath: app/components/TimesheetsTab.tsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { TimeCard, ShiftTemplate, Checklist } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { formatDateSafe, formatTimeSafe, generatePeriods } from '@/lib/common';
import { notify } from '@/lib/ui-utils';

// ==================================================================
// 1. ISOLATED REPORT EDITOR (Ported from TimeCardTab)
// ==================================================================
function ShiftReportEditor({ card, globalReport, assignedTasks, fetchChecklists }: any) {
  const [completedTasks, setCompletedTasks] = useState<string[]>(globalReport?.completedTasks || []);
  const [notes, setNotes] = useState(globalReport?.notes || '');
  const [prevNotes, setPrevNotes] = useState(globalReport?.previousShiftNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const[savedOnce, setSavedOnce] = useState(!!globalReport);

  useEffect(() => {
    if (globalReport && !savedOnce) {
      setCompletedTasks(globalReport.completedTasks ||[]);
      setNotes(globalReport.notes || '');
      setPrevNotes(globalReport.previousShiftNotes || '');
      setSavedOnce(true);
    }
  }, [globalReport?.id, savedOnce]);

  const progressPct = assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : (completedTasks.length > 0 ? 100 : 0);

  const saveReport = async (tasks: string[], n: string, pN: string) => {
    setIsSaving(true);
    const missed = assignedTasks.filter((t: string) => !tasks.includes(t));
    const payload = {
      id: globalReport?.id || undefined,
      timeCardId: card.id,
      userId: card.userId,
      locationId: card.locationId,
      notes: n,
      previousShiftNotes: pN,
      completedTasks: tasks,
      missedTasks: missed
    };

    try {
      const res = await fetch('/api/checklists', {
        method: globalReport?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSavedOnce(true);
        await fetchChecklists();
      }
    } catch (e) {
      notify.error("Network error saving report");
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const toggleTask = (task: string) => {
    const updated = completedTasks.includes(task) ? completedTasks.filter((t: string) => t !== task) : [...completedTasks, task];
    setCompletedTasks(updated);
    saveReport(updated, notes, prevNotes);
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 space-y-6">
      <div>
        <h4 className="text-xs font-black text-slate-700 uppercase mb-3 italic tracking-widest">Facility Checklist ({progressPct}% Done)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
          {assignedTasks.map((t: string, idx: number) => (
            <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${completedTasks.includes(t) ? 'bg-green-50 border-green-300' : 'bg-white border-slate-300 hover:border-blue-400'}`}>
              <input type="checkbox" checked={completedTasks.includes(t)} onChange={() => toggleTask(t)} className="w-5 h-5 rounded shrink-0 mt-0.5" />
              <span className={`text-sm font-bold ${completedTasks.includes(t) ? 'text-green-900 line-through opacity-70' : 'text-slate-900'}`}>{t}</span>
            </label>
          ))}
          {assignedTasks.length === 0 && <p className="text-sm font-bold text-slate-500 italic col-span-2">No tasks assigned for this shift.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-black text-pink-700 uppercase mb-2">Previous Shift Carry-Over</h4>
          <textarea value={prevNotes} onChange={(e) => setPrevNotes(e.target.value)} onBlur={() => saveReport(completedTasks, notes, prevNotes)} placeholder="Did the previous shift leave items unfinished?" className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 bg-white focus:border-pink-500 outline-none resize-none shadow-inner h-24" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Your Shift Notes</h4>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => saveReport(completedTasks, notes, prevNotes)} placeholder="Report any issues or pass-downs..." className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 bg-white focus:border-blue-500 outline-none resize-none shadow-inner h-24" />
        </div>
      </div>

      <button onClick={() => saveReport(completedTasks, notes, prevNotes)} disabled={isSaving} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-md transition text-sm tracking-widest uppercase">
        {isSaving ? 'Saving...' : (savedOnce ? 'Report Saved ✓' : 'Save Shift Report')}
      </button>
    </div>
  );
}

// ==================================================================
// 2. MAIN UNIFIED TIMESHEET TAB
// ==================================================================
export default function TimesheetsTab({ appState }: any) {
  const managerData = useAppStore(state => state.managerData);
  const users = useAppStore(state => state.users);
  const locations = useAppStore(state => state.locations);
  const templates = useAppStore(state => state.templates);
  const checklists = useAppStore(state => state.checklists);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  const manPeriods = useAppStore(state => state.manPeriods);
  const setManPeriods = useAppStore(state => state.setManPeriods);
  const manLocs = useAppStore(state => state.manLocs);
  const setManLocs = useAppStore(state => state.setManLocs);
  const manEmps = useAppStore(state => state.manEmps);
  const setManEmps = useAppStore(state => state.setManEmps);

  const fetchManagerData = useAppStore(state => state.fetchManagerData);
  const fetchTimeCards = useAppStore(state => state.fetchTimeCards);
  const fetchChecklists = useAppStore(state => state.fetchChecklists);

  const activeUserObj = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUserObj?.systemRoles?.includes('Administrator');
  const isManager = activeUserObj?.systemRoles?.includes('Manager') || isAdmin;

  const activeUsers = users.filter(u => u.isActive !== false);
  const periods = useMemo(() => generatePeriods() as { label: string; start: string; end: string }[],[]);

  // State for Matrix Interaction
  const [selectedCell, setSelectedCell] = useState<{ locId: number | null, periodIdx: number | null }>({ locId: null, periodIdx: null });

  useEffect(() => {
    fetchManagerData(!!isManager, selectedUserId);
  },[manPeriods, manLocs, manEmps, isManager, selectedUserId, fetchManagerData]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const[expandedReports, setExpandedReports] = useState<Record<number, boolean>>({});
  
  const[editingCardId, setEditingCardId] = useState<number | null>(null);
  const [formUserId, setFormUserId] = useState('');
  const[formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const[formEndTime, setFormEndTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const toggleGroup = (key: string) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleReport = (id: number) => setExpandedReports(prev => ({ ...prev, [id]: !prev[id] }));

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = isManager ? formUserId : selectedUserId;
    if (!targetUserId) return alert("Select an employee!");
    if (!selectedLocation) return alert("Select a location!");
    if (!formDate || !formStartTime) return alert("Date and Start Time required!");

    const clockInDateTime = new Date(`${formDate}T${formStartTime}`);
    let clockOutDateTime: Date | null = null;
    if (formEndTime) {
      clockOutDateTime = new Date(`${formDate}T${formEndTime}`);
      if (clockOutDateTime < clockInDateTime) clockOutDateTime.setDate(clockOutDateTime.getDate() + 1);
    }
    
    const body: any = { userId: parseInt(targetUserId as string), locationId: parseInt(selectedLocation), clockIn: clockInDateTime.toISOString(), clockOut: clockOutDateTime?.toISOString() || null };
    if (editingCardId) body.id = editingCardId;

    try {
      const res = await fetch('/api/timecards', { method: editingCardId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setEditingCardId(null); setFormStartTime(''); setFormEndTime(''); setFormUserId(''); setFormDate(''); setSelectedLocation('');
        await fetchManagerData(!!isManager, selectedUserId); 
        await fetchTimeCards(selectedUserId);
      }
    } catch (err) { console.error(err); }
  };

  const handleEditClick = (card: TimeCard) => {
    const inD = new Date(card.clockIn);
    setFormDate(inD.toISOString().split('T')[0]);
    const getLocalTime = (d: Date) => { const h = d.getHours().toString().padStart(2, '0'); const m = d.getMinutes().toString().padStart(2, '0'); return `${h}:${m}`; };
    setFormStartTime(getLocalTime(inD));
    if (card.clockOut) setFormEndTime(getLocalTime(new Date(card.clockOut)));
    else setFormEndTime('');
    setSelectedLocation(card.locationId.toString());
    setFormUserId(card.userId.toString());
    setEditingCardId(card.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (cardId: number) => {
    if(!confirm("Delete this timecard?")) return;
    await fetch('/api/timecards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cardId }) });
    await fetchManagerData(!!isManager, selectedUserId);
    await fetchTimeCards(selectedUserId);
  };

  // Matrix Logic
  const matrixData = useMemo(() => {
    const activePeriods = manPeriods.map(idx => periods[idx]);
    const matrixMap = new Map();

    (managerData || []).forEach(card => {
      const locId = card.locationId;
      if (manLocs.length > 0 && !manLocs.includes(locId)) return;
      
      const locName = card.location?.name || 'Unknown Facility';
      if (!matrixMap.has(locId)) {
        matrixMap.set(locId, { locId, locName, periodTotals: new Array(activePeriods.length).fill(0), totalRowHours: 0 });
      }
      
      const row = matrixMap.get(locId);
      activePeriods.forEach((p, pIdx) => {
        const cDate = new Date(card.clockIn);
        if (cDate >= new Date(p.start) && cDate <= new Date(new Date(p.end).setHours(23,59,59))) {
          row.periodTotals[pIdx] += (card.totalHours || 0);
          row.totalRowHours += (card.totalHours || 0);
        }
      });
    });

    return Array.from(matrixMap.values()).sort((a, b) => a.locName.localeCompare(b.locName));
  }, [managerData, manPeriods, periods, manLocs]);

  const filteredCards = useMemo(() => {
    return (managerData || []).filter(card => {
      // 1. Basic Filters
      if (manLocs.length > 0 && !manLocs.includes(card.locationId)) return false;
      
      // 2. Matrix Filter (Drill-down)
      if (selectedCell.locId !== null && card.locationId !== selectedCell.locId) return false;
      if (selectedCell.periodIdx !== null) {
        const p = periods[manPeriods[selectedCell.periodIdx]];
        const cDate = new Date(card.clockIn);
        if (!(cDate >= new Date(p.start) && cDate <= new Date(new Date(p.end).setHours(23,59,59)))) return false;
      }
      
      return true;
    });
  }, [managerData, manLocs, selectedCell, periods, manPeriods]);

  const totalHoursSummary = useMemo(() => {
    return filteredCards.reduce((sum, card) => sum + (card.totalHours || 0), 0);
  }, [filteredCards]);

  const handlePrint = () => window.print();

  const labelClasses = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = "w-full border-2 border-slate-300 rounded-xl px-4 py-3.5 text-base font-black text-slate-900 bg-white focus:border-blue-600 outline-none shadow-sm transition-all";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 print:mb-8 print:border-none">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">{isManager ? 'Timesheet Auditing' : 'My Timesheet'}</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 print:hidden">
            {isManager ? 'Audit individual punches and payroll summaries.' : 'Review your hours and submit shift reports.'}
          </p>
          {!isManager && (
            <div className="hidden print:block mt-2">
              <p className="text-xl font-black text-slate-800 uppercase tracking-tight">{activeUserObj?.name}</p>
              <p className="text-sm font-bold text-slate-600">Payroll Period Summary</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto print:hidden">
          <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-3 px-6 rounded-xl hover:bg-black transition-all text-xs uppercase tracking-widest shadow-md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Report
          </button>
        </div>
      </div>

      {/* 1. Log Missing Shift (Staff Tool) */}
      <div className="bg-blue-50/40 p-5 md:p-7 rounded-2xl border-2 border-blue-100 shadow-inner print:hidden">
        <h3 className="text-lg font-black text-blue-950 mb-5 flex items-center gap-2">
          {editingCardId ? <><span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span> Edit Timecard</> : <><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Log Missing Shift</>}
        </h3>
        <form onSubmit={handleManualSubmit}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-4 items-start">
            {isManager && (
              <div className="col-span-2 sm:col-span-4 lg:col-span-3">
                <label className={labelClasses}>Staff Member</label>
                <select value={formUserId} onChange={(e) => setFormUserId(e.target.value)} required className={inputClasses}>
                  <option value="">-- Select Name --</option>
                  {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div className={`col-span-2 sm:col-span-4 ${isManager ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              <label className={labelClasses}>Facility</label>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} required className={inputClasses}>
                <option value="">-- Select Location --</option>
                {locations.filter(l => l.isActive !== false || (editingCardId && l.id.toString() === selectedLocation)).map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
            <div className={`col-span-2 sm:col-span-4 ${isManager ? 'lg:col-span-2' : 'lg:col-span-4'}`}>
              <label className={labelClasses}>Date</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className={inputClasses} />
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <label className={labelClasses}>Clock In</label>
              <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} required className={inputClasses} />
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <label className={labelClasses}>Clock Out</label>
              <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className={inputClasses} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-blue-200/60">
            <button type="submit" className="w-full sm:w-auto bg-slate-900 text-white font-black py-3.5 px-8 rounded-xl shadow-lg hover:bg-black transition-all text-sm uppercase tracking-widest">
              {editingCardId ? 'Save Changes' : 'Log Timecard'}
            </button>
            {editingCardId && <button type="button" onClick={() => { setEditingCardId(null); setFormUserId(''); setFormDate(''); setFormStartTime(''); setFormEndTime(''); setSelectedLocation(''); }} className="w-full sm:w-auto bg-white border-2 border-slate-300 text-slate-700 font-black py-3.5 px-8 rounded-xl hover:bg-slate-50 transition-colors text-sm uppercase tracking-widest shadow-sm">Cancel Edit</button>}
          </div>
        </form>
      </div>

      {/* 2. Payroll Matrix Summary (Payroll View Style) */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-900 p-4 flex justify-between items-center print:bg-white print:border-b-2 print:border-slate-300">
          <h3 className="text-sm font-black text-white uppercase tracking-widest print:text-slate-900 italic">Hours Summary Matrix</h3>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => setSelectedCell({ locId: null, periodIdx: null })} className={`text-[10px] font-black uppercase px-3 py-1 rounded-full transition-all ${selectedCell.locId === null && selectedCell.periodIdx === null ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Show All</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-4 font-black uppercase border-r border-slate-200">Facility</th>
                {manPeriods.map((idx, i) => (
                  <th key={idx} className={`p-4 font-black uppercase text-center border-r border-slate-200 ${selectedCell.periodIdx === i ? 'bg-yellow-50 text-blue-700' : ''}`}>
                    {periods[idx].label.split(' - ')[0]}...
                  </th>
                ))}
                <th className="p-4 font-black uppercase text-center bg-slate-200 text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matrixData.map(row => (
                <tr key={row.locId} className="hover:bg-slate-50 transition-colors">
                  <td onClick={() => setSelectedCell(prev => prev.locId === row.locId ? { ...prev, locId: null } : { ...prev, locId: row.locId })} className={`p-4 font-black border-r border-slate-200 cursor-pointer ${selectedCell.locId === row.locId ? 'bg-blue-50 text-blue-700' : 'text-slate-800'}`}>
                    {row.locName}
                  </td>
                  {row.periodTotals.map((total: number, pIdx: number) => (
                    <td 
                      key={pIdx} 
                      onClick={() => setSelectedCell({ locId: row.locId, periodIdx: pIdx })}
                      className={`p-4 text-center font-bold border-r border-slate-200 cursor-pointer transition-all ${total > 0 ? 'text-green-700 bg-green-50/30' : 'text-slate-300'} ${selectedCell.locId === row.locId && selectedCell.periodIdx === pIdx ? 'ring-4 ring-inset ring-yellow-400 !bg-yellow-50 !text-slate-900' : ''}`}
                    >
                      {total > 0 ? total.toFixed(2) + 'h' : '-'}
                    </td>
                  ))}
                  <td className="p-4 text-center font-black bg-slate-50 text-slate-900">{row.totalRowHours.toFixed(2)}h</td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-black print:text-slate-900 print:bg-slate-100">
                <td className="p-4 uppercase italic">Grand Total</td>
                {manPeriods.map((_, pIdx) => {
                  const pTotal = matrixData.reduce((sum, row) => sum + row.periodTotals[pIdx], 0);
                  return <td key={pIdx} className="p-4 text-center text-lg tracking-tighter">{pTotal.toFixed(2)}h</td>;
                })}
                <td className="p-4 text-center text-xl text-yellow-400 print:text-blue-700">{matrixData.reduce((sum, row) => sum + row.totalRowHours, 0).toFixed(2)}h</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Detailed Shift List (Drill-down) */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
            {selectedCell.locId !== null || selectedCell.periodIdx !== null ? 'Filtered Detail View' : 'Individual Timecards'}
          </h3>
          <span className="text-xs font-bold text-slate-500 uppercase">Showing {filteredCards.length} shifts | {totalHoursSummary.toFixed(2)}h</span>
        </div>

        {filteredCards.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 p-12 text-center rounded-2xl shadow-inner">
            <p className="text-slate-400 font-black uppercase tracking-widest">No shifts found for this selection.</p>
          </div>
        ) : (
          filteredCards.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => {
            const report = checklists.find(c => c.timeCardId === card.id);
            const isExpanded = expandedReports[card.id];
            
            // Find best template for checklist
            const tcDate = new Date(card.clockIn);
            const day = tcDate.getDay();
            const mins = tcDate.getHours() * 60 + tcDate.getMinutes();
            const todayTpls = templates?.filter(t => t.locationId === card.locationId && t.dayOfWeek === day) || [];
            let bestTpl = todayTpls.length === 1 ? todayTpls[0] : (todayTpls.length > 1 ? todayTpls.reduce((min, t) => {
              const p = t.startTime.split(':');
              const d = Math.abs(mins - (parseInt(p[0]) * 60 + parseInt(p[1])));
              return d < min.diff ? { diff: d, t } : min;
            }, { diff: 9999, t: todayTpls[0] }).t : null);
            const assignedTasks = bestTpl ? (bestTpl.checklistTasks || []) : [];
            const progress = assignedTasks.length > 0 ? Math.round(((report?.completedTasks?.length || 0) / assignedTasks.length) * 100) : (report ? 100 : 0);

            return (
              <div key={card.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition-all">
                <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6">
                    <div className="flex flex-col">
                      <span className="font-black text-lg text-slate-900 leading-none">{formatDateSafe(card.clockIn)}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{card.location?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                      <span className="text-green-700">{formatTimeSafe(card.clockIn)}</span>
                      <span className="text-slate-300">→</span>
                      <span className={!card.clockOut ? 'text-red-500 animate-pulse' : 'text-slate-800'}>{card.clockOut ? formatTimeSafe(card.clockOut) : 'ACTIVE'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{card.totalHours?.toFixed(2)}h</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${progress === 100 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-600'}`}>{progress}% Report</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto print:hidden">
                    <button onClick={() => toggleReport(card.id)} className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest border-2 transition-all ${isExpanded ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                      {isExpanded ? 'Close Report' : 'Shift Report'}
                    </button>
                    <button onClick={() => handleEditClick(card)} className="px-4 py-2 text-xs bg-white text-blue-700 border-2 border-blue-100 hover:bg-blue-50 font-black rounded-lg uppercase tracking-widest transition-all">Edit</button>
                    <button onClick={() => handleDeleteClick(card.id)} className="px-4 py-2 text-xs bg-white text-red-600 border-2 border-red-100 hover:bg-red-50 font-black rounded-lg uppercase tracking-widest transition-all">Delete</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t-2 border-slate-100">
                    <ShiftReportEditor card={card} globalReport={report} assignedTasks={assignedTasks} fetchChecklists={fetchChecklists} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}