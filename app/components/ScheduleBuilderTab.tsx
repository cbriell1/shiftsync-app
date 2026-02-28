// filepath: app/components/ScheduleBuilderTab.tsx
"use client";
import React, { useState } from 'react';
import { AppState, Shift, User } from '../lib/types';

// Native HTML5 Drag-and-Drop Resizable Shift Card
const ShiftCard = ({ shift, appState }: { shift: Shift, appState: AppState }) => {
  const { handleUpdateShiftTime, getLocationColor } = appState;
  
  // Use local state during mouse drag to ensure the UI feels completely smooth
  const [tempEnd, setTempEnd] = useState<Date>(new Date(shift.endTime));
  
  const startD = new Date(shift.startTime);
  const durationMs = tempEnd.getTime() - startD.getTime();
  const hours = durationMs / (1000 * 60 * 60);

  const shiftColor = getLocationColor(shift.locationId);

  // HTML5 Drag Event Handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('shiftId', shift.id.toString());
  };

  // Mouse Resize Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevents the card from dragging while resizing

    const startY = e.clientY;
    const originalEnd = new Date(shift.endTime).getTime();
    let currentMinsAdded = 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // For every 15 pixels dragged, add or remove 15 minutes
      currentMinsAdded = Math.round(deltaY / 15) * 15;
      setTempEnd(new Date(originalEnd + currentMinsAdded * 60000));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const finalEndTime = new Date(originalEnd + currentMinsAdded * 60000);
      
      // Prevent negative durations
      if (finalEndTime.getTime() <= startD.getTime()) {
        setTempEnd(new Date(shift.endTime));
        return;
      }
      
      // Fire the global update hook
      handleUpdateShiftTime(shift.id, shift.startTime, finalEndTime.toISOString(), shift.userId || null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      draggable 
      onDragStart={handleDragStart}
      className={`relative rounded-lg shadow-sm mb-2 border-l-4 overflow-hidden flex flex-col transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing ${shiftColor.bg} ${shiftColor.border}`}
    >
      <div className="p-2 pb-5">
        <div className="flex justify-between items-start mb-1">
          <span className={`text-[10px] font-black uppercase tracking-widest ${shiftColor.text}`}>
            {shift.location?.name}
          </span>
          <span className="text-[10px] font-black text-slate-700 bg-white/50 px-1.5 py-0.5 rounded">
            {hours.toFixed(1)}h
          </span>
        </div>
        <div className="font-bold text-slate-900 text-xs truncate">
          {startD.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {tempEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
      
      {/* Bottom Resize Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 left-0 right-0 h-4 bg-black/5 hover:bg-black/10 cursor-ns-resize flex items-center justify-center transition-colors"
      >
        <div className="w-8 h-1 bg-black/20 rounded-full"></div>
      </div>
    </div>
  );
};


export default function ScheduleBuilderTab({ appState }: { appState: AppState }) {
  const { 
    shifts, users, builderWeekStart, setBuilderWeekStart, 
    calLocFilter, setCalLocFilter, locations, handleUpdateShiftTime 
  } = appState;

  const startOfWeek = new Date(builderWeekStart);
  startOfWeek.setHours(0, 0, 0, 0);

  // Generate the 7 Date objects for the current week columns
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Calculate End of Week to filter shifts
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Helper to jump weeks
  const changeWeek = (direction: number) => {
    const newDate = new Date(startOfWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setBuilderWeekStart(newDate.toISOString().split('T')[0]);
  };

  // Helper to ensure a shift belongs in a specific day column
  const isSameDay = (isoString: string, targetDate: Date) => {
    const d = new Date(isoString);
    return d.getFullYear() === targetDate.getFullYear() && 
           d.getMonth() === targetDate.getMonth() && 
           d.getDate() === targetDate.getDate();
  };

  // Pre-filter shifts that belong to this week and active location filter
  const weeklyShifts = shifts.filter(s => {
    const sd = new Date(s.startTime);
    const inWeek = sd >= startOfWeek && sd <= endOfWeek;
    const matchLoc = calLocFilter ? s.locationId === parseInt(calLocFilter) : true;
    return inWeek && matchLoc;
  });

  // NEW: Filter employees based on the active location dropdown
  const filteredUsers = users.filter(user => {
    if (!calLocFilter) return true; // Show all staff if "All Locations" is selected
    const selectedLocId = parseInt(calLocFilter, 10);
    // Ensure the user's locationIds array includes the currently filtered location
    return user.locationIds?.includes(selectedLocId);
  });

  // Calculate total assigned hours per employee for the visual column
  const employeeTotals = filteredUsers.reduce((acc: Record<number, number>, user) => {
    const userShifts = weeklyShifts.filter(s => s.userId === user.id);
    const totalHours = userShifts.reduce((sum, s) => {
      const ms = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
      return sum + (ms / (1000 * 60 * 60));
    }, 0);
    acc[user.id] = totalHours;
    return acc;
  }, {});

  // HTML5 Drop Handler
  const handleDrop = (e: React.DragEvent, targetUserId: number | null, targetDate: Date) => {
    e.preventDefault();
    const shiftId = Number(e.dataTransfer.getData('shiftId'));
    const targetShift = shifts.find(s => s.id === shiftId);
    
    if (!targetShift) return;

    // Calculate the exact time shift to preserve the duration and time of day
    const originalStart = new Date(targetShift.startTime);
    const originalEnd = new Date(targetShift.endTime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    // Set the new date, keeping the original hours and minutes
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Push the update to the Database via AppState
    handleUpdateShiftTime(shiftId, newStart.toISOString(), newEnd.toISOString(), targetUserId);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-300 shadow-md flex flex-col h-[85vh]">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Visual Schedule Builder</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Drag to assign employees. Drag the bottom of a shift to stretch time.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={calLocFilter} 
            onChange={(e) => setCalLocFilter(e.target.value)} 
            className="border-2 border-blue-200 rounded-xl p-2.5 font-black text-slate-900 bg-blue-50 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-300">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white rounded-lg font-black transition-colors">&lt;</button>
            <span className="px-4 font-black text-sm text-slate-800 whitespace-nowrap">
              {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white rounded-lg font-black transition-colors">&gt;</button>
          </div>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="flex-grow overflow-auto border-2 border-slate-200 rounded-xl relative shadow-inner bg-slate-50">
        <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
          
          {/* Grid Header (Sticky) */}
          <thead className="bg-slate-200 sticky top-0 z-20 shadow-sm border-b-2 border-slate-300">
            <tr>
              <th className="p-4 font-black text-slate-900 uppercase tracking-widest sticky left-0 bg-slate-200 z-30 border-r-2 border-slate-300 w-48">
                Employee
              </th>
              {weekDays.map((day, i) => (
                <th key={i} className="p-4 border-r border-slate-300 text-center w-40">
                  <div className="font-black text-slate-900 uppercase tracking-widest text-xs">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="font-bold text-slate-600">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* ROW 0: OPEN SHIFTS (Always pinned at top) */}
            <tr className="bg-green-50/50 border-b-4 border-slate-300">
              <td className="p-4 sticky left-0 bg-green-50/90 z-10 border-r-2 border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <div className="font-black text-green-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Open Shifts
                </div>
                <div className="text-[10px] font-bold text-green-700 mt-1">Drag from here</div>
              </td>
              {weekDays.map((day, i) => (
                <td 
                  key={i} 
                  className="p-2 border-r border-slate-300 bg-green-50/30 min-h-[120px] align-top transition-colors hover:bg-green-100/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, null, day)}
                >
                  {weeklyShifts
                    .filter(s => isSameDay(s.startTime, day) && s.userId === null)
                    .map(shift => (
                      <ShiftCard key={shift.id} shift={shift} appState={appState} />
                    ))
                  }
                </td>
              ))}
            </tr>

            {/* ROWS 1...N: Employees (Filtered by Location) */}
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-bold italic bg-white">
                  No staff members are currently assigned to this location. You can assign them in the "Staff" tab.
                </td>
              </tr>
            ) : (
              [...filteredUsers].sort((a,b) => a.name.localeCompare(b.name)).map(user => (
                <tr key={user.id} className="border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  
                  <td className="p-4 sticky left-0 bg-white z-10 border-r-2 border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="font-black text-slate-900 truncate">{user.name}</div>
                    <div className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded shadow-sm border ${
                      employeeTotals[user.id] >= 40 
                        ? 'bg-red-100 text-red-800 border-red-300' 
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      {employeeTotals[user.id]?.toFixed(2) || '0.00'} hrs total
                    </div>
                  </td>

                  {weekDays.map((day, i) => (
                    <td 
                      key={i} 
                      className="p-2 border-r border-slate-200 min-h-[100px] align-top transition-colors hover:bg-blue-50/50"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, user.id, day)}
                    >
                      {weeklyShifts
                        .filter(s => isSameDay(s.startTime, day) && s.userId === user.id)
                        .map(shift => (
                          <ShiftCard key={shift.id} shift={shift} appState={appState} />
                        ))
                      }
                    </td>
                  ))}

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}