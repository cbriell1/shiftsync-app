// filepath: app/components/PrivilegesTab.tsx
"use client";
import React, { useState } from 'react';
import { Member, PassUsage } from '@/lib/types';
import { useAppStore } from '@/lib/store';

// Helper Component to handle the complex rendering of a single row/card
const MemberRow = ({ 
  m, isManager, expandedMember, setExpandedMember, 
  editingRenewalId, setEditingRenewalId, newRenewalDate, setNewRenewalDate, handleUpdateRenewal,
  editingTotalId, setEditingTotalId, newTotalVal, setNewTotalVal, newBonusNotes, setNewBonusNotes, handleUpdateTotal,
  handleRedeemBeverage, handleLogPass, pDate, setPDate, pAmt, setPAmt, pInitials, setPInitials,
  viewMode // <-- Added viewMode to toggle between div and tr
}: any) => {
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

  const isExpanded = expandedMember === m.id;

  // ============================================
  // MOBILE CARD RENDER
  // ============================================
  if (viewMode === 'mobile') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="font-black text-lg text-slate-900">{m.lastName}, {m.firstName}</span>
          <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{m.location || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-500 uppercase text-xs">Renewal</span>
          {editingRenewalId === m.id ? (
            <div className="flex gap-1">
              <input type="text" value={newRenewalDate} onChange={(e) => setNewRenewalDate(e.target.value)} className="border border-slate-400 rounded px-2 py-1 text-xs w-20 outline-none font-bold text-slate-900" />
              <button onClick={() => handleUpdateRenewal(m.id)} className="bg-green-600 text-white font-bold px-2 py-1 rounded text-xs">Save</button>
              <button onClick={() => setEditingRenewalId(null)} className="bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-xs">X</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{m.renewalDate || 'N/A'}</span>
              {isManager && (
                <button onClick={() => { setEditingRenewalId(m.id); setNewRenewalDate(m.renewalDate || ''); }} className="text-blue-600 text-xs font-bold underline">Edit</button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-2">
          <span className="font-bold text-slate-500 uppercase text-xs">Total Passes</span>
          {editingTotalId === m.id ? (
            <div className="flex flex-col gap-1 w-32">
              <div className="flex gap-1">
                <input type="number" value={newTotalVal} onChange={(e) => setNewTotalVal(e.target.value)} className="border border-slate-400 rounded px-2 py-1 text-xs w-12 outline-none font-black text-slate-900" />
                <button onClick={() => handleUpdateTotal(m.id)} className="bg-green-600 text-white font-bold px-2 py-1 rounded text-xs flex-1">✔</button>
              </div>
              <input type="text" placeholder="Notes" value={newBonusNotes} onChange={(e) => setNewBonusNotes(e.target.value)} className="border border-slate-400 rounded px-2 py-1 text-[10px] outline-none font-bold text-slate-700 w-full" />
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base">{m.totalPasses}</span>
                {isManager && (
                  <button onClick={() => { setEditingTotalId(m.id); setNewTotalVal(m.totalPasses); setNewBonusNotes(m.bonusNotes || ''); }} className="text-blue-600 text-[10px] font-bold uppercase underline">Edit</button>
                )}
              </div>
              {m.bonusNotes && <span className="text-[9px] text-blue-700 font-bold italic mt-0.5 max-w-[120px] text-right leading-tight">Note: {m.bonusNotes}</span>}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100">
             <span className="text-[10px] font-black text-slate-500 uppercase mb-1">Passes Left</span>
             <span className={`font-black text-xl ${remaining <= 0 ? 'text-red-600' : 'text-green-700'}`}>{remaining}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100">
             <span className="text-[10px] font-black text-slate-500 uppercase mb-1">Monthly Bev</span>
             {bevAvailable ? (
                <button onClick={() => handleRedeemBeverage(m.id)} className="bg-yellow-400 text-slate-900 border border-yellow-500 text-xs font-black px-3 py-1 rounded shadow-sm w-full">Redeem</button>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2 py-1 rounded border border-slate-300">Used {bevDateStr}</span>
              )}
          </div>
        </div>

        <button onClick={() => setExpandedMember(isExpanded ? null : m.id)} className="mt-1 w-full bg-slate-900 text-white font-black py-3 rounded-lg text-sm shadow-md">
          {isExpanded ? 'Close Management' : 'Manage Usage History'}
        </button>

        {isExpanded && (
          <div className="mt-2 pt-4 border-t border-slate-200 flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
              <h4 className="font-black text-slate-900 mb-3 border-b border-slate-200 pb-2 text-sm">Log Pass Usage</h4>
              <form onSubmit={(e) => handleLogPass(e, m.id)} className="flex flex-col space-y-3 mt-3">
                <input type="text" required placeholder="Date (e.g. 10-25)" value={pDate} onChange={(e) => setPDate(e.target.value)} className="border border-slate-400 p-2.5 rounded-lg text-sm text-slate-900 font-bold w-full outline-none focus:border-blue-500 shadow-sm" />
                <div className="flex gap-2">
                  <input type="number" required min="1" placeholder="Amt" value={pAmt} onChange={(e) => setPAmt(e.target.value)} className="border border-slate-400 p-2.5 rounded-lg text-sm text-slate-900 font-bold w-1/3 outline-none focus:border-blue-500 shadow-sm" />
                  <input type="text" required placeholder="Initials" value={pInitials} onChange={(e) => setPInitials(e.target.value)} className="border border-slate-400 p-2.5 rounded-lg text-sm text-slate-900 font-bold w-2/3 outline-none focus:border-blue-500 shadow-sm" />
                </div>
                <button type="submit" className="bg-green-800 hover:bg-green-900 text-white font-black text-sm py-3 px-6 rounded-lg shadow-md w-full transition">Save</button>
              </form>
              <p className="text-xs text-slate-600 mt-4 font-medium bg-white p-3 border border-slate-200 rounded-lg">{m.notes || 'No special notes.'}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
              <h4 className="font-black text-slate-900 mb-3 border-b border-slate-200 pb-2 text-sm">Usage History</h4>
              {m.usages.length === 0 ? <p className="text-sm text-slate-500 italic mt-4 font-bold">No usage logged yet.</p> : (
                <div className="space-y-2 mt-3 max-h-40 overflow-y-auto pr-2">
                  {m.usages.map((u: PassUsage) => (
                    <div key={u.id} className="flex justify-between border-b border-slate-200 pb-2 pt-1 text-sm font-bold text-slate-700 bg-white px-2 rounded mb-1">
                      <span className="w-1/3">{u.dateUsed}</span>
                      <span className="w-1/3 text-center text-red-700">Used {u.amount}</span>
                      <span className="w-1/3 text-right text-slate-500">By: {u.initials}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP ROW RENDER
  // ============================================
  return (
    <>
      <tr className="border-b border-slate-200 hover:bg-slate-50 transition whitespace-nowrap bg-white">
        <td className="p-3 font-black text-slate-900">{m.lastName}</td>
        <td className="p-3 font-bold text-slate-800">{m.firstName}</td>
        <td className="p-3 font-bold text-slate-700">{m.location}</td>
        
        <td className="p-3 font-bold text-slate-700">
          {editingRenewalId === m.id ? (
            <div className="flex space-x-1">
              <input type="text" value={newRenewalDate} onChange={(e) => setNewRenewalDate(e.target.value)} className="border border-slate-400 rounded px-2 py-0.5 text-xs w-24 outline-none font-bold text-slate-900" />
              <button onClick={() => handleUpdateRenewal(m.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-xs shadow-sm">Save</button>
              <button onClick={() => setEditingRenewalId(null)} className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-2 py-0.5 rounded text-xs shadow-sm">X</button>
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

        <td className="p-3 border-l border-slate-200">
          {editingTotalId === m.id ? (
            <div className="flex flex-col gap-1 w-48">
              <div className="flex space-x-1">
                <input type="number" value={newTotalVal} onChange={(e) => setNewTotalVal(e.target.value)} className="border border-slate-400 rounded px-2 py-0.5 text-xs w-16 outline-none font-black text-slate-900" />
                <button onClick={() => handleUpdateTotal(m.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-xs shadow-sm">Save</button>
                <button onClick={() => setEditingTotalId(null)} className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-2 py-0.5 rounded text-xs shadow-sm">X</button>
              </div>
              <input type="text" placeholder="Manager Notes (Optional)" value={newBonusNotes} onChange={(e) => setNewBonusNotes(e.target.value)} className="border border-slate-400 rounded px-2 py-1 text-[10px] outline-none font-bold text-slate-700 w-full" />
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

        <td className={`p-3 font-black text-center border-l border-slate-200 ${remaining <= 0 ? 'bg-red-100 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {remaining}
        </td>
        
        <td className="p-3 text-center border-l border-slate-200">
          {bevAvailable ? (
            <button onClick={() => handleRedeemBeverage(m.id)} className="bg-yellow-400 text-slate-900 border border-yellow-500 text-xs font-black px-3 py-1.5 rounded shadow-sm hover:bg-yellow-500 transition">
              Redeem
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1.5 rounded border border-slate-300 shadow-inner">
              Used {bevDateStr}
            </span>
          )}
        </td>

        <td className="p-3 text-center border-l border-slate-200">
          <button onClick={() => setExpandedMember(isExpanded ? null : m.id)} className="bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded shadow-sm hover:bg-slate-300 w-full transition">
            {isExpanded ? 'Close' : 'Manage'}
          </button>
        </td>
      </tr>
      
      {/* EXPANDED DESKTOP VIEW */}
      {isExpanded && (
        <tr className="bg-slate-100/80 shadow-inner border-b border-slate-300">
          <td colSpan={8} className="p-4">
            <div className="flex flex-col lg:flex-row gap-6">
              
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex-1">
                <h4 className="font-black text-slate-900 mb-3 border-b border-slate-100 pb-2">Log Pass Usage</h4>
                <form onSubmit={(e) => handleLogPass(e, m.id)} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2 mt-4">
                  <input type="text" required placeholder="Date (e.g. 10-25)" value={pDate} onChange={(e) => setPDate(e.target.value)} className="border border-slate-400 p-2.5 rounded-lg text-sm text-slate-900 font-bold w-full sm:w-1/3 outline-none focus:border-blue-500 shadow-inner" />
                  <input type="number" required min="1" placeholder="Amt" value={pAmt} onChange={(e) => setPAmt(e.target.value)} className="border border-slate-400 p-2.5 rounded-lg text-sm text-slate-900 font-bold w-full sm:w-1/4 outline-none focus:border-blue-500 shadow-inner" />
                  <input type="text" required placeholder="Initials" value={pInitials} onChange={(e) => setPInitials(e.target.value)} className="border border-slate-400 p-2.5 rounded-lg text-sm text-slate-900 font-bold w-full sm:w-1/3 outline-none focus:border-blue-500 shadow-inner" />
                  <button type="submit" className="bg-green-800 hover:bg-green-900 text-white font-black text-sm py-2.5 px-6 rounded-lg shadow-md w-full sm:w-auto transition">Save</button>
                </form>
                <p className="text-xs text-slate-600 mt-4 font-medium bg-slate-50 p-3 border border-slate-200 rounded-lg">{m.notes || 'No special notes.'}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex-1">
                <h4 className="font-black text-slate-900 mb-3 border-b border-slate-100 pb-2">Usage History</h4>
                {m.usages.length === 0 ? <p className="text-sm text-slate-500 italic mt-4 font-bold">No usage logged yet.</p> : (
                  <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2">
                    {m.usages.map((u: PassUsage) => (
                      <div key={u.id} className="flex justify-between border-b border-slate-100 pb-2 pt-1 text-sm font-bold text-slate-700 hover:bg-slate-50 px-1 rounded">
                        <span className="w-1/3">{u.dateUsed}</span>
                        <span className="w-1/3 text-center text-red-700">Used {u.amount}</span>
                        <span className="w-1/3 text-right text-slate-500">By: {u.initials}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function PrivilegesTab({ appState }: any) {
  const members = useAppStore(state => state.members);
  const users = useAppStore(state => state.users);
  const selectedUserId = useAppStore(state => state.selectedUserId);
  const fetchMembers = useAppStore(state => state.fetchMembers);

  const activeUserObj = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUserObj?.systemRoles?.includes('Administrator');
  const isManager = activeUserObj?.systemRoles?.includes('Manager') || isAdmin;

  const [passSearch, setPassSearch] = useState('');
  const[expandedMember, setExpandedMember] = useState<number | null>(null);
  
  const [pDate, setPDate] = useState('');
  const [pAmt, setPAmt] = useState<number | string>(1);
  const[pInitials, setPInitials] = useState('');
  
  const [editingRenewalId, setEditingRenewalId] = useState<number | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  
  const[editingTotalId, setEditingTotalId] = useState<number | null>(null);
  const [newTotalVal, setNewTotalVal] = useState<number | string>(12);
  const [newBonusNotes, setNewBonusNotes] = useState('');

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemLast, setNewMemLast] = useState('');
  const[newMemFirst, setNewMemFirst] = useState('');
  const [newMemLoc, setNewMemLoc] = useState('');
  const[newMemDate, setNewMemDate] = useState('');
  const [newMemTotal, setNewMemTotal] = useState<number | string>(12);

  const filteredMembers = (members ||[]).filter(m => 
    m.lastName.toLowerCase().includes(passSearch.toLowerCase()) || 
    m.firstName.toLowerCase().includes(passSearch.toLowerCase())
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemLast) return alert("Last name is required!");
    await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastName: newMemLast, firstName: newMemFirst, location: newMemLoc, renewalDate: newMemDate, totalPasses: newMemTotal })
    });
    setNewMemLast(''); setNewMemFirst(''); setNewMemLoc(''); setNewMemDate(''); setNewMemTotal(12);
    setShowAddMember(false);
    await fetchMembers();
  };

  const handleUpdateRenewal = async (memberId: number) => {
    await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'UPDATE_RENEWAL', memberId, renewalDate: newRenewalDate }) });
    setEditingRenewalId(null); await fetchMembers();
  };

  const handleUpdateTotal = async (memberId: number) => {
    await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'UPDATE_TOTAL_PASSES', memberId, totalPasses: newTotalVal, bonusNotes: newBonusNotes }) });
    setEditingTotalId(null); await fetchMembers();
  };

  const handleRedeemBeverage = async (memberId: number) => {
    await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, action: 'LOG_BEVERAGE' }) });
    await fetchMembers();
  };

  const handleLogPass = async (e: React.FormEvent, memberId: number) => {
    e.preventDefault();
    const res = await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, dateUsed: pDate, amount: pAmt, initials: pInitials }) });
    if (res.ok) { setPDate(''); setPAmt(1); setPInitials(''); await fetchMembers(); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 md:p-6 rounded-xl border border-slate-300 shadow-sm gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Platinum Privileges & Passes</h2>
          <p className="text-sm font-bold text-slate-600 hidden md:block">Manage member access and benefits.</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <input type="text" placeholder="Search Name..." value={passSearch} onChange={(e) => setPassSearch(e.target.value)} className="w-full sm:w-auto border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 font-bold outline-none focus:border-blue-500 shadow-inner" />
          {isManager && (
            <button onClick={() => setShowAddMember(!showAddMember)} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black py-2.5 px-6 rounded-lg shadow-md transition-colors whitespace-nowrap">
              {showAddMember ? 'Cancel' : '+ Add Member'}
            </button>
          )}
        </div>
      </div>

      {showAddMember && (
        <div className="bg-slate-50 border-2 border-slate-300 p-5 md:p-6 rounded-xl shadow-inner animate-in slide-in-from-top-4">
          <h3 className="font-black text-slate-900 mb-4 text-lg">Add New Platinum Member</h3>
          <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
            <div className="sm:col-span-2"><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Last Name *</label><input required value={newMemLast} onChange={(e) => setNewMemLast(e.target.value)} className="w-full border-2 border-slate-300 p-2.5 rounded-lg font-bold outline-none focus:border-blue-500" /></div>
            <div className="sm:col-span-1"><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">First Name</label><input value={newMemFirst} onChange={(e) => setNewMemFirst(e.target.value)} className="w-full border-2 border-slate-300 p-2.5 rounded-lg font-bold outline-none focus:border-blue-500" /></div>
            <div className="sm:col-span-1"><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Location</label><input placeholder="e.g. WF" value={newMemLoc} onChange={(e) => setNewMemLoc(e.target.value)} className="w-full border-2 border-slate-300 p-2.5 rounded-lg font-bold outline-none focus:border-blue-500" /></div>
            <div className="sm:col-span-1"><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Renewal</label><input placeholder="10-01-26" value={newMemDate} onChange={(e) => setNewMemDate(e.target.value)} className="w-full border-2 border-slate-300 p-2.5 rounded-lg font-bold outline-none focus:border-blue-500" /></div>
            <div className="sm:col-span-1 flex items-end"><button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-2.5 rounded-lg shadow-md transition-colors h-[44px]">Save</button></div>
          </form>
        </div>
      )}

      {/* MOBILE LIST VIEW (< 768px) */}
      <div className="md:hidden flex flex-col gap-4">
         {filteredMembers.length === 0 ? (
           <div className="p-8 text-center text-slate-500 font-bold italic bg-white border border-slate-200 rounded-xl">No members found.</div>
         ) : (
           filteredMembers.map((m: Member) => (
             <MemberRow 
               key={m.id} m={m} isManager={isManager} expandedMember={expandedMember} setExpandedMember={setExpandedMember} viewMode="mobile"
               editingRenewalId={editingRenewalId} setEditingRenewalId={setEditingRenewalId} newRenewalDate={newRenewalDate} setNewRenewalDate={setNewRenewalDate} handleUpdateRenewal={handleUpdateRenewal}
               editingTotalId={editingTotalId} setEditingTotalId={setEditingTotalId} newTotalVal={newTotalVal} setNewTotalVal={setNewTotalVal} newBonusNotes={newBonusNotes} setNewBonusNotes={setNewBonusNotes} handleUpdateTotal={handleUpdateTotal}
               handleRedeemBeverage={handleRedeemBeverage} handleLogPass={handleLogPass} pDate={pDate} setPDate={setPDate} pAmt={pAmt} setPAmt={setPAmt} pInitials={pInitials} setPInitials={setPInitials}
             />
           ))
         )}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div className="hidden md:block bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4">Last Name</th>
                <th className="p-4">First Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Renewal Date</th>
                <th className="p-4 border-l border-slate-300">Total Passes</th>
                <th className="p-4 bg-slate-300/50 text-center border-l border-slate-300">Remain</th>
                <th className="p-4 text-center border-l border-slate-300">Bev/Snack</th>
                <th className="p-4 text-center border-l border-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-bold italic bg-white border-b border-slate-200">No members found.</td></tr>
              ) : (
                filteredMembers.map((m: Member) => (
                  <MemberRow 
                    key={m.id} m={m} isManager={isManager} expandedMember={expandedMember} setExpandedMember={setExpandedMember} viewMode="desktop"
                    editingRenewalId={editingRenewalId} setEditingRenewalId={setEditingRenewalId} newRenewalDate={newRenewalDate} setNewRenewalDate={setNewRenewalDate} handleUpdateRenewal={handleUpdateRenewal}
                    editingTotalId={editingTotalId} setEditingTotalId={setEditingTotalId} newTotalVal={newTotalVal} setNewTotalVal={setNewTotalVal} newBonusNotes={newBonusNotes} setNewBonusNotes={setNewBonusNotes} handleUpdateTotal={handleUpdateTotal}
                    handleRedeemBeverage={handleRedeemBeverage} handleLogPass={handleLogPass} pDate={pDate} setPDate={setPDate} pAmt={pAmt} setPAmt={setPAmt} pInitials={pInitials} setPInitials={setPInitials}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}