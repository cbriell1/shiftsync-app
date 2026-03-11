// filepath: app/components/TimeCardTab.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AppState, TimeCard, User, Location, ShiftTemplate, Checklist } from '../lib/types';
import { notify } from '@/lib/ui-utils';

const TimeCardRow = ({ 
  card, activeUser, locations, templates, formatTimeSafe, formatDateSafe, checklists, fetchChecklists 
}: {
  card: TimeCard, activeUser?: User, locations: Location[], templates: ShiftTemplate[],
  formatTimeSafe: (d: string) => string, formatDateSafe: (d: string) => string,
  checklists: Checklist[], fetchChecklists?: () => void
}) => {
  const outD = new Date(card.clockOut || '');
  const isActive = !card.clockOut || isNaN(outD.getTime()) || outD.getFullYear() === 1970;
  
  const globalReport = checklists?.find((c: Checklist) => c.timeCardId === card.id);
  const activeReport = globalReport || (card.checklists && card.checklists.length > 0 ? card.checklists[0] : null);

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
  
  const [isExpanded, setIsExpanded] = useState(isActive); 
  const [completedTasks, setCompletedTasks] = useState<string[]>(activeReport ? activeReport.completedTasks ||[] : []);
  const [notes, setNotes] = useState(activeReport ? activeReport.notes || '' : '');
  const [prevNotes, setPrevNotes] = useState(activeReport ? activeReport.previousShiftNotes || '' : '');
  const [reportId, setReportId] = useState<number | null>(activeReport?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(!!activeReport);

  const lastLocalUpdate = useRef<number>(0);

  useEffect(() => {
    const sourceReport = globalReport || activeReport;
    if (sourceReport) {
      if (!reportId) setReportId(sourceReport.id);
      if (!savedOnce) setSavedOnce(true);
      if (Date.now() - lastLocalUpdate.current < 10000) return;
      setCompletedTasks(prev => JSON.stringify(prev) !== JSON.stringify(sourceReport.completedTasks || []) ? sourceReport.completedTasks || [] : prev);
      setNotes(prev => prev !== (sourceReport.notes || '') ? sourceReport.notes || '' : prev);
      setPrevNotes(prev => prev !== (sourceReport.previousShiftNotes || '') ? sourceReport.previousShiftNotes || '' : prev);
    }
  }, [globalReport, activeReport]);

  const progressPct = assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : (completedTasks.length > 0 ? 100 : 0);

  const saveInlineReport = async (tasksToSave: string[], notesToSave: string, prevToSave: string) => {
    setIsSaving(true);
    const missed = assignedTasks.filter(t => !tasksToSave.includes(t));
    const payload: any = { 
      notes: notesToSave, 
      previousShiftNotes: prevToSave,
      completedTasks: tasksToSave, 
      missedTasks: missed,
      userId: card.userId,
      locationId: card.locationId,
      timeCardId: card.id
    };

    try {
      if (reportId) payload.id = reportId;
      const res = await fetch('/api/checklists', { method: reportId ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) setReportId(data.id);
        setSavedOnce(true);
        if (fetchChecklists) fetchChecklists();
      }
    } catch (err) {
      notify.error("Network Error saving report.");
    } finally {
      setTimeout(() => setIsSaving(false), 500); 
    }
  };

  const toggleTask = (task: string) => {
    lastLocalUpdate.current = Date.now();
    setCompletedTasks(prev => {
      const updated = prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task];
      saveInlineReport(updated, notes, prevNotes);
      return updated;
    });
  };

  return (
    <div className={`relative bg-white rounded-2xl p-5 shadow-md border transition-all ${isActive ? 'border-l-[8px] border-l-blue-600 border-blue-200' : 'border-slate-300'}`}>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-none mb-2">{formatDateSafe(card.clockIn)}</h3>
          <span className="text-[11px] font-black text-blue-900 bg-blue-100 border px-3 py-1 rounded shadow-sm uppercase">{activeUser?.name || 'Unknown'}</span>
        </div>
        {isActive && <div className="text-xs font-black tracking-widest text-blue-800 bg-blue-50 px-4 py-2 rounded-full border border-blue-300 animate-pulse">ACTIVE</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 p-4 rounded-xl border flex items-center justify-between shadow-inner">
          <div className="flex flex-col"><span className="text-[10px] font-black text-slate-600 uppercase">In</span><span className="text-sm md:text-base font-black text-slate-900">{formatTimeSafe(card.clockIn)}</span></div>
          <div className="flex flex-col items-end"><span className="text-[10px] font-black text-slate-600 uppercase">Out</span><span className={`text-sm md:text-base font-black ${isActive ? 'text-blue-700 italic' : 'text-slate-900'}`}>{isActive ? 'Working...' : formatTimeSafe(card.clockOut!)}</span></div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border flex items-center gap-3 shadow-inner">
          <div className="flex flex-col"><span className="text-[10px] font-black text-slate-600 uppercase">Location</span><span className="text-sm md:text-base font-bold text-slate-900 truncate">{locations?.find(l => l.id === card.locationId)?.name || 'Unknown'}</span></div>
        </div>
      </div>

      <div className="mt-2 border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-white hover:bg-slate-50 p-4 flex justify-between items-center transition-colors">
          <div className="flex items-center gap-3">
            <span className="block font-black text-slate-900 uppercase">Shift Report</span>
            <span className="text-xs font-bold text-slate-600">{progressPct}% Complete</span>
          </div>
          <svg className={`h-6 w-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
        </button>

        {isExpanded && (
          <div className="p-4 md:p-6 border-t-2 border-slate-200 bg-slate-50 space-y-6">
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase mb-3">Facility Checklist</h4>
              <div className="space-y-2">
                {assignedTasks.map((t, idx) => (
                  <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${completedTasks.includes(t) ? 'bg-green-50 border-green-300' : 'bg-white border-slate-300 hover:border-blue-400'}`}>
                    <input type="checkbox" checked={completedTasks.includes(t)} onChange={() => toggleTask(t)} className="w-5 h-5 rounded" />
                    <span className={`text-sm font-bold ${completedTasks.includes(t) ? 'text-green-900 line-through opacity-70' : 'text-slate-900'}`}>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-black text-pink-700 uppercase mb-2">Previous Shift Carry-Over</h4>
                <textarea 
                  value={prevNotes} 
                  onChange={(e) => { lastLocalUpdate.current = Date.now(); setPrevNotes(e.target.value); }} 
                  onBlur={() => saveInlineReport(completedTasks, notes, prevNotes)} 
                  placeholder="Did the previous shift leave items unfinished? Document them here..." 
                  className="w-full border-2 border-slate-400 rounded-xl p-3 text-sm font-black text-slate-950 bg-white focus:border-pink-500 outline-none resize-none shadow-inner placeholder:text-slate-400" 
                  rows={4}
                ></textarea>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Your Shift Notes</h4>
                <textarea 
                  value={notes} 
                  onChange={(e) => { lastLocalUpdate.current = Date.now(); setNotes(e.target.value); }} 
                  onBlur={() => saveInlineReport(completedTasks, notes, prevNotes)} 
                  placeholder="Report any issues or pass-downs for the manager..." 
                  className="w-full border-2 border-slate-400 rounded-xl p-3 text-sm font-black text-slate-950 bg-white focus:border-blue-500 outline-none resize-none shadow-inner placeholder:text-slate-400" 
                  rows={4}
                ></textarea>
              </div>
            </div>

            <button onClick={() => saveInlineReport(completedTasks, notes, prevNotes)} disabled={isSaving} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-md transition">{isSaving ? 'Saving...' : (savedOnce ? 'Report Saved ✓' : 'Save Shift Report')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TimeCardTab({ appState }: { appState: AppState }) {
  const { activeUserTimeCards, formatTimeSafe, formatDateSafe, selectedUserId, users, templates, locations, checklists, fetchChecklists } = appState;
  const activeUser = users?.find(u => u.id === parseInt(selectedUserId));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-5">Your Time & Shift Reports</h2>
      {activeUserTimeCards.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border-2 text-center"><p className="text-slate-600 font-bold">No recent time cards found.</p></div>
      ) : (
        <div className="space-y-6">
          {[...activeUserTimeCards].sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => (
            <TimeCardRow key={card.id} card={card} activeUser={activeUser} locations={locations} templates={templates} formatDateSafe={formatDateSafe} formatTimeSafe={formatTimeSafe} checklists={checklists} fetchChecklists={fetchChecklists} />
          ))}
        </div>
      )}
    </div>
  );
}