"use client";
import React, { useState, useEffect } from 'react';

// --- SUB-COMPONENT: Individual Time Card Row ---
const TimeCardRow = ({ card, activeUser, locations, templates, isManager, handleEditClick, handleDeleteClick, formatDateSafe, formatTimeSafe, checklists }) => {
  const outD = new Date(card.clockOut);
  const isActive = !card.clockOut || isNaN(outD.getTime()) || outD.getFullYear() === 1970;
  
  // Find the report safely from the global checklists array (Handles refresh persistence)
  const globalReport = checklists?.find(c => c.timeCardId === card.id);
  const activeReport = globalReport || (card.checklists && card.checklists.length > 0 ? card.checklists[0] : null);

  // Smarter Template Matching Logic
  let bestTpl = null;
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

  const assignedTasks = bestTpl ? (bestTpl.checklistTasks ||[]) :[];
  
  // Local State for Inline Editing
  const [isExpanded, setIsExpanded] = useState(isActive); 
  const [completedTasks, setCompletedTasks] = useState(activeReport ? activeReport.completedTasks ||[] : []);
  const [notes, setNotes] = useState(activeReport ? activeReport.notes || '' : '');
  const[reportId, setReportId] = useState(activeReport?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(!!activeReport);

  // CRITICAL FIX: Ensure state updates if checklists load AFTER the component mounts (on screen refresh)
  useEffect(() => {
    if (globalReport && !reportId) {
      setCompletedTasks(globalReport.completedTasks ||[]);
      setNotes(globalReport.notes || '');
      setReportId(globalReport.id);
      setSavedOnce(true);
    }
  }, [globalReport, reportId]);

  const progressPct = assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : (completedTasks.length > 0 ? 100 : 0);

  // Core Save Logic (Can be triggered manually or automatically)
  const saveInlineReport = async (tasksToSave = completedTasks, notesToSave = notes) => {
    setIsSaving(true);
    const missed = assignedTasks.filter(t => !tasksToSave.includes(t));
    const payload = { notes: notesToSave, completedTasks: tasksToSave, missedTasks: missed };

    try {
      let newReportId = reportId;
      if (reportId) {
        payload.id = reportId;
        await fetch('/api/checklists', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
      } else {
        payload.userId = card.userId;
        payload.locationId = card.locationId;
        payload.timeCardId = card.id;
        const res = await fetch('/api/checklists', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data && data.id) {
          setReportId(data.id);
          newReportId = data.id;
        }
      }

      setSavedOnce(true);
      setTimeout(() => setIsSaving(false), 500); 
    } catch (err) {
      console.error("Failed to save report:", err);
      setIsSaving(false);
    }
  };

  // Toggle individual task selection + AUTO-SAVE
  const toggleTask = (task) => {
    if (!isActive) return;
    const updatedTasks = completedTasks.includes(task) 
      ? completedTasks.filter(t => t !== task) 
      : [...completedTasks, task];
      
    setCompletedTasks(updatedTasks);
    saveInlineReport(updatedTasks, notes); // Auto-save instantly on click!
  };

  // Auto-Save notes when clicking out of the text box
  const handleNotesBlur = () => {
    if (isActive) saveInlineReport(completedTasks, notes);
  };

  return (
    <div className={`relative bg-white rounded-2xl p-5 md:p-6 shadow-md border transition-all duration-300 ${isActive ? 'border-l-[8px] border-l-blue-500 border-blue-200' : 'border-gray-200'}`}>
      
      {/* Header Row: Date, Name, & Status Badge */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
            {formatDateSafe(card.clockIn)}
          </h3>
          <span className="text-[11px] font-black text-blue-950 bg-blue-100 border border-blue-300 px-3 py-1 rounded shadow-sm uppercase tracking-widest">
            {activeUser?.name || 'Unknown'}
          </span>
        </div>
        <div>
          {isActive ? (
            <div className="flex items-center gap-1.5 text-xs font-black tracking-widest text-blue-700 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> ACTIVE
            </div>
          ) : (
            <div className="text-[10px] font-black tracking-widest text-gray-500 bg-gray-100 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              CLOSED
            </div>
          )}
        </div>
      </div>

      {/* Times & Location Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Clocked In</span>
            <span className="text-sm md:text-base font-black text-slate-800">{formatTimeSafe(card.clockIn)}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Clocked Out</span>
            <span className={`text-sm md:text-base font-black ${isActive ? 'text-blue-600 italic' : 'text-slate-800'}`}>
              {isActive ? 'Working...' : formatTimeSafe(card.clockOut)}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-inner">
          <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Location</span>
            <span className="text-sm md:text-base font-bold text-slate-800 truncate">{locations?.find(l => l.id === card.locationId)?.name || 'Unknown Location'}</span>
          </div>
        </div>
      </div>

      {/* --- EXPANDABLE SHIFT REPORT ACCORDION --- */}
      <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50">
        
        {/* Accordion Toggle Header */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full bg-white hover:bg-slate-50 p-4 flex justify-between items-center transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block font-black text-slate-800 text-sm md:text-base uppercase tracking-wider">
                Shift Report
              </span>
              <span className={`text-xs font-bold ${progressPct === 100 ? 'text-green-600' : 'text-slate-500'}`}>
                {assignedTasks.length > 0 ? `${completedTasks.length} / ${assignedTasks.length} Tasks Done` : (completedTasks.length > 0 ? `${completedTasks.length} Extra Tasks Done` : (notes ? 'Notes Saved' : 'No Tasks Assigned'))}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {assignedTasks.length > 0 && (
              <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-slate-200 relative">
                <svg className="absolute w-8 h-8 -rotate-90">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-500 transition-all duration-500" strokeDasharray="88" strokeDashoffset={88 - (88 * progressPct) / 100} />
                </svg>
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Collapsed Preview */}
        {!isExpanded && notes && (
          <div className="px-5 pb-4 pt-1 bg-white text-left border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Notes Saved:</span>
            <p className="text-sm text-slate-600 font-semibold italic truncate">"{notes}"</p>
          </div>
        )}

        {/* Accordion Body */}
        {isExpanded && (
          <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50">
            
            {/* Task Checklist */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Facility Tasks</h4>
              
              {assignedTasks.length > 0 ? (
                <div className="space-y-2">
                  {assignedTasks.map((task, idx) => {
                    const isDone = completedTasks.includes(task);
                    return (
                      <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${!isActive ? 'cursor-default' : 'cursor-pointer'} ${isDone ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}>
                        <input 
                          type="checkbox" 
                          checked={isDone} 
                          onChange={() => toggleTask(task)} 
                          disabled={!isActive}
                          className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-60 cursor-pointer" 
                        />
                        <span className={`text-sm font-bold leading-snug transition-all ${isDone ? 'text-green-800 line-through opacity-70' : 'text-slate-800'}`}>
                          {task}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  {completedTasks.length > 0 ? (
                    <ul className="space-y-2">
                      {completedTasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm font-bold text-slate-500">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          {task}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm font-bold text-slate-500 italic">No specific tasks were assigned to this shift.</p>
                  )}
                </div>
              )}
            </div>

            {/* Shift Notes Field */}
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                Shift Notes <span className="font-medium normal-case tracking-normal">(Required if skipping tasks)</span>
              </h4>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                onBlur={handleNotesBlur} 
                readOnly={!isActive}
                placeholder={isActive ? "Report any issues, missing supplies, or pass-downs for the manager here..." : "No notes saved."}
                className={`w-full border rounded-xl p-4 text-sm font-bold text-slate-800 outline-none resize-none transition-colors ${isActive ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm' : 'border-gray-200 bg-gray-100 text-slate-600'}`}
                rows="3"
              ></textarea>
            </div>

            {/* Manual Save Button */}
            {isActive && (
              <button 
                onClick={() => saveInlineReport(completedTasks, notes)} 
                disabled={isSaving}
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-md transition flex justify-center items-center gap-2"
              >
                {isSaving ? (
                  <span className="animate-pulse">Auto-Saving...</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {savedOnce ? 'Shift Report Saved' : 'Save Shift Report'}
                  </>
                )}
              </button>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

// --- MAIN TAB COMPONENT ---
export default function TimeCardTab({ appState }) {
  const {
    activeUserTimeCards, handleEditClick, handleDeleteClick, formatTimeSafe, formatDateSafe,
    selectedUserId, users, isManager, templates, locations, checklists
  } = appState;

  const activeUser = users?.find(u => u.id === parseInt(selectedUserId));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-transparent">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-5 px-1">Your Time & Shift Reports</h2>
        
        {(!activeUserTimeCards || activeUserTimeCards.length === 0) ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
            <p className="text-gray-500 font-bold text-sm">No recent time cards found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeUserTimeCards.sort((a,b) => new Date(b.clockIn) - new Date(a.clockIn)).map(card => (
              <TimeCardRow 
                key={card.id} 
                card={card} 
                activeUser={activeUser} 
                locations={locations} 
                templates={templates} 
                isManager={isManager} 
                handleEditClick={handleEditClick} 
                handleDeleteClick={handleDeleteClick} 
                formatDateSafe={formatDateSafe} 
                formatTimeSafe={formatTimeSafe} 
                checklists={checklists} // Passed down for persistence!
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}