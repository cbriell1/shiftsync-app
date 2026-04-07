// filepath: app/components/SetupTab.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Location, GlobalTask, ShiftTemplate } from '../lib/types';
import { notify } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { DAYS_OF_WEEK } from '@/lib/common';

export default function SetupTab({ appState }: any) {
  const locations = useAppStore(state => state.locations);
  const users = useAppStore(state => state.users);
  const globalTasks = useAppStore(state => state.globalTasks);
  const templates = useAppStore(state => state.templates);
  
  const fetchGlobalTasks = useAppStore(state => state.fetchGlobalTasks);
  const fetchTemplates = useAppStore(state => state.fetchTemplates);
  const fetchShifts = useAppStore(state => state.fetchShifts); // NEW: To refresh calendar after generation

  const [activeTab, setActiveTab] = useState('templates');
  const[showLocFilter, setShowLocFilter] = useState(false);
  const [showDayFilter, setShowDayFilter] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({ key: 'location', direction: 'asc' });

  // Template Form State
  const[editingTplId, setEditingTplId] = useState<number | null>(null);
  const[tplLocs, setTplLocs] = useState<number[]>([]);
  const[tplDays, setTplDays] = useState<number[]>([]);
  const [tplStart, setTplStart] = useState('');
  const [tplEnd, setTplEnd] = useState('');
  const [tplStartDate, setTplStartDate] = useState('');
  const [tplEndDate, setTplEndDate] = useState('');
  const [tplTasks, setTplTasks] = useState<string[]>([]);
  const [tplUserId, setTplUserId] = useState('');
  
  // View Filters
  const [tplViewLocs, setTplViewLocs] = useState<number[]>([]);
  const [tplViewDays, setTplViewDays] = useState<number[]>([]);
  
  // Master Task State
  const [newTaskStr, setNewTaskStr] = useState('');
  const[editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskStr, setEditTaskStr] = useState('');

  // NEW: Generation State (Defaults to Today -> 4 Weeks out)
  const[genLocId, setGenLocId] = useState('');
  const [genStartDate, setGenStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [genEndDate, setGenEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split('T')[0];
  });
  const[isGenerating, setIsGenerating] = useState(false);

  const locFilterRef = useRef<HTMLTableHeaderCellElement>(null);
  const dayFilterRef = useRef<HTMLTableHeaderCellElement>(null);

  const resetForm = () => {
    setEditingTplId(null); setTplLocs([]); setTplDays([]); setTplStart(''); setTplEnd('');
    setTplStartDate(''); setTplEndDate(''); setTplTasks([]); setTplUserId('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locFilterRef.current && !locFilterRef.current.contains(event.target as Node)) setShowLocFilter(false);
      if (dayFilterRef.current && !dayFilterRef.current.contains(event.target as Node)) setShowDayFilter(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  },[]);

  const toggleTplLoc = (id: number) => { if (editingTplId) { setTplLocs([id]); return; } setTplLocs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); };
  const toggleTplDay = (idx: number) => { if (editingTplId) { setTplDays([idx]); return; } setTplDays(prev => prev.includes(idx) ? prev.filter(x => x !== idx) :[...prev, idx]); };
  const toggleTplTask = (taskName: string) => { if (tplTasks.includes(taskName)) setTplTasks(tplTasks.filter(t => t !== taskName)); else setTplTasks([...tplTasks, taskName]); };
  const toggleTplViewLoc = (id: number) => tplViewLocs.includes(id) ? setTplViewLocs(tplViewLocs.filter(x => x !== id)) : setTplViewLocs([...tplViewLocs, id]);
  const toggleTplViewDay = (idx: number) => tplViewDays.includes(idx) ? setTplViewDays(tplViewDays.filter(x => x !== idx)) : setTplViewDays([...tplViewDays, idx]);

  const handleSelectAllTasks = () => {
    if (globalTasks.length > 0 && tplTasks.length === globalTasks.length) setTplTasks([]);
    else setTplTasks(globalTasks.map((t: GlobalTask) => t.name));
  };

  const formatDateForTable = (isoString?: string | null) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleAddMasterTask = async () => {
    if (!newTaskStr.trim()) return;
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTaskStr.trim() }) });
    if (res.ok) { setNewTaskStr(''); await fetchGlobalTasks(); } 
    else { const data = await res.json(); notify.error(data.error || "Failed to add task."); }
  };

  const handleEditMasterTask = async (id: number, newName: string) => {
    const res = await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: newName }) });
    if (res.ok) { setEditingTaskId(null); await fetchGlobalTasks(); await fetchTemplates(); } 
    else { const data = await res.json(); notify.error(data.error || "Failed to edit task."); }
  };

  const handleDeleteMasterTask = async (id: number) => {
    if(!confirm("Delete task?")) return;
    const res = await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) await fetchGlobalTasks();
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { id: editingTplId, locationIds: tplLocs, daysOfWeek: tplDays, startTime: tplStart.trim(), endTime: tplEnd.trim(), startDate: tplStartDate || null, endDate: tplEndDate || null, checklistTasks: tplTasks, userId: tplUserId || null };
    const res = await fetch('/api/templates', { method: editingTplId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    
    if (!res.ok) { const err = await res.json(); notify.error("Failed to save: " + (err.error || "Error")); return; }
    notify.success(editingTplId ? "Template updated!" : "Templates created!");
    resetForm(); 
    await fetchTemplates();
  };

  const handleDeleteTemplate = async (id: number) => {
    if(!confirm("Delete?")) return;
    await fetch('/api/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await fetchTemplates();
  };

  const cleanTimeStr = (t: string) => {
    if (!t) return '';
    const match = t.match(/\d{2}:\d{2}/);
    return match ? match[0] : '';
  };

  const handleEditTemplate = (t: ShiftTemplate) => {
    setEditingTplId(t.id); 
    setTplLocs([t.locationId]); 
    setTplDays([t.dayOfWeek]); 
    setTplStart(cleanTimeStr(t.startTime)); 
    setTplEnd(cleanTimeStr(t.endTime)); 
    setTplStartDate(t.startDate ? t.startDate.split('T')[0] : ''); 
    setTplEndDate(t.endDate ? t.endDate.split('T')[0] : ''); 
    setTplTasks(t.checklistTasks ||[]); 
    setTplUserId(t.userId?.toString() || ''); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // NEW: Generate Schedule Handler
  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    try {
      // Fallback defaults if blank
      let start = genStartDate;
      let end = genEndDate;
      
      if (!start) start = new Date().toISOString().split('T')[0];
      if (!end) {
        const d = new Date(start);
        d.setDate(d.getDate() + 30);
        end = d.toISOString().split('T')[0];
      }

      const res = await fetch('/api/shifts/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: genLocId ? parseInt(genLocId) : null,
          startDate: start,
          endDate: end
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify.success(`Success! Generated ${data.count} shifts.`);
        await fetchShifts();
      } else {
        notify.error(data.error || 'Failed to generate');
      }
    } catch (e) {
      notify.error('Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayedTemplates = (templates ||[]).filter(tpl => {
    const matchLoc = tplViewLocs.length === 0 || tplViewLocs.includes(tpl.locationId);
    const matchDay = tplViewDays.length === 0 || tplViewDays.includes(tpl.dayOfWeek);
    return matchLoc && matchDay;
  });

  const sortedTemplates =[...displayedTemplates].sort((a, b) => {
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    const locA = a.location?.name || '';
    const locB = b.location?.name || '';
    const dayA = a.dayOfWeek ?? -1;
    const dayB = b.dayOfWeek ?? -1;
    const timeA = a.startTime || '';
    const timeB = b.startTime || '';

    if (sortConfig.key === 'location' && locA !== locB) return locA.localeCompare(locB) * dir;
    if (sortConfig.key === 'dayOfWeek' && dayA !== dayB) return (dayA - dayB) * dir;
    if (sortConfig.key === 'startTime' && timeA !== timeB) return timeA.localeCompare(timeB) * dir;
    return 0;
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-md">
      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => setActiveTab('templates')} className={`py-2 px-6 font-black text-sm outline-none transition-colors border-b-2 ${activeTab === 'templates' ? 'border-blue-600 text-blue-800' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-400'}`}>Shift Templates</button>
        <button onClick={() => setActiveTab('tasks')} className={`py-2 px-6 font-black text-sm outline-none transition-colors border-b-2 ${activeTab === 'tasks' ? 'border-blue-600 text-blue-800' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-400'}`}>Facility Master Tasks</button>
      </div>

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-300 shadow-inner">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">{editingTplId ? 'Edit Template' : 'New Template'}</h3>
               <button type="button" onClick={resetForm} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Clear Form</button>
            </div>
            
            <form onSubmit={handleSaveTemplate} className="space-y-5" autoCapitalize="off" autoComplete="off">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">1. Pre-Assign Employee</label>
                <select value={tplUserId} onChange={(e) => setTplUserId(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm bg-white text-slate-900 font-bold focus:border-blue-600 focus:outline-none">
                  <option value="" className="text-slate-600 font-bold">-- Unassigned --</option>
                  {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">2. Locations</label>
                <div className="max-h-32 overflow-y-auto bg-white p-2 border-2 border-slate-300 rounded-lg shadow-sm space-y-1">
                  {locations?.map((loc: Location) => (
                    <label key={loc.id} className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-slate-50 p-1.5 rounded">
                      <input type="checkbox" checked={tplLocs.includes(loc.id)} onChange={() => toggleTplLoc(loc.id)} className="w-4 h-4 text-blue-600 rounded border-slate-400" />
                      <span className="text-slate-900 font-bold">{loc.name} {loc.isActive === false && <span className="text-[10px] text-orange-600 ml-1">[HIDDEN]</span>}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">3. Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK?.map((day, idx) => (
                    <label key={day} className="flex items-center space-x-1 cursor-pointer text-sm bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-50">
                      <input type="checkbox" checked={tplDays.includes(idx)} onChange={() => toggleTplDay(idx)} className="w-4 h-4 text-blue-600 rounded border-slate-400" />
                      <span className="text-slate-900 font-bold">{day.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">4. Start Time</label>
                  <input type="time" value={tplStart} onChange={(e) => setTplStart(e.target.value)} required className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none" />
                </div>
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">End Time</label>
                  <input type="time" value={tplEnd} onChange={(e) => setTplEnd(e.target.value)} required className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">5. Start Date <span className="block font-bold text-[11px] text-slate-600 mt-0.5">(Leave blank)</span></label>
                  <div className="relative flex items-center">
                    <input type="date" name="tpl_start_date_ignore" autoComplete="off" value={tplStartDate} onChange={(e) => setTplStartDate(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none" />
                    {tplStartDate && (
                      <button type="button" onClick={() => setTplStartDate('')} className="absolute right-6 text-slate-400 hover:text-red-500 font-black text-lg p-1 bg-white" title="Clear Date">&times;</button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">End Date <span className="block font-bold text-[11px] text-slate-600 mt-0.5">(Leave blank)</span></label>
                  <div className="relative flex items-center">
                    <input type="date" name="tpl_end_date_ignore" autoComplete="off" value={tplEndDate} onChange={(e) => setTplEndDate(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none" />
                    {tplEndDate && (
                      <button type="button" onClick={() => setTplEndDate('')} className="absolute right-6 text-slate-400 hover:text-red-500 font-black text-lg p-1 bg-white" title="Clear Date">&times;</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-slate-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-black text-slate-900">6. Checklist Tasks</label>
                  <button type="button" onClick={handleSelectAllTasks} className="text-xs font-black text-blue-700 hover:text-blue-900 hover:underline">
                    {globalTasks?.length > 0 && tplTasks?.length === globalTasks?.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto bg-white p-2 rounded-lg border-2 border-slate-300 shadow-sm space-y-1">
                  {globalTasks?.map((task: GlobalTask) => (
                    <label key={task.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded">
                      <input type="checkbox" checked={tplTasks.includes(task.name)} onChange={() => toggleTplTask(task.name)} className="w-4 h-4 text-blue-600 rounded border-slate-400" />
                      <span className="text-xs font-bold text-slate-900">{task.name}</span>
                    </label>
                  ))}
                  {globalTasks?.length === 0 && <div className="text-xs text-slate-600 italic font-bold p-2">No tasks available. Add them in the Master Tasks tab.</div>}
                </div>
              </div>
              <button type="submit" className="w-full bg-green-800 text-white font-black py-3.5 rounded-lg hover:bg-green-900 transition shadow-lg mt-2">{editingTplId ? 'Update Template' : 'Save Templates'}</button>
              {editingTplId && <button type="button" onClick={resetForm} className="w-full bg-slate-700 text-white font-black py-2.5 rounded-lg hover:bg-slate-800 transition shadow mt-2">Cancel Edit</button>}
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            {/* NEW: GENERATE SCHEDULE COMPONENT */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-900 shadow-md">
              <h3 className="font-black text-white mb-4 text-lg border-b border-slate-600 pb-2">Generate Schedule from Templates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Facility</label>
                  <select value={genLocId} onChange={(e) => setGenLocId(e.target.value)} className="w-full border-2 border-slate-600 bg-slate-900 text-white rounded-lg p-2.5 text-sm font-bold focus:border-yellow-400 outline-none cursor-pointer">
                    <option value="">All Locations</option>
                    {locations?.map((loc: Location) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Start Date</label>
                  <input type="date" value={genStartDate} onChange={(e) => setGenStartDate(e.target.value)} className="w-full border-2 border-slate-600 bg-slate-900 text-white rounded-lg p-2.5 text-sm font-bold focus:border-yellow-400 outline-none" />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">End Date</label>
                  <input type="date" value={genEndDate} onChange={(e) => setGenEndDate(e.target.value)} className="w-full border-2 border-slate-600 bg-slate-900 text-white rounded-lg p-2.5 text-sm font-bold focus:border-yellow-400 outline-none" />
                </div>
                <div className="sm:col-span-1">
                  <button 
                    onClick={handleGenerateSchedule} 
                    disabled={isGenerating}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 h-[44px]"
                  >
                    {isGenerating ? '...' : 'Generate Shifts'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm overflow-hidden h-full flex flex-col">
              <h3 className="font-black text-slate-900 mb-4 text-xl border-b-2 border-slate-100 pb-2">Saved Templates</h3>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[300px] max-h-[800px] pb-32">
                <table className="w-full text-left text-sm text-slate-800 relative">
                  <thead className="bg-slate-200 text-slate-900 text-xs uppercase font-black sticky top-0 z-40 shadow-sm">
                    <tr>
                      <th className="p-3 relative select-none" ref={locFilterRef}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 cursor-pointer hover:text-blue-800 transition-colors" onClick={() => handleSort('location')}>
                            LOCATION {sortConfig.key === 'location' && <span className="text-blue-700 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                          <div className={`flex items-center justify-center cursor-pointer px-1.5 py-0.5 rounded transition-colors ${tplViewLocs?.length > 0 ? 'bg-blue-300 text-blue-900' : 'hover:bg-slate-300 text-slate-600 hover:text-blue-800'}`} onClick={() => setShowLocFilter(!showLocFilter)}>
                            {tplViewLocs?.length > 0 ? <span className="text-[10px] font-black">{tplViewLocs.length}</span> : <span className="text-[10px]">⧨</span>}
                          </div>
                        </div>
                        {showLocFilter && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white border-2 border-slate-300 rounded-lg shadow-2xl p-2 font-normal normal-case text-sm text-slate-900 flex flex-col z-[100]">
                            <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                              {locations?.map((loc: Location) => (
                                <label key={loc.id} className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                                  <input type="checkbox" checked={tplViewLocs.includes(loc.id)} onChange={() => toggleTplViewLoc(loc.id)} className="w-4 h-4 text-blue-600 rounded border-slate-400" />
                                  <span className="truncate font-bold">{loc.name} {loc.isActive === false && '(Hidden)'}</span>
                                </label>
                              ))}
                            </div>
                            {tplViewLocs.length > 0 && <button onClick={(e) => { e.stopPropagation(); setTplViewLocs([]); setShowLocFilter(false); }} className="text-xs font-black text-red-700 border-t border-slate-200 pt-2 pb-1 hover:text-red-900 transition-colors">Clear Selection</button>}
                          </div>
                        )}
                      </th>
                      <th className="p-3 relative select-none" ref={dayFilterRef}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 cursor-pointer hover:text-blue-800 transition-colors" onClick={() => handleSort('dayOfWeek')}>
                            DAYS {sortConfig.key === 'dayOfWeek' && <span className="text-blue-700 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                          <div className={`flex items-center justify-center cursor-pointer px-1.5 py-0.5 rounded transition-colors ${tplViewDays?.length > 0 ? 'bg-blue-300 text-blue-900' : 'hover:bg-slate-300 text-slate-600 hover:text-blue-800'}`} onClick={() => setShowDayFilter(!showDayFilter)}>
                            {tplViewDays?.length > 0 ? <span className="text-[10px] font-black">{tplViewDays.length}</span> : <span className="text-[10px]">⧨</span>}
                          </div>
                        </div>
                        {showDayFilter && (
                          <div className="absolute top-full left-0 mt-1 w-32 bg-white border-2 border-slate-300 rounded-lg shadow-2xl p-2 font-normal normal-case text-sm text-slate-900 flex flex-col z-[100]">
                            <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                              {DAYS_OF_WEEK?.map((day, idx) => (
                                <label key={day} className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                                  <input type="checkbox" checked={tplViewDays.includes(idx)} onChange={() => toggleTplViewDay(idx)} className="w-4 h-4 text-blue-600 rounded border-slate-400" />
                                  <span className="font-bold">{day.substring(0, 3)}</span>
                                </label>
                              ))}
                            </div>
                            {tplViewDays.length > 0 && <button onClick={(e) => { e.stopPropagation(); setTplViewDays([]); setShowDayFilter(false); }} className="text-xs font-black text-red-700 border-t border-slate-200 pt-2 pb-1 hover:text-red-900 transition-colors">Clear</button>}
                          </div>
                        )}
                      </th>
                      <th className="p-3 select-none">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-blue-800 transition-colors w-max" onClick={() => handleSort('startTime')}>
                          TIME {sortConfig.key === 'startTime' && <span className="text-blue-700 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                        </div>
                      </th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Tasks</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTemplates?.length === 0 ? (
                      <tr><td colSpan={6} className="p-10 text-center text-slate-600 font-bold italic bg-slate-50/80">{tplViewLocs.length > 0 || tplViewDays.length > 0 ? "No templates match your active filters." : "No templates found. Create one using the form on the left."}</td></tr>
                    ) : (
                      sortedTemplates?.map((tpl) => (
                        <tr key={tpl.id} className="border-b border-slate-200 hover:bg-slate-100 transition-colors">
                          <td className={`p-3 font-bold max-w-[120px] truncate ${tpl.location?.isActive === false ? 'text-orange-700' : ''}`} title={tpl.location?.name}>
                            {tpl.location?.name || 'Unknown'} {tpl.location?.isActive === false && <span className="text-[9px] uppercase tracking-widest ml-1 block">Hidden</span>}
                          </td>
                          <td className="p-3 font-bold">{DAYS_OF_WEEK[tpl.dayOfWeek]?.substring(0, 3) || 'N/A'}</td>
                          <td className="p-3 whitespace-nowrap"><span className="font-black text-slate-900">{tpl.startTime} - {tpl.endTime}</span></td>
                          <td className="p-3 font-bold whitespace-nowrap">{!(tpl.startDate || tpl.endDate) ? <span className="text-green-800">Always</span> : <span className="text-slate-800">{formatDateForTable(tpl.startDate) || 'Always'} to {formatDateForTable(tpl.endDate) || 'Always'}</span>}</td>
                          <td className="p-3 font-bold text-slate-700 max-w-[100px] truncate">{tpl.checklistTasks?.length || 0} tasks</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button type="button" onClick={() => handleEditTemplate(tpl)} className="text-blue-700 hover:text-blue-900 hover:underline mr-4 font-black transition-colors">Edit</button>
                            <button type="button" onClick={() => handleDeleteTemplate(tpl.id)} className="text-red-700 hover:text-red-900 hover:underline font-black transition-colors">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Code Below (Unchanged) */}
      {activeTab === 'tasks' && (
        <div className="max-w-4xl mx-auto mt-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col h-full">
            <div className="p-5 md:p-6 border-b border-slate-200 bg-slate-50">
              <h3 className="font-black text-slate-900 text-xl tracking-tight mb-1">Facility Master Tasks</h3>
              <p className="text-sm text-slate-600 font-bold mb-5">Create and manage global tasks available for shift templates.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  value={newTaskStr} onChange={(e) => setNewTaskStr(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMasterTask(); } }}
                  className="flex-grow bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm transition-all" 
                  placeholder="Type a new task description and press Enter..." 
                />
                <button type="button" onClick={handleAddMasterTask} disabled={!newTaskStr.trim()} className="bg-slate-900 text-white font-black px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 hover:bg-black transition-colors shadow-sm whitespace-nowrap">+ Add Task</button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto bg-white">
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest font-black sticky top-0 z-10 shadow-sm border-b border-slate-200">
                  <tr><th className="px-4 py-2 w-full">Task Description</th><th className="px-4 py-2 text-center whitespace-nowrap">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {globalTasks?.map((task: GlobalTask) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-1">
                        {editingTaskId === task.id ? (
                          <input value={editTaskStr} onChange={(e) => setEditTaskStr(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditMasterTask(task.id, editTaskStr.trim()); } }} autoFocus className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-100 shadow-inner" />
                        ) : ( <span className="font-bold text-slate-800 text-xs block py-0.5">{task.name}</span> )}
                      </td>
                      <td className="px-4 py-1 text-center whitespace-nowrap">
                        {editingTaskId === task.id ? (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => handleEditMasterTask(task.id, editTaskStr.trim())} className="text-green-600 hover:text-green-800 font-black text-[10px] uppercase tracking-wider transition-colors">Save</button>
                            <button type="button" onClick={() => setEditingTaskId(null)} className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-wider transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => { setEditingTaskId(task.id); setEditTaskStr(task.name); }} className="text-blue-600 hover:text-blue-800 hover:underline font-black text-[10px] uppercase tracking-wider transition-colors">Edit</button>
                            <button type="button" onClick={() => handleDeleteMasterTask(task.id)} className="text-red-600 hover:text-red-800 hover:underline font-black text-[10px] uppercase tracking-wider transition-colors">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {globalTasks?.length === 0 && <tr><td colSpan={2} className="p-10 text-center text-slate-500 font-bold italic bg-slate-50">No master tasks created yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}