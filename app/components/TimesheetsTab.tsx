// filepath: app/components/TimesheetsTab.tsx
"use client";
import React, { useState, useMemo } from 'react';
import { TimeCard } from '../lib/types';
import { useAppStore } from '@/lib/store';
import { formatDateSafe, formatTimeSafe } from '@/lib/common';

export default function TimesheetsTab({ appState }: any) {
  // 1. Store Subscriptions
  const managerData = useAppStore(state => state.managerData);
  const users = useAppStore(state => state.users);
  const locations = useAppStore(state => state.locations);
  const manLocs = useAppStore(state => state.manLocs);
  const checklists = useAppStore(state => state.checklists);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  const fetchManagerData = useAppStore(state => state.fetchManagerData);
  const fetchTimeCards = useAppStore(state => state.fetchTimeCards);

  // 2. Compute Roles
  const activeUserObj = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUserObj?.systemRoles?.includes('Administrator');
  const isManager = activeUserObj?.systemRoles?.includes('Manager') || isAdmin;

  const activeUsers = users.filter(u => u.isActive !== false);

  // 3. Local UI State
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedReports, setExpandedReports] = useState<Record<number, boolean>>({});
  
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [formUserId, setFormUserId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const toggleGroup = (key: string) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleReport = (id: number) => setExpandedReports(prev => ({ ...prev,[id]: !prev[id] }));

  // 4. API Handlers
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId) return alert("Select an employee!");
    if (!selectedLocation) return alert("Select a location!");
    if (!formDate || !formStartTime) return alert("Date and Start Time required!");

    const clockInDateTime = new Date(`${formDate}T${formStartTime}`);
    let clockOutDateTime = null;
    if (formEndTime) {
      clockOutDateTime = new Date(`${formDate}T${formEndTime}`);
      if (clockOutDateTime < clockInDateTime) clockOutDateTime.setDate(clockOutDateTime.getDate() + 1);
    }
    
    const body: any = { userId: formUserId, locationId: selectedLocation, clockIn: clockInDateTime.toISOString(), clockOut: clockOutDateTime?.toISOString() || null };
    if (editingCardId) body.id = editingCardId;

    try {
      const res = await fetch('/api/timecards', { method: editingCardId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setEditingCardId(null); setFormStartTime(''); setFormEndTime(''); setFormUserId(''); setFormDate(''); setSelectedLocation('');
        await fetchManagerData(isManager, selectedUserId); 
        await fetchTimeCards(selectedUserId);
      }
    } catch (err) { console.error(err); }
  };

  const handleEditClick = (card: TimeCard) => {
    const inD = new Date(card.clockIn);
    setFormDate(inD.toISOString().split('T')[0]);
    setFormStartTime(inD.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    if (card.clockOut) setFormEndTime(new Date(card.clockOut).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    else setFormEndTime('');
    setSelectedLocation(card.locationId.toString());
    setFormUserId(card.userId.toString());
    setEditingCardId(card.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (cardId: number) => {
    if(!confirm("Delete this timecard?")) return;
    await fetch('/api/timecards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cardId }) });
    await fetchManagerData(isManager, selectedUserId);
    await fetchTimeCards(selectedUserId);
  };

  const groupedCards = useMemo(() => {
    return (managerData ||[]).reduce((acc: Record<string, Record<string, TimeCard[]>>, card) => {
      if (manLocs.length > 0 && !manLocs.includes(card.locationId)) return acc;
      const locName = card.location?.name || 'Unknown Location';
      const empName = card.user?.name || 'Unknown Employee';
      if (!acc[locName]) acc[locName] = {};
      if (!acc[locName][empName]) acc[locName][empName] =[];
      acc[locName][empName].push(card);
      return acc;
    }, {});
  }, [managerData, manLocs]);

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-300 shadow-md animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-slate-900">Timesheets & Auditing</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Review hours and read shift reports inline.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 mb-8">
        <h2 className="text-lg font-black text-slate-900 mb-4">{editingCardId ? 'Edit Entry' : 'Manual Entry'}</h2>
        <form onSubmit={handleManualSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Staff</label>
            <select value={formUserId} onChange={(e) => setFormUserId(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2 text-sm font-black bg-white shadow-inner">
              <option value="">- Select -</option>
              {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date</label>
            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2 text-sm font-black bg-white shadow-inner" />
          </div>
          <div className="flex-1 min-w-[110px]">
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">In</label>
            <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2 text-sm font-black bg-white shadow-inner" />
          </div>
          <div className="flex-1 min-w-[110px]">
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Out</label>
            <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className="w-full border border-gray-400 rounded-lg p-2 text-sm font-black bg-white shadow-inner" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Facility</label>
            <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} required className="w-full border border-gray-400 rounded-lg p-2 text-sm font-black bg-white shadow-inner">
              <option value="">- Select -</option>
              {locations.filter(l => l.isActive !== false || (editingCardId && l.id.toString() === selectedLocation)).map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} {loc.isActive === false && '(Archived)'}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-slate-900 text-white font-black py-2.5 px-6 rounded-lg shadow-md hover:bg-black transition-colors">{editingCardId ? 'Update' : 'Save'}</button>
            {editingCardId && <button type="button" onClick={() => { setEditingCardId(null); setFormUserId(''); setFormDate(''); setFormStartTime(''); setFormEndTime(''); setSelectedLocation(''); }} className="bg-slate-200 text-slate-800 font-bold py-2.5 px-6 rounded-lg transition-colors">Cancel</button>}
          </div>
        </form>
      </div>
      
      <div className="space-y-4">
        {Object.keys(groupedCards).sort().map(locName => {
          const locKey = `loc-${locName}`;
          const empGroups = groupedCards[locName];
          return (
            <div key={locName} className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
              <button onClick={() => toggleGroup(locKey)} className="w-full bg-slate-800 text-white p-4 flex justify-between items-center hover:bg-slate-700 transition">
                <span className="text-xl font-black uppercase tracking-wide">{locName}</span>
                <svg className={`h-6 w-6 transition-transform ${expandedGroups[locKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {expandedGroups[locKey] && (
                <div className="p-3 bg-slate-50 space-y-4">
                  {Object.keys(empGroups).sort().map(empName => {
                    const empKey = `emp-${locName}-${empName}`;
                    const cards = empGroups[empName];
                    return (
                      <div key={empName} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <button onClick={() => toggleGroup(empKey)} className="w-full bg-blue-50 text-blue-900 p-3 flex justify-between items-center border-b border-blue-100">
                          <span className="font-black uppercase tracking-widest">{empName}</span>
                          <svg className={`h-5 w-5 transition-transform ${expandedGroups[empKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        
                        {expandedGroups[empKey] && (
                          <div className="p-3 space-y-4 bg-white">
                            {cards.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => {
                              const report = checklists.find(c => c.timeCardId === card.id);
                              return (
                                <div key={card.id} className="flex flex-col border-2 border-slate-200 rounded-xl overflow-hidden">
                                  <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 bg-white">
                                    <div className="flex items-center gap-4">
                                      <span className="font-black text-slate-800">{formatDateSafe(card.clockIn)}</span>
                                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                        <span className="text-green-700">{formatTimeSafe(card.clockIn)}</span>
                                        <span>&rarr;</span>
                                        <span className={!card.clockOut ? 'text-red-600 animate-pulse' : 'text-slate-800'}>{!card.clockOut ? 'Active' : formatTimeSafe(card.clockOut!)}</span>
                                      </div>
                                      <span className="text-sm font-black text-blue-700">{card.totalHours?.toFixed(2)}h</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleEditClick(card)} className="px-4 py-1.5 text-xs bg-orange-50 text-orange-900 border border-orange-200 font-black rounded-lg uppercase">Edit</button>
                                      <button onClick={() => handleDeleteClick(card.id)} className="px-4 py-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-300 font-black rounded-lg uppercase">Delete</button>
                                    </div>
                                  </div>

                                  {report && (
                                    <div className="border-t border-slate-200 bg-slate-50">
                                      <button onClick={() => toggleReport(card.id)} className="w-full flex items-center justify-between p-3 text-[10px] font-black text-slate-600 hover:bg-slate-100 uppercase tracking-widest">
                                        <span>Shift Report Attached</span>
                                        <svg className={`h-4 w-4 transition-transform ${expandedReports[card.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                      </button>
                                      
                                      {expandedReports[card.id] && (
                                        <div className="p-4 pt-0 space-y-3">
                                          {report.previousShiftNotes && (
                                            <div className="bg-pink-50 border border-pink-200 p-3 rounded-lg shadow-inner">
                                              <span className="text-[10px] font-black uppercase text-pink-700 block mb-1">Leftover Issues from Previous Shift:</span>
                                              <p className="text-xs font-bold text-pink-900 italic">"{report.previousShiftNotes}"</p>
                                            </div>
                                          )}

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                            <div>
                                              <span className="text-[10px] font-black uppercase text-green-700 mb-2 block">Completed</span>
                                              <ul className="text-[10px] font-bold text-slate-700 pl-4 list-disc">
                                                {report.completedTasks.map(t => <li key={t}>{t}</li>)}
                                              </ul>
                                            </div>
                                            <div>
                                              <span className="text-[10px] font-black uppercase text-red-700 mb-2 block">Missed</span>
                                              <ul className="text-[10px] font-bold text-slate-700 pl-4 list-disc">
                                                {report.missedTasks.map(t => <li key={t}>{t}</li>)}
                                              </ul>
                                            </div>
                                          </div>
                                          {report.notes && (
                                            <div className="bg-white p-3 border-l-4 border-slate-400 rounded-r-lg text-xs text-slate-800 font-bold shadow-sm italic">
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
    </div>
  );
}