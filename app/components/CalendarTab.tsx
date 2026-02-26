"use client";
import React from 'react';

export default function CalendarTab({ appState }) {
  const {
    currentMonth, setCurrentMonth, currentYear, setCurrentYear, MONTHS, YEARS,
    calLocFilter, setCalLocFilter, locations, calEmpFilter, setCalEmpFilter, users,
    showSetup, handleGenerateSchedule, DAYS_OF_WEEK, activeCalColor, calendarCells,
    shifts, selectedUserId, getLocationColor, formatTimeSafe, handleClaimShift,
    isAdmin, isManager
  } = appState;

  // --- ROLE & LOCATION FILTERING LOGIC ---
  
  // 1. Find the current user object and their assigned locations
  const activeUserObj = users.find(u => u.id === parseInt(selectedUserId));
  
  // Use locationIds from the user object. If none, default to empty array.
  const userLocationIds = activeUserObj?.locationIds || [];
  
  // Ensure we are comparing numbers to numbers
  const allowedLocationIds = userLocationIds.map(id => parseInt(id, 10));

  // 2. Filter the Location Dropdown list
  // Managers and Admins see all locations. Staff see only assigned ones.
  const visibleLocations = (isAdmin || isManager) 
    ? locations 
    : locations.filter(loc => allowedLocationIds.includes(parseInt(loc.id, 10)));

  // --- ACTIONS ---

  const handleRequestCover = async (shiftId) => {
    if(!confirm("Are you sure you need coverage? The shift will turn orange and be offered to other employees.")) return;
    await fetch('/api/shifts', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ shiftId: shiftId, action: 'REQUEST_COVER' }) 
    });
    window.location.reload(); 
  };

  const handleCancelCover = async (shiftId) => {
    await fetch('/api/shifts', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ shiftId: shiftId, action: 'CANCEL_COVER' }) 
    });
    window.location.reload();
  };

  const claimCoverage = async (shiftId) => {
    if(!selectedUserId) return alert("Select an active employee at the top first!");
    if(!confirm("Are you sure you want to cover this shift? It will become yours.")) return;
    await fetch('/api/shifts', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ shiftId: shiftId, userId: parseInt(selectedUserId), action: 'CLAIM' }) 
    });
    window.location.reload();
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-300 shadow-sm">
      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-slate-100 p-4 rounded-xl border border-gray-300 gap-4 shadow-inner text-sm">
        
        {/* Month/Year Selection */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto">
          <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className="w-full sm:w-auto border border-gray-400 rounded-lg p-2 font-black text-slate-900 bg-white shadow-sm outline-none">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className="w-full sm:w-auto border border-gray-400 rounded-lg p-2 font-black text-slate-900 bg-white shadow-sm outline-none">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full xl:w-auto">
          <select value={calLocFilter} onChange={(e) => setCalLocFilter(e.target.value)} className="w-full sm:w-auto border border-blue-400 rounded-lg p-2 font-bold text-slate-900 bg-blue-50 shadow-sm outline-none">
            <option value="">All Available Locations</option>
            {visibleLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <select value={calEmpFilter} onChange={(e) => setCalEmpFilter(e.target.value)} className="w-full sm:w-auto border border-blue-400 rounded-lg p-2 font-bold text-slate-900 bg-blue-50 shadow-sm outline-none">
            <option value="">All Employees</option>
            <option value="OPEN">Open (Unclaimed)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {showSetup && (
          <button onClick={handleGenerateSchedule} className="w-full xl:w-auto bg-green-800 hover:bg-green-900 text-white font-bold py-2 px-4 rounded-lg shadow-md whitespace-nowrap transition">
            + Generate Schedule
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div style={{ minWidth: '800px' }}>
          {/* Calendar Header Days */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_OF_WEEK.map(dayName => (
              <div key={dayName} className={`font-black text-center py-2 rounded-t-lg border shadow-sm ${activeCalColor.bg} ${activeCalColor.text} ${activeCalColor.border}`}>
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 border-l border-t border-gray-300 bg-gray-200 rounded-b-lg overflow-hidden shadow-inner">
            {calendarCells.map((dayNum, index) => {
              const dayShifts = dayNum ? shifts.filter(shift => {
                const shiftLocId = parseInt(shift.locationId, 10);

                // --- RBAC Filter ---
                // If the user isn't an admin/manager, hide shifts for locations they aren't assigned to
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
              }) : [];

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
                            finalBg = 'bg-orange-50';
                            finalBorder = 'border-orange-500';
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
                                <button onClick={() => { handleClaimShift(shift.id); setTimeout(() => window.location.reload(), 500); }} className={`w-full mt-1 text-white font-bold py-1.5 rounded shadow-sm transition ${shiftColor.claim}`}>
                                  Claim
                                </button>
                              ) : shift.status === 'COVERAGE_REQUESTED' ? (
                                <div className="mt-1 flex flex-col gap-1">
                                  <div className="font-bold text-center truncate px-1 py-1 rounded shadow-sm border bg-orange-100 text-orange-900 border-orange-500">
                                    {isMyShift ? 'You Requested Cover' : `${shift.assignedTo?.name || 'Staff'} Needs Cover`}
                                  </div>
                                  {isMyShift ? (
                                    <button onClick={() => handleCancelCover(shift.id)} className="w-full text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 rounded shadow-sm transition border border-gray-400">Cancel Request</button>
                                  ) : (
                                    <button onClick={() => claimCoverage(shift.id)} className="w-full text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold py-1.5 rounded shadow-md transition">Cover Shift</button>
                                  )}
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