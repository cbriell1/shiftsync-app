// filepath: app/components/TimesheetsTab.tsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { TimeCard } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { formatDateSafe, formatTimeSafe, generatePeriods } from '@/lib/common';

export default function TimesheetsTab({ appState }: any) {
  const managerData = useAppStore(state => state.managerData);
  const users = useAppStore(state => state.users);
  const locations = useAppStore(state => state.locations);
  const manLocs = useAppStore(state => state.manLocs);
  const checklists = useAppStore(state => state.checklists);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  const manPeriods = useAppStore(state => state.manPeriods);
  const setManPeriods = useAppStore(state => state.setManPeriods);
  const setManLocs = useAppStore(state => state.setManLocs);
  const manEmps = useAppStore(state => state.manEmps);
  const setManEmps = useAppStore(state => state.setManEmps);

  const fetchManagerData = useAppStore(state => state.fetchManagerData);
  const fetchTimeCards = useAppStore(state => state.fetchTimeCards);

  const activeUserObj = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUserObj?.systemRoles?.includes('Administrator');
  const isManager = activeUserObj?.systemRoles?.includes('Manager') || isAdmin;

  const activeUsers = users.filter(u => u.isActive !== false);
  const periods = useMemo(() => generatePeriods(),[]);

  useEffect(() => {
    fetchManagerData(isManager, selectedUserId);
  },[manPeriods, manLocs, manEmps, isManager, selectedUserId, fetchManagerData]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const[expandedReports, setExpandedReports] = useState<Record<number, boolean>>({});
  
  const[editingCardId, setEditingCardId] = useState<number | null>(null);
  const [formUserId, setFormUserId] = useState('');
  const[formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const[formEndTime, setFormEndTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const toggleGroup = (key: string) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleReport = (id: number) => setExpandedReports(prev => ({ ...prev, [id]: !prev[id] }));

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // FIX: Force target user to be the logged in user if not a manager
    const targetUserId = isManager ? formUserId : selectedUserId;
    if (!targetUserId) return alert("Select an employee!");
    if (!selectedLocation) return alert("Select a location!");
    if (!formDate || !formStartTime) return alert("Date and Start Time required!");

    const clockInDateTime = new Date(`${formDate}T${formStartTime}`);
    let clockOutDateTime = null;
    if (formEndTime) {
      clockOutDateTime = new Date(`${formDate}T${formEndTime}`);
      if (clockOutDateTime < clockInDateTime) clockOutDateTime.setDate(clockOutDateTime.getDate() + 1);
    }
    
    const body: any = { userId: parseInt(targetUserId), locationId: selectedLocation, clockIn: clockInDateTime.toISOString(), clockOut: clockOutDateTime?.toISOString() || null };
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

  const cleanTimeStr = (t: string) => {
    if (!t) return '';
    const match = t.match(/\d{2}:\d{2}/);
    return match ? match[0] : '';
  };

  const handleEditClick = (card: TimeCard) => {
    const inD = new Date(card.clockIn);
    setFormDate(inD.toISOString().split('T')[0]);
    
    const getLocalTime = (d: Date) => {
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    setFormStartTime(getLocalTime(inD));
    if (card.clockOut) setFormEndTime(getLocalTime(new Date(card.clockOut)));
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
  },[managerData, manLocs]);

  const inputClasses = "w-full border-2 border-slate-300 rounded-xl px-4 py-3.5 text-base font-black text-slate-900 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none shadow-sm transition-all";
  const labelClasses = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-300 shadow-md animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-slate-900">
            {isManager ? 'Timesheets & Auditing' : 'My Pay Periods'}
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Review hours and read shift reports inline.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border-2 border-slate-200 mb-8 flex flex-col sm:flex-row gap-4 shadow-inner">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Pay Period Filter</label>
          <select 
            value={manPeriods.length > 0 ? manPeriods[0] : 0} 
            onChange={(e) => setManPeriods([parseInt(e.target.value)])} 
            className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 bg-white focus:border-blue-600 outline-none shadow-sm cursor-pointer"
          >
            {periods.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Facility Filter</label>
          <select 
            value={manLocs.length === 1 ? manLocs[0] : ''} 
            onChange={(e) => { const v = e.target.value; if(v === '') setManLocs([]); else setManLocs([parseInt(v)]); }} 
            className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 bg-white focus:border-blue-600 outline-none shadow-sm cursor-pointer"
          >
            <option value="">All Locations</option>
            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} {loc.isActive === false && '(Archived)'}</option>)}
          </select>
        </div>
        
        {/* FIX: Hide Staff Filter if not a manager */}
        {isManager && (
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Staff Filter</label>
            <select 
              value={manEmps.length === 1 ? manEmps[0] : ''} 
              onChange={(e) => { const v = e.target.value; if(v === '') setManEmps([]); else setManEmps([parseInt(v)]); }} 
              className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 bg-white focus:border-blue-600 outline-none shadow-sm cursor-pointer"
            >
              <option value="">All Staff</option>
              {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="bg-blue-50/40 p-5 md:p-7 rounded-2xl border-2 border-blue-100 mb-10 shadow-inner">
        <h2 className="text-lg md:text-xl font-black text-blue-950 mb-5 flex items-center gap-2">
          {editingCardId ? (
            <><span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span> Edit Timecard</>
          ) : (
            <><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Log Missing Shift</>
          )}
        </h2>
        
        <form onSubmit={handleManualSubmit}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-4 md:gap-5 items-start">
            
            {/* FIX: Only Managers can select other staff members */}
            {isManager && (
              <div className="col-span-2 sm:col-span-4 lg:col-span-3">
                <label className={labelClasses}>Staff Member</label>
                <select value={formUserId} onChange={(e) => setFormUserId(e.target.value)} required className={inputClasses}>
                  <option value="" className="text-slate-500 font-medium">-- Select Name --</option>
                  {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            
            <div className={`col-span-2 sm:col-span-4 ${isManager ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              <label className={labelClasses}>Facility</label>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} required className={inputClasses}>
                <option value="" className="text-slate-500 font-medium">-- Select Location --</option>
                {locations.filter(l => l.isActive !== false || (editingCardId && l.id.toString() === selectedLocation)).map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} {loc.isActive === false && '(Archived)'}</option>
                ))}
              </select>
            </div>
            
            <div className={`col-span-2 sm:col-span-4 ${isManager ? 'lg:col-span-2' : 'lg:col-span-4'}`}>
              <label className={labelClasses}>Date</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className={inputClasses} />
            </div>
            
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <label className={labelClasses}>Clock In</label>
              <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(cleanTimeStr(e.target.value))} required className={inputClasses} />
            </div>
            
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <label className={labelClasses}>Clock Out</label>
              <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(cleanTimeStr(e.target.value))} className={inputClasses} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-blue-200/60">
            <button type="submit" className="w-full sm:w-auto bg-slate-900 text-white font-black py-3.5 px-8 rounded-xl shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all text-base uppercase tracking-widest">
              {editingCardId ? 'Save Changes' : 'Log Timecard'}
            </button>
            {editingCardId && (
              <button 
                type="button" 
                onClick={() => { setEditingCardId(null); setFormUserId(''); setFormDate(''); setFormStartTime(''); setFormEndTime(''); setSelectedLocation(''); }} 
                className="w-full sm:w-auto bg-white border-2 border-slate-300 text-slate-700 font-black py-3.5 px-8 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors text-base uppercase tracking-widest shadow-sm"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="space-y-4">
        {Object.keys(groupedCards).length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 p-12 text-center rounded-2xl">
            <p className="text-slate-500 font-black uppercase tracking-widest">No timesheets match your active filters.</p>
          </div>
        ) : (
          Object.keys(groupedCards).sort().map(locName => {
            const locKey = `loc-${locName}`;
            const empGroups = groupedCards[locName];
            return (
              <div key={locName} className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                <button onClick={() => toggleGroup(locKey)} className="w-full bg-slate-800 text-white p-5 flex justify-between items-center hover:bg-slate-700 transition">
                  <span className="text-xl font-black uppercase tracking-widest">{locName}</span>
                  <svg className={`h-6 w-6 transition-transform ${expandedGroups[locKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {expandedGroups[locKey] && (
                  <div className="p-3 md:p-5 bg-slate-100 space-y-4">
                    {Object.keys(empGroups).sort().map(empName => {
                      const empKey = `emp-${locName}-${empName}`;
                      const cards = empGroups[empName];
                      return (
                        <div key={empName} className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
                          <button onClick={() => toggleGroup(empKey)} className="w-full bg-blue-50 text-blue-950 p-4 flex justify-between items-center border-b-2 border-blue-100 hover:bg-blue-100/50 transition-colors">
                            <span className="font-black text-lg tracking-tight">{empName}</span>
                            <svg className={`h-5 w-5 text-blue-700 transition-transform ${expandedGroups[empKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          
                          {expandedGroups[empKey] && (
                            <div className="p-3 md:p-5 space-y-4 bg-white">
                              {cards.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()).map(card => {
                                const report = checklists.find(c => c.timeCardId === card.id);
                                return (
                                  <div key={card.id} className="flex flex-col border-2 border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 bg-white">
                                      
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-5">
                                        <span className="font-black text-lg text-slate-800">{formatDateSafe(card.clockIn)}</span>
                                        
                                        <div className="flex items-center gap-3 text-sm font-black text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-inner">
                                          <span className="text-green-700">{formatTimeSafe(card.clockIn)}</span>
                                          <span className="text-slate-400">&rarr;</span>
                                          <span className={!card.clockOut ? 'text-red-600 animate-pulse' : 'text-slate-800'}>
                                            {!card.clockOut ? 'Active' : formatTimeSafe(card.clockOut!)}
                                          </span>
                                        </div>
                                        
                                        <span className="text-sm font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg shadow-sm">
                                          {card.totalHours?.toFixed(2)}h
                                        </span>
                                      </div>

                                      <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                        <button onClick={() => handleEditClick(card)} className="flex-1 md:flex-none px-5 py-2 text-xs bg-white text-blue-700 border-2 border-blue-200 hover:bg-blue-50 font-black rounded-lg uppercase tracking-widest transition-colors">Edit</button>
                                        <button onClick={() => handleDeleteClick(card.id)} className="flex-1 md:flex-none px-5 py-2 text-xs bg-white text-red-600 border-2 border-red-200 hover:bg-red-50 font-black rounded-lg uppercase tracking-widest transition-colors">Delete</button>
                                      </div>
                                    </div>

                                    {report && (
                                      <div className="border-t-2 border-slate-200 bg-slate-50">
                                        <button onClick={() => toggleReport(card.id)} className="w-full flex items-center justify-between p-3.5 text-xs font-black text-slate-600 hover:bg-slate-100 hover:text-slate-900 uppercase tracking-widest transition-colors">
                                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Shift Report Attached</span>
                                          <svg className={`h-4 w-4 transition-transform ${expandedReports[card.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        
                                        {expandedReports[card.id] && (
                                          <div className="p-4 pt-0 space-y-4">
                                            {report.previousShiftNotes && (
                                              <div className="bg-pink-50 border-2 border-pink-200 p-4 rounded-xl shadow-inner">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-pink-700 block mb-1.5">Carry-Over from Previous Shift:</span>
                                                <p className="text-sm font-bold text-pink-900 italic">"{report.previousShiftNotes}"</p>
                                              </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-2.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Completed</span>
                                                <ul className="text-xs font-bold text-slate-700 pl-4 space-y-1 list-disc">
                                                  {report.completedTasks.map(t => <li key={t}>{t}</li>)}
                                                  {report.completedTasks.length === 0 && <li className="italic text-slate-400 list-none -ml-4">None</li>}
                                                </ul>
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Missed</span>
                                                <ul className="text-xs font-bold text-slate-700 pl-4 space-y-1 list-disc">
                                                  {report.missedTasks.map(t => <li key={t}>{t}</li>)}
                                                  {report.missedTasks.length === 0 && <li className="italic text-slate-400 list-none -ml-4">None</li>}
                                                </ul>
                                              </div>
                                            </div>
                                            {report.notes && (
                                              <div className="bg-white p-4 border-l-4 border-blue-500 rounded-r-xl text-sm text-slate-800 font-bold shadow-sm italic">
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
          })
        )}
      </div>
    </div>
  );
}