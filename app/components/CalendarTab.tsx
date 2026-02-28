// filepath: app/components/CalendarTab.tsx
"use client";
import React from 'react';
import { AppState, Shift, Location, User } from '../lib/types';

export default function CalendarTab({ appState }: { appState: AppState }) {
  const {
    currentMonth, setCurrentMonth, currentYear, setCurrentYear, MONTHS, YEARS,
    calLocFilter, setCalLocFilter, locations, calEmpFilter, setCalEmpFilter, users,
    showSetup, handleGenerateSchedule, DAYS_OF_WEEK, activeCalColor, calendarCells,
    shifts, selectedUserId, getLocationColor, formatTimeSafe, handleClaimShift,
    isAdmin, isManager, setShifts
  } = appState;

  // --- ROLE & LOCATION FILTERING LOGIC ---
  const activeUserObj = users.find(u => u.id === parseInt(selectedUserId));
  const userLocationIds = activeUserObj?.locationIds ||[];
  const allowedLocationIds = userLocationIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);

  const visibleLocations = (isAdmin || isManager) 
    ? locations 
    : locations.filter(loc => allowedLocationIds.includes(loc.id));

  // --- ARROW NAVIGATION LOGIC ---
  const minYear = Math.min(...YEARS);
  const maxYear = Math.max(...YEARS);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      if (currentYear > minYear) {
        setCurrentMonth(11); // Loop to December
        setCurrentYear(currentYear - 1);
      }
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      if (currentYear < maxYear) {
        setCurrentMonth(0); // Loop to January
        setCurrentYear(currentYear + 1);
      }
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrevYear = () => {
    if (currentYear > minYear) setCurrentYear(currentYear - 1);
  };

  const handleNextYear = () => {
    if (currentYear < maxYear) setCurrentYear(currentYear + 1);
  };

  // --- SHIFT HELPERS ---
  const refreshShifts = async () => {
    try {
      const res = await fetch('/api/shifts?t=' + new Date().getTime());
      const data = await res.json();
      setShifts(data);
    } catch (err) {
      console.error("Failed to refresh shifts", err);
    }
  };

  const handleRequestCover = async (shiftId: number) => {
    if(!confirm("Are you sure you need coverage? The shift will turn red and explicitly alert managers.")) return;
    await fetch('/api/shifts', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ shiftId: shiftId, action: 'REQUEST_COVER' }) 
    });
    refreshShifts(); 
  };

  const handleCancelCover = async (shiftId: number) => {
    await fetch('/api/shifts', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ shiftId: shiftId, action: 'CANCEL_COVER' }) 
    });
    refreshShifts();
  };

  const assignCoverage = async (shiftId: number) => {
    if(!selectedUserId) return alert("Select an employee at the top of the screen first!");
    if(!confirm("Are you sure you want to assign this shift to the currently selected employee?")) return;
    await fetch('/api/shifts', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ shiftId: shiftId, userId: parseInt(selectedUserId), action: 'CLAIM' }) 
    });
    refreshShifts();
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-300 shadow-sm">
      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-slate-100 p-4 rounded-xl border border-gray-300 gap-4 shadow-inner text-sm">
        
        {/* Navigation Arrows for Month & Year */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full xl:w-auto">
          
          <div className="flex items-center space-x-1 w-full sm:w-auto">
            <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 transition" title="Previous Month">
              &lt;
            </button>
            <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className="w-full sm:w-32 h-10 border border-gray-400 rounded-lg px-2 font-black text-slate-900 bg-white shadow-sm outline-none cursor-pointer">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 transition" title="Next Month">
              &gt;
            </button>
          </div>

          <div className="flex items-center space-x-1 w-full sm:w-auto">
            <button onClick={handlePrevYear} disabled={currentYear <= minYear} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition" title="Previous Year">
              &lt;
            </button>
            <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className="w-full sm:w-24 h-10 border border-gray-400 rounded-lg px-2 font-black text-slate-900 bg-white shadow-sm outline-none cursor-pointer">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleNextYear} disabled={currentYear >= maxYear} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-200 border border-gray-400 rounded-lg shadow-sm font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition" title="Next Year">
              &gt;
            </button>
          </div>

        </div>

        {/* Global Filters & Generation */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto">
          <select value={calLocFilter} onChange={(e) => setCalLocFilter(e.target.value)} className="w-full sm:w-auto border border-blue-400 rounded-lg p-2.5 font-bold text-slate-900 bg-blue-50 shadow-sm outline-none cursor-pointer">
            <option value="">All Available Locations</option>
            {visibleLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <select value={calEmpFilter} onChange={(e) => setCalEmpFilter(e.target.value)} className="w-full sm:w-auto border border-blue-400 rounded-lg p-2.5 font-bold text-slate-900 bg-blue-50 shadow-sm outline-none cursor-pointer">
            <option value="">All Employees</option>
            <option value="OPEN">Open (Unassigned)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {showSetup && (
          <button onClick={handleGenerateSchedule} className="w-full xl:w-auto bg-green-800 hover:bg-green-900 text-white font-bold py-2.5 px-4 rounded-lg shadow-md whitespace-nowrap transition">
            + Generate Schedule
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div style={{ minWidth: '800px' }}>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_OF_WEEK.map(dayName => (
              <div key={dayName} className={`font-black text-center py-2 rounded-t-lg border shadow-sm ${activeCalColor.bg} ${activeCalColor.text} ${activeCalColor.border}`}>
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 border-l border-t border-gray-300 bg-gray-200 rounded-b-lg overflow-hidden shadow-inner">
            {calendarCells.map((dayNum, index) => {
              const dayShifts = dayNum ? shifts.filter(shift => {
                const shiftLocId = shift.locationId;

                if (!isAdmin && !isManager) {
                  if (!allowedLocationIds.includes(shiftLocId)) return false;
                }

                const sd = new Date(shift.startTime);
                const isSameDay = sd.getFullYear() === currentYear && sd.getMonth() === currentMonth && sd.getDate() === dayNum;
                
                let locMatch = true;
                if (calLocFilter !== '') locMatch = shiftLocId === parseInt(calLocFilter, 10);
                
                let empMatch = true;
                if (calEmpFilter === 'OPEN') empMatch = shift.status === 'OPEN';
                else if (calEmpFilter !== '') empMatch = shift.userId === parseInt(calEmpFilter, 10);
                
                return isSameDay && locMatch && empMatch;
              }) :[];

              const rightNow = new Date();
              const isToday = dayNum && dayNum === rightNow.getDate() && currentMonth === rightNow.getMonth() && currentYear === rightNow.getFullYear();

              return (
                <div key={index} className={`bg-white min-h-32 border-r border-b border-gray-300 p-2 flex flex-col relative ${isToday ? 'ring-4 ring-inset ring-yellow-400 bg-yellow-50 z-10' : ''}`}>
                  {dayNum && (
                    <>
                      <div className={`text-right font-black mb-2 flex justify-between items-center ${isToday ? 'text-slate-900 text-base' : 'text-gray-400 text-sm'}`}>
                        {isToday ? <span style={{ fontSize: '10px' }} className="bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded shadow-sm tracking-widest uppercase">Today</span> : <span></span>}
                        <span>{dayNum}</span>
                      </div>
                      <div className="space-y-2 overflow-y-auto flex-grow">
                        {dayShifts.map(shift => {
                          const isMyShift = shift.userId === parseInt(selectedUserId);
                          const shiftColor = getLocationColor(shift.locationId);

                          let finalBg = 'bg-white';
                          let finalBorder = shiftColor.border;
                          if (shift.status === 'OPEN') {
                            finalBg = 'bg-green-50';
                            finalBorder = 'border-green-300';
                          } else if (shift.status === 'COVERAGE_REQUESTED') {
                            finalBg = 'bg-red-50 ring-2 ring-red-500 ring-inset shadow-md shadow-red-500/30';
                            finalBorder = 'border-red-500';
                          }

                          return (
                            <div key={shift.id} className={`p-2 rounded text-xs border-l-4 shadow-md mb-2 ${finalBg} ${finalBorder}`}>
                              <div className="font-bold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis mb-1">
                                {formatTimeSafe(shift.startTime)} - {formatTimeSafe(shift.endTime)}
                              </div>
                              <div className={`text-xs font-bold mb-1 truncate ${shiftColor.text}`}>
                                {shift.location?.name}
                              </div>
                              
                              {shift.status === 'OPEN' ? (
                                (isAdmin || isManager) ? (
                                  <button onClick={async () => { 
                                    if(confirm("Assign this open shift to the currently selected employee?")) {
                                      await handleClaimShift(shift.id); 
                                    }
                                  }} className={`w-full mt-1 text-white font-bold py-1.5 rounded shadow-sm transition ${shiftColor.claim}`}>
                                    Assign Selected
                                  </button>
                                ) : (
                                  <div className="text-center font-bold text-slate-500 mt-2 text-[10px] uppercase tracking-widest border border-dashed border-slate-300 rounded py-1 bg-slate-50">
                                    Unassigned
                                  </div>
                                )
                              ) : shift.status === 'COVERAGE_REQUESTED' ? (
                                <div className="mt-1 flex flex-col gap-1">
                                  <div className="font-black text-center truncate px-1 py-1.5 rounded shadow-sm border bg-red-600 text-white text-[10px] uppercase tracking-widest animate-pulse">
                                    🚨 Needs Cover
                                  </div>
                                  <div className="text-center text-[10px] font-bold text-red-900 leading-tight mb-1">
                                    {isMyShift ? 'Your Shift' : shift.assignedTo?.name}
                                  </div>
                                  {isMyShift ? (
                                    <button onClick={() => handleCancelCover(shift.id)} className="w-full text-[10px] uppercase tracking-widest bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-1.5 rounded shadow-sm transition border border-gray-400">Cancel Request</button>
                                  ) : (isAdmin || isManager) ? (
                                    <button onClick={() => assignCoverage(shift.id)} className="w-full text-[10px] uppercase tracking-widest bg-red-700 hover:bg-red-800 text-white font-black py-1.5 rounded shadow-md transition">Assign Selected</button>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="mt-1 flex flex-col gap-1">
                                  <div className={`font-bold text-center truncate px-1 py-1 rounded shadow-sm border ${isMyShift ? 'bg-green-100 text-green-900 border-green-500' : shiftColor.badge}`}>
                                    {isMyShift ? 'Your Shift' : (shift.assignedTo?.name || 'Assigned')}
                                  </div>
                                  {isMyShift && (
                                    <button onClick={() => handleRequestCover(shift.id)} className="w-full text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300 font-bold py-1 rounded shadow-sm transition">
                                      Need Coverage
                                    </button>
                                  )}
                                </div>
                              )}
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
    </div>
  );
}