"use client";
import React from 'react';

export default function DashboardTab({ appState }) {
  const {
    isManager, handleImportTimecards, handleImportHistory, missingPunches,
    formatDateSafe, formatTimeSafe, dashHiddenWarnings, dashPeriodIndex,
    setDashPeriodIndex, periods, locations, dashLocs, toggleDashLoc, users,
    dashEmployees, toggleDashEmp, selectedUserId, dashVisibleData
  } = appState;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-300 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 text-center md:text-left">Payroll Dashboard</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          {isManager && (
            <>
              <button onClick={handleImportTimecards} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition">
                + Import Jan/Feb Timecards
              </button>
              <button onClick={handleImportHistory} className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-slate-900 text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition">
                + Import History
              </button>
            </>
          )}
        </div>
      </div>

      {/* MISSING PUNCHES WARNING */}
      {(missingPunches ||[]).length > 0 && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-600 p-4 md:p-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="w-full">
              <h3 className="text-sm md:text-base font-black text-red-900 mb-1">MISSING TIMECARDS DETECTED</h3>
              <p className="text-xs md:text-sm text-red-800 font-bold mb-3">
                {isManager ? "The following shifts were claimed for this Pay Period, but the employee never clocked their hours:" : "You claimed the following shifts this Pay Period, but haven't clocked your hours:"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {(missingPunches ||[]).map((warn, i) => (
                  <div key={i} className="bg-white border border-red-200 p-2.5 rounded-lg shadow-sm text-xs font-bold text-slate-800 flex justify-between items-center">
                    <span className="truncate pr-2">{formatDateSafe(warn.startTime)} | {warn.assignedTo?.name}</span>
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded shadow-inner border border-red-100 whitespace-nowrap">
                      {formatTimeSafe(warn.startTime)} - {formatTimeSafe(warn.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* HIDDEN FLOATING HOURS WARNING */}
      {isManager && (dashHiddenWarnings ||[]).length > 0 && (
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-500 p-4 md:p-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="w-full">
              <h3 className="text-sm md:text-base font-black text-yellow-800 mb-1">Warning: Hidden Floating Hours!</h3>
              <p className="text-xs md:text-sm text-yellow-700 font-bold mb-3">
                The following employees worked at locations you currently have unchecked. Their Dashboard Totals below do <span className="underline font-black">NOT</span> include these hours:
              </p>
              <ul className="list-disc pl-5 text-sm font-black text-yellow-900 space-y-1">
                {(dashHiddenWarnings ||[]).map((warn, i) => <li key={i}>{warn}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD FILTERS */}
      <div className={`grid grid-cols-1 gap-4 md:gap-6 mb-8 bg-slate-50 p-4 rounded-xl border border-gray-200 shadow-inner ${isManager ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div>
          <label className="block text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Select Pay Period</label>
          <select value={dashPeriodIndex} onChange={(e) => setDashPeriodIndex(parseInt(e.target.value))} className="w-full border border-gray-400 rounded-lg p-2.5 md:p-3 font-bold text-slate-900 bg-white shadow-sm outline-none cursor-pointer">
            {(periods ||[]).map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Filter by Location</label>
          <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
            {(locations ||[]).map(loc => (
              <label key={loc.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                <input type="checkbox" checked={(dashLocs ||[]).includes(loc.id)} onChange={() => toggleDashLoc(loc.id)} className="w-5 h-5 md:w-4 md:h-4 text-green-700 rounded border-gray-400 cursor-pointer" />
                <span className="text-xs md:text-sm font-bold text-slate-900">{loc.name}</span>
              </label>
            ))}
          </div>
        </div>

        {isManager && (
          <div>
            <label className="block text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Filter by Employee</label>
            <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
              {(users ||[]).map(u => (
                <label key={u.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input type="checkbox" checked={(dashEmployees ||[]).includes(u.id)} onChange={() => toggleDashEmp(u.id)} className="w-5 h-5 md:w-4 md:h-4 text-green-700 rounded border-gray-400 cursor-pointer" />
                  <span className="text-xs md:text-sm font-bold text-slate-900">{u.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DASHBOARD TABLES */}
      <div>
        {!selectedUserId && !isManager ? (
          <div className="p-8 text-center text-slate-500 font-bold italic bg-slate-50 border border-slate-300 rounded-xl shadow-inner text-sm md:text-base">
            Please select your Active Employee profile at the top to view your Dashboard.
          </div>
        ) : (!dashVisibleData || dashVisibleData.length === 0) ? (
          <div className="p-8 text-center text-slate-500 font-bold italic bg-slate-50 border border-slate-300 rounded-xl shadow-inner text-sm md:text-base">
            No hours logged for this pay period matching your filters.
          </div>
        ) : (
          dashVisibleData.map((row) => {
            const userCards = row.cards ||[];
            return (
              <div key={row.userId} className="mb-8 border border-gray-300 rounded-2xl overflow-hidden bg-white shadow-md">
                <div className="bg-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-300 gap-3">
                  <h3 className="font-black text-slate-900 text-lg md:text-xl uppercase tracking-widest">{row.name}</h3>
                  <div className="bg-slate-900 border border-slate-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm tracking-widest w-full sm:w-auto text-center">
                    Total: <span className="text-yellow-400 ml-1">{row.totalHours} hrs</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" style={{ minWidth: '600px' }}>
                    <thead className="bg-white border-b border-gray-200 text-slate-600">
                      <tr>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-900 text-xs">Day</th>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-900 text-xs">Location</th>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-900 text-xs">Start</th>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-900 text-xs">End</th>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-900 text-xs">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userCards.map(card => {
                        // Dynamically determine if the card is active right now
                        const outD = new Date(card.clockOut);
                        const isActive = !card.clockOut || isNaN(outD.getTime()) || outD.getFullYear() === 1970;

                        return (
                          <tr key={card.id} className="border-b border-gray-100 hover:bg-slate-50 transition whitespace-nowrap">
                            <td className="p-3 font-bold text-slate-900">{formatDateSafe(card.clockIn)}</td>
                            <td className="p-3 font-bold text-gray-700">{card.location?.name || 'Unknown'}</td>
                            <td className="p-3 text-green-700 font-bold">{formatTimeSafe(card.clockIn)}</td>
                            <td className={`p-3 font-bold ${isActive ? 'text-red-600 italic' : 'text-red-700'}`}>
                              {isActive ? 'Active' : formatTimeSafe(card.clockOut)}
                            </td>
                            {/* IF ACTIVE: Show a cool pulsing badge instead of a blank "h" */}
                            <td className="p-3 font-black text-slate-900 bg-slate-50 border-l border-gray-200">
                              {isActive ? (
                                <span className="text-[10px] text-red-600 bg-red-100 px-2 py-1 rounded shadow-inner uppercase tracking-widest animate-pulse border border-red-200">
                                  Working
                                </span>
                              ) : (
                                `${card.totalHours || 0}h`
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}