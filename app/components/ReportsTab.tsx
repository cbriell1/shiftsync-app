"use client";
import React from 'react';
import { AppState, Checklist, TimeCard } from '../lib/types';

export default function ReportsTab({ appState }: { appState: AppState }) {
  const { checklists, timeCards } = appState;

  // Safe sorting: Convert ISO strings to numbers for comparison
  const sortedChecklists = [...(checklists || [])].sort((a: Checklist, b: Checklist) => {
    const tcA = timeCards.find((t: TimeCard) => t.id === a.timeCardId);
    const tcB = timeCards.find((t: TimeCard) => t.id === b.timeCardId);
    
    const dateA = new Date(tcA?.clockIn || a.date).getTime();
    const dateB = new Date(tcB?.clockIn || b.date).getTime();
    
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
          sortedChecklists.map((report: Checklist) => {
            const tc = timeCards.find((t: TimeCard) => t.id === report.timeCardId);
            return (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <span className="font-black text-slate-800">
                    {report.user?.name || 'Unknown User'} @ {report.location?.name || 'Unknown Location'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                    {tc ? new Date(tc.clockIn).toLocaleDateString() : new Date(report.date).toLocaleDateString()}
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
                        {report.completedTasks.map((t: string, i: number) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-black text-red-600 uppercase mb-1">Missed Tasks ({report.missedTasks?.length || 0})</p>
                      <ul className="text-xs font-bold text-slate-600 list-disc pl-4">
                        {report.missedTasks.map((t: string, i: number) => <li key={i}>{t}</li>)}
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