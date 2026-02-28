// filepath: app/components/TimesheetsTab.tsx
"use client";
import React, { useState } from 'react';
import { AppState, TimeCard } from '../lib/types';

export default function TimesheetsTab({ appState }: { appState: AppState }) {
  const {
    managerData, formDate, setFormDate, formStartTime, setFormStartTime, 
    formEndTime, setFormEndTime, selectedLocation, setSelectedLocation, 
    handleManualSubmit, editingCardId, setEditingCardId, selectedUserId, 
    setSelectedUserId, setActiveTab, handleEditClick, handleDeleteClick, 
    formatDateSafe, formatTimeSafe, handleUpdateCardStatus, checklists,
    users, locations, manLocs
  } = appState;

  const[expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedReports, setExpandedReports] = useState<Record<number, boolean>>({});
  
  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleReport = (id: number) => {
    setExpandedReports(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleManagerEditClick = (card: TimeCard) => {
    handleEditClick(card); 
    setActiveTab('timesheets'); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // Group managerData dynamically
  const groupedCards = (managerData ||[]).reduce((acc: Record<string, Record<string, TimeCard[]>>, card) => {
    if (manLocs.length > 0 && !manLocs.includes(card.locationId)) return acc;

    const locName = card.location?.name || 'Unknown Location';
    const empName = card.user?.name || 'Unknown Employee';

    if (!acc[locName]) acc[locName] = {};
    if (!acc[locName][empName]) acc[locName][empName] =[];

    acc[locName][empName].push(card);
    return acc;
  }, {});

  const renderStatusBadge = (status: string | undefined) => {
    if (status === 'APPROVED') return <span className="text-green-700 bg-green-100 px-2 py-1 rounded text-[10px] uppercase tracking-widest font-black border border-green-300">Approved</span>;
    if (status === 'FLAGGED') return <span className="text-red-700 bg-red-100 px-2 py-1 rounded text-[10px] uppercase tracking-widest font-black border border-red-300">Flagged</span>;
    return <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-[10px] uppercase tracking-widest font-black border border-yellow-300">Pending</span>;
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-300 shadow-md">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-slate-900 text-center md:text-left">Timesheets & Auditing</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Review hours, approve timecards, and read shift reports inline.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-300 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h2 className="text-lg md:text-xl font-black text-slate-900">
            {editingCardId ? 'Edit Time Entry' : 'Manual Time Entry'}
          </h2>
        </div>
        
        <form onSubmit={handleManualSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end flex-wrap">
          <div className="w-full md:w-auto flex-grow">
            <label className="block text-sm font-bold text-slate-700 mb-1">Employee</label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2.5 text-slate-900 font-black focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
              <option value="">-- Select --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="w-full md:w-auto flex-grow">
            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2.5 text-slate-900 font-black focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
          </div>

          <div className="w-full md:w-auto flex-grow">
            <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
            <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2.5 text-slate-900 font-black focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
          </div>

          <div className="w-full md:w-auto flex-grow">
            <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
            <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className="w-full border border-gray-400 rounded-lg p-2.5 text-slate-900 font-black focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
          </div>

          <div className="w-full md:w-auto flex-grow">
            <label className="block text-sm font-bold text-slate-700 mb-1">Location</label>
            <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2.5 text-slate-900 font-black focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
              <option value="">-- Select --</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-2 md:pb-6">
            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg shadow-md transition whitespace-nowrap">
              {editingCardId ? 'Update Entry' : 'Save Entry'}
            </button>
            {editingCardId && (
              <button type="button" onClick={() => { setEditingCardId(null); setFormDate(''); setFormStartTime(''); setFormEndTime(''); setSelectedLocation(''); setSelectedUserId(''); }} className="w-full bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-6 rounded-lg shadow-sm transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      <h3 className="text-xl font-black text-slate-900 mb-4 border-b border-gray-200 pb-2">Detailed Time Cards</h3>
      
      {Object.keys(groupedCards).length === 0 ? (
        <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-bold italic shadow-sm">
          No cards match the active filters on the Dashboard.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedCards).sort().map(locName => {
            const locKey = `loc-${locName}`;
            const empGroups = groupedCards[locName];
            let locTotal = 0;
            Object.values(empGroups).forEach(group => group.forEach(c => locTotal += (c.totalHours || 0)));

            return (
              <div key={locName} className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                <button onClick={() => toggleGroup(locKey)} className="w-full bg-slate-800 text-white p-4 md:p-5 flex justify-between items-center hover:bg-slate-700 transition">
                  <span className="text-lg md:text-xl font-black tracking-wide">{locName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-600">{locTotal.toFixed(2)} hrs</span>
                    <svg className={`h-6 w-6 transition-transform ${expandedGroups[locKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>

                {expandedGroups[locKey] && (
                  <div className="p-3 md:p-5 bg-slate-50 space-y-4">
                    {Object.keys(empGroups).sort().map(empName => {
                      const empKey = `emp-${locName}-${empName}`;
                      const cards = empGroups[empName];
                      const empTotal = cards.reduce((sum, c) => sum + (c.totalHours || 0), 0);

                      return (
                        <div key={empName} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                          <button onClick={() => toggleGroup(empKey)} className="w-full bg-blue-50 text-blue-900 p-3 md:p-4 flex justify-between items-center border-b border-blue-100">
                            <span className="font-black text-sm md:text-base uppercase tracking-widest">{empName}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs md:text-sm font-black bg-blue-200 text-blue-800 px-3 py-1 rounded shadow-sm">{empTotal.toFixed(2)} hrs</span>
                              <svg className={`h-5 w-5 transition-transform ${expandedGroups[empKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </button>
                          
                          {expandedGroups[empKey] && (
                            <div className="p-3 md:p-4 space-y-4 bg-white">
                              {cards.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => {
                                const isActive = !card.clockOut || isNaN(new Date(card.clockOut).getTime()) || new Date(card.clockOut).getFullYear() === 1970;
                                const isSuspicious = card.totalHours && (card.totalHours > 10 || card.totalHours < 1);
                                const report = checklists.find(c => c.timeCardId === card.id);

                                return (
                                  <div key={card.id} className="flex flex-col border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 bg-white">
                                      
                                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto">
                                        <div className="flex items-center gap-3">
                                          {renderStatusBadge(card.status)}
                                          <span className="font-black text-slate-800">{formatDateSafe(card.clockIn)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                          <span className="text-green-700">{formatTimeSafe(card.clockIn)}</span>
                                          <span>→</span>
                                          <span className={isActive ? 'text-red-600 animate-pulse' : 'text-slate-800'}>{isActive ? 'Active' : formatTimeSafe(card.clockOut!)}</span>
                                        </div>
                                        <span className={`text-sm font-black ${isSuspicious ? 'text-red-600 bg-red-100 px-2 py-0.5 rounded shadow-sm' : 'text-blue-700'}`}>
                                          {card.totalHours != null ? `${card.totalHours.toFixed(2)}h` : (card.clockOut ? '0.00h' : '')}
                                        </span>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                        {(!card.status || card.status === 'PENDING' || card.status === 'FLAGGED') && (
                                          <button onClick={() => handleUpdateCardStatus([card.id], 'APPROVED')} className="px-4 py-1.5 text-xs bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 font-bold rounded-lg transition-colors">
                                            Approve
                                          </button>
                                        )}
                                        {card.status !== 'FLAGGED' && (
                                          <button onClick={() => handleUpdateCardStatus([card.id], 'FLAGGED')} className="px-4 py-1.5 text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold rounded-lg transition-colors">
                                            Flag
                                          </button>
                                        )}
                                        
                                        <div className="h-6 w-px bg-slate-300 hidden md:block mx-1"></div>

                                        <button onClick={() => handleManagerEditClick(card)} className="px-4 py-1.5 text-xs bg-orange-50 text-orange-900 border border-orange-200 font-bold rounded-lg hover:bg-orange-100 transition-colors">Edit</button>
                                        <button onClick={() => handleDeleteClick(card.id)} className="px-4 py-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg hover:bg-slate-200 transition-colors">Delete</button>
                                      </div>
                                    </div>

                                    {/* Embedded Shift Report */}
                                    {report && (
                                      <div className="border-t border-slate-200 bg-slate-50">
                                        <button 
                                          onClick={() => toggleReport(card.id)} 
                                          className="w-full flex items-center justify-between p-3 text-xs font-black text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-widest"
                                        >
                                          <span>Shift Report Attached</span>
                                          <svg className={`h-4 w-4 transition-transform ${expandedReports[card.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        
                                        {expandedReports[card.id] && (
                                          <div className="p-4 pt-0">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                              <div>
                                                <span className="text-xs font-black uppercase tracking-widest text-green-700 mb-2 block">Completed ({report.completedTasks.length})</span>
                                                <ul className="text-xs font-bold text-slate-700 space-y-1 pl-4 list-disc">
                                                  {report.completedTasks.length > 0 ? report.completedTasks.map(t => <li key={t}>{t}</li>) : <li className="italic text-slate-400">None</li>}
                                                </ul>
                                              </div>
                                              <div>
                                                <span className="text-xs font-black uppercase tracking-widest text-red-700 mb-2 block">Missed ({report.missedTasks.length})</span>
                                                <ul className="text-xs font-bold text-slate-700 space-y-1 pl-4 list-disc">
                                                  {report.missedTasks.length > 0 ? report.missedTasks.map(t => <li key={t}>{t}</li>) : <li className="italic text-slate-400">None</li>}
                                                </ul>
                                              </div>
                                            </div>
                                            {report.notes && (
                                              <div className="mt-3 bg-white p-3 border-l-4 border-slate-400 rounded-r-lg text-sm text-slate-800 font-bold shadow-sm italic">
                                                "{report.notes}"
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}