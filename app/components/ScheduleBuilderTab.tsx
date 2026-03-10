"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Shift, User } from '../lib/types';

// Native HTML5 Drag-and-Drop Resizable Shift Card
const ShiftCard = ({ shift, appState, showEmployeeSelect = false }: { shift: Shift, appState: AppState, showEmployeeSelect?: boolean }) => {
  const { handleUpdateShiftTime, getLocationColor, users } = appState;
  
  const [tempEnd, setTempEnd] = useState<Date>(new Date(shift.endTime));
  const startD = new Date(shift.startTime);
  const durationMs = tempEnd.getTime() - startD.getTime();
  const hours = durationMs / (1000 * 60 * 60);

  const shiftColor = getLocationColor(shift.locationId);

  let finalBg = shiftColor.bg;
  let finalBorder = shiftColor.border;
  let locTextColor = shiftColor.text;

  if (shift.status === 'OPEN') {
    finalBg = 'bg-green-50';
    finalBorder = 'border-green-400';
    locTextColor = 'text-green-900';
  } else if (shift.status === 'COVERAGE_REQUESTED') {
    finalBg = 'bg-red-50 ring-1 ring-red-500 ring-inset shadow-md shadow-red-500/30';
    finalBorder = 'border-red-500';
    locTextColor = 'text-red-900';
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('shiftId', shift.id.toString());
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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
      handleUpdateShiftTime(shift.id, shift.startTime, finalEndTime.toISOString(), shift.userId || null);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div draggable onDragStart={handleDragStart} className={`relative w-full rounded-lg shadow-sm mb-2 border-l-[5px] overflow-hidden flex flex-col transition-transform hover:shadow-md cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:z-20 ${finalBg} ${finalBorder}`}>
      <div className={`p-1.5 flex-1 flex flex-col overflow-hidden leading-tight pointer-events-none ${showEmployeeSelect ? 'pb-1' : 'pb-5'}`}>
        <div className="flex justify-between items-start mb-1">
          <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate pr-2 ${locTextColor}`}>{shift.location?.name}</span>
          <span className="text-[9px] md:text-[10px] font-black text-slate-700 bg-white/60 px-1.5 py-0.5 rounded shadow-sm">{hours.toFixed(1)}h</span>
        </div>
        <div className="font-bold text-slate-900 text-[10px] md:text-xs truncate">{startD.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {tempEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
        {shift.status === 'COVERAGE_REQUESTED' && <div className="mt-1.5 font-black text-center truncate px-1 py-1 rounded shadow-sm border bg-red-600 text-white text-[9px] uppercase tracking-widest animate-pulse">🚨 Needs Cover</div>}
        {!showEmployeeSelect && shift.status === 'OPEN' && <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Unassigned</div>}
      </div>
      {showEmployeeSelect && (
        <div className="px-1.5 pb-4 mt-auto relative z-10">
          <select value={shift.userId || ""} onChange={(e) => handleUpdateShiftTime(shift.id, shift.startTime, shift.endTime, e.target.value ? parseInt(e.target.value) : null)} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className={`w-full font-bold text-center truncate px-1 py-1 rounded shadow-sm border outline-none cursor-pointer text-[10px] transition-colors ${shift.userId === null ? 'bg-green-100 text-green-900 border-green-500 hover:bg-green-200' : `${shiftColor.badge} hover:brightness-95`}`}><option value="">- Open Shift -</option>{users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        </div>
      )}
      <div onMouseDown={handleMouseDown} className="absolute bottom-0 left-0 right-0 h-3 bg-black/5 hover:bg-black/20 cursor-ns-resize flex items-center justify-center transition-colors z-20"><div className="w-6 h-0.5 bg-black/30 rounded-full"></div></div>
    </div>
  );
};

export default function ScheduleBuilderTab({ appState }: { appState: AppState }) {
  const { 
    shifts, users, builderWeekStart, setBuilderWeekStart, 
    calLocFilter, setCalLocFilter, visibleLocations, handleUpdateShiftTime,
    DAYS_OF_WEEK, showSetup, handleGenerateSchedule, setCurrentMonth, setCurrentYear
  } = appState;

  // --- DEFAULT VIEW SET TO MONTH ---
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    const [year, month] = builderWeekStart.split('-').map(Number);
    setCurrentMonth(month - 1);
    setCurrentYear(year);
  }, [builderWeekStart, setCurrentMonth, setCurrentYear]);

  const dateColumns = useMemo(() => {
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
    return [];
  }, [builderWeekStart, viewMode]);

  const monthCells = useMemo(() => {
    if (viewMode !== 'month') return [];
    const firstDay = dateColumns[0].getDay();
    return [...Array(firstDay).fill(null), ...dateColumns];
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
    else if (viewMode === 'week') dateLabel = `${dateColumns[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dateColumns[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    else if (viewMode === 'month') dateLabel = dateColumns[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const isSameDay = (isoString: string, targetDate: Date) => {
    const d = new Date(isoString);
    return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate();
  };

  const rangeStart = dateColumns[0], rangeEnd = new Date(dateColumns[dateColumns.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const visibleShifts = shifts.filter(s => {
    const sd = new Date(s.startTime);
    const inRange = sd >= rangeStart && sd <= rangeEnd;
    const matchLoc = calLocFilter ? s.locationId === parseInt(calLocFilter) : true;
    return inRange && matchLoc;
  });

  const filteredUsers = users.filter(user => {
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

  const gridColsClass = viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7';
  const colWidthClass = viewMode === 'day' ? 'min-w-[300px] w-full' : 'min-w-[140px] w-1/7';

  return (
    <div className="bg-white p-3 md:p-6 rounded-2xl border border-gray-300 shadow-md flex flex-col h-[85vh]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight shrink-0">Builder</h2>

        <div className="flex flex-wrap items-center gap-2">
          {showSetup && (
            <button
              onClick={handleGenerateSchedule}
              className="bg-green-800 hover:bg-green-900 text-white font-black py-2 px-3 rounded-lg shadow-sm text-xs transition-all flex items-center gap-1"
            >
              <span>+</span> Generate
            </button>
          )}

          <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 shadow-sm">
            {['month', 'week', 'day'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode as any)} className={`px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${viewMode === mode ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>{mode}</button>
            ))}
          </div>

          <select value={calLocFilter} onChange={(e) => setCalLocFilter(e.target.value)} className="border border-blue-200 rounded-lg p-1.5 font-black text-slate-900 bg-blue-50 focus:border-blue-500 outline-none cursor-pointer text-[11px]">
            <option value="">All Locations</option>
            {visibleLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} {loc.isActive === false && '(Hidden)'}</option>)}
          </select>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 shadow-inner border border-slate-300">
            <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white rounded font-black transition-colors text-xs">&lt;</button>
            <span className="px-2 font-black text-[11px] text-slate-800 whitespace-nowrap text-center min-w-[110px]">{dateLabel}</span>
            <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-white rounded font-black transition-colors text-xs">&gt;</button>
          </div>

          <button onClick={jumpToToday} className="px-2 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition">
            Today
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto border-2 border-slate-200 rounded-xl relative shadow-inner bg-slate-50">
        {viewMode === 'month' ? (
          <div className="p-2 md:p-4" style={{ minWidth: '800px' }}>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS_OF_WEEK.map(dayName => (
                <div key={dayName} className="font-black text-center py-2 rounded-t-lg border shadow-sm bg-slate-800 text-white border-slate-700 uppercase tracking-widest text-xs">{dayName}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 border-l border-t border-gray-300 bg-gray-200 rounded-b-lg overflow-hidden shadow-inner">
              {monthCells.map((dateObj, index) => {
                const dayShifts = dateObj ? visibleShifts.filter(s => isSameDay(s.startTime, dateObj)) : [];
                dayShifts.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                const isToday = dateObj && dateObj.getDate() === new Date().getDate() && dateObj.getMonth() === new Date().getMonth() && dateObj.getFullYear() === new Date().getFullYear();
                return (
                  <div key={index} className={`bg-white min-h-[140px] border-r border-b border-gray-300 p-2 flex flex-col relative transition-colors ${isToday ? 'ring-4 ring-inset ring-yellow-400 bg-yellow-50/50 z-10' : ''} ${dateObj ? 'hover:bg-slate-50' : ''}`} onDragOver={(e) => { if (dateObj) e.preventDefault(); }} onDrop={(e) => { if (!dateObj) return; e.preventDefault(); const shiftId = Number(e.dataTransfer.getData('shiftId')); const targetShift = shifts.find(s => s.id === shiftId); if(targetShift) handleDrop(e, targetShift.userId || null, dateObj); }}>
                    {dateObj && (
                      <>
                        <div className={`text-right font-black mb-2 flex justify-between items-center border-b border-slate-100 pb-1 ${isToday ? 'text-slate-900 text-base' : 'text-gray-400 text-sm'}`}>{isToday ? <span style={{ fontSize: '10px' }} className="bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded shadow-sm tracking-widest uppercase">Today</span> : <span></span>}<span>{dateObj.getDate()}</span></div>
                        <div className="space-y-2 overflow-y-auto flex-grow pr-1">{dayShifts.map(shift => <ShiftCard key={shift.id} shift={shift} appState={appState} showEmployeeSelect={true} />)}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead className="bg-slate-200 sticky top-0 z-20 shadow-sm border-b-2 border-slate-300">
              <tr>
                <th className="p-4 font-black text-slate-900 uppercase tracking-widest sticky left-0 bg-slate-200 z-30 border-r-2 border-slate-300 w-48">Employee</th>
                {dateColumns.map((day, i) => (
                  <th key={i} className={`p-4 border-r border-slate-300 text-center ${colWidthClass}`}>
                    <div className="font-black text-slate-900 uppercase tracking-widest text-xs">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="font-bold text-slate-600">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-green-50 border-b-4 border-slate-300">
                <td className="p-4 sticky left-0 bg-green-50 z-10 border-r-2 border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="font-black text-green-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>Open Shifts</div>
                  <div className="text-[10px] font-bold text-green-700 mt-1">Drag from here</div>
                </td>
                {dateColumns.map((day, i) => (
                  <td key={i} className={`p-2 border-r border-slate-300 min-h-[120px] align-top transition-colors hover:bg-green-100/50 ${colWidthClass}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null, day)}>
                    {visibleShifts.filter(s => isSameDay(s.startTime, day) && s.userId === null).map(shift => <ShiftCard key={shift.id} shift={shift} appState={appState} />)}
                  </td>
                ))}
              </tr>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={dateColumns.length + 1} className="p-8 text-center text-slate-500 font-bold italic bg-white">No staff members match active filters.</td></tr>
              ) : (
                [...filteredUsers].sort((a,b) => a.name.localeCompare(b.name)).map(user => (
                  <tr key={user.id} className="border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-4 sticky left-0 bg-white z-10 border-r-2 border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <div className="font-black text-slate-900 truncate">{user.name}</div>
                      <div className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded shadow-sm border ${employeeTotals[user.id] >= overtimeThreshold ? 'bg-red-100 text-red-800 border-red-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>{employeeTotals[user.id]?.toFixed(2) || '0.00'} hrs</div>
                    </td>
                    {dateColumns.map((day, i) => (
                      <td key={i} className={`p-2 border-r border-slate-200 min-h-[100px] align-top transition-colors hover:bg-blue-50/50 ${colWidthClass}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, user.id, day)}>
                        {visibleShifts.filter(s => isSameDay(s.startTime, day) && s.userId === user.id).map(shift => <ShiftCard key={shift.id} shift={shift} appState={appState} />)}
                      </td>
                    ))}
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