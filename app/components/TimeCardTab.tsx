// filepath: app/components/TimeCardTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { TimeCard, ShiftTemplate, Checklist } from '../lib/types';
import { notify } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { formatTimeSafe, formatDateSafe } from '@/lib/common';

// ==================================================================
// 1. ISOLATED REPORT EDITOR (Fixes typing focus & scroll jumping)
// ==================================================================
function ShiftReportEditor({ card, globalReport, assignedTasks, fetchChecklists }: any) {
  // Local state guarantees the UI never tears down while typing
  const [completedTasks, setCompletedTasks] = useState<string[]>(globalReport?.completedTasks || []);
  const [notes, setNotes] = useState(globalReport?.notes || '');
  const [prevNotes, setPrevNotes] = useState(globalReport?.previousShiftNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const[savedOnce, setSavedOnce] = useState(!!globalReport);

  // Only sync from server on initial mount
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
        await fetchChecklists(); // Silently updates the parent progress percentage
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
    saveReport(updated, notes, prevNotes); // Auto-save on toggle
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 space-y-6">
      <div>
        <h4 className="text-xs font-black text-slate-700 uppercase mb-3">Facility Checklist ({progressPct}% Done)</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {assignedTasks.map((t: string, idx: number) => (
            <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${completedTasks.includes(t) ? 'bg-green-50 border-green-300' : 'bg-white border-slate-300 hover:border-blue-400'}`}>
              <input type="checkbox" checked={completedTasks.includes(t)} onChange={() => toggleTask(t)} className="w-5 h-5 rounded shrink-0 mt-0.5" />
              <span className={`text-sm font-bold ${completedTasks.includes(t) ? 'text-green-900 line-through opacity-70' : 'text-slate-900'}`}>{t}</span>
            </label>
          ))}
          {assignedTasks.length === 0 && <p className="text-sm font-bold text-slate-500 italic">No tasks assigned.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-black text-pink-700 uppercase mb-2">Previous Shift Carry-Over</h4>
          <textarea 
            value={prevNotes} 
            onChange={(e) => setPrevNotes(e.target.value)} 
            onBlur={() => saveReport(completedTasks, notes, prevNotes)} 
            placeholder="Did the previous shift leave items unfinished?" 
            className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 bg-white focus:border-pink-500 outline-none resize-none shadow-inner placeholder:text-slate-400" 
            rows={4}
          ></textarea>
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Your Shift Notes</h4>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            onBlur={() => saveReport(completedTasks, notes, prevNotes)} 
            placeholder="Report any issues or pass-downs..." 
            className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 bg-white focus:border-blue-500 outline-none resize-none shadow-inner placeholder:text-slate-400" 
            rows={4}
          ></textarea>
        </div>
      </div>

      <button onClick={() => saveReport(completedTasks, notes, prevNotes)} disabled={isSaving} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-md transition text-sm tracking-wide">
        {isSaving ? 'Saving...' : (savedOnce ? 'Report Saved ✓' : 'Save Shift Report')}
      </button>
    </div>
  );
}

// ==================================================================
// 2. TIMECARD ROW COMPONENT
// ==================================================================
const TimeCardItem = ({ card, viewMode }: { card: TimeCard, viewMode: 'mobile' | 'desktop' }) => {
  const locations = useAppStore(state => state.locations);
  const templates = useAppStore(state => state.templates);
  const checklists = useAppStore(state => state.checklists);
  const fetchChecklists = useAppStore(state => state.fetchChecklists);

  const outD = new Date(card.clockOut || '');
  const isActive = !card.clockOut || isNaN(outD.getTime()) || outD.getFullYear() === 1970;
  
  const [isExpanded, setIsExpanded] = useState(isActive); 
  const globalReport = checklists?.find((c: Checklist) => c.timeCardId === card.id);

  let bestTpl: ShiftTemplate | null = null;
  const tcDate = new Date(card.clockIn);
  const day = tcDate.getDay();
  const mins = tcDate.getHours() * 60 + tcDate.getMinutes();

  const todayTpls = templates?.filter(t => t.locationId === card.locationId && t.dayOfWeek === day) ||[];
  if (todayTpls.length === 1) {
    bestTpl = todayTpls[0];
  } else if (todayTpls.length > 1) {
    let minDiff = 9999;
    todayTpls.forEach(t => {
      const parts = t.startTime.split(':');
      const tMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      const diff = Math.abs(mins - tMins);
      if (diff < minDiff) { minDiff = diff; bestTpl = t; }
    });
  }

  const assignedTasks = bestTpl ? (bestTpl.checklistTasks || []) :[];
  
  // Calculate display progress from the global store so it updates silently on the outside row
  const completedTaskCount = globalReport?.completedTasks?.length || 0;
  const progressPct = assignedTasks.length > 0 ? Math.round((completedTaskCount / assignedTasks.length) * 100) : (completedTaskCount > 0 ? 100 : 0);

  if (viewMode === 'mobile') {
    return (
      <div className="md:hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-4 flex flex-col relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
        
        <div className="flex justify-between items-start mb-4 pl-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-none mb-1">{formatDateSafe(card.clockIn)}</h3>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{locations?.find(l => l.id === card.locationId)?.name || 'Unknown'}</span>
          </div>
          {isActive && <div className="text-[10px] font-black tracking-widest text-blue-800 bg-blue-50 px-3 py-1 rounded border border-blue-300 animate-pulse">ACTIVE</div>}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 pl-2">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black text-slate-500 uppercase">In</span>
            <span className="text-sm font-bold text-green-700">{formatTimeSafe(card.clockIn)}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black text-slate-500 uppercase">Out</span>
            <span className={`text-sm font-bold ${isActive ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>{isActive ? 'Active' : formatTimeSafe(card.clockOut!)}</span>
          </div>
        </div>
        
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs py-3 rounded-lg flex items-center justify-between px-4 transition-colors">
          <span>Shift Report ({progressPct}%)</span>
          <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        </button>

        {isExpanded && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <ShiftReportEditor card={card} globalReport={globalReport} assignedTasks={assignedTasks} fetchChecklists={fetchChecklists} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <tr onClick={() => setIsExpanded(!isExpanded)} className={`hidden md:table-row border-b border-slate-200 hover:bg-blue-50 transition cursor-pointer ${isActive ? 'bg-blue-50/30' : 'bg-white'}`}>
        <td className="p-4 font-black text-slate-900">{formatDateSafe(card.clockIn)}</td>
        <td className="p-4 font-bold text-slate-700">{locations?.find(l => l.id === card.locationId)?.name || 'Unknown'}</td>
        <td className="p-4 font-bold text-green-700">{formatTimeSafe(card.clockIn)}</td>
        <td className="p-4 font-bold text-slate-700">{isActive ? <span className="text-red-500 animate-pulse uppercase tracking-widest text-[10px] font-black border border-red-200 bg-red-50 px-2 py-1 rounded">Active</span> : formatTimeSafe(card.clockOut!)}</td>
        <td className="p-4 font-black text-blue-700 text-right">{card.totalHours ? card.totalHours.toFixed(2) + 'h' : '-'}</td>
        <td className="p-4 text-center">
          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border shadow-sm ${progressPct === 100 ? 'bg-green-100 text-green-800 border-green-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
            {progressPct}% Done
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="hidden md:table-row bg-slate-50 border-b border-slate-300 shadow-inner">
          <td colSpan={6} className="p-0">
            <div className="border-x-4 border-blue-500">
               <ShiftReportEditor card={card} globalReport={globalReport} assignedTasks={assignedTasks} fetchChecklists={fetchChecklists} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ==================================================================
// 3. MAIN TAB LAYOUT
// ==================================================================
export default function TimeCardTab({ appState }: any) {
  const timeCards = useAppStore(state => state.timeCards);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  const activeUserTimeCards = timeCards.filter(c => c.userId.toString() === selectedUserId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">My Timesheet History</h2>
          <p className="text-slate-600 font-bold text-xs uppercase tracking-widest mt-0.5">Review past punches and submit shift reports.</p>
        </div>
      </div>

      {activeUserTimeCards.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center shadow-sm">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No recent time cards found.</p>
        </div>
      ) : (
        <>
          {/* MOBILE LIST VIEW */}
          <div className="md:hidden flex flex-col">
            {[...activeUserTimeCards].sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => (
              <TimeCardItem key={`mob-${card.id}`} card={card} viewMode="mobile" />
            ))}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest font-black sticky top-0 z-10 shadow-sm border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Facility</th>
                    <th className="px-4 py-3">Clock In</th>
                    <th className="px-4 py-3">Clock Out</th>
                    <th className="px-4 py-3 text-right">Hours</th>
                    <th className="px-4 py-3 text-center">Shift Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...activeUserTimeCards].sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => (
                    <TimeCardItem key={`desk-${card.id}`} card={card} viewMode="desktop" />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}