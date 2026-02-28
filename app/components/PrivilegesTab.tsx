"use client";
import React, { useState } from 'react';
import { AppState, Member, PassUsage } from '../lib/types';

export default function PrivilegesTab({ appState }: { appState: AppState }) {
  const {
    passSearch, setPassSearch, filteredMembers,
    handleRedeemBeverage, expandedMember, setExpandedMember,
    pDate, setPDate, pAmt, setPAmt, pInitials, setPInitials, handleLogPass,
    isManager, setMembers, editingRenewalId, setEditingRenewalId,
    newRenewalDate, setNewRenewalDate,
    editingTotalId, setEditingTotalId, newTotalVal, setNewTotalVal,
    newBonusNotes, setNewBonusNotes
  } = appState;

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemLast, setNewMemLast] = useState('');
  const [newMemFirst, setNewMemFirst] = useState('');
  const [newMemLoc, setNewMemLoc] = useState('');
  const [newMemDate, setNewMemDate] = useState('');
  const [newMemTotal, setNewMemTotal] = useState<number | string>(12);

  const refreshMembers = async () => {
    const res = await fetch('/api/members?t=' + new Date().getTime());
    const data = await res.json();
    setMembers(data);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemLast) return alert("Last name is required!");
    await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastName: newMemLast, firstName: newMemFirst, location: newMemLoc, renewalDate: newMemDate, totalPasses: newMemTotal })
    });
    alert("New member added successfully!");
    setNewMemLast(''); setNewMemFirst(''); setNewMemLoc(''); setNewMemDate(''); setNewMemTotal(12);
    setShowAddMember(false);
    refreshMembers();
  };

  const handleUpdateRenewal = async (memberId: number) => {
    await fetch('/api/members', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ action: 'UPDATE_RENEWAL', memberId, renewalDate: newRenewalDate }) 
    });
    setEditingRenewalId(null);
    refreshMembers();
  };

  const handleUpdateTotal = async (memberId: number) => {
    await fetch('/api/members', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ action: 'UPDATE_TOTAL_PASSES', memberId, totalPasses: newTotalVal, bonusNotes: newBonusNotes }) 
    });
    setEditingTotalId(null);
    refreshMembers();
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-300 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 text-center md:text-left">Platinum Privileges & Passes</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          <input type="text" placeholder="Search Name/Loc..." value={passSearch} onChange={(e) => setPassSearch(e.target.value)} className="w-full sm:w-auto border border-gray-400 rounded p-2 text-slate-900 font-bold outline-none shadow-inner" />
          {isManager && (
            <button onClick={() => setShowAddMember(!showAddMember)} className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition">
              {showAddMember ? 'Cancel' : '+ Add Member'}
            </button>
          )}
          {/* Import CSV Button Removed */}
        </div>
      </div>

      {showAddMember && (
        <div className="mb-6 bg-slate-50 border border-gray-300 p-4 rounded-xl shadow-inner">
          <h3 className="font-black text-slate-900 mb-3">Add New Platinum Member</h3>
          <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input type="text" placeholder="Last Name" required value={newMemLast} onChange={(e) => setNewMemLast(e.target.value)} className="sm:col-span-2 border border-gray-400 p-2 rounded text-slate-900 font-bold outline-none" />
            <input type="text" placeholder="First Name" value={newMemFirst} onChange={(e) => setNewMemFirst(e.target.value)} className="sm:col-span-1 border border-gray-400 p-2 rounded text-slate-900 font-bold outline-none" />
            <input type="text" placeholder="Location (e.g. WF)" value={newMemLoc} onChange={(e) => setNewMemLoc(e.target.value)} className="sm:col-span-1 border border-gray-400 p-2 rounded text-slate-900 font-bold outline-none" />
            <input type="text" placeholder="Renewal (e.g. 10-01-26)" value={newMemDate} onChange={(e) => setNewMemDate(e.target.value)} className="sm:col-span-1 border border-gray-400 p-2 rounded text-slate-900 font-bold outline-none" />
            <button type="submit" className="sm:col-span-1 bg-green-700 hover:bg-green-800 text-white font-bold rounded shadow-sm">Save Member</button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm pb-2">
        <table className="w-full text-left text-sm" style={{ minWidth: '800px' }}>
          <thead className="bg-slate-100 border-b border-gray-300 text-slate-800">
            <tr>
              <th className="p-3 font-black text-slate-900">Last Name</th>
              <th className="p-3 font-black text-slate-900">First Name</th>
              <th className="p-3 font-black text-slate-900">Location</th>
              <th className="p-3 font-black text-slate-900">Renewal Date</th>
              <th className="p-3 font-black text-slate-900 border-l border-gray-300">Total Passes</th>
              <th className="p-3 font-black text-slate-900 bg-slate-200 text-center border-l border-gray-300">Remain</th>
              <th className="p-3 font-black text-slate-900 text-center border-l border-gray-300">Bev/Snack</th>
              <th className="p-3 font-black text-slate-900 text-center border-l border-gray-300">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-slate-500 font-bold italic bg-white">No members found.</td></tr>
            ) : (
              filteredMembers.map((m: Member) => {
                let usedCount = 0;
                m.usages.forEach((u: PassUsage) => usedCount += u.amount);
                const remaining = m.totalPasses - usedCount;

                let bevAvailable = true;
                let bevDateStr = '';
                if (m.lastBeverageDate) {
                  const bDate = new Date(m.lastBeverageDate);
                  const today = new Date();
                  if (bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear()) {
                    bevAvailable = false;
                    bevDateStr = bDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                }

                return (
                  <React.Fragment key={m.id}>
                    <tr className="border-b border-gray-200 hover:bg-slate-50 transition whitespace-nowrap">
                      <td className="p-3 font-black text-slate-900">{m.lastName}</td>
                      <td className="p-3 font-bold text-slate-800">{m.firstName}</td>
                      <td className="p-3 font-bold text-gray-700">{m.location}</td>
                      
                      {/* EDITABLE RENEWAL DATE */}
                      <td className="p-3 font-bold text-gray-700">
                        {editingRenewalId === m.id ? (
                          <div className="flex space-x-1">
                            <input type="text" value={newRenewalDate} onChange={(e) => setNewRenewalDate(e.target.value)} className="border border-gray-400 rounded px-2 py-0.5 text-xs w-24 outline-none font-bold text-slate-900" />
                            <button onClick={() => handleUpdateRenewal(m.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-xs shadow-sm">Save</button>
                            <button onClick={() => setEditingRenewalId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-2 py-0.5 rounded text-xs shadow-sm">X</button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>{m.renewalDate || 'N/A'}</span>
                            {isManager && (
                              <button onClick={() => { setEditingRenewalId(m.id); setNewRenewalDate(m.renewalDate || ''); }} className="bg-slate-200 hover:bg-slate-300 rounded p-1.5 transition shadow-sm" title="Edit Date">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-slate-700"><path d="M2.695 14.763l-1.262 3.152a.5.5 0 00.65.65l3.152-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* EDITABLE TOTAL PASSES */}
                      <td className="p-3 border-l border-gray-200">
                        {editingTotalId === m.id ? (
                          <div className="flex flex-col gap-1 w-48">
                            <div className="flex space-x-1">
                              <input type="number" value={newTotalVal} onChange={(e) => setNewTotalVal(e.target.value)} className="border border-gray-400 rounded px-2 py-0.5 text-xs w-16 outline-none font-black text-slate-900" />
                              <button onClick={() => handleUpdateTotal(m.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-xs shadow-sm">Save</button>
                              <button onClick={() => setEditingTotalId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-2 py-0.5 rounded text-xs shadow-sm">X</button>
                            </div>
                            <input type="text" placeholder="Manager Notes (Optional)" value={newBonusNotes} onChange={(e) => setNewBonusNotes(e.target.value)} className="border border-gray-400 rounded px-2 py-1 text-[10px] outline-none font-bold text-slate-700 w-full" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-start">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-slate-800 text-base">{m.totalPasses}</span>
                              {isManager && (
                                <button onClick={() => { setEditingTotalId(m.id); setNewTotalVal(m.totalPasses); setNewBonusNotes(m.bonusNotes || ''); }} className="bg-slate-200 hover:bg-slate-300 rounded p-1.5 transition shadow-sm" title="Edit Total Passes">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-slate-700"><path d="M2.695 14.763l-1.262 3.152a.5.5 0 00.65.65l3.152-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                                </button>
                              )}
                            </div>
                            {m.bonusNotes && <span className="text-[10px] text-blue-700 font-bold italic mt-0.5 whitespace-normal break-words w-32 leading-tight">Note: {m.bonusNotes}</span>}
                          </div>
                        )}
                      </td>

                      <td className={`p-3 font-black text-center border-l border-gray-200 ${remaining <= 0 ? 'bg-red-100 text-red-800' : 'bg-green-50 text-green-800'}`}>
                        {remaining}
                      </td>
                      
                      <td className="p-3 text-center border-l border-gray-200">
                        {bevAvailable ? (
                          <button onClick={() => handleRedeemBeverage(m.id)} className="bg-yellow-400 text-slate-900 border border-yellow-500 text-xs font-black px-3 py-1.5 rounded shadow-sm hover:bg-yellow-500 transition">
                            Redeem
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1.5 rounded border border-gray-300 shadow-inner">
                            Used {bevDateStr}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center border-l border-gray-200">
                        <button onClick={() => setExpandedMember(expandedMember === m.id ? null : m.id)} className="bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded shadow-sm hover:bg-slate-300 w-full transition">
                          {expandedMember === m.id ? 'Close' : 'Manage'}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedMember === m.id && (
                      <tr className="bg-slate-100 border-b border-gray-400 shadow-inner">
                        <td colSpan={8} className="p-4">
                          <div className="flex flex-col lg:flex-row gap-6">
                            
                            <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm flex-1">
                              <h4 className="font-black text-slate-900 mb-3 border-b pb-2">Log Pass Usage</h4>
                              <form onSubmit={(e) => handleLogPass(e, m.id)} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                                <input type="text" required placeholder="Date (e.g. 10-25)" value={pDate} onChange={(e) => setPDate(e.target.value)} className="border border-gray-400 p-2 rounded text-slate-900 font-bold w-full sm:w-1/3 outline-none" />
                                <input type="number" required min="1" placeholder="Amt" value={pAmt} onChange={(e) => setPAmt(e.target.value)} className="border border-gray-400 p-2 rounded text-slate-900 font-bold w-full sm:w-1/4 outline-none" />
                                <input type="text" required placeholder="Initials" value={pInitials} onChange={(e) => setPInitials(e.target.value)} className="border border-gray-400 p-2 rounded text-slate-900 font-bold w-full sm:w-1/3 outline-none" />
                                <button type="submit" className="bg-green-800 hover:bg-green-900 text-white font-bold py-2 px-4 rounded shadow-sm w-full sm:w-auto transition">Save</button>
                              </form>
                              <p className="text-xs text-slate-500 mt-4 font-bold bg-slate-50 p-2 border border-slate-200 rounded">{m.notes || 'No special notes.'}</p>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm flex-1">
                              <h4 className="font-black text-slate-900 mb-3 border-b pb-2">Usage History</h4>
                              {m.usages.length === 0 ? <p className="text-sm text-slate-500 italic mt-4">No usage logged yet.</p> : (
                                <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2">
                                  {m.usages.map((u: PassUsage) => (
                                    <div key={u.id} className="flex justify-between border-b border-gray-100 pb-1 text-sm font-bold text-slate-700">
                                      <span>{u.dateUsed}</span>
                                      <span className="text-red-700">Used {u.amount}</span>
                                      <span className="text-slate-500">By: {u.initials}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}