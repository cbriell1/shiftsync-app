// filepath: app/components/CalendarTab.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Shift, Location } from '@/lib/types';
import { customConfirm, notify } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { MONTHS, YEARS, DAYS_OF_WEEK, getLocationColor, formatTimeSafe } from '@/lib/common';

const TIMELINE_START_HOUR = 6; 
const TIMELINE_END_HOUR = 24;  
const HOUR_HEIGHT = 70;        

const TIME_LABELS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }, 
  (_, i) => i + TIMELINE_START_HOUR
);

export default function CalendarTab({ appState }: any) {
  const currentMonth = useAppStore(state => state.currentMonth);
  const currentYear = useAppStore(state => state.currentYear);
  const setCurrentMonth = useAppStore(state => state.setCurrentMonth);
  const setCurrentYear = useAppStore(state => state.setCurrentYear);
  const locations = useAppStore(state => state.locations);
  const users = useAppStore(state => state.users);
  const shifts = useAppStore(state => state.shifts);
  const fetchShifts = useAppStore(state => state.fetchShifts);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  const calLocFilter = useAppStore(state => state.calLocFilter);
  const setCalLocFilter = useAppStore(state => state.setCalLocFilter);
  const calEmpFilter = useAppStore(state => state.calEmpFilter);
  const setCalEmpFilter = useAppStore(state => state.setCalEmpFilter);

  const activeUserObj = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUserObj?.systemRoles?.includes('Administrator');
  const isManager = activeUserObj?.systemRoles?.includes('Manager') || isAdmin;

  const userLocationIds = activeUserObj?.locationIds ||[];
  const allowedLocationIds = userLocationIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);

  const activeLocations = (isAdmin || isManager) 
    ? locations.filter(l => l.isActive !== false) 
    : locations.filter(loc => allowedLocationIds.includes(loc.id) && loc.isActive !== false);

  const activeCalColor = calLocFilter ? getLocationColor(calLocFilter) : { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInM = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells =[...new Array(firstDay).fill(null), ...Array.from({ length: daysInM }, (_, i) => i + 1)];

  const[viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const[mobileMoveShiftId, setMobileMoveShiftId] = useState<number | null>(null);
  
  const[baseDate, setBaseDate] = useState(() => {
    const today = new Date();
    if (today.getMonth() === currentMonth && today.getFullYear() === currentYear) return today;
    return new Date(currentYear, currentMonth, 1);
  });

  useEffect(() => { setCurrentMonth(baseDate.getMonth()); setCurrentYear(baseDate.getFullYear()); },[baseDate, setCurrentMonth, setCurrentYear]);

  const [selectedLocs, setSelectedLocs] = useState<number[]>([]);
  const[selectedEmps, setSelectedEmps] = useState<number[]>([]);
  const[showLocDropdown, setShowLocDropdown] = useState(false);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  const handlePrev = () => {
    const newDate = new Date(baseDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setBaseDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(baseDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setBaseDate(newDate);
  };

  const jumpToToday = () => setBaseDate(new Date());

  const handleMonthDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => { const m = parseInt(e.target.value); const newDate = new Date(baseDate); newDate.setMonth(m); setBaseDate(newDate); };
  const handleYearDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => { const y = parseInt(e.target.value); const newDate = new Date(baseDate); newDate.setFullYear(y); setBaseDate(newDate); };

  const toggleEmpFilter = (id: number) => { if (selectedEmps.includes(id)) setSelectedEmps(selectedEmps.filter(x => x !== id)); else setSelectedEmps([...selectedEmps, id]); };
  const toggleLocFilter = (id: number) => { if (selectedLocs.includes(id)) setSelectedLocs(selectedLocs.filter(x => x !== id)); else setSelectedLocs([...selectedLocs, id]); };

  const dayArray = useMemo(() => {
    const days = viewMode === 'week' ? 7 : 1;
    const startOfGrid = new Date(baseDate);
    if (viewMode === 'week') startOfGrid.setDate(startOfGrid.getDate() - startOfGrid.getDay());
    return Array.from({ length: days }, (_, i) => { const d = new Date(startOfGrid); d.setDate(d.getDate() + i); return d; });
  }, [baseDate, viewMode]);

  const timelineColumns = useMemo(() => {
    const locsToRender = new Set<number>();
    if (selectedLocs.length > 0) selectedLocs.forEach(id => locsToRender.add(id));
    else activeLocations.forEach(l => locsToRender.add(l.id));
    dayArray.forEach(d => {
      shifts.forEach(s => {
        const sd = new Date(s.startTime);
        if (sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth() && sd.getDate() === d.getDate()) {
          if ((isAdmin || isManager) || allowedLocationIds.includes(s.locationId)) locsToRender.add(s.locationId);
        }
      });
    });
    const renderedLocs = Array.from(locsToRender).map(id => locations.find(l => l.id === id)).filter(Boolean) as Location[];
    const safeLocs = renderedLocs.length > 0 ? renderedLocs.sort((a,b) => a.name.localeCompare(b.name)) : [{ id: 0, name: 'No Locations' } as Location];
    return dayArray.flatMap(d => safeLocs.map(loc => ({ date: d, location: loc })));
  },[dayArray, activeLocations, selectedLocs, shifts, locations, isAdmin, isManager, allowedLocationIds]);

  const handleUpdateShiftTime = async (shiftId: number, startTime: string, endTime: string, userId: number | null) => {
    await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId, userId, startTime, endTime, action: 'UPDATE' }) });
    await fetchShifts(); 
  };

  const handleClaimShift = async (shiftId: number) => { 
    if(!selectedUserId) { notify.error("Select an employee first!"); return; } 
    await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shiftId, userId: parseInt(selectedUserId), action: 'CLAIM' }) }); 
    await fetchShifts(); 
    notify.success("Shift claimed!");
  };

  const handleRequestCover = async (shiftId: number) => {
    if(!(await customConfirm("Are you sure you need coverage for this shift?", "Need Cover", true))) return;
    await fetch('/api/shifts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ shiftId: shiftId, action: 'REQUEST_COVER' }) });
    await fetchShifts();
    notify.success("Coverage requested!");
  };

  const handleCancelCover = async (shiftId: number) => {
    await fetch('/api/shifts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ shiftId: shiftId, action: 'CANCEL_COVER' }) });
    await fetchShifts();
    notify.success("Coverage request canceled.");
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const shiftId = Number(e.dataTransfer.getData('shiftId'));
    const targetShift = shifts.find(s => s.id === shiftId);
    if (!targetShift) return;
    const originalStart = new Date(targetShift.startTime);
    const originalEnd = new Date(targetShift.endTime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);
    handleUpdateShiftTime(shiftId, newStart.toISOString(), newEnd.toISOString(), targetShift.userId || null);
  };

  const executeMobileMove = (targetDate: Date) => {
    if (!mobileMoveShiftId) return;
    const targetShift = shifts.find(s => s.id === mobileMoveShiftId);
    if (!targetShift) { setMobileMoveShiftId(null); return; }
    
    const originalStart = new Date(targetShift.startTime);
    const durationMs = new Date(targetShift.endTime).getTime() - originalStart.getTime();
    
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);
    
    handleUpdateShiftTime(mobileMoveShiftId, newStart.toISOString(), newEnd.toISOString(), targetShift.userId || null);
    setMobileMoveShiftId(null);
    notify.success("Shift Moved!");
  };

  const getFilteredShifts = (dateObj: Date, columnLocId?: number) => {
    return shifts.filter(shift => {
      if (!isAdmin && !isManager && !allowedLocationIds.includes(shift.locationId)) return false;
      const sd = new Date(shift.startTime);
      if (sd.getFullYear() !== dateObj.getFullYear() || sd.getMonth() !== dateObj.getMonth() || sd.getDate() !== dateObj.getDate()) return false;
      if (columnLocId) {
        if (shift.locationId !== columnLocId) return false;
      } else if (selectedLocs.length > 0) {
        if (!selectedLocs.includes(shift.locationId)) return false;
      }
      if (selectedEmps.length > 0) {
        const isOpen = shift.status === 'OPEN';
        const hasOpenFilter = selectedEmps.includes(-1);
        const hasEmpFilter = shift.userId !== null && selectedEmps.includes(shift.userId);
        if (!((isOpen && hasOpenFilter) || hasEmpFilter)) return false;
      }
      return true;
    });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-300 shadow-sm animate-in fade-in duration-300 relative">
      
      {/* FLOATING ACTION BAR FOR MOBILE MOVE */}
      {mobileMoveShiftId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] flex items-center justify-between animate-in slide-in-from-bottom-10 fade-in border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-full animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" /></svg>
            </div>
            <span className="text-xs font-black tracking-widest uppercase leading-tight">Tap empty slot<br/>to place shift</span>
          </div>
          <button onClick={() => setMobileMoveShiftId(null)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors shrink-0">Cancel</button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-slate-100 p-3 rounded-xl border border-gray-300 gap-4 shadow-inner text-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300 shadow-sm w-full sm:w-auto">
            {['month', 'week', 'day'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode as any)} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-md transition-all ${viewMode === mode ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>{mode}</button>
            ))}
          </div>
          <div className="flex items-center space-x-1 w-full sm:w-auto justify-center">
            <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 transition">&lt;</button>
            <select value={baseDate.getMonth()} onChange={handleMonthDropdown} className="w-28 sm:w-32 h-10 border border-gray-400 rounded-lg px-2 font-black text-slate-900 bg-white shadow-sm outline-none cursor-pointer">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={baseDate.getFullYear()} onChange={handleYearDropdown} className="w-20 sm:w-24 h-10 border border-gray-400 rounded-lg px-2 font-black text-slate-900 bg-white shadow-sm outline-none cursor-pointer">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 transition">&gt;</button>
            <button onClick={jumpToToday} className="ml-2 h-10 px-3 bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-[10px] text-slate-600 uppercase tracking-widest transition">Today</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto items-center">
          <div className="relative w-full sm:w-auto">
            <button onClick={() => setShowLocDropdown(!showLocDropdown)} className="w-full sm:w-auto bg-white border border-blue-400 rounded-lg p-2.5 font-bold text-slate-900 shadow-sm flex items-center justify-between gap-2">
              <span>Locs ({selectedLocs.length === 0 ? 'All' : selectedLocs.length})</span>
              <span className="text-[10px]">▼</span>
            </button>
            {showLocDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLocDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-2 max-h-60 overflow-y-auto flex flex-col gap-1">
                  <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-200 mb-1 transition-colors">
                    <input type="checkbox" checked={selectedLocs.length === 0} onChange={() => setSelectedLocs([])} className="w-4 h-4" />
                    <span className="font-black text-sm text-slate-900">All Active</span>
                  </label>
                  {activeLocations.map(l => (
                    <label key={l.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" checked={selectedLocs.includes(l.id)} onChange={() => toggleLocFilter(l.id)} className="w-4 h-4" />
                      <span className="font-bold text-sm text-slate-700">{l.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <button onClick={() => setShowEmpDropdown(!showEmpDropdown)} className="w-full sm:w-auto bg-white border border-blue-400 rounded-lg p-2.5 font-bold text-slate-900 shadow-sm flex items-center justify-between gap-2">
              <span>Staff ({selectedEmps.length === 0 ? 'All' : selectedEmps.length})</span>
              <span className="text-[10px]">▼</span>
            </button>
            {showEmpDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmpDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-2 max-h-60 overflow-y-auto flex flex-col gap-1">
                  <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-200 mb-1 transition-colors">
                    <input type="checkbox" checked={selectedEmps.length === 0} onChange={() => setSelectedEmps([])} className="w-4 h-4" />
                    <span className="font-black text-sm text-slate-900">All Staff</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-green-50 rounded cursor-pointer border-b border-slate-100 transition-colors">
                    <input type="checkbox" checked={selectedEmps.includes(-1)} onChange={() => toggleEmpFilter(-1)} className="w-4 h-4 rounded text-green-600" />
                    <span className="font-black text-sm text-green-700">Open Shifts</span>
                  </label>
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" checked={selectedEmps.includes(u.id)} onChange={() => toggleEmpFilter(u.id)} className="w-4 h-4" />
                      <span className="font-bold text-sm text-slate-700">{u.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="overflow-x-auto pb-4">
          <div style={{ minWidth: '800px' }}>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS_OF_WEEK.map(dayName => (
                <div key={dayName} className={`font-black text-center py-2 rounded-t-lg border shadow-sm ${activeCalColor.bg} ${activeCalColor.text} ${activeCalColor.border}`}>{dayName}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 border-l border-t border-gray-300 bg-gray-200 rounded-b-lg overflow-hidden shadow-inner">
              {calendarCells.map((dayNum, index) => {
                const dateObj = dayNum ? new Date(baseDate.getFullYear(), baseDate.getMonth(), dayNum) : null;
                const dayShifts = dateObj ? getFilteredShifts(dateObj) :[];
                dayShifts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                const isToday = dateObj && dateObj.getDate() === new Date().getDate() && dateObj.getMonth() === new Date().getMonth() && dateObj.getFullYear() === new Date().getFullYear();
                return (
                  <div 
                    key={index} 
                    className={`bg-white min-h-32 border-r border-b border-gray-300 p-2 flex flex-col relative transition-colors ${isToday ? 'ring-4 ring-inset ring-yellow-400 bg-yellow-50/50 z-10' : ''} ${(isAdmin || isManager) && dateObj ? 'hover:bg-slate-50' : ''} ${mobileMoveShiftId ? 'cursor-crosshair hover:bg-blue-50 ring-inset ring-2 ring-blue-200' : ''}`} 
                    onDragOver={(e) => { if (dateObj && (isAdmin || isManager)) e.preventDefault(); }} 
                    onDrop={(e) => { if (dateObj && (isAdmin || isManager)) handleDrop(e, dateObj); }}
                    onClick={() => { if (mobileMoveShiftId && dateObj && (isAdmin || isManager)) executeMobileMove(dateObj); }}
                  >
                    {dateObj && (
                      <>
                        <div className={`text-right font-black mb-2 flex justify-between items-center ${isToday ? 'text-slate-900 text-base' : 'text-gray-400 text-sm'}`}>
                          {isToday ? <span style={{ fontSize: '10px' }} className="bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded shadow-sm tracking-widest uppercase">Today</span> : <span></span>}
                          <span>{dateObj.getDate()}</span>
                        </div>
                        <div className="space-y-2 overflow-y-auto flex-grow">
                          {dayShifts.map(shift => {
                            const isMyShift = shift.userId === parseInt(selectedUserId);
                            const shiftColor = getLocationColor(shift.locationId);
                            let finalBg = 'bg-white', finalBorder = shiftColor.border;
                            
                            if (mobileMoveShiftId === shift.id) {
                              finalBg = 'bg-blue-100 ring-4 ring-blue-500 animate-pulse';
                              finalBorder = 'border-blue-500';
                            } else if (shift.status === 'OPEN') { 
                              finalBg = 'bg-green-50'; finalBorder = 'border-green-300'; 
                            } else if (shift.status === 'COVERAGE_REQUESTED') { 
                              finalBg = 'bg-red-50 ring-2 ring-red-500 ring-inset shadow-md'; finalBorder = 'border-red-500'; 
                            }

                            return (
                              <div key={shift.id} draggable={isAdmin || isManager} onDragStart={(e) => { if (isAdmin || isManager) e.dataTransfer.setData('shiftId', shift.id.toString()); }} className={`p-2 rounded text-xs border-l-4 shadow-md mb-2 transition-transform ${isAdmin || isManager ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5' : ''} ${finalBg} ${finalBorder}`}>
                                <div className="font-bold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis mb-1 pointer-events-none">{formatTimeSafe(shift.startTime)} - {formatTimeSafe(shift.endTime)}</div>
                                <div className={`text-[10px] font-black uppercase tracking-wider mb-1 truncate pointer-events-none ${shiftColor.text}`}>{shift.location?.name}</div>
                                {shift.status === 'COVERAGE_REQUESTED' && <div className="mt-1 mb-1 font-black text-center truncate px-1 py-1.5 rounded shadow-sm border bg-red-600 text-white text-[10px] uppercase tracking-widest animate-pulse pointer-events-none">🚨 Needs Cover</div>}
                                <div className="mt-1 flex flex-col gap-1">
                                  {isAdmin || isManager ? (
                                    <>
                                      <select value={shift.userId || ""} onChange={(e) => handleUpdateShiftTime(shift.id, shift.startTime, shift.endTime, e.target.value ? parseInt(e.target.value) : null)} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className={`w-full font-bold text-center truncate px-1 py-1.5 rounded shadow-sm border outline-none cursor-pointer text-xs ${shift.userId === null ? 'bg-green-100 text-green-900 border-green-500' : `${shiftColor.badge}`}`}><option value="">-- Open Shift --</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); setMobileMoveShiftId(mobileMoveShiftId === shift.id ? null : shift.id); }} className="md:hidden w-full bg-slate-900 text-white font-black text-[9px] py-1.5 rounded uppercase tracking-widest shadow-sm">
                                        {mobileMoveShiftId === shift.id ? 'Cancel Move' : 'Move Shift'}
                                      </button>
                                    </>
                                  ) : (
                                    shift.status === 'OPEN' ? <div className="text-center font-bold text-slate-500 mt-1 text-[10px] uppercase tracking-widest border border-dashed border-slate-300 rounded py-1 bg-slate-50">Unassigned</div> : <div className={`font-bold text-center truncate px-1 py-1 rounded shadow-sm border pointer-events-none ${isMyShift ? 'bg-green-100 text-green-900 border-green-500' : shiftColor.badge}`}>{isMyShift ? 'Your Shift' : (shift.assignedTo?.name || 'Assigned')}</div>
                                  )}
                                  {isMyShift && shift.status !== 'COVERAGE_REQUESTED' && <button onClick={() => handleRequestCover(shift.id)} className="w-full text-xs bg-orange-100 text-orange-800 border border-orange-300 font-bold py-1 rounded shadow-sm">Need Coverage</button>}
                                  {isMyShift && shift.status === 'COVERAGE_REQUESTED' && <button onClick={() => handleCancelCover(shift.id)} className="w-full text-[10px] uppercase tracking-widest bg-gray-200 text-gray-800 font-black py-1.5 rounded shadow-sm border border-gray-400">Cancel Request</button>}
                                  {!isMyShift && shift.status === 'COVERAGE_REQUESTED' && <button onClick={async () => { if(await customConfirm("Pick up shift?", "Pick Up", false)) handleClaimShift(shift.id); }} className="w-full text-[10px] uppercase tracking-widest bg-green-600 text-white font-black py-1.5 rounded shadow-sm border border-green-700 mt-1">Pick Up Shift</button>}
                                  {!isMyShift && shift.status === 'OPEN' && (!isAdmin && !isManager) && <button onClick={async () => { if(await customConfirm("Claim open shift?", "Claim", false)) handleClaimShift(shift.id); }} className="w-full text-[10px] uppercase tracking-widest bg-blue-600 text-white font-black py-1.5 rounded shadow-sm border border-blue-700 mt-1">Claim Shift</button>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="flex flex-col border border-slate-300 rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(800, timelineColumns.length * 150)}px` }}>
              <div className="flex bg-slate-100 border-b border-slate-300 z-20 shadow-sm relative">
                <div className="w-16 md:w-20 flex-shrink-0 border-r border-slate-200 bg-slate-100" />
                <div className="flex-1 flex flex-col">
                  <div className="grid divide-x divide-slate-200 border-b border-slate-200" style={{ gridTemplateColumns: `repeat(${dayArray.length}, minmax(0, 1fr))` }}>
                    {dayArray.map((d, i) => {
                      const isToday = d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                      return <div key={i} className={`py-2 text-center font-black uppercase text-xs transition-colors ${isToday ? 'bg-yellow-200 text-yellow-900' : 'bg-slate-100 text-slate-700'}`}>{DAYS_OF_WEEK[d.getDay()]} {d.getDate()}</div>;
                    })}
                  </div>
                  <div className="grid divide-x divide-slate-200 bg-white" style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))` }}>
                    {timelineColumns.map((col, i) => {
                      const locColor = col.location ? getLocationColor(col.location.id) : activeCalColor;
                      return <div key={i} className={`py-1.5 text-center text-xs font-black uppercase tracking-widest truncate px-1 border-b-4 text-slate-900 ${locColor.border}`}>{col.location.name}</div>;
                    })}
                  </div>
                </div>
              </div>
              <div className="flex overflow-y-auto max-h-[65vh] bg-slate-50 relative">
                <div className="w-16 md:w-20 flex-shrink-0 border-r border-slate-200 bg-white relative z-20">
                  {TIME_LABELS.map(hour => {
                    const displayHour = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                    return <div key={hour} className="absolute w-full text-right pr-2 md:pr-3 text-[10px] md:text-xs font-bold text-slate-400" style={{ top: `${(hour - TIMELINE_START_HOUR) * HOUR_HEIGHT}px`, transform: 'translateY(-50%)' }}>{displayHour}</div>;
                  })}
                  <div style={{ height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT}px` }} />
                </div>
                <div className="flex-1 relative">
                  <div className="absolute inset-0 pointer-events-none z-0">{TIME_LABELS.map(hour => <div key={hour} className="absolute w-full border-t border-slate-200" style={{ top: `${(hour - TIMELINE_START_HOUR) * HOUR_HEIGHT}px` }} />)}</div>
                  <div className="absolute inset-0 z-10 grid divide-x divide-slate-200" style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))` }}>
                    {timelineColumns.map((col, colIndex) => {
                      const colShifts = getFilteredShifts(col.date, col.location?.id);
                      colShifts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                      const overlapCols: Shift[][] =[];
                      colShifts.forEach(shift => {
                        let placed = false;
                        const startMs = new Date(shift.startTime).getTime();
                        for (let c = 0; c < overlapCols.length; c++) {
                          const lastShift = overlapCols[c][overlapCols[c].length - 1];
                          if (new Date(lastShift.endTime).getTime() <= startMs) { overlapCols[c].push(shift); placed = true; break; }
                        }
                        if (!placed) overlapCols.push([shift]);
                      });
                      return (
                        <div 
                          key={colIndex} 
                          className={`relative w-full h-full transition-colors ${mobileMoveShiftId ? 'cursor-crosshair bg-blue-50/50 hover:bg-blue-100' : 'hover:bg-slate-100/30'}`} 
                          onDragOver={(e) => { if (isAdmin || isManager) e.preventDefault(); }} 
                          onDrop={(e) => { if (isAdmin || isManager) handleDrop(e, col.date); }}
                          onClick={() => { if (mobileMoveShiftId && (isAdmin || isManager)) executeMobileMove(col.date); }}
                        >
                          {overlapCols.map((shiftList, overlapIndex) => shiftList.map(shift => {
                            const s = new Date(shift.startTime), e = new Date(shift.endTime);
                            let startHourRaw = s.getHours() + s.getMinutes() / 60, endHourRaw = e.getHours() + e.getMinutes() / 60;
                            if (e.getHours() === 0 && e.getMinutes() === 0 && e.getDate() !== s.getDate()) endHourRaw = 24;
                            const topPos = Math.max(0, (startHourRaw - TIMELINE_START_HOUR) * HOUR_HEIGHT), heightPos = Math.min((endHourRaw - startHourRaw) * HOUR_HEIGHT, (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT - topPos);
                            const widthPct = 100 / overlapCols.length, leftPct = overlapIndex * widthPct;
                            const isMyShift = shift.userId === parseInt(selectedUserId), shiftColor = getLocationColor(shift.locationId);
                            let finalBg = shiftColor.bg, finalBorder = shiftColor.border, finalHeaderBg = shiftColor.badge;
                            
                            if (mobileMoveShiftId === shift.id) {
                              finalBg = 'bg-blue-100 ring-4 ring-blue-500 animate-pulse'; finalBorder = 'border-blue-500'; finalHeaderBg = 'bg-blue-600 text-white';
                            } else if (shift.status === 'OPEN') { 
                              finalBg = 'bg-green-50'; finalBorder = 'border-green-400'; finalHeaderBg = 'bg-green-100 text-green-900 border-green-300'; 
                            } else if (shift.status === 'COVERAGE_REQUESTED') { 
                              finalBg = 'bg-red-50'; finalBorder = 'border-red-500'; finalHeaderBg = 'bg-red-600 text-white animate-pulse'; 
                            }

                            const isCompact = heightPos < 45;
                            return (
                              <div key={shift.id} draggable={isAdmin || isManager} onDragStart={(e) => { if (isAdmin || isManager) e.dataTransfer.setData('shiftId', shift.id.toString()); }} className="absolute p-[1px] transition-transform hover:z-20 hover:scale-[1.01]" style={{ top: `${topPos}px`, height: `${heightPos}px`, left: `${leftPct}%`, width: `${widthPct}%` }}>
                                <div className={`w-full h-full rounded shadow-sm border overflow-hidden flex flex-col ${finalBg} ${finalBorder} ${isAdmin || isManager ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                                  <div className={`px-1.5 py-0.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate border-b flex-shrink-0 ${finalHeaderBg}`}>{shift.status === 'OPEN' ? 'OPEN' : shift.status === 'COVERAGE_REQUESTED' ? '🚨 COVER' : shift.location?.name}</div>
                                  <div className={`p-1.5 flex-1 flex flex-col overflow-hidden leading-tight ${isCompact ? 'flex-row items-center gap-2' : ''}`}>
                                    <div className={`font-bold text-slate-900 truncate ${isCompact ? 'text-[10px]' : 'text-xs md:text-sm'}`}>{formatTimeSafe(shift.startTime)} - {formatTimeSafe(shift.endTime)}</div>
                                    {!isCompact && <div className={`text-[10px] mt-0.5 font-bold truncate opacity-80 ${shiftColor.text}`}>{shift.status === 'OPEN' ? 'Unassigned' : (isMyShift ? 'Your Shift' : (shift.assignedTo?.name || 'Assigned'))}</div>}
                                  </div>
                                  {(isAdmin || isManager) && !isCompact && (
                                    <div className="px-1 pb-1 mt-auto space-y-1">
                                      <select value={shift.userId || ""} onChange={(e) => handleUpdateShiftTime(shift.id, shift.startTime, shift.endTime, e.target.value ? parseInt(e.target.value) : null)} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="w-full bg-white/50 border border-black/10 rounded outline-none text-[9px] font-bold p-0.5 cursor-pointer text-slate-800"><option value="">- Open -</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); setMobileMoveShiftId(mobileMoveShiftId === shift.id ? null : shift.id); }} className="md:hidden w-full bg-slate-900 text-white font-black text-[9px] py-1.5 rounded uppercase tracking-widest shadow-sm">
                                        {mobileMoveShiftId === shift.id ? 'Cancel Move' : 'Move Shift'}
                                      </button>
                                    </div>
                                  )}
                                  {!isMyShift && shift.status === 'COVERAGE_REQUESTED' && !isCompact && <button onClick={async () => { if(await customConfirm("Pick up shift?", "Pick Up", false)) handleClaimShift(shift.id); }} className="mx-1 mb-1 text-[8px] bg-green-600 text-white font-black py-1 rounded">CLAIM</button>}
                                  {!isMyShift && shift.status === 'OPEN' && (!isAdmin && !isManager) && !isCompact && <button onClick={async () => { if(await customConfirm("Claim open shift?", "Claim", false)) handleClaimShift(shift.id); }} className="mx-1 mb-1 text-[8px] bg-blue-600 text-white font-black py-1 rounded">CLAIM</button>}
                                </div>
                              </div>
                            );
                          }))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}