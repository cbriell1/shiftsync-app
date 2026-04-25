// filepath: app/components/ScheduleBuilderTab.tsx
"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Shift, User, Event } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { DAYS_OF_WEEK, getLocationColor } from '@/lib/common';
import { notify, customConfirm } from '@/lib/ui-utils';
import { Calendar, ShieldAlert, Paintbrush, XCircle, UserPlus, Save, Search, UserCheck, MapPin } from 'lucide-react';

// Helper for 12h time format
const formatTime12h = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// ==================================================================
// QUICK-ASSIGN POPOVER COMPONENT
// ==================================================================
function QuickAssignPopover({ shift, users, onAssign, onClose, employeeTotals }: any) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = users.filter((u: User) => 
      u.isActive !== false && 
      (u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    );

    // Smart Sort: 1. Location match, 2. Lowest Hours
    return list.sort((a: User, b: User) => {
      const aLocMatch = a.locationIds?.includes(shift.locationId) ? 1 : 0;
      const bLocMatch = b.locationIds?.includes(shift.locationId) ? 1 : 0;
      if (aLocMatch !== bLocMatch) return bLocMatch - aLocMatch;
      return (employeeTotals[a.id] || 0) - (employeeTotals[b.id] || 0);
    });
  }, [users, query, shift.locationId, employeeTotals]);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        onAssign(filtered[selectedIndex].id);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onAssign, onClose]);

  return (
    <div 
      className="absolute top-0 left-0 z-[100] w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-slate-900 overflow-hidden animate-in zoom-in duration-200"
      onClick={e => e.stopPropagation()}
    >
      <div className="bg-slate-900 p-3 flex items-center gap-2">
         <Search size={14} className="text-yellow-400" />
         <input 
           ref={inputRef}
           value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
           placeholder="Search staff..."
           className="bg-transparent text-white text-xs font-black uppercase outline-none w-full placeholder:text-slate-500"
         />
      </div>
      <div className="max-h-60 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-[10px] font-black text-slate-400 uppercase italic">No matches</div>
        ) : (
          filtered.map((u: User, idx: number) => {
            const isLocMatch = u.locationIds?.includes(shift.locationId);
            const hours = employeeTotals[u.id] || 0;
            return (
              <button 
                key={u.id}
                onClick={() => onAssign(u.id)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left p-3 border-b border-slate-100 flex items-center justify-between transition-colors ${idx === selectedIndex ? 'bg-blue-50' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900 truncate uppercase">{u.name}</p>
                  <p className="text-[9px] font-bold text-slate-400">{hours.toFixed(1)}h this week</p>
                </div>
                {isLocMatch && (
                  <div className="bg-green-100 text-green-700 p-1 rounded-md" title="Location Match">
                    <MapPin size={10} />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================================================================
// SHIFT CARD COMPONENT
// ==================================================================
const ShiftCard = ({ shift, showEmployeeSelect = false, isMoving, onMoveClick, onDeleteClick }: { shift: Shift, showEmployeeSelect?: boolean, isMoving?: boolean, onMoveClick?: () => void, onDeleteClick?: () => void }) => {
  const users = useAppStore(state => state.users);
  const updateShift = useAppStore(state => state.updateShift);
  const selectedUserId = useAppStore(state => state.selectedUserId);
  const activePainterId = useAppStore(state => state.activePainterId);
  const popoverTargetShiftId = useAppStore(state => state.popoverTargetShiftId);
  const setPopoverTargetShiftId = useAppStore(state => state.setPopoverTargetShiftId);
  
  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUser?.systemRoles?.includes('Administrator');
  const isManager = activeUser?.systemRoles?.includes('Manager') || isAdmin;

  const [tempEnd, setTempEnd] = useState<Date>(new Date(shift.endTime));
  const startD = new Date(shift.startTime);
  const durationMs = tempEnd.getTime() - startD.getTime();
  const hours = durationMs / (1000 * 60 * 60);

  const shiftColor = getLocationColor(shift.locationId);

  let finalBg = shiftColor.bg;
  let finalBorder = shiftColor.border;
  let locTextColor = shiftColor.text;

  const isPainterActive = activePainterId !== null;
  const isPopoverActive = popoverTargetShiftId === shift.id;

  if (isMoving) {
    finalBg = 'bg-blue-100 ring-2 ring-blue-500 animate-pulse';
    finalBorder = 'border-blue-500';
    locTextColor = 'text-blue-900';
  } else if (activePainterId === -1 && shift.userId !== null) {
    finalBg = 'bg-red-50 hover:bg-red-100 cursor-copy';
    finalBorder = 'border-red-400 border-dashed';
    locTextColor = 'text-red-900';
  } else if (shift.status === 'OPEN') {
    finalBg = isPainterActive ? 'bg-yellow-50 hover:bg-yellow-100 cursor-copy' : 'bg-green-50';
    finalBorder = isPainterActive ? 'border-yellow-400' : 'border-green-400';
    locTextColor = isPainterActive ? 'text-yellow-900' : 'text-green-900';
  } else if (shift.status === 'COVERAGE_REQUESTED') {
    finalBg = 'bg-red-50 ring-1 ring-red-500 ring-inset shadow-md shadow-red-500/30';
    finalBorder = 'border-red-500';
    locTextColor = 'text-red-900';
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (isPainterActive) { e.preventDefault(); return; }
    e.dataTransfer.setData('shiftId', shift.id.toString());
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePainterId === -1) {
        if (shift.userId !== null) {
            updateShift(shift.id, shift.startTime, shift.endTime, null, 'UPDATE');
            notify.success("Set to Open");
        }
    } else if (activePainterId && shift.status === 'OPEN') {
      updateShift(shift.id, shift.startTime, shift.endTime, activePainterId, 'UPDATE');
      notify.success("Assigned!");
    } else if (shift.status === 'OPEN' && !isPainterActive) {
      setPopoverTargetShiftId(shift.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPainterActive) return;
    e.stopPropagation();
    e.preventDefault(); 
    const startY = e.clientY;
    const originalEnd = new Date(shift.endTime).getTime();
    let currentMinsAdded = 0;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      currentMinsAdded = Math.round(deltaY / 15) * 15;
      setTempEnd(new Date(originalEnd + currentMinsAdded * 60000));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      const finalEndTime = new Date(originalEnd + currentMinsAdded * 60000);
      if (finalEndTime.getTime() <= startD.getTime()) { setTempEnd(new Date(shift.endTime)); return; }
      updateShift(shift.id, shift.startTime, finalEndTime.toISOString(), shift.userId || null, 'UPDATE');
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const dropdownUsers = users.filter(u => u.isActive !== false || u.id === shift.userId);

  return (
    <div 
      draggable={!isPainterActive} 
      onDragStart={handleDragStart} 
      onClick={handleCardClick}
      className={`group relative w-full rounded-md shadow-sm mb-1.5 border-l-[3px] overflow-hidden flex flex-col transition-all hover:shadow-md ${!isPainterActive ? 'cursor-grab active:cursor-grabbing hover:scale-[1.01]' : 'cursor-copy active:scale-95'} ${isPopoverActive ? 'ring-4 ring-blue-500 z-50' : 'hover:z-20'} ${finalBg} ${finalBorder}`}
    >
      
      {isManager && !isPainterActive && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeleteClick?.(); }}
          className="absolute top-0.5 right-0.5 bg-white/90 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-sm"
          title="Delete Shift"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
        </button>
      )}

      {isPainterActive && shift.status === 'OPEN' && activePainterId !== -1 && (
        <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <UserPlus size={16} className="text-yellow-700 animate-bounce" />
        </div>
      )}

      {activePainterId === -1 && shift.userId !== null && (
        <div className="absolute inset-0 bg-red-400/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <XCircle size={16} className="text-red-700 animate-pulse" />
        </div>
      )}

      <div className={`p-1 flex-1 flex flex-col overflow-hidden leading-tight pointer-events-none ${showEmployeeSelect ? 'pb-0.5' : 'pb-3'}`}>
        <div className="flex justify-between items-start mb-0.5">
          <span className={`text-[8px] font-black uppercase tracking-widest truncate pr-2 ${locTextColor}`}>{shift.location?.name}</span>
          <span className="text-[8px] font-black text-slate-700 bg-white/60 px-1 py-0.5 rounded shadow-sm">{hours.toFixed(1)}h</span>
        </div>
        <div className="font-bold text-slate-900 text-[9px] truncate">{formatTime12h(shift.startTime)} - {formatTime12h(tempEnd.toISOString())}</div>
        {!showEmployeeSelect && shift.status === 'OPEN' && <div className="text-[8px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Open</div>}
      </div>
      
      {showEmployeeSelect && !isPainterActive && !isPopoverActive && (
        <div className="px-1 pb-1 mt-auto relative z-10">
          <select 
            value={shift.userId || ""} 
            onChange={(e) => updateShift(shift.id, shift.startTime, shift.endTime, e.target.value ? parseInt(e.target.value) : null, 'UPDATE')} 
            onClick={(e) => e.stopPropagation()} 
            onMouseDown={(e) => e.stopPropagation()} 
            className={`w-full font-bold text-center truncate px-0.5 py-0.5 rounded shadow-sm border outline-none cursor-pointer text-[9px] transition-colors ${shift.userId === null ? 'bg-green-100 text-green-900 border-green-500 hover:bg-green-200' : `${shiftColor.badge} hover:brightness-95`}`}
          >
            <option value="">- Open -</option>
            {dropdownUsers.map((u: User) => (
              <option key={u.id} value={u.id}>{u.name} {u.isActive === false ? '(X)' : ''}</option>
            ))}
          </select>
        </div>
      )}

      {isPainterActive && shift.status === 'OPEN' && activePainterId !== -1 && (
        <div className="px-1 pb-1 mt-auto text-center">
           <span className="text-[8px] font-black text-yellow-700 uppercase tracking-widest bg-yellow-200/50 px-2 py-0.5 rounded-full">Click to Paint</span>
        </div>
      )}

      {activePainterId === -1 && shift.userId !== null && (
        <div className="px-1 pb-1 mt-auto text-center">
           <span className="text-[8px] font-black text-red-700 uppercase tracking-widest bg-red-200/50 px-2 py-0.5 rounded-full">Set to Open</span>
        </div>
      )}

      <div onMouseDown={handleMouseDown} className={`hidden md:flex absolute bottom-0 left-0 right-0 h-2 bg-black/5 hover:bg-black/20 ${isPainterActive ? 'cursor-default' : 'cursor-ns-resize'} items-center justify-center transition-colors z-20`}><div className="w-4 h-0.5 bg-black/30 rounded-full"></div></div>
    </div>
  );
};

// ==================================================================
// MAIN SCHEDULE BUILDER TAB
// ==================================================================
export default function ScheduleBuilderTab({ appState }: any) {
  const shifts = useAppStore(state => state.shifts);
  const users = useAppStore(state => state.users);
  const locations = useAppStore(state => state.locations);
  const events = useAppStore(state => state.events);
  const activePainterId = useAppStore(state => state.activePainterId);
  const setActivePainterId = useAppStore(state => state.setActivePainterId);
  const popoverTargetShiftId = useAppStore(state => state.popoverTargetShiftId);
  const setPopoverTargetShiftId = useAppStore(state => state.setPopoverTargetShiftId);
  
  const builderWeekStart = useAppStore(state => state.builderWeekStart);
  const setBuilderWeekStart = useAppStore(state => state.setBuilderWeekStart);
  const calLocFilter = useAppStore(state => state.calLocFilter);
  const setCalLocFilter = useAppStore(state => state.setCalLocFilter);
  
  const setCurrentMonth = useAppStore(state => state.setCurrentMonth);
  const setCurrentYear = useAppStore(state => state.setCurrentYear);

  const fetchShifts = useAppStore(state => state.fetchShifts);
  const fetchTemplates = useAppStore(state => state.fetchTemplates);
  const updateShift = useAppStore(state => state.updateShift);
  const deleteShift = useAppStore(state => state.deleteShift);
  const bulkDeleteShifts = useAppStore(state => state.bulkDeleteShifts);
  const bulkTemplatesFromShifts = useAppStore(state => state.bulkTemplatesFromShifts);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUser?.systemRoles?.includes('Administrator');
  const isManager = activeUser?.systemRoles?.includes('Manager') || isAdmin;

  const allowedLocationIds = activeUser?.locationIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id) ||[];
  const visibleLocations = isAdmin ? locations : locations.filter(loc => allowedLocationIds.includes(loc.id));

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week'); 
  const [mobileMoveShiftId, setMobileMoveShiftId] = useState<number | null>(null);

  const activePainterObj = users.find(u => u.id === activePainterId);
  const popoverShift = shifts.find(s => s.id === popoverTargetShiftId);

  useEffect(() => {
    if (builderWeekStart) {
      const[year, month] = builderWeekStart.split('-').map(Number);
      setCurrentMonth(month - 1);
      setCurrentYear(year);
    }
  },[builderWeekStart, setCurrentMonth, setCurrentYear]);

  const dateColumns = useMemo(() => {
    if (!builderWeekStart) return[];
    const [year, month, day] = builderWeekStart.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    if (viewMode === 'day') return [targetDate];
    if (viewMode === 'week') {
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(d.getDate() + i); return d; });
    }
    if (viewMode === 'month') {
      const y = targetDate.getFullYear(), m = targetDate.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1));
    }
    return[];
  }, [builderWeekStart, viewMode]);

  const monthCells = useMemo(() => {
    if (viewMode !== 'month' || dateColumns.length === 0) return[];
    const firstDay = dateColumns[0].getDay();
    return[...Array(firstDay).fill(null), ...dateColumns];
  }, [dateColumns, viewMode]);

  const changeDate = (direction: number) => {
    const [year, month, day] = builderWeekStart.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else if (viewMode === 'month') { newDate.setMonth(newDate.getMonth() + direction); newDate.setDate(1); }
    const yyyy = newDate.getFullYear(), mm = String(newDate.getMonth() + 1).padStart(2, '0'), dd = String(newDate.getDate()).padStart(2, '0');
    setBuilderWeekStart(`${yyyy}-${mm}-${dd}`);
  };

  const jumpToToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear(), mm = String(today.getMonth() + 1).padStart(2, '0'), dd = String(today.getDate()).padStart(2, '0');
    setBuilderWeekStart(`${yyyy}-${mm}-${dd}`);
  };

  let dateLabel = '';
  if (dateColumns.length > 0) {
    if (viewMode === 'day') dateLabel = dateColumns[0].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    else if (viewMode === 'week') dateLabel = `${dateColumns[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dateColumns[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    else if (viewMode === 'month') dateLabel = dateColumns[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const isSameDay = (isoString: string, targetDate: Date) => {
    const d = new Date(isoString);
    return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate();
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(e => {
      const start = new Date(e.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(e.endDate);
      end.setHours(23,59,59,999);
      const matchLoc = !e.locationId || (calLocFilter && e.locationId === parseInt(calLocFilter));
      return date >= start && date <= end && matchLoc;
    });
  };

  const rangeStart = dateColumns[0] || new Date();
  const rangeEnd = new Date(dateColumns[dateColumns.length - 1] || new Date());
  rangeEnd.setHours(23, 59, 59, 999);

  const visibleShifts = shifts.filter(s => {
    const sd = new Date(s.startTime);
    const inRange = sd >= rangeStart && sd <= rangeEnd;
    const matchLoc = calLocFilter ? s.locationId === parseInt(calLocFilter) : true;
    return inRange && matchLoc;
  });

  const filteredUsers = users.filter(user => {
    if (user.isActive === false) return false; 
    if (!calLocFilter) return true; 
    return user.locationIds?.includes(parseInt(calLocFilter, 10));
  });

  let overtimeThreshold = 40;
  if (viewMode === 'month') overtimeThreshold = 160;
  if (viewMode === 'day') overtimeThreshold = 10;

  const employeeTotals = filteredUsers.reduce((acc: Record<number, number>, user) => {
    const userShifts = visibleShifts.filter(s => s.userId === user.id);
    const totalHours = userShifts.reduce((sum, s) => sum + ((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60)), 0);
    acc[user.id] = totalHours;
    return acc;
  }, {});

  const handleUpdateShiftTime = async (shiftId: number, startTime: string, endTime: string, userId: number | null) => {
    await updateShift(shiftId, startTime, endTime, userId, 'UPDATE');
  };

  const handleDrop = (e: React.DragEvent, targetUserId: number | null, targetDate: Date) => {
    e.preventDefault();
    const shiftId = Number(e.dataTransfer.getData('shiftId'));
    const targetShift = shifts.find(s => s.id === shiftId);
    if (!targetShift) return;
    const originalStart = new Date(targetShift.startTime);
    const durationMs = new Date(targetShift.endTime).getTime() - originalStart.getTime();
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    handleUpdateShiftTime(shiftId, newStart.toISOString(), new Date(newStart.getTime() + durationMs).toISOString(), targetUserId);
  };

  const executeMobileMove = (targetUserId: number | null, targetDate: Date) => {
    if (!mobileMoveShiftId) return;
    const targetShift = shifts.find(s => s.id === mobileMoveShiftId);
    if (!targetShift) { setMobileMoveShiftId(null); return; }
    const originalStart = new Date(targetShift.startTime);
    const durationMs = new Date(targetShift.endTime).getTime() - originalStart.getTime();
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    handleUpdateShiftTime(mobileMoveShiftId, newStart.toISOString(), new Date(newStart.getTime() + durationMs).toISOString(), targetUserId);
    setMobileMoveShiftId(null);
    notify.success("Shift Moved!");
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!(await customConfirm("Are you sure you want to delete this specific shift?", "Delete Shift", true))) return;
    await deleteShift(shiftId);
  };

  const handleBulkDelete = async () => {
    const locName = calLocFilter ? locations.find(l => l.id.toString() === calLocFilter)?.name : 'All Locations';
    if (!(await customConfirm(`Are you sure you want to completely delete ALL visible shifts for ${locName}?`, "Delete All Listed", true))) return;
    await bulkDeleteShifts(rangeStart.toISOString(), rangeEnd.toISOString(), calLocFilter ? parseInt(calLocFilter) : undefined);
  };

  const handleSaveWeekAsTemplate = async () => {
    if (visibleShifts.length === 0) return notify.error("No shifts visible to save!");
    const msg = `Are you sure you want to save these ${visibleShifts.length} visible shifts as the master template pattern?`;
    if (!(await customConfirm(msg, "Save Week as Template", true))) return;
    await bulkTemplatesFromShifts(visibleShifts);
  };

  const handleQuickAssign = async (userId: number) => {
    if (!popoverShift) return;
    await updateShift(popoverShift.id, popoverShift.startTime, popoverShift.endTime, userId, 'UPDATE');
    setPopoverTargetShiftId(null);
    notify.success("Staff Assigned!");
  };

  const colWidthClass = viewMode === 'day' ? 'min-w-[200px] w-full' : 'min-w-[80px] w-1/8';

  return (
    <div className="flex flex-col h-[75vh] relative max-w-full overflow-hidden" onClick={() => setPopoverTargetShiftId(null)}>
      
      {/* Quick Paint Toolbar */}
      {activePainterId && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md ${activePainterId === -1 ? 'bg-red-500 text-white' : 'bg-yellow-400 text-slate-900'} px-6 py-4 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.4)] z-[100] flex items-center justify-between animate-in zoom-in duration-300 border-4 border-slate-900`}>
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 rounded-2xl animate-pulse"><Paintbrush size={20} className={activePainterId === -1 ? 'text-red-400' : 'text-yellow-400'} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-70">Quick-Paint Active</p>
              <p className="text-sm font-black uppercase sports-slant leading-none">
                  {activePainterId === -1 ? 'Mode: Unassign to OPEN' : `Assigning: ${activePainterObj?.name}`}
              </p>
            </div>
          </div>
          <button onClick={() => setActivePainterId(null)} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"><XCircle size={14} /> Stop</button>
        </div>
      )}

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

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-200 pb-3">
        <div className="flex items-center bg-white rounded-lg p-0.5 shadow-sm border border-slate-300">
          <button onClick={(e) => { e.stopPropagation(); changeDate(-1); }} className="px-2 py-1 hover:bg-slate-100 rounded font-black transition-colors flex items-center gap-1 text-slate-700 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Prev
          </button>
          <span className="px-2 font-black text-[11px] text-slate-900 whitespace-nowrap text-center min-w-[100px]">{dateLabel}</span>
          <button onClick={(e) => { e.stopPropagation(); changeDate(1); }} className="px-2 py-1 hover:bg-slate-100 rounded font-black transition-colors flex items-center gap-1 text-slate-700 text-xs">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isManager && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleSaveWeekAsTemplate(); }} title="Save current visible shifts as reusable master templates" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-black py-1.5 px-3 rounded-lg shadow-sm text-[9px] uppercase tracking-widest transition-all flex items-center gap-1"><Save size={14} />Save</button>
              <button onClick={(e) => { e.stopPropagation(); handleBulkDelete(); }} title="Permanently delete all visible shifts in the current view" className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black py-1.5 px-3 rounded-lg shadow-sm text-[9px] uppercase tracking-widest transition-all flex items-center gap-1"><ShieldAlert size={14} />Clear</button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); jumpToToday(); }} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition">Today</button>
          <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 shadow-sm">
            {['month', 'week', 'day'].map(mode => (
              <button key={mode} onClick={(e) => { e.stopPropagation(); setViewMode(mode as any); }} className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all ${viewMode === mode ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>{mode}</button>
            ))}
          </div>
          <select value={calLocFilter} onChange={(e) => setCalLocFilter(e.target.value)} onClick={e => e.stopPropagation()} className="border border-blue-200 rounded-lg py-1 px-2 font-black text-slate-900 bg-blue-50 focus:border-blue-500 outline-none cursor-pointer text-[10px]">
            <option value="">All Facilities</option>
            {visibleLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} {loc.isActive === false && '(X)'}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-grow overflow-auto border-2 border-slate-200 rounded-xl relative shadow-inner bg-slate-50">
        {viewMode === 'month' ? (
          <div className="p-1 md:p-2" style={{ minWidth: '700px' }}>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_OF_WEEK.map(dayName => (
                <div key={dayName} className="font-black text-center py-1.5 rounded-t-lg border shadow-sm bg-slate-800 text-white border-slate-700 uppercase tracking-widest text-[10px]">{dayName.substring(0,3)}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 border-l border-t border-gray-300 bg-gray-200 rounded-b-lg overflow-hidden shadow-inner">
              {monthCells.map((dateObj, index) => {
                const dayShifts = dateObj ? visibleShifts.filter(s => isSameDay(s.startTime, dateObj)) :[];
                dayShifts.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                const isToday = dateObj && isSameDay(dateObj.toISOString(), new Date());
                const dayEvents = dateObj ? getEventsForDay(dateObj) : [];
                const hasSkip = dayEvents.some(e => e.impact === 'SKIP_GENERATION');
                return (
                  <div 
                    key={index} 
                    className={`bg-white min-h-[100px] border-r border-b border-gray-300 p-1 flex flex-col relative transition-colors ${isToday ? 'ring-2 ring-inset ring-yellow-400 bg-yellow-50/50 z-10' : ''} ${hasSkip ? 'bg-orange-50/50' : ''} ${dateObj ? 'hover:bg-slate-50' : ''}`} 
                    onDragOver={(e) => { if (dateObj) e.preventDefault(); }} 
                    onDrop={(e) => { if (!dateObj) return; e.preventDefault(); const shiftId = Number(e.dataTransfer.getData('shiftId')); const targetShift = shifts.find(s => s.id === shiftId); if(targetShift) handleDrop(e, targetShift.userId || null, dateObj); }}
                  >
                    {dateObj && (
                      <>
                        <div className={`text-right font-black mb-1 flex justify-between items-center border-b border-slate-100 pb-0.5 ${isToday ? 'text-slate-900 text-sm' : 'text-gray-400 text-[10px]'}`}>
                          {isToday ? <span className="bg-yellow-400 text-slate-900 px-1 rounded shadow-sm tracking-tighter uppercase text-[8px]">Today</span> : <span></span>}
                          <span>{dateObj.getDate()}</span>
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="space-y-0.5 mb-1">
                             {dayEvents.map(e => (
                               <div key={e.id} title={e.title} className={`text-[7px] font-black uppercase px-0.5 py-0.5 rounded border leading-tight truncate ${e.impact === 'SKIP_GENERATION' ? 'bg-orange-500 text-white border-orange-600' : 'bg-blue-600 text-white border-blue-700'}`}>{e.title}</div>
                             ))}
                          </div>
                        )}
                        <div className="space-y-1 overflow-y-auto flex-grow pr-0.5">
                          {dayShifts.map(shift => (
                            <div key={shift.id} className="relative">
                               <ShiftCard shift={shift} showEmployeeSelect={true} onDeleteClick={() => handleDeleteShift(shift.id)} />
                               {popoverTargetShiftId === shift.id && (
                                 <QuickAssignPopover shift={shift} users={users} employeeTotals={employeeTotals} onAssign={handleQuickAssign} onClose={() => setPopoverTargetShiftId(null)} />
                               )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse table-fixed">
            <thead className="sticky top-0 z-30 shadow-md">
              <tr className="bg-slate-200 border-b border-slate-300">
                <th className="p-2 font-black text-slate-900 uppercase tracking-widest sticky left-0 bg-slate-200 z-40 border-r-2 border-slate-300 w-24 md:w-32 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-[10px]">Staff</th>
                {dateColumns.map((day, i) => {
                  const dayEvents = getEventsForDay(day);
                  const hasSkip = dayEvents.some(e => e.impact === 'SKIP_GENERATION');
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <th key={i} className={`p-2 border-r border-slate-300 text-center relative ${isToday ? 'bg-yellow-200 ring-2 ring-inset ring-yellow-400 z-10' : (hasSkip ? 'bg-orange-100' : 'bg-slate-200')} ${colWidthClass}`}>
                      <div className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="font-bold text-slate-600 text-[10px]">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.map(e => (
                          <div key={e.id} className={`text-[7px] font-black uppercase px-1 py-0.5 rounded shadow-sm border truncate ${e.impact === 'SKIP_GENERATION' ? 'bg-orange-500 text-white border-orange-600' : 'bg-blue-600 text-white border-blue-700'}`} title={e.title}>{e.title}</div>
                        ))}
                      </div>
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-green-50 border-b-2 border-slate-400">
                <th 
                  onClick={() => setActivePainterId(activePainterId === -1 ? null : -1)}
                  className={`p-2 sticky left-0 z-40 border-r-2 border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)] align-top cursor-pointer transition-colors ${activePainterId === -1 ? 'bg-yellow-100 ring-2 ring-inset ring-yellow-400' : 'bg-green-50'}`}
                >
                  <div className="font-black text-green-900 uppercase tracking-widest flex items-center justify-between gap-1 text-[9px]">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Open
                    </div>
                    <div className={`p-1 rounded transition-all ${activePainterId === -1 ? 'bg-slate-900 text-yellow-400 shadow-sm' : 'text-slate-300 opacity-50'}`}><Paintbrush size={10} /></div>
                  </div>
                </th>
                {dateColumns.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const hasSkip = getEventsForDay(day).some(e => e.impact === 'SKIP_GENERATION');
                  return (
                    <th key={i} className={`p-1 border-r border-slate-300 min-h-[80px] align-top transition-colors ${isToday ? 'bg-yellow-50' : (hasSkip ? 'bg-orange-50' : 'bg-green-50 hover:bg-green-100/80')} ${colWidthClass}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null, day)}>
                      {visibleShifts.filter(s => isSameDay(s.startTime, day) && s.userId === null).map(shift => (
                        <div key={shift.id} className="relative">
                           <ShiftCard shift={shift} showEmployeeSelect={true} onDeleteClick={() => handleDeleteShift(shift.id)} />
                           {popoverTargetShiftId === shift.id && (
                             <QuickAssignPopover shift={shift} users={users} employeeTotals={employeeTotals} onAssign={handleQuickAssign} onClose={() => setPopoverTargetShiftId(null)} />
                           )}
                        </div>
                      ))}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={dateColumns.length + 1} className="p-4 text-center text-slate-500 font-bold italic bg-white text-xs">No matches.</td></tr>
              ) : (
                [...filteredUsers].sort((a,b) => a.name.localeCompare(b.name)).map(user => (
                  <tr key={user.id} data-testid="staff-row" className={`border-b border-slate-200 transition-colors ${activePainterId === user.id ? 'bg-yellow-100 ring-1 ring-inset ring-yellow-400 z-10' : 'bg-white hover:bg-slate-50'}`}>
                    <td data-testid="staff-name-cell" onClick={(e) => { e.stopPropagation(); setActivePainterId(activePainterId === user.id ? null : user.id); }} className={`p-2 sticky left-0 z-10 border-r-2 border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.02)] cursor-pointer group ${activePainterId === user.id ? 'bg-yellow-100' : 'bg-white'}`}>
                      <div className="flex items-center justify-between gap-1">
                         <div className="min-w-0 overflow-hidden">
                            <div className="font-black text-slate-900 truncate text-[10px]">{user.name}</div>
                            <div className={`text-[8px] font-bold mt-0.5 inline-block px-1 rounded border ${employeeTotals[user.id] >= overtimeThreshold ? 'bg-red-100 text-red-800 border-red-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>{employeeTotals[user.id]?.toFixed(1)}h</div>
                         </div>
                         <div className={`p-1 rounded transition-all ${activePainterId === user.id ? 'bg-slate-900 text-yellow-400 shadow-sm' : 'bg-slate-50 text-slate-300 opacity-0 group-hover:opacity-100'}`}><Paintbrush size={10} /></div>
                      </div>
                    </td>
                    {dateColumns.map((day, i) => {
                       const isToday = day.toDateString() === new Date().toDateString();
                       const hasSkip = getEventsForDay(day).some(e => e.impact === 'SKIP_GENERATION');
                       return (
                        <td key={i} className={`p-1 border-r border-slate-200 min-h-[70px] align-top transition-colors ${isToday ? 'bg-yellow-50/30' : (hasSkip ? 'bg-orange-50/30' : 'hover:bg-blue-50/50')} ${colWidthClass}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, user.id, day)}>
                          {visibleShifts.filter(s => isSameDay(s.startTime, day) && s.userId === user.id).map(shift => (
                            <ShiftCard key={shift.id} shift={shift} showEmployeeSelect={true} onDeleteClick={() => handleDeleteShift(shift.id)} />
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
