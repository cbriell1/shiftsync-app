// filepath: app/components/ScheduleBuilderTab.tsx
"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Shift, User, Event, ShiftTemplate, Location as LocType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { DAYS_OF_WEEK, getLocationColor, MONTHS, YEARS, formatTimeSafe } from '@/lib/common';
import { notify, customConfirm } from '@/lib/ui-utils';
import { cloneShiftsAction } from '@/lib/actions';
import { Calendar, ShieldAlert, XCircle, UserPlus, Save, Search, UserCheck, MapPin, Zap, Layout, Activity, Clock, X, ChevronLeft, ChevronRight, Plus, CheckCircle2, ChevronDown, ListChecks, Edit3, Trash2 } from 'lucide-react';

// ==================================================================
// HELPERS
// ==================================================================
const formatTime12h = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatTimeString12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hourStr, minute] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; 
  return `${hour}:${minute} ${ampm}`;
};

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

const getDurationHours = (start: string, end: string) => {
    return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
};

// ==================================================================
// SLIDE-OUT BUILDER COMPONENT
// ==================================================================
function SlideOutBuilder({ onClose, defaultDate, defaultStart }: any) {
  const { shifts, templates, users, locations, globalTasks, builderMode, editingShiftId, createShift, updateShift, deleteShift, saveTemplates, deleteTemplate } = useAppStore();
  const isBlueprint = builderMode === 'blueprint';
  const editingItem = isBlueprint ? templates.find(t => t.id === editingShiftId) : shifts.find(s => s.id === editingShiftId);
  
  const [form, setForm] = useState({
    locationId: editingItem?.locationId || locations[0]?.id || 0,
    userId: editingItem?.userId || '',
    date: (!isBlueprint && editingItem?.startTime) ? new Date(editingItem.startTime).toISOString().split('T')[0] : (defaultDate || new Date().toISOString().split('T')[0]),
    startTime: editingItem?.startTime ? (isBlueprint ? editingItem.startTime : new Date(editingItem.startTime).toTimeString().slice(0,5)) : (defaultStart || '08:00'),
    endTime: editingItem?.endTime ? (isBlueprint ? editingItem.endTime : new Date(editingItem.endTime).toTimeString().slice(0,5)) : '16:00',
    checklistTasks: (editingItem as any)?.checklistTasks || [] as string[]
  });

  const [showChecklist, setShowChecklist] = useState(false);

  const handleSave = async () => {
    if (isBlueprint && editingShiftId) {
        await saveTemplates({
            id: editingShiftId,
            locationIds: [form.locationId],
            daysOfWeek: [new Date(`${form.date}T12:00:00`).getDay()],
            startTime: form.startTime,
            endTime: form.endTime,
            userId: form.userId ? Number(form.userId) : null,
            checklistTasks: form.checklistTasks
        });
    } else if (!isBlueprint && editingShiftId) {
        const start = new Date(`${form.date}T${form.startTime}:00`);
        const end = new Date(`${form.date}T${form.endTime}:00`);
        if (end <= start) end.setDate(end.getDate() + 1);
        await updateShift(editingShiftId, start.toISOString(), end.toISOString(), form.userId ? Number(form.userId) : null, 'UPDATE');
    } else {
        const start = new Date(`${form.date}T${form.startTime}:00`);
        const end = new Date(`${form.date}T${form.endTime}:00`);
        if (end <= start) end.setDate(end.getDate() + 1);
        await createShift(form.locationId, form.userId ? Number(form.userId) : null, start.toISOString(), end.toISOString());
    }
    onClose();
  };

  const toggleTask = (name: string) => {
    setForm(prev => ({
        ...prev,
        checklistTasks: prev.checklistTasks.includes(name) ? prev.checklistTasks.filter(t => t !== name) : [...prev.checklistTasks, name]
    }));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.2)] border-l-4 border-slate-900 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
            <div className="bg-brand-yellow p-2 rounded-xl text-slate-900 shadow-lg"><Activity size={20}/></div>
            <h2 className="text-lg font-black uppercase tracking-tighter sports-slant italic">{editingShiftId ? (isBlueprint ? 'Edit Pattern' : 'Edit Shift') : 'Build New Shift'}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Facility Location</label>
            <div className="grid grid-cols-2 gap-2">
                {locations.map(l => (
                    <button key={l.id} onClick={() => setForm({...form, locationId: l.id})} className={`p-4 rounded-2xl border-2 font-black text-xs uppercase transition-all text-center ${form.locationId === l.id ? 'bg-slate-900 border-slate-900 text-brand-yellow shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                        {l.name.replace(/pnp\s+/i, '')}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign Staff Member</label>
            <select value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} className="w-full bg-slate-50 border-4 border-slate-100 rounded-[20px] p-4 font-black text-sm uppercase outline-none focus:border-slate-900 transition-all cursor-pointer">
                <option value="">-- Open Slot --</option>
                {users.filter(u => u.isActive !== false).sort((a,b) => a.name.localeCompare(b.name)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
            </select>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{isBlueprint ? 'Time Block' : 'Date & Time Block'}</label>
            <div className="bg-slate-50 border-4 border-slate-100 rounded-[24px] p-6 space-y-4 shadow-inner">
                {!isBlueprint && <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 font-black text-sm outline-none focus:border-slate-900" />}
                <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Starts</span>
                        <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 font-black text-sm outline-none focus:border-slate-900" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Ends</span>
                        <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 font-black text-sm outline-none focus:border-slate-900" />
                    </div>
                </div>
            </div>
        </div>

        {isBlueprint && (
            <div className="space-y-4">
                <button onClick={() => setShowChecklist(!showChecklist)} className="flex items-center justify-between w-full p-4 bg-slate-900 text-white rounded-2xl shadow-md font-black text-[10px] uppercase tracking-widest">
                    <span className="flex items-center gap-2"><ListChecks size={16} className="text-brand-yellow"/> Facility Checklist ({form.checklistTasks.length})</span>
                    <ChevronDown size={16} className={showChecklist ? 'rotate-180 transition-transform' : ''}/>
                </button>
                {showChecklist && (
                    <div className="bg-slate-50 border-4 border-slate-100 rounded-[24px] p-4 max-h-60 overflow-y-auto custom-scrollbar space-y-2 animate-in fade-in zoom-in-95 duration-200">
                        {globalTasks.map(t => (
                            <button key={t.id} onClick={() => toggleTask(t.name)} className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${form.checklistTasks.includes(t.name) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                <span className="text-[10px] font-bold uppercase truncate">{t.name}</span>
                                {form.checklistTasks.includes(t.name) && <CheckCircle2 size={12}/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}

        {editingShiftId && (
            <button onClick={async () => { if(await customConfirm(`Delete this ${isBlueprint ? 'pattern' : 'shift'}?`)) { if(isBlueprint) deleteTemplate(editingShiftId); else deleteShift(editingShiftId); onClose(); } }} className="w-full py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] text-red-500 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                <Trash2 size={16}/> Delete {isBlueprint ? 'Master Pattern' : 'Shift Record'}
            </button>
        )}
      </div>

      <div className="p-8 bg-slate-50 border-t-2 border-slate-100">
        <button onClick={handleSave} className="w-full bg-slate-900 text-brand-yellow font-black py-5 rounded-[24px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3">
            <CheckCircle2 size={20}/> {editingShiftId ? 'Update' : 'Launch'} {isBlueprint ? 'Pattern' : 'Shift'}
        </button>
      </div>
    </div>
  );
}

// ==================================================================
// MAIN UNIFIED SCHEDULER
// ==================================================================
export default function ScheduleBuilderTab() {
  const { shifts, templates, users, locations, globalTasks, builderMode, setBuilderMode, builderWeekStart, setBuilderWeekStart, calLocFilter, setCalLocFilter, calEmpFilter, setCalEmpFilter, sidebarBuilderOpen, setSidebarBuilderOpen, editingShiftId, setEditingShiftId, generateSchedule, saveTemplates, deleteTemplate, deleteShift, updateShift, selectedUserId } = useAppStore();

  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isManager = activeUser?.systemRoles?.includes('Manager') || activeUser?.systemRoles?.includes('Administrator');

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [genStart, setGenStart] = useState('');
  const [genEnd, setGenEnd] = useState('');
  const [preFill, setPreFill] = useState({ date: '', start: '' });

  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  // Blueprint Creation State
  const [showChecklist, setShowChecklist] = useState(true);
  const [creatorForm, setCreatorForm] = useState({
    locationIds: [] as string[],
    daysOfWeek: [] as string[],
    startTime: '08:00',
    endTime: '16:00',
    userId: '',
    checklistTasks: [] as string[]
  });

  const dateColumns = useMemo(() => {
    if (!builderWeekStart) return [];
    const [y, m, d] = builderWeekStart.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    
    if (viewMode === 'day') return [targetDate];
    if (viewMode === 'week' || builderMode === 'blueprint') {
        // Special case: if we are in blueprint mode but NOT in day view, default to week
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        return Array.from({ length: 7 }, (_, i) => { const day = new Date(startOfWeek); day.setDate(day.getDate() + i); return day; });
    }
    // Month View
    const firstOfMonth = new Date(y, m - 1, 1);
    const startOfGrid = new Date(firstOfMonth);
    startOfGrid.setDate(startOfGrid.getDate() - startOfGrid.getDay()); 
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(startOfGrid); d.setDate(d.getDate() + i); cells.push(d);
    }
    return cells;
  }, [builderWeekStart, viewMode, builderMode]);

  const changeDate = (direction: number) => {
    const [year, month, day] = builderWeekStart.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setDate(newDate.getDate() + direction);
    setBuilderWeekStart(newDate.toISOString().split('T')[0]);
  };

  const jumpToToday = () => setBuilderWeekStart(new Date().toISOString().split('T')[0]);

  const activeView = viewMode;

  const [y_base, m_base, d_base] = builderWeekStart ? builderWeekStart.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate()];
  const currentBaseDate = new Date(y_base, m_base - 1, d_base);

  let dateLabel = 'LOADING...';
  if (dateColumns.length > 0) {
      if (builderMode === 'blueprint') dateLabel = "Master Blueprint Grid";
      else if (activeView === 'month' && dateColumns.length >= 42) dateLabel = dateColumns[15].toLocaleDateString([], { month: 'long', year: 'numeric' });
      else if (activeView === 'day') dateLabel = dateColumns[0].toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      else dateLabel = `${dateColumns[0].toLocaleDateString([], {month:'short', day:'numeric'})} - ${dateColumns[6].toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}`;
  }

  const handleMonthDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value);
    const newDate = new Date(currentBaseDate); newDate.setMonth(m);
    setBuilderWeekStart(newDate.toISOString().split('T')[0]);
  };

  const handleYearDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value);
    const newDate = new Date(currentBaseDate); newDate.setFullYear(y);
    setBuilderWeekStart(newDate.toISOString().split('T')[0]);
  };

  const toggleLocFilter = (id: number) => {
    if (calLocFilter.includes(id)) setCalLocFilter(calLocFilter.filter(x => x !== id));
    else setCalLocFilter([...calLocFilter, id]);
  };

  const toggleEmpFilter = (id: number) => {
    if (calEmpFilter.includes(id)) setCalEmpFilter(calEmpFilter.filter(x => x !== id));
    else setCalEmpFilter([...calEmpFilter, id]);
  };

  const handleOpenBuilder = (id: number | null = null, date: string = '', start: string = '') => {
    setEditingShiftId(id);
    setPreFill({ date, start });
    setSidebarBuilderOpen(true);
  };

  const handleCreateBlueprint = async () => {
    if (creatorForm.locationIds.length === 0 || creatorForm.daysOfWeek.length === 0) return notify.error("Select Facilities & Days!");
    await saveTemplates({
        ...creatorForm,
        locationIds: creatorForm.locationIds.map(Number),
        daysOfWeek: creatorForm.daysOfWeek.map(Number),
        userId: creatorForm.userId ? Number(creatorForm.userId) : null
    });
    setCreatorForm({ locationIds:[], daysOfWeek:[], startTime: '08:00', endTime: '16:00', userId: '', checklistTasks: [] });
    notify.success("Blueprint Created!");
  };

  const toggleCreatorLoc = (id: string) => setCreatorForm({...creatorForm, locationIds: creatorForm.locationIds.includes(id) ? creatorForm.locationIds.filter(x => x !== id) : [...creatorForm.locationIds, id]});
  const toggleCreatorDay = (id: string) => setCreatorForm({...creatorForm, daysOfWeek: creatorForm.daysOfWeek.includes(id) ? creatorForm.daysOfWeek.filter(x => x !== id) : [...creatorForm.daysOfWeek, id]});
  const toggleCreatorTask = (name: string) => setCreatorForm({...creatorForm, checklistTasks: creatorForm.checklistTasks.includes(name) ? creatorForm.checklistTasks.filter(x => x !== name) : [...creatorForm.checklistTasks, name]});

  const hourHeight = 36; // Ultra-compact row height
  const totalGridHeight = HOURS.length * hourHeight;

  const getLanes = (items: any[]) => {
      const isLive = builderMode === 'live';
      const sorted = [...items].sort((a,b) => {
          const aStart = isLive ? new Date(a.startTime).getHours() * 60 + new Date(a.startTime).getMinutes() : parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
          const bStart = isLive ? new Date(b.startTime).getHours() * 60 + new Date(b.startTime).getMinutes() : parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
          return aStart - bStart;
      });
      const lanes: any[][] = [];
      sorted.forEach(item => {
          let placed = false;
          const iStart = isLive ? new Date(item.startTime).getHours() * 60 + new Date(item.startTime).getMinutes() : parseInt(item.startTime.split(':')[0]) * 60 + parseInt(item.startTime.split(':')[1]);
          for (let l = 0; l < lanes.length; l++) {
              const lastInLane = lanes[l][lanes[l].length - 1];
              const lEnd = isLive ? new Date(lastInLane.endTime).getHours() * 60 + new Date(lastInLane.endTime).getMinutes() : parseInt(lastInLane.endTime.split(':')[0]) * 60 + parseInt(lastInLane.endTime.split(':')[1]);
              if (iStart >= lEnd) { lanes[l].push(item); placed = true; break; }
          }
          if (!placed) lanes.push([item]);
      });
      return lanes;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* HEADER: MATCHING CALENDAR TAB DESIGN */}
      <div className="flex flex-col xl:flex-row justify-between items-center bg-slate-100 p-3 rounded-xl border border-gray-300 gap-4 shadow-inner text-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex flex-col gap-2">
            <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300 shadow-sm w-full sm:w-auto">
                <button 
                    data-testid="live-mode-btn"
                    onClick={() => setBuilderMode('live')} 
                    className={`px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-md transition-all ${builderMode === 'live' ? 'bg-brand-green text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Live
                </button>
                <button 
                    data-testid="master-mode-btn"
                    onClick={() => setBuilderMode('blueprint')} 
                    className={`px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-md transition-all ${builderMode === 'blueprint' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Master
                </button>
            </div>
            <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300 shadow-sm w-full sm:w-auto">
                {(builderMode === 'live' ? ['month', 'week', 'day'] : ['week', 'day']).map(mode => (
                <button 
                    key={mode} 
                    data-testid={`${mode}-view-btn`}
                    onClick={() => setViewMode(mode as any)} 
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeView === mode ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {mode}
                </button>
                ))}
            </div>
          </div>

          <div className="flex items-center space-x-1 w-full sm:w-auto justify-center">
            <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 transition">&lt;</button>
            <select value={currentBaseDate.getMonth()} onChange={handleMonthDropdown} className="w-28 sm:w-32 h-10 border border-gray-400 rounded-lg px-2 font-black text-slate-900 bg-white shadow-sm outline-none cursor-pointer">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={currentBaseDate.getFullYear()} onChange={handleYearDropdown} className="w-20 sm:w-24 h-10 border border-gray-400 rounded-lg px-2 font-black text-slate-900 bg-white shadow-sm outline-none cursor-pointer">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => changeDate(1)} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 transition">&gt;</button>
            <button onClick={jumpToToday} className="ml-2 h-10 px-3 bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-[10px] text-slate-600 uppercase tracking-widest transition">Today</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto items-center">
         {isManager && builderMode === 'live' && (
             <>
               <button
                 onClick={async () => {
                   let sourceStart: Date, sourceEnd: Date, targetStart: Date, periodName: string;

                   if (activeView === 'month') {
                      // Current month target
                      targetStart = new Date(currentBaseDate.getFullYear(), currentBaseDate.getMonth(), 1);
                      // Prev month source
                      sourceStart = new Date(targetStart);
                      sourceStart.setMonth(sourceStart.getMonth() - 1);
                      sourceEnd = new Date(targetStart);
                      sourceEnd.setDate(sourceEnd.getDate() - 1);
                      periodName = "Month";
                   } else {
                      // Week target
                      const [y, m, d] = builderWeekStart.split('-').map(Number);
                      targetStart = new Date(y, m - 1, d);
                      targetStart.setDate(targetStart.getDate() - targetStart.getDay());
                      // Prev week source
                      sourceStart = new Date(targetStart);
                      sourceStart.setDate(sourceStart.getDate() - 7);
                      sourceEnd = new Date(targetStart);
                      sourceEnd.setDate(sourceEnd.getDate() - 1);
                      periodName = "Week";
                   }

                   const msg = `Clone all shifts from last ${periodName.toLowerCase()} (${sourceStart.toLocaleDateString()} - ${sourceEnd.toLocaleDateString()}) to this ${periodName.toLowerCase()}? Existing identical shifts will be skipped.`;

                   if (await customConfirm(msg, `Clone Previous ${periodName}`, true)) {
                      const res = await cloneShiftsAction({
                          sourceStart: sourceStart.toISOString(),
                          sourceEnd: sourceEnd.toISOString(),
                          targetStart: targetStart.toISOString(),
                          locationIds: calLocFilter
                      });

                      if (res.success) {
                          notify.success(`Successfully cloned ${res.count} shifts!`);
                      } else {
                          notify.error("Cloning failed: " + res.error);
                      }
                   }
                 }}
                 className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md bg-blue-600 text-white hover:bg-blue-700 transition-all"
               >
                 <Calendar size={14} /> Clone Prev {activeView === 'month' ? 'Month' : 'Week'}
               </button>
               <button onClick={() => handleOpenBuilder()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md bg-brand-green text-white hover:bg-green-700 transition-all"><Plus size={14} /> Add Shift</button>
             </>
         )}
          <div className="relative w-full sm:w-auto">
            <button onClick={() => setShowLocDropdown(!showLocDropdown)} className="w-full sm:w-auto bg-white border border-blue-400 rounded-lg p-2.5 font-bold text-slate-900 shadow-sm flex items-center justify-between gap-2">
              <span>Locs ({calLocFilter.length === 0 ? 'All' : calLocFilter.length})</span>
              <ChevronDown size={14} />
            </button>
            {showLocDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLocDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-2 max-h-60 overflow-y-auto flex flex-col gap-1">
                  <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-200 mb-1 transition-colors">
                    <input type="checkbox" checked={calLocFilter.length === 0} onChange={() => setCalLocFilter([])} className="w-4 h-4" />
                    <span className="font-black text-sm text-slate-900">All Active</span>
                  </label>
                  {locations.map(l => (
                    <label key={l.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" checked={calLocFilter.includes(l.id)} onChange={() => toggleLocFilter(l.id)} className="w-4 h-4" />
                      <span className="font-bold text-sm text-slate-700">{l.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <button onClick={() => setShowEmpDropdown(!showEmpDropdown)} className="w-full sm:w-auto bg-white border border-blue-400 rounded-lg p-2.5 font-bold text-slate-900 shadow-sm flex items-center justify-between gap-2">
              <span>Staff ({calEmpFilter.length === 0 ? 'All' : calEmpFilter.length})</span>
              <ChevronDown size={14} />
            </button>
            {showEmpDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmpDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-2 max-h-60 overflow-y-auto flex flex-col gap-1">
                  <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-200 mb-1 transition-colors">
                    <input type="checkbox" checked={calEmpFilter.length === 0} onChange={() => setCalEmpFilter([])} className="w-4 h-4" />
                    <span className="font-black text-sm text-slate-900">All Staff</span>
                  </label>
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" checked={calEmpFilter.includes(u.id)} onChange={() => toggleEmpFilter(u.id)} className="w-4 h-4" />
                      <span className="font-bold text-sm text-slate-700">{u.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BLUEPRINT BUILDER TRAY */}
      {builderMode === 'blueprint' && isManager && (
          <div className="bg-slate-900 text-white p-6 rounded-[28px] border-4 border-slate-900 shadow-2xl space-y-6 animate-in slide-in-from-top-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                  <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block ml-1">1. Choose Facilities</span>
                      <div className="flex flex-wrap gap-2">
                        {locations.map(loc => {
                            const initMap: any = { 'PnP Wake Forest': 'WF', 'PnP Garner': 'GN', 'Pnp Chapel Hill': 'CH', 'PnP Brier Creek': 'BC' };
                            const init = initMap[loc.name] || loc.name.substring(0,2).toUpperCase();
                            return (
                                <button key={loc.id} onClick={() => toggleCreatorLoc(loc.id.toString())} title={loc.name} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${creatorForm.locationIds.includes(loc.id.toString()) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{init}</button>
                            );
                        })}
                      </div>
                  </div>
                  <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block ml-1">2. Pattern Days</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['S','M','T','W','T','F','S'].map((day, idx) => (
                            <button key={idx} onClick={() => toggleCreatorDay(idx.toString())} className={`w-9 h-9 rounded-xl text-[11px] font-black border-2 transition-all ${creatorForm.daysOfWeek.includes(idx.toString()) ? 'bg-brand-yellow border-brand-yellow text-slate-900 shadow-lg scale-105' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{day}</button>
                        ))}
                      </div>
                  </div>
                  <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block ml-1">3. Time & Staff</span>
                      <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-slate-800 border-2 border-slate-700 rounded-xl p-1.5">
                            <input type="time" value={creatorForm.startTime} onChange={e => setCreatorForm({...creatorForm, startTime: e.target.value})} className="bg-transparent p-1 font-black text-xs text-blue-400 outline-none" />
                            <span className="text-slate-600">-</span>
                            <input type="time" value={creatorForm.endTime} onChange={e => setCreatorForm({...creatorForm, endTime: e.target.value})} className="bg-transparent p-1 font-black text-xs text-blue-400 outline-none" />
                          </div>
                          <select value={creatorForm.userId} onChange={e => setCreatorForm({...creatorForm, userId: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-2.5 font-black text-[10px] uppercase text-white outline-none focus:border-blue-500">
                            <option value="">-- Vacant Slot --</option>
                            {users.filter(u => u.isActive !== false).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                      </div>
                  </div>
                  <div className="flex flex-col gap-4">
                        <button onClick={handleCreateBlueprint} className="bg-brand-yellow text-slate-900 font-black px-6 py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 border-b-4 border-slate-900"><CheckCircle2 size={16} /> Save Pattern</button>
                        <div className="bg-brand-yellow/10 border-2 border-brand-yellow/30 p-3 rounded-2xl flex items-center gap-2">
                            <div className="flex-1">
                                <span className="text-[7px] font-black text-brand-yellow uppercase tracking-widest block mb-1">Live Deploy Range</span>
                                <div className="flex items-center gap-2">
                                    <input type="date" value={genStart} onChange={e => setGenStart(e.target.value)} className="bg-transparent font-black text-[10px] text-brand-yellow outline-none w-max" />
                                    <span className="text-brand-yellow/40">-</span>
                                    <input type="date" value={genEnd} onChange={e => setGenEnd(e.target.value)} className="bg-transparent font-black text-[10px] text-brand-yellow outline-none w-max" />
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if (!genStart || !genEnd) { notify.error("Select range!"); return; }
                                    const offset = new Date().getTimezoneOffset();
                                    generateSchedule(genStart, genEnd, calLocFilter, offset);
                                }} 
                                title="Deploy to Live Grid" 
                                className="bg-brand-yellow text-slate-900 p-2 rounded-lg hover:bg-white transition-all shadow-md"
                            >
                                <Zap size={14}/>
                            </button>
                        </div>
                  </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setShowChecklist(!showChecklist)} className="flex items-center gap-3 group">
                        <ListChecks size={18} className="text-brand-yellow" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Master Facility Checklist ({creatorForm.checklistTasks.length} selected)</span>
                        <ChevronDown size={16} className={`text-slate-600 group-hover:text-white transition-all ${showChecklist ? 'rotate-180' : ''}`} />
                    </button>
                    {showChecklist && (
                        <button onClick={() => setCreatorForm(prev => ({ ...prev, checklistTasks: prev.checklistTasks.length === globalTasks.length ? [] : globalTasks.map(t => t.name) }))} className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase bg-slate-800 border border-slate-700 text-brand-yellow hover:bg-slate-700 transition-all">
                            {creatorForm.checklistTasks.length === globalTasks.length ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                  </div>
                  {showChecklist && (
                    <div className="mt-4 bg-slate-800/50 rounded-2xl p-4 border-2 border-slate-800 max-h-60 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in zoom-in-95 duration-200">
                        {globalTasks.map(task => (
                            <div key={task.id} onClick={() => toggleCreatorTask(task.name)} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${creatorForm.checklistTasks.includes(task.name) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${creatorForm.checklistTasks.includes(task.name) ? 'bg-white text-blue-600' : 'bg-slate-800 border border-slate-700'}`}>
                                    {creatorForm.checklistTasks.includes(task.name) && <CheckCircle2 size={12}/>}
                                </div>
                                <span className="text-[10px] font-bold uppercase truncate">{task.name}</span>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
          </div>
      )}

      {/* SCHEDULER GRID */}
      <div className={`flex-grow border-4 border-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col bg-white`}>
         <div className="flex-1 overflow-auto relative scroll-smooth bg-slate-50">
            
            {/* MONTH VIEW */}
            {activeView === 'month' && (
                <div className="min-w-[1000px]">
                    <div className="grid grid-cols-7 bg-slate-900 border-b-4 border-slate-900 sticky top-0 z-40 shadow-xl">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="p-4 text-center font-black text-[11px] uppercase tracking-widest italic sports-slant text-brand-yellow border-r border-slate-800">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 bg-slate-300 gap-px border-b border-slate-300">
                        {dateColumns.map((dateObj, idx) => {
                            const isLive = builderMode === 'live';
                            const dayItems = isLive 
                                ? shifts.filter(s => {
                                    const matchesLoc = calLocFilter.length === 0 || calLocFilter.includes(s.locationId);
                                    const matchesEmp = calEmpFilter.length === 0 || (s.userId && calEmpFilter.includes(s.userId)) || (!s.userId && calEmpFilter.includes(-1));
                                    return matchesLoc && matchesEmp && new Date(s.startTime).toDateString() === dateObj.toDateString();
                                  })
                                : templates.filter(t => {
                                    const matchesLoc = calLocFilter.length === 0 || calLocFilter.includes(t.locationId);
                                    const matchesEmp = calEmpFilter.length === 0 || (t.userId && calEmpFilter.includes(t.userId)) || (!t.userId && calEmpFilter.includes(-1));
                                    return matchesLoc && matchesEmp && t.dayOfWeek === dateObj.getDay();
                                  });
                            
                            const sortedItems = dayItems.sort((a,b) => {
                                const aTime = isLive ? new Date(a.startTime).getTime() : a.startTime;
                                const bTime = isLive ? new Date(b.startTime).getTime() : b.startTime;
                                return aTime > bTime ? 1 : -1;
                            });

                            const isToday = dateObj.toDateString() === new Date().toDateString();
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => handleOpenBuilder(null, dateObj.toISOString().split('T')[0], '08:00')}
                                    className={`min-h-[160px] p-2 flex flex-col transition-colors group cursor-copy hover:bg-blue-50 relative ${dateObj.getMonth() === currentBaseDate.getMonth() ? 'bg-white' : 'bg-slate-50/50 text-slate-400'} ${isToday ? 'ring-4 ring-inset ring-yellow-400 bg-yellow-50/30' : ''}`}
                                >
                                    <div className="flex justify-end items-center mb-2 border-b border-slate-100 pb-1">
                                        <span className={`text-[12px] font-black opacity-40 ${isToday ? 'text-yellow-600 opacity-100' : ''}`}>{dateObj.getDate()}</span>
                                    </div>
                                    <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
                                        {sortedItems.map((item: any) => {
                                            const shiftColor = getLocationColor(item.locationId);
                                            return (
                                            <div key={item.id} className={`relative p-2.5 rounded-xl border-l-[8px] shadow-lg transition-all hover:scale-105 group/card bg-white ${shiftColor.border.replace('500','600')}`}>
                                                {isManager && (
                                                    <button 
                                                        onClick={async (e) => { 
                                                            e.stopPropagation(); 
                                                            if (await customConfirm(`Delete this ${isLive ? 'shift' : 'pattern'}?`, "Delete Item", true)) { 
                                                                if(isLive) deleteShift(item.id); else deleteTemplate(item.id); 
                                                            } 
                                                        }} 
                                                        title="Permanently delete this item from the grid"
                                                        className="absolute -top-2 -right-2 bg-white text-red-600 p-1.5 rounded-full shadow-lg z-30 border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all scale-110"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                                <div className="font-black text-slate-900 text-[11px] mb-1">{isLive ? `${formatTimeSafe(item.startTime)} - ${formatTimeSafe(item.endTime)}` : `${formatTimeString12h(item.startTime)} - ${formatTimeString12h(item.endTime)}`}</div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 truncate ${shiftColor.text} brightness-50`}>{item.location?.name?.replace(/pnp\s+/i, '') || locations.find(l=>l.id===item.locationId)?.name?.replace(/pnp\s+/i, '')}</div>
                                                
                                                <div className="mt-1 space-y-1.5">
                                                    <select 
                                                        value={item.userId || ""} 
                                                        onChange={(e) => {
                                                            const uid = e.target.value ? parseInt(e.target.value) : null;
                                                            if(isLive) updateShift(item.id, item.startTime, item.endTime, uid);
                                                            else saveTemplates({ ...item, userId: uid });
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`w-full font-black text-center truncate px-1 py-2 rounded-xl shadow-sm border-2 outline-none cursor-pointer text-[10px] transition-all ${item.userId === null ? 'bg-green-100 text-green-900 border-green-300 hover:bg-green-200' : 'bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200'}`}
                                                    >
                                                        <option value="">{isLive ? '-- Open Shift --' : '-- Open Pattern --'}</option>
                                                        {users.filter(u=>u.isActive!==false).sort((a,b)=>a.name.localeCompare(b.name)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                    </select>

                                                    {isLive && item.status === 'COVERAGE_REQUESTED' && (
                                                        <div className="py-2 px-3 rounded-xl bg-orange-50 text-orange-700 border-2 border-orange-200 text-[9px] font-black uppercase text-center tracking-[0.1em] shadow-sm">Need Coverage</div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* WEEK & DAY VIEW (PRO PLANNER VIEW) */}
            {(activeView === 'week' || activeView === 'day') && (
                <div className="flex flex-col h-full bg-white relative">
                    <div className="flex bg-slate-900 text-white sticky top-0 z-40 border-b-4 border-slate-900">
                        <div className="w-20 border-r-2 border-slate-700 font-black text-[9px] flex items-center justify-center uppercase tracking-widest italic sports-slant text-slate-500 bg-slate-900 shrink-0">TIME</div>
                        <div className="flex flex-1">
                            {dateColumns.map((day, i) => (
                                <div key={i} className={`flex-1 p-3 text-center border-r-2 border-slate-700 ${activeView === 'day' ? 'min-w-full' : ''}`}>
                                    <div className="font-black text-[11px] uppercase sports-slant tracking-tighter text-brand-yellow">{DAYS_OF_WEEK[day.getDay()]}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{day.toLocaleDateString([], { month:'short', day:'numeric' })}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative flex min-w-full" style={{ height: `${totalGridHeight}px` }}>
                        <div className="w-20 flex flex-col bg-white border-r-2 border-slate-400 shrink-0 z-10">
                            {HOURS.map(hour => (
                                <div key={hour} style={{ height: `${hourHeight}px` }} className="flex items-center justify-center font-black text-[10px] text-slate-900 uppercase tracking-widest border-b border-slate-300 bg-white">
                                    {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-1 relative h-full">
                            {dateColumns.map((day, colIdx) => (
                                <div key={colIdx} className={`flex-1 border-r-2 border-slate-400 relative group h-full ${activeView === 'day' ? 'min-w-full' : ''}`}>
                                    {HOURS.map((_, i) => (
                                        <div key={i} style={{ height: `${hourHeight}px` }} className="border-b border-slate-300 w-full group-hover:bg-slate-50/50 transition-colors pointer-events-none" />
                                    ))}
                                    <div className="absolute inset-0">
                                        {HOURS.map(hour => (
                                            <div key={hour} style={{ height: `${hourHeight}px` }} onClick={() => { const d = new Date(day); d.setHours(hour); d.setMinutes(0); handleOpenBuilder(null, d.toISOString().split('T')[0], `${String(hour).padStart(2,'0')}:00`); }} className="w-full cursor-copy hover:bg-blue-500/5 flex items-center justify-center transition-all group/cell"><Plus size={16} className="text-blue-500 opacity-0 group-hover/cell:opacity-20" /></div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 pointer-events-none">
                                        {(() => {
                                            const isLive = builderMode === 'live';
                                            const items = isLive 
                                                ? shifts.filter(s => {
                                                    const matchesLoc = calLocFilter.length === 0 || calLocFilter.includes(s.locationId);
                                                    const matchesEmp = calEmpFilter.length === 0 || (s.userId && calEmpFilter.includes(s.userId)) || (!s.userId && calEmpFilter.includes(-1));
                                                    return matchesLoc && matchesEmp && new Date(s.startTime).toDateString() === day.toDateString();
                                                  })
                                                : (templates as ShiftTemplate[]).filter(t => {
                                                    const matchesLoc = calLocFilter.length === 0 || calLocFilter.includes(t.locationId);
                                                    const matchesEmp = calEmpFilter.length === 0 || (t.userId && calEmpFilter.includes(t.userId)) || (!t.userId && calEmpFilter.includes(-1));
                                                    return matchesLoc && matchesEmp && t.dayOfWeek === day.getDay();
                                                  });
                                            const lanes = getLanes(items);
                                            return lanes.map((lane, laneIdx) => {
                                                return lane.map(item => {
                                                    const startHour = isLive ? new Date(item.startTime).getHours() : parseInt(item.startTime.split(':')[0]);
                                                    const startMin = isLive ? new Date(item.startTime).getMinutes() : parseInt(item.startTime.split(':')[1]);
                                                    const endHour = isLive ? new Date(item.endTime).getHours() : parseInt(item.endTime.split(':')[0]);
                                                    const endMin = isLive ? new Date(item.endTime).getMinutes() : parseInt(item.endTime.split(':')[1]);
                                                    const topOffset = (startHour - 6 + (startMin / 60)) * hourHeight;
                                                    let duration = (endHour - startHour) + ((endMin - startMin) / 60);
                                                    if (duration < 0) duration += 24;
                                                    const shiftColor = getLocationColor(item.locationId);
                                                    const widthPercent = 100 / lanes.length;
                                                    const leftPercent = laneIdx * widthPercent;
                                                    return (
                                                        <div key={item.id} onClick={(e) => { e.stopPropagation(); handleOpenBuilder(item.id); }} style={{ top: `${topOffset}px`, height: `${duration * hourHeight}px`, width: `calc(${widthPercent}% - 4px)`, left: `${leftPercent}%` }} className={`absolute m-1 rounded-xl shadow-xl border-l-[10px] border border-slate-300 overflow-hidden pointer-events-auto cursor-pointer hover:scale-[1.02] active:scale-95 transition-all z-10 p-2 flex flex-col justify-center leading-none group/card ${shiftColor.bg} ${!isLive ? 'border-dashed' : ''} ${shiftColor.border.replace('500','600')}`}>
                                                            {isManager && (
                                                                <button onClick={async (e) => { e.stopPropagation(); if (await customConfirm("Delete this item?")) { if(isLive) deleteShift(item.id); else deleteTemplate(item.id); } }} className="absolute top-1 right-1 bg-white text-red-600 p-0.5 rounded-full shadow-md opacity-0 group-hover/card:opacity-100 transition-opacity z-20 border border-red-100 hover:bg-red-600 hover:text-white"><X size={8} /></button>
                                                            )}
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="text-[8px] font-black uppercase tracking-tighter truncate text-slate-900 opacity-80">
                                                                    {item.location?.name?.replace(/pnp\s+/i, '') || locations.find(l=>l.id===item.locationId)?.name?.replace(/pnp\s+/i, '')}
                                                                </span>
                                                                <span className="text-[7px] font-bold opacity-70">{isLive ? `${formatTimeSafe(item.startTime)} - ${formatTimeSafe(item.endTime)}` : `${formatTimeString12h(item.startTime)} - ${formatTimeString12h(item.endTime)}`}</span>
                                                            </div>
                                                            <div className="mt-1 space-y-1">
                                                                <select 
                                                                    value={item.userId || ""} 
                                                                    onChange={(e) => {
                                                                        const uid = e.target.value ? parseInt(e.target.value) : null;
                                                                        if(isLive) updateShift(item.id, item.startTime, item.endTime, uid);
                                                                        else saveTemplates({ ...item, userId: uid });
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className={`w-full font-bold text-center truncate px-0.5 py-1 rounded shadow-sm border outline-none cursor-pointer text-[9px] transition-colors ${item.userId === null ? 'bg-green-100 text-green-900 border-green-300 hover:bg-green-200' : 'bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200'}`}
                                                                >
                                                                    <option value="">{isLive ? '-- Open Shift --' : '-- Open Pattern --'}</option>
                                                                    {users.filter(u=>u.isActive!==false).sort((a,b)=>a.name.localeCompare(b.name)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                                </select>

                                                                {isLive && item.status === 'COVERAGE_REQUESTED' && (
                                                                    <div className="py-0.5 px-1 rounded bg-orange-100 text-orange-700 border border-orange-200 text-[8px] font-black uppercase text-center tracking-widest animate-pulse">Need Cover</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            });
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
         </div>
      </div>

      {sidebarBuilderOpen && <SlideOutBuilder onClose={() => setSidebarBuilderOpen(false)} defaultDate={preFill.date} defaultStart={preFill.start} />}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
