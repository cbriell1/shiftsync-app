// filepath: app/components/PrivilegesTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Member, PassUsage } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { notify, customConfirm } from '@/lib/ui-utils';
import { Star, Coffee, Utensils, Users, History, Ticket, CreditCard, ChevronRight, CheckCircle2, ShieldAlert, XCircle, Search, UserPlus, Info, Trash2, Gift } from 'lucide-react';
import { getFamilyAllotment, logSnackUsage } from '@/lib/actions';

const MemberVIPRow = ({ 
  m, isManager, expandedMember, setExpandedMember, 
  handleRedeemBeverage, handleLogPass, fetchMembers
}: any) => {
  const [allotment, setAllotment] = useState<any>(null);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    if (m.membershipLevel === 'PLATINUM') {
      getFamilyAllotment(m.id).then(setAllotment);
    }
  }, [m.id, m.membershipLevel]);

  const handlePunchSnack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!allotment || allotment.remaining <= 0) return notify.error("Pool Depleted!");
    setIsLogging(true);
    const res = await logSnackUsage(m.id);
    if (res.success) {
        notify.success("Snack Logged!");
        const updated = await getFamilyAllotment(m.id);
        setAllotment(updated);
    }
    setIsLogging(false);
  };

  const handleRevert = async (usageId: number) => {
    if (!(await customConfirm("Undo this pass transaction?", "Revert Log", true))) return;
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVERT_PASS', usageId })
      });
      if (res.ok) { notify.success("Transaction Reversed"); fetchMembers(); }
    } catch (e) { notify.error("Revert failed."); }
  };

  const handleGrantBonus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const amount = prompt("Bonus Passes to Grant:");
    if (!amount || isNaN(Number(amount))) return;
    const reason = prompt("Reason for Grant (Mandatory):");
    if (!reason) return notify.error("Reason required!");
    const initials = prompt("Manager Initials:");
    if (!initials) return;

    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'GRANT_EXTRA_PASSES', 
            memberId: m.id, 
            amount: Number(amount), 
            description: reason,
            initials 
        })
      });
      if (res.ok) { notify.success("Passes Granted!"); fetchMembers(); }
    } catch (e) { notify.error("Grant failed."); }
  };

  let usedCount = 0;
  m.usages.forEach((u: PassUsage) => usedCount += u.amount);
  const remaining = m.totalPasses - usedCount;

  return (
    <div data-testid="member-row" className="flex flex-col w-full border-b-2 border-slate-200">
      <div 
        data-testid="member-row-header"
        onClick={() => setExpandedMember(expandedMember === m.id ? null : m.id)}
        className={`flex flex-col xl:flex-row items-start xl:items-center gap-4 p-3 hover:bg-slate-50 transition-all cursor-pointer group ${expandedMember === m.id ? 'bg-blue-50/50' : 'bg-white'}`}
      >
        {/* MEMBER IDENTITY */}
        <div className="w-full xl:w-[22%] flex items-center gap-3 shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs italic shrink-0 ${m.membershipLevel === 'PLATINUM' ? 'bg-brand-yellow text-slate-900 shadow-md' : 'bg-slate-900'}`}>
            {m.membershipLevel === 'PLATINUM' ? <Star size={14} className="fill-slate-900" /> : m.lastName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
             <h3 className="text-sm font-black text-slate-900 uppercase sports-slant truncate">{m.lastName}, {m.firstName}</h3>
             <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black uppercase tracking-tighter px-1 rounded border ${m.membershipLevel === 'PLATINUM' ? 'bg-slate-900 text-brand-yellow border-slate-900' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{m.membershipLevel}</span>
                {m.family && <span className="text-[8px] font-bold text-slate-400 truncate max-w-[80px]">FAM: {m.family}</span>}
             </div>
          </div>
        </div>

        {/* PASS COUNT (Visual Anchor - Centered) */}
        <div className="w-full xl:w-[12%] flex items-center justify-center gap-3 shrink-0 border-t xl:border-t-0 pt-2 xl:pt-0">
           <div className="stadium-scoreboard text-2xl w-14 flex items-center justify-center">{remaining.toString().padStart(2, '0')}</div>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Passes<br/>Left</span>
        </div>

        {/* PLATINUM SNACK POOL */}
        <div className="w-full xl:w-[15%] shrink-0">
           {m.membershipLevel === 'PLATINUM' && allotment && allotment.isPlatinum ? (
             <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-3 py-2 shadow-lg group-hover:ring-2 ring-brand-yellow/30 transition-all">
                <div className="min-w-0">
                   <p className="text-[8px] font-black text-brand-yellow uppercase tracking-tighter leading-none mb-0.5">Snack</p>
                   <p className="text-xs font-black tabular-nums">{allotment.remaining} <span className="opacity-40 text-[10px]">/ {allotment.total}</span></p>
                </div>
                <button 
                  onClick={handlePunchSnack}
                  disabled={isLogging || allotment.remaining <= 0}
                  className="bg-brand-yellow text-slate-900 p-1.5 rounded-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale shadow-md"
                >
                   <Utensils size={14} />
                </button>
             </div>
           ) : (
             <div className="h-10 border-2 border-dashed border-slate-100 rounded-xl"></div>
           )}
        </div>

        {/* ACTION STRIP */}
        <div className="w-full xl:w-[35%] flex gap-2 shrink-0">
           <button 
             onClick={(e) => { e.stopPropagation(); handleLogPass(m.id); }}
             disabled={remaining <= 0}
             className="flex-1 bg-brand-green hover:bg-green-600 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-40 transition-all"
           >
              <Ticket size={14} /> LOG PASSES
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); handleRedeemBeverage(m.id); }}
             className="flex-1 bg-slate-900 hover:bg-black text-brand-yellow font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all border border-slate-700"
           >
              <Coffee size={14} /> BEVERAGE
           </button>
           {isManager && (
             <button 
               onClick={handleGrantBonus}
               className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 shadow-sm"
               title="Grant Bonus Passes"
             >
                <Gift size={16} />
             </button>
           )}
        </div>

        {/* INFO BUTTON */}
        <div className="hidden xl:flex xl:flex-1 justify-end">
           <div className={`p-2 rounded-full transition-colors ${expandedMember === m.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-300 hover:text-slate-600'}`}>
              <ChevronRight size={18} className={`transition-transform duration-300 ${expandedMember === m.id ? 'rotate-90' : ''}`} />
           </div>
        </div>
      </div>

      {/* EXPANDED RECEIPT HISTORY */}
      {expandedMember === m.id && (
        <div className="bg-slate-50 p-4 border-t-2 border-slate-900/10 animate-in slide-in-from-top-2 duration-300">
           <div className="max-w-xl mx-auto bg-white border-2 border-dashed border-slate-200 p-6 rounded-xl shadow-inner font-mono text-[10px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <ShieldAlert size={80} />
              </div>
              <div className="text-center border-b-2 border-dashed border-slate-200 pb-3 mb-3">
                 <p className="font-black text-sm uppercase tracking-tighter">VIP ACCESS AUDIT</p>
                 <p className="text-slate-400 uppercase">{m.lastName}, {m.firstName} • RENEWS: {m.renewalDate || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                 {m.usages.length === 0 ? (
                    <p className="text-center py-4 text-slate-300 italic uppercase">No Transactions</p>
                 ) : (
                    m.usages.slice().reverse().map((u: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-center text-slate-600 border-b border-slate-50 pb-1 group/audit">
                          <div className="flex flex-col">
                             <span className="tabular-nums">{new Date(u.dateUsed).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})}</span>
                             {u.description && <span className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter">{u.description}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                             <span data-testid="audit-entry-value" className="font-black text-slate-900 uppercase">
                                {u.amount === 0 ? 'INFO' : `[-${u.amount}]`} {u.initials ? `[${u.initials}]` : ''}
                             </span>
                             <button 
                                data-testid="revert-pass-btn"
                                onClick={() => handleRevert(u.id)} 
                                className="text-red-400 hover:text-red-600 transition-opacity"
                             >
                                <Trash2 size={12} />
                             </button>
                          </div>
                       </div>
                    ))
                 )}
                 {m.lastBeverageDate && (
                    <div className="flex justify-between text-blue-600 border-t border-slate-100 pt-1 mt-1">
                       <span>{new Date(m.lastBeverageDate).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})}</span>
                       <span className="font-black">[1] BEV_REDEEM</span>
                    </div>
                 )}
              </div>
              <p className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 text-center text-[8px] text-slate-400 uppercase tracking-widest">Efficiency Secured via ShiftSync v5</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default function PrivilegesTab() {
  const members = useAppStore(state => state.members);
  const users = useAppStore(state => state.users);
  const fetchMembers = useAppStore(state => state.fetchMembers);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  const activeUserObj = users.find(u => u.id.toString() === selectedUserId);
  const isManager = activeUserObj?.systemRoles?.includes('Administrator') || activeUserObj?.systemRoles?.includes('Manager');

  const [passSearch, setPassSearch] = useState('');
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  // 🧪 SUPPORT DEEP-LINK EXPANSION FOR TESTING
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const expandId = params.get('expand');
    if (expandId && members.length > 0) {
      setExpandedMember(parseInt(expandId));
    }
  }, [members.length]);

  // New Member Form
  const [newMemFirst, setNewMemFirst] = useState('');
  const [newMemLast, setNewMemLast] = useState('');
  const [newMemLoc, setNewMemLoc] = useState('');
  const [newMemDate, setNewMemDate] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: newMemFirst, lastName: newMemLast, location: newMemLoc, renewalDate: newMemDate })
      });
      if (res.ok) {
        notify.success("VIP Enrolled!");
        setNewMemFirst(''); setNewMemLast(''); setNewMemLoc(''); setNewMemDate('');
        setShowAddMember(false);
        fetchMembers();
      }
    } catch (e) { notify.error("Failed."); }
  };

  const handleLogPass = async (memberId: number) => {
    const amountStr = prompt("Number of passes to use:", "1");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return notify.error("Invalid amount.");

    const initials = prompt("Staff Initials:");
    if (!initials) return;
    
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOG_PASS_USAGE', memberId, amount, dateUsed: new Date().toISOString(), initials })
      });
      if (res.ok) { notify.success("Logged!"); fetchMembers(); }
    } catch (e) { notify.error("Failed."); }
  };

  const handleRedeemBeverage = async (memberId: number) => {
    if (!confirm("Redeem complimentary beverage?")) return;
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'LOG_BEVERAGE' })
      });
      if (res.ok) { notify.success("Logged!"); fetchMembers(); }
    } catch (e) { notify.error("Failed."); }
  };

  const filteredMembers = (members || []).filter(m => 
    m.lastName.toLowerCase().includes(passSearch.toLowerCase()) ||
    m.firstName.toLowerCase().includes(passSearch.toLowerCase()) ||
    m.family?.toLowerCase().includes(passSearch.toLowerCase())
  ).sort((a,b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-2 pb-20">
      
      {/* COMPACT STADIUM HEADER */}
      <div className="bg-slate-900 p-6 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-brand-green">
         <div className="flex items-center gap-4">
            <div className="bg-brand-green text-white p-3 rounded-2xl shadow-lg rotate-3">
               <Ticket size={24} />
            </div>
            <div className="text-left">
               <h1 className="text-3xl font-black text-white uppercase sports-slant leading-none tracking-tighter">Stadium VIP <span className="text-brand-green">Registry</span></h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High-Speed Front Desk Gatekeeper</p>
            </div>
         </div>

         <div className="relative w-full md:w-96 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-green transition-colors" />
            <input 
              type="text" 
              placeholder="QUICK FIND MEMBER OR FAMILY..." 
              value={passSearch} 
              onChange={(e) => setPassSearch(e.target.value)} 
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl pl-12 pr-4 py-3 font-black text-white text-xs uppercase outline-none focus:border-brand-green transition-all shadow-inner placeholder:text-slate-600"
            />
         </div>

         {isManager && (
           <button onClick={() => setShowAddMember(!showAddMember)} className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 shrink-0">
             {showAddMember ? 'Cancel Add' : '+ Add VIP'}
           </button>
         )}
      </div>

      {showAddMember && (
        <div className="bg-white p-6 border-4 border-slate-900 text-slate-900 animate-in zoom-in-95 duration-200 rounded-[32px] shadow-2xl">
          <h3 className="font-black text-xl sports-slant mb-4 text-slate-900 uppercase">ENROLL NEW VIP</h3>
          <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex gap-2">
               <input required placeholder="LAST NAME" value={newMemLast} onChange={(e) => setNewMemLast(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-200 p-3 font-black text-xs uppercase rounded-xl outline-none focus:border-brand-green" />
               <input required placeholder="FIRST NAME" value={newMemFirst} onChange={(e) => setNewMemFirst(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-200 p-3 font-black text-xs uppercase rounded-xl outline-none focus:border-brand-green" />
            </div>
            <input placeholder="LOC (WF, CH, G)" value={newMemLoc} onChange={(e) => setNewMemLoc(e.target.value)} className="bg-slate-50 border-2 border-slate-200 p-3 font-black text-xs uppercase rounded-xl outline-none focus:border-brand-green" />
            <button type="submit" className="w-full bg-brand-green hover:bg-green-600 text-white font-black py-3 px-6 transition-all sports-slant uppercase rounded-xl shadow-lg active:scale-95">
              Confirm Enrollment
            </button>
          </form>
        </div>
      )}

      {/* ROW-BASED REGISTRY */}
      <div className="bg-white border-4 border-slate-900 rounded-[40px] shadow-2xl overflow-hidden min-h-[50vh]">
         {filteredMembers.length === 0 ? (
           <div className="py-32 text-center">
              <XCircle size={60} className="mx-auto text-slate-100 mb-4" />
              <div className="text-2xl font-black text-slate-200 uppercase tracking-widest italic">No matches found.</div>
           </div>
         ) : (
           <div className="flex flex-col">
              {filteredMembers.map((m: Member) => (
                <MemberVIPRow 
                  key={m.id} m={m} isManager={isManager} expandedMember={expandedMember} setExpandedMember={setExpandedMember}
                  fetchMembers={fetchMembers}
                  handleLogPass={handleLogPass}
                  handleRedeemBeverage={handleRedeemBeverage}
                />
              ))}
           </div>
         )}
      </div>

      {/* REGISTRY STATS */}
      <div className="flex flex-col md:flex-row justify-between items-center px-6 gap-4">
         <div className="flex items-center gap-3">
            <Info size={16} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Showing {filteredMembers.length} Members • {new Date().toLocaleDateString()}</span>
         </div>
         <div className="stadium-scoreboard text-3xl text-slate-900 px-4 flex items-center justify-center min-w-[100px]">{filteredMembers.length.toString().padStart(3, '0')}</div>
      </div>

    </div>
  );
}
