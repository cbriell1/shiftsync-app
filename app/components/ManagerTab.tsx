"use client";
import React, { useState } from 'react';
import { AppState, TimeCard, User, Location } from '../lib/types';

export default function ManagerTab({ appState }: { appState: AppState }) {
  const {
    handleExportCSV, periods, manPeriods, toggleManPeriod, locations, manLocs, toggleManLoc,
    users, manEmps, toggleManEmp, hiddenWarnings, matrixRows, activeManPeriods, managerData,
    formDate, setFormDate, formStartTime, setFormStartTime, formEndTime, setFormEndTime,
    selectedLocation, setSelectedLocation, handleManualSubmit, editingCardId, setEditingCardId,
    selectedUserId, setSelectedUserId, setActiveTab,
    handleEditClick, handleDeleteClick, formatDateSafe, formatTimeSafe
  } = appState;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleManagerEditClick = (card: TimeCard) => {
    handleEditClick(card); 
    setActiveTab('manager'); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // Group managerData dynamically
  const groupedCards = (managerData || []).reduce((acc: Record<string, Record<string, TimeCard[]>>, card) => {
    if (manLocs.length > 0 && !manLocs.includes(card.locationId)) return acc;

    const locName = card.location?.name || 'Unknown Location';
    const empName = card.user?.name || 'Unknown Employee';

    if (!acc[locName]) acc[locName] = {};
    if (!acc[locName][empName]) acc[locName][empName] = [];

    acc[locName][empName].push(card);
    return acc;
  }, {});

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-300 shadow-md">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <h2 className="text-lg md:text-2xl font-black text-slate-900 text-center md:text-left">Manager View & Tools</h2>
        <button onClick={handleExportCSV} className="w-full md:w-auto bg-green-800 hover:bg-green-900 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition whitespace-nowrap">
          Export to CSV
        </button>
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
        
        <form onSubmit={(e) => { handleManualSubmit(e); setActiveTab('manager'); setTimeout(() => window.location.reload(), 500); }} className="flex flex-col md:flex-row gap-4 items-start md:items-end flex-wrap">
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
      
      <h3 className="text-lg font-black text-slate-900 mb-3">Report Filters</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 bg-slate-50 p-4 rounded-xl border border-gray-200 shadow-inner">
        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-800 mb-2">Pay Periods</label>
          <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
            {periods.map((p, i) => (
              <label key={i} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                <input type="checkbox" checked={manPeriods.includes(i)} onChange={() => toggleManPeriod(i)} className="w-5 h-5 md:w-4 md:h-4 text-orange-500 rounded border-gray-400 cursor-pointer" />
                <span className="text-xs md:text-sm font-bold text-slate-900">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-800 mb-2">Locations</label>
          <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
            {locations.map(loc => (
              <label key={loc.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                <input type="checkbox" checked={manLocs.includes(loc.id)} onChange={() => toggleManLoc(loc.id)} className="w-5 h-5 md:w-4 md:h-4 text-orange-500 rounded border-gray-400 cursor-pointer" />
                <span className="text-xs md:text-sm font-bold text-slate-900">{loc.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-800 mb-2">Employees</label>
          <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
            {users.map(u => (
              <label key={u.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                <input type="checkbox" checked={manEmps.includes(u.id)} onChange={() => toggleManEmp(u.id)} className="w-5 h-5 md:w-4 md:h-4 text-orange-500 rounded border-gray-400 cursor-pointer" />
                <span className="text-xs md:text-sm font-bold text-slate-900">{u.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {hiddenWarnings.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-black text-yellow-800">Warning: Hidden Floating Hours!</h3>
              <ul className="list-disc pl-5 mt-2 font-black text-yellow-900 text-sm">
                {hiddenWarnings.map((warn, i) => <li key={i}>{warn}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-lg font-black text-slate-900 mb-3">Hours Matrix</h3>
      <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm mb-10">
        <table className="w-full text-left text-sm" style={{ minWidth: '700px' }}>
          <thead className="bg-slate-100 border-b border-gray-300 text-slate-800">
            <tr>
              <th className="p-3 font-black text-slate-900 border-r border-gray-300">Location</th>
              <th className="p-3 font-black text-slate-900 border-r border-gray-300">Employee</th>
              {activeManPeriods.map(p => <th key={p.label} className="p-3 font-black text-slate-900 border-r border-gray-300 text-center">{p.label}</th>)}
              <th className="p-3 font-black text-blue-900 bg-blue-100 text-center border-l border-blue-300">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.length === 0 ? (
              <tr><td colSpan={10} className="p-6 text-center font-bold text-slate-500 italic bg-white">No data match.</td></tr>
            ) : (
              matrixRows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-slate-50 transition whitespace-nowrap">
                  <td className="p-3 font-bold text-gray-700 border-r border-gray-200">{row.locName}</td>
                  <td className="p-3 font-black text-slate-900 border-r border-gray-200">{row.empName}</td>
                  {activeManPeriods.map(p => {
                    const val = row.periodTotals.get(p.label);
                    return (
                      <td key={p.label} className={`p-3 font-bold text-center border-r border-gray-200 ${val > 0 ? 'text-green-800 bg-green-50' : 'text-gray-400'}`}>
                        {val > 0 ? val.toFixed(2) + 'h' : '-'}
                      </td>
                    );
                  })}
                  <td className="p-3 font-black text-blue-900 bg-blue-50 text-center border-l-2 border-blue-200">{row.totalRowHours.toFixed(2)}h</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-black text-slate-900 mb-4 border-b border-gray-200 pb-2">Detailed Time Cards</h3>
      
      {Object.keys(groupedCards).length === 0 ? (
        <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-bold italic shadow-sm">No cards.</div>
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
                            <div className="p-3 md:p-4 space-y-3 bg-white">
                              {cards.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => {
                                const isActive = !card.clockOut || isNaN(new Date(card.clockOut).getTime()) || new Date(card.clockOut).getFullYear() === 1970;
                                return (
                                  <div key={card.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 rounded-lg gap-4">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                      <span className="font-black text-slate-800">{formatDateSafe(card.clockIn)}</span>
                                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                        <span className="text-green-700">{formatTimeSafe(card.clockIn)}</span>
                                        <span>→</span>
                                        <span className={isActive ? 'text-red-600 animate-pulse' : 'text-slate-800'}>{isActive ? 'Active' : formatTimeSafe(card.clockOut!)}</span>
                                      </div>
                                      <span className="text-sm font-black text-blue-700">{card.totalHours?.toFixed(2)}h</span>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                      <button onClick={() => handleManagerEditClick(card)} className="px-5 py-2 text-xs bg-orange-50 text-orange-900 border border-orange-200 font-bold rounded-lg">Edit</button>
                                      <button onClick={() => { handleDeleteClick(card.id); setTimeout(() => window.location.reload(), 400); }} className="px-5 py-2 text-xs bg-red-50 text-red-700 border border-red-200 font-bold rounded-lg">Delete</button>
                                    </div>
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