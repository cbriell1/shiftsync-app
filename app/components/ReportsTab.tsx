// filepath: app/components/ReportsTab.tsx
"use client";
import React from 'react';
import { Checklist, TimeCard } from '@/lib/types';
import { useAppStore } from '@/lib/store';

export default function ReportsTab() {
  // 1. Pull exactly what we need from the store
  const checklists = useAppStore(state => state.checklists);
  const timeCards = useAppStore(state => state.timeCards);

  // 2. Sort Logic
  const sortedChecklists =[...(checklists || [])].sort((a: Checklist, b: Checklist) => {
    const tcA = timeCards.find((t: TimeCard) => t.id === a.timeCardId);
    const tcB = timeCards.find((t: TimeCard) => t.id === b.timeCardId);
    const dateA = new Date(tcA?.clockIn || a.createdAt || 0).getTime();
    const dateB = new Date(tcB?.clockIn || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 italic tracking-tight">Shift Report Archive</h2>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Review historical facility closing notes.</p>
      </div>

      <div className="grid gap-4">
        {sortedChecklists.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed text-center font-black text-slate-400 uppercase tracking-widest italic">No shift reports archived.</div>
        ) : (
          sortedChecklists.map((report: Checklist) => {
            const tc = timeCards.find((t: TimeCard) => t.id === report.timeCardId);
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
                <div className="bg-slate-800 text-white px-5 py-3 flex justify-between items-center">
                  <span className="font-black text-sm md:text-base uppercase tracking-wider">{report.user?.name || 'Unknown'} @ {report.location?.name || 'Facility'}</span>
                  <span className="text-[10px] font-black bg-slate-900 px-2 py-1 rounded border border-slate-700">{tc ? new Date(tc.clockIn).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.previousShiftNotes && (
                      <div className="bg-pink-50 border border-pink-200 p-4 rounded-xl shadow-inner">
                        <span className="text-[10px] font-black text-pink-700 uppercase tracking-widest block mb-1">Carry-Over from Previous Shift</span>
                        <p className="text-sm font-bold text-slate-800 italic">"{report.previousShiftNotes}"</p>
                      </div>
                    )}
                    <div className={`${report.previousShiftNotes ? 'bg-slate-50' : 'bg-slate-50 md:col-span-2'} border border-slate-200 p-4 rounded-xl shadow-inner`}>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Shift Notes / Pass-Downs</span>
                      <p className="text-sm font-bold text-slate-800 italic">"{report.notes || 'No general notes.'}"</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b border-slate-100 pb-1">Completed Tasks</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.completedTasks.map((t, i) => (
                          <span key={i} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">✓ {t}</span>
                        ))}
                        {report.completedTasks.length === 0 && <span className="text-slate-400 italic text-xs font-bold">No tasks completed.</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b border-slate-100 pb-1">Missed / Partial</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.missedTasks.map((t, i) => (
                          <span key={i} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">✗ {t}</span>
                        ))}
                        {report.missedTasks.length === 0 && <span className="text-slate-400 italic text-xs font-bold">Everything completed!</span>}
                      </div>
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
