"use client";
import React from 'react';

export default function ReportsTab({ appState }: { appState: any }) {
  const { checklists, timeCards, formatDateSafe, formatTimeSafe, locations, users } = appState;

  // Filter logic: Match checklist to timecard, then strictly hide if the timecard is ACTIVE.
  const completedReports = (checklists ||[]).filter(report => {
    // 1. Find the parent time card
    const tc = (timeCards ||[]).find(t => t.id === report.timeCardId) || report.timeCard;
    if (!tc) return false;
    
    // 2. Determine if it is currently active
    const outD = new Date(tc.clockOut);
    const isActive = !tc.clockOut || isNaN(outD.getTime()) || outD.getFullYear() === 1970;
    
    // 3. Only keep reports that belong to CLOSED (clocked out) timecards
    return !isActive; 
  }).sort((a, b) => {
    // Sort so newest dates appear at the top
    const dateA = new Date((timeCards ||[]).find(t => t.id === a.timeCardId)?.clockIn || a.date || 0);
    const dateB = new Date((timeCards ||[]).find(t => t.id === b.timeCardId)?.clockIn || b.date || 0);
    return dateB - dateA;
  });

  return (
    <div className="bg-transparent max-w-5xl mx-auto">
      
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Shift Closing Reports Archive</h2>
        <span className="text-sm font-bold bg-slate-200 text-slate-700 px-3 py-1 rounded-lg">
          {completedReports.length} {completedReports.length === 1 ? 'Report' : 'Reports'}
        </span>
      </div>
      
      <div className="space-y-5">
        {completedReports.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-black text-slate-800 mb-1">No Completed Reports</h3>
            <p className="text-sm font-bold text-slate-500 italic">Reports will appear here automatically once employees clock out.</p>
          </div>
        ) : (
          completedReports.map(report => {
            const parentTc = (timeCards ||[]).find(t => t.id === report.timeCardId) || report.timeCard;
            const empName = (users ||[]).find(u => u.id === report.userId)?.name || report.user?.name || 'Unknown Employee';
            const locName = (locations ||[]).find(l => l.id === report.locationId)?.name || report.location?.name || 'Unknown Location';

            return (
              <div key={report.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row">
                
                {/* Left Side: Summary & Employee Info */}
                <div className="md:w-1/3 bg-slate-50 p-5 md:border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded-md tracking-wider">
                        {formatDateSafe(parentTc?.clockIn || report.date)}
                      </span>
                      <span className="text-xs font-black text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded-md shadow-sm">
                        {formatTimeSafe(parentTc?.clockIn)} - {formatTimeSafe(parentTc?.clockOut)}
                      </span>
                    </div>
                    
                    <h3 className="font-black text-slate-900 text-xl leading-tight mb-1">{empName}</h3>
                    <p className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5 mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {locName}
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tasks Completed</span>
                    <span className="text-2xl font-black text-green-600">{report.completedTasks?.length || 0}</span>
                  </div>
                </div>

                {/* Right Side: Tasks & Notes */}
                <div className="md:w-2/3 p-5 flex flex-col gap-4">
                  
                  {/* Completed Tasks */}
                  {report.completedTasks && report.completedTasks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Completed Tasks
                      </h4>
                      <ul className="space-y-1.5 bg-green-50 p-3 rounded-xl border border-green-100">
                        {report.completedTasks.map((t, i) => (
                          <li key={i} className="text-sm font-bold text-slate-700 flex items-start gap-2 leading-tight">
                            <span className="text-green-500 font-black mt-0.5">-</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missed Tasks */}
                  {report.missedTasks && report.missedTasks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incomplete Tasks
                      </h4>
                      <ul className="space-y-1.5 bg-red-50 p-3 rounded-xl border border-red-100">
                        {report.missedTasks.map((t, i) => (
                          <li key={i} className="text-sm font-bold text-red-900 flex items-start gap-2 leading-tight">
                            <span className="text-red-500 font-black mt-0.5">-</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Manager Notes */}
                  <div className="mt-auto pt-2">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Shift Notes</h4>
                    {report.notes ? (
                      <p className="text-sm font-semibold text-slate-800 bg-slate-100 p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                        &quot;{report.notes}&quot;
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                        No additional notes provided.
                      </p>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}