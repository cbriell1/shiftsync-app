"use client";
import React, { useState } from 'react';
import { AppState, Shift } from '../lib/types';

// Constants for the Timeline View
const TIMELINE_START_HOUR = 6; // 6:00 AM
const TIMELINE_END_HOUR = 24;  // 12:00 AM (Midnight)
const HOUR_HEIGHT = 70;        // pixels per hour

const TIME_LABELS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }, 
  (_, i) => i + TIMELINE_START_HOUR
);

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
      className={`relative w-full h-full rounded shadow-sm border overflow-hidden flex flex-col transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing hover:z-20 ${shiftColor.bg} ${shiftColor.border}`}
    >
      <div className={`px-1.5 py-0.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate border-b flex-shrink-0 ${shiftColor.badge}`}>
        {shift.location?.name}
      </div>
      <div className="p-1.5 flex-1 flex flex-col overflow-hidden leading-tight">
        <div className="font-bold text-slate-900 text-[10px] md:text-xs truncate">
          {startD.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {tempEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div className="text-[10px] font-bold text-slate-600 mt-0.5">
          {hours.toFixed(1)}h
        </div>
      </div>
      
      {/* Bottom Resize Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 left-0 right-0 h-3 bg-black/5 hover:bg-black/10 cursor-ns-resize flex items-center justify-center transition-colors z-10"
      >
        <div className="w-6 h-0.5 bg-black/20 rounded-full"></div>
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
            {locations.filter(l => l.isActive !== false).map(loc => (
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

      {/* Main Timeline Wrapper */}
      <div className="flex-grow overflow-auto border border-slate-300 rounded-xl shadow-inner bg-slate-50 flex flex-col relative">
        
        {/* --- TIMELINE HEADER --- */}
        <div className="flex bg-slate-200 border-b-2 border-slate-300 sticky top-0 z-40 shadow-sm">
          {/* Left Y-Axis Header Spacer */}
          <div className="w-24 md:w-32 flex-shrink-0 border-r-2 border-slate-300 bg-slate-200 p-3 flex flex-col justify-end">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Employee</span>
          </div>
          
          {/* Day Columns Header */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-slate-300 min-w-[800px]">
            {weekDays.map((day, i) => (
              <div key={i} className="p-3 text-center">
                <div className="font-black text-slate-900 uppercase tracking-widest text-xs">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="font-bold text-slate-600 text-sm">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- TIMELINE BODY --- */}
        <div className="flex flex-1 relative min-w-[800px]">
          
          {/* Y-Axis / Employee List */}
          <div className="w-24 md:w-32 flex-shrink-0 border-r-2 border-slate-300 bg-white sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
            
            {/* "Open Shifts" Row Header */}
            <div className="border-b-4 border-slate-300 bg-green-50 p-3 relative h-[250px]">
              <div className="font-black text-green-900 text-[10px] md:text-xs uppercase tracking-widest leading-tight">
                Open Shifts
              </div>
              <div className="text-[9px] font-bold text-green-700 mt-1 leading-tight hidden md:block">
                Drag from here to assign
              </div>
            </div>

            {/* Employee Row Headers */}
            {filteredUsers.sort((a,b) => a.name.localeCompare(b.name)).map(user => (
              <div key={user.id} className="border-b border-slate-200 p-3 bg-white h-[200px] relative">
                <div className="font-black text-slate-900 text-xs md:text-sm leading-tight truncate" title={user.name}>
                  {user.name}
                </div>
                <div className={`text-[10px] font-bold mt-1 inline-block px-1.5 py-0.5 rounded border ${
                  employeeTotals[user.id] >= 40 
                    ? 'bg-red-100 text-red-800 border-red-300' 
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {employeeTotals[user.id]?.toFixed(1) || '0'} hrs
                </div>
              </div>
            ))}
          </div>

          {/* Grid Background Lines (Absolute positioned behind shifts) */}
          <div className="absolute inset-0 left-24 md:left-32 pointer-events-none z-0">
            {/* Draw horizontal lines for time increments if desired, though here we align by employee rows */}
          </div>

          {/* Data Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200 relative z-10">
            
            {/* Render 7 day columns */}
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="flex flex-col relative min-w-[120px]">
                
                {/* OPEN SHIFTS CELL */}
                <div 
                  className="relative border-b-4 border-slate-300 bg-green-50/30 p-1 hover:bg-green-100/50 transition-colors h-[250px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, null, day)}
                >
                  <div className="absolute inset-1 overflow-y-auto space-y-1">
                    {weeklyShifts
                      .filter(s => isSameDay(s.startTime, day) && s.userId === null)
                      .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map(shift => (
                        <div key={shift.id} className="h-16">
                          <ShiftCard shift={shift} appState={appState} />
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* EMPLOYEE CELLS */}
                {filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    className="relative border-b border-slate-200 p-1 hover:bg-blue-50/50 transition-colors h-[200px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, user.id, day)}
                  >
                    <div className="absolute inset-1 overflow-y-auto space-y-1">
                      {weeklyShifts
                        .filter(s => isSameDay(s.startTime, day) && s.userId === user.id)
                        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map(shift => (
                          <div key={shift.id} className="h-16">
                            <ShiftCard shift={shift} appState={appState} />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}

              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}