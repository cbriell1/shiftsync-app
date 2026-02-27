"use client";
import React from 'react';

export default function ReportsTab({ appState }: { appState: any }) {
  const { checklists, timeCards } = appState;

  // Fix: Explicitly convert Dates to numbers for sorting and add 'any' types
  const sortedChecklists = [...(checklists || [])].sort((a: any, b: any) => {
    const dateA = new Date((timeCards || []).find((t: any) => t.id === a.timeCardId)?.clockIn || a.date || 0).getTime();
    const dateB = new Date((timeCards || []).find((t: any) => t.id === b.timeCardId)?.clockIn || b.date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Shift Reports</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Review submitted shift closing checklists and notes.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedChecklists.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
            <p className="font-bold text-slate-400 italic">No shift reports found.</p>
          </div>
        ) : (
          sortedChecklists.map((report: any) => {
            const tc = (timeCards || []).find((t: any) => t.id === report.timeCardId);
            return (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <span className="font-black text-slate-800">
                    {report.user?.name || 'Unknown User'} @ {report.location?.name || 'Unknown Location'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                    {tc ? new Date(tc.clockIn).toLocaleDateString() : 'Unknown Date'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">Notes</p>
                    <p className="text-sm font-bold text-slate-700">{report.notes || 'No notes provided.'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-black text-green-600 uppercase mb-1">Completed Tasks ({report.completedTasks?.length || 0})</p>
                      <ul className="text-xs font-bold text-slate-600 list-disc pl-4">
                        {(report.completedTasks || []).map((t: any, i: number) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-black text-red-600 uppercase mb-1">Missed Tasks ({report.missedTasks?.length || 0})</p>
                      <ul className="text-xs font-bold text-slate-600 list-disc pl-4">
                        {(report.missedTasks || []).map((t: any, i: number) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
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