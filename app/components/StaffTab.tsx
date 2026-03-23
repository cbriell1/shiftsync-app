// filepath: app/components/StaffTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { User, AuditLog } from '../lib/types';
import { notify, customConfirm } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { AVAILABLE_ROLES } from '@/lib/common';
import ActiveSessionsTab from './ActiveSessionsTab';

export default function StaffTab({ appState }: any) {
  const users = useAppStore(state => state.users);
  const locations = useAppStore(state => state.locations);
  const auditLogs = useAppStore(state => state.auditLogs);
  const selectedUserId = useAppStore(state => state.selectedUserId);
  const fetchUsers = useAppStore(state => state.fetchUsers);
  const fetchTimeCards = useAppStore(state => state.fetchTimeCards);
  const fetchShifts = useAppStore(state => state.fetchShifts);
  const fetchAuditLogs = useAppStore(state => state.fetchAuditLogs);

  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUser?.systemRoles?.includes('Administrator');
  const isManager = activeUser?.systemRoles?.includes('Manager') || isAdmin;

  const [staffView, setStaffView] = useState<'DIRECTORY' | 'SESSIONS' | 'LOGS'>('DIRECTORY');
  const[isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', pinCode: '', courtReserveId: '', phoneNumber: '', email: '' });
  const[mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const[mergeTargetId, setMergeTargetId] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  
  // Directory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const[filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const[groupBy, setGroupBy] = useState<'NONE' | 'LOCATION' | 'ROLE'>('NONE');

  // NEW: Log Filters
  const [logDateFilter, setLogDateFilter] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('ALL');

  useEffect(() => {
    if (staffView === 'LOGS' && isAdmin) {
      fetchAuditLogs();
    }
  }, [staffView, isAdmin]);

  useEffect(() => {
    if (!isAdmin && (staffView === 'LOGS' || staffView === 'SESSIONS')) {
      setStaffView('DIRECTORY');
    }
  }, [isAdmin, staffView]);

  if (!isAdmin && !isManager) return <div className="p-8 text-center bg-white rounded-2xl border border-gray-200"><h2 className="text-xl font-black text-slate-900 uppercase">Access Denied</h2></div>;

  const handleAddUser = async (userData: any) => {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
    if (res.ok) { await fetchUsers(); notify.success("User added successfully!"); } 
    else { const err = await res.json(); notify.error(`Failed to add user: ${err.error || 'Unknown error'}`); }
  };

  const handleUpdateUser = async (targetUserId: number, updates: any) => {
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: targetUserId, ...updates }) });
    await fetchUsers();
  };

  const handleRoleToggle = async (targetUserId: number, roleName: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;
    let currentRoles = targetUser.systemRoles ? [...targetUser.systemRoles] :[];
    if (currentRoles.includes(roleName)) currentRoles = currentRoles.filter(r => r !== roleName);
    else currentRoles.push(roleName);
    await handleUpdateUser(targetUserId, { roles: currentRoles });
  };

  const handleMergeUsers = async (oldId: number, newId: number) => {
    const res = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'MERGE', oldId, newId }) });
    if (res.ok) { 
      notify.success("Users merged successfully!"); 
      await fetchUsers(); await fetchTimeCards(selectedUserId); await fetchShifts(); 
    } else { 
      const err = await res.json(); notify.error(`Merge failed: ${err.error || 'Unknown error'}`); 
    }
  };

  const toggleLocation = async (user: User, locationId: number) => {
    const currentLocs = user.locationIds ?[...user.locationIds] :[];
    let newLocs = currentLocs.includes(locationId) ? currentLocs.filter(id => id !== locationId) : [...currentLocs, locationId];
    await handleUpdateUser(user.id, { locationIds: newLocs });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddUser(newStaff);
    setIsAddModalOpen(false);
    setNewStaff({ name: '', pinCode: '', courtReserveId: '', phoneNumber: '', email: '' });
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) return notify.error("Select two different users.");
    const sourceUser = users.find(u => u.id.toString() === mergeSourceId);
    const targetUser = users.find(u => u.id.toString() === mergeTargetId);
    if (!(await customConfirm(`Merge ${sourceUser?.name} into ${targetUser?.name}?`, "Confirm Merge", true))) return;
    setIsMerging(true);
    await handleMergeUsers(parseInt(mergeSourceId), parseInt(mergeTargetId));
    setIsMerging(false);
    setMergeModalOpen(false);
  };

  const processedUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLoc = filterLocation === 'ALL' || u.locationIds?.includes(parseInt(filterLocation));
    const matchesRole = filterRole === 'ALL' || u.systemRoles?.includes(filterRole);
    const matchesActive = showArchived ? true : u.isActive !== false;
    return matchesSearch && matchesLoc && matchesRole && matchesActive;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // NEW: Filtered Logs logic
  const filteredLogs = auditLogs.filter((log: AuditLog) => {
    let matchesDate = true;
    if (logDateFilter) {
      // en-CA formats Date to standard YYYY-MM-DD which perfectly matches HTML5 date inputs
      const logLocal = new Date(log.createdAt).toLocaleDateString('en-CA');
      matchesDate = logLocal === logDateFilter;
    }
    
    let matchesUser = true;
    if (logUserFilter === 'SYSTEM') {
      matchesUser = log.userId === null;
    } else if (logUserFilter !== 'ALL') {
      matchesUser = log.userId?.toString() === logUserFilter;
    }
    
    return matchesDate && matchesUser;
  });

  const renderUserRow = (user: User) => {
    const isInactive = user.isActive === false;
    const isManagement = user.systemRoles?.includes('Administrator') || user.systemRoles?.includes('Manager');
    
    let lastLoginDisplay = 'Never';
    if (user.lastLoginAt) {
      const loginDate = new Date(user.lastLoginAt);
      lastLoginDisplay = `${loginDate.toLocaleDateString()} @ ${loginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return (
      <div key={user.id} className={`bg-white border border-slate-200 rounded-xl p-3 flex flex-col xl:flex-row gap-3 items-start xl:items-center shadow-sm hover:shadow transition-all group relative ${isInactive ? 'opacity-60 grayscale' : ''}`}>
        <div className="flex w-full xl:w-[22%] items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-inner shrink-0 ${isInactive ? 'bg-slate-400' : 'bg-slate-900'}`}>{user.name.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black truncate text-slate-900">{user.name}</h3>
            
            {/* FIX: Bright, unmistakable Last Login Badge */}
            <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border shadow-sm ${user.lastLoginAt ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user.lastLoginAt ? 'bg-green-500' : 'bg-slate-400'}`}></span> 
              <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Login: {lastLoginDisplay}</span>
            </div>

          </div>
        </div>
        <div className="w-full xl:w-[18%] flex flex-col gap-2 border-t xl:border-t-0 xl:border-l pt-2 xl:pt-0 xl:pl-4">
          <div className="flex items-center gap-2">
             <span className="text-[9px] font-bold text-slate-400">ID:{user.id}</span>
             <input type="text" maxLength={4} defaultValue={user.pinCode || ''} onBlur={(e) => handleUpdateUser(user.id, { pinCode: e.target.value })} className="w-12 bg-slate-100 border border-slate-300 rounded text-[9px] font-black text-center text-slate-950 focus:bg-white focus:border-blue-500 outline-none" placeholder="PIN" />
          </div>
          <input type="email" defaultValue={user.email || ''} onBlur={(e) => handleUpdateUser(user.id, { email: e.target.value })} className="w-full bg-slate-50 border border-slate-400 rounded p-1.5 text-[10px] font-black text-slate-950 focus:bg-white focus:border-blue-500 outline-none" placeholder="Email" />
        </div>
        <div className="w-full xl:w-[20%] border-t xl:border-t-0 xl:border-l pt-2 xl:pt-0 xl:pl-4">
          <div className="flex flex-wrap gap-1">
            {AVAILABLE_ROLES.map(role => (
              <button key={role} onClick={() => handleRoleToggle(user.id, role)} className={`px-2 py-0.5 rounded text-[9px] font-black border ${user.systemRoles?.includes(role) ? 'bg-slate-800 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}>{role}</button>
            ))}
          </div>
        </div>
        <div className="w-full xl:w-[15%] border-t xl:border-t-0 xl:border-l pt-2 xl:pt-0 xl:pl-4">
          {isManagement && (
            <button onClick={() => handleUpdateUser(user.id, { receiveReportEmails: !user.receiveReportEmails })} className={`flex items-center justify-between w-full px-2 py-1.5 rounded border text-[9px] font-black transition-all ${user.receiveReportEmails !== false ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span>REPORTS</span><span>{user.receiveReportEmails !== false ? 'ON' : 'OFF'}</span>
            </button>
          )}
        </div>
        <div className="w-full xl:w-[25%] border-t xl:border-t-0 xl:border-l pt-2 xl:pt-0 xl:pl-4">
          <div className="flex flex-wrap gap-1">
            {locations.map(loc => (
              <button key={loc.id} onClick={() => toggleLocation(user, loc.id)} className={`px-2 py-0.5 rounded text-[9px] font-black border transition-all ${user.locationIds?.includes(loc.id) ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}>{loc.name}</button>
            ))}
          </div>
        </div>
        <button onClick={async () => { const newS = !user.isActive; await handleUpdateUser(user.id, { isActive: newS }); notify.success(newS ? "Restored" : "Archived"); }} className={`absolute top-2 right-2 text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm border opacity-0 group-hover:opacity-100 ${isInactive ? 'bg-green-100 text-green-800 opacity-100' : 'bg-red-50 text-red-700'}`}>{isInactive ? 'Restore' : 'Archive'}</button>
      </div>
    );
  };

  const getLogBadge = (action: string) => {
    switch(action.toUpperCase()) {
      case 'LOGIN': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ERROR': return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Staff Management</h2>
          <div className="flex bg-slate-200 p-1 rounded-lg mt-2 w-max shadow-inner border border-slate-300">
            <button onClick={() => setStaffView('DIRECTORY')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${staffView === 'DIRECTORY' ? 'bg-white shadow text-slate-900 border border-slate-300' : 'text-slate-500'}`}>Staff Directory</button>
            {isAdmin && (
              <>
                <button onClick={() => setStaffView('SESSIONS')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${staffView === 'SESSIONS' ? 'bg-white shadow text-slate-900 border border-slate-300' : 'text-slate-500'}`}>Live Sessions</button>
                <button onClick={() => setStaffView('LOGS')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${staffView === 'LOGS' ? 'bg-white shadow text-blue-700 border border-slate-300' : 'text-slate-500'}`}>System Logs</button>
              </>
            )}
          </div>
        </div>
        {staffView === 'DIRECTORY' && (
          <div className="flex gap-2">
            {isAdmin && <button onClick={() => setMergeModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all">🔗 Merge Duplicates</button>}
            {isAdmin && <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all">➕ Add Staff</button>}
          </div>
        )}
      </div>

      {staffView === 'SESSIONS' && isAdmin ? (
        <ActiveSessionsTab />
      ) : staffView === 'LOGS' && isAdmin ? (
        // --- SYSTEM LOGS VIEW WITH FILTERS ---
        <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h3 className="font-black text-slate-800">Recent Activity & Errors</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input 
                type="date" 
                value={logDateFilter} 
                onChange={(e) => setLogDateFilter(e.target.value)} 
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-inner"
              />
              <select 
                value={logUserFilter} 
                onChange={(e) => setLogUserFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer shadow-inner"
              >
                <option value="ALL">All Users</option>
                <option value="SYSTEM">System Actions Only</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button onClick={() => { setLogDateFilter(''); setLogUserFilter('ALL'); fetchAuditLogs(); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">Clear & Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-600 text-[10px] uppercase font-black sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 w-48">Date / Time</th>
                  <th className="p-3 w-48">User</th>
                  <th className="p-3 w-32">Action</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold italic">No logs match your filters.</td></tr>
                ) : (
                  filteredLogs.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-xs font-bold text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-xs font-black text-slate-800">
                        {log.user ? log.user.name : <span className="text-slate-400 italic">System</span>}
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm ${getLogBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-medium text-slate-700 whitespace-normal min-w-[300px]">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // --- DIRECTORY VIEW ---
        <>
          <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex flex-col md:flex-row gap-3 items-center">
            <input type="text" placeholder="Search name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 min-w-[200px] px-3 py-2 border border-slate-400 rounded-lg text-xs font-black text-slate-950 bg-slate-50 focus:bg-white outline-none placeholder:text-slate-500" />
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="border border-slate-400 rounded-lg py-2 px-3 text-xs font-black text-slate-950 bg-slate-50 outline-none cursor-pointer">
              <option value="ALL">All Locations</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="border border-blue-400 rounded-lg py-2 px-3 text-xs font-black text-blue-900 bg-blue-50 outline-none cursor-pointer">
              <option value="NONE">No Grouping</option>
              <option value="LOCATION">Group by Location</option>
              <option value="ROLE">Group by Role</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-2 rounded-lg border border-slate-300">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
              <span className="text-[10px] font-black uppercase text-slate-700">Show Archived</span>
            </label>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            {processedUsers.length === 0 ? <div className="py-12 text-center bg-white border border-dashed rounded-2xl italic font-black text-slate-400 uppercase tracking-widest">No staff match filters.</div> : processedUsers.map(renderUserRow)}
          </div>
        </>
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-300">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-black text-xl text-slate-900">Add New Staff</h3><button onClick={() => setIsAddModalOpen(false)} className="text-2xl font-black text-slate-400 hover:text-red-500 transition-colors">&times;</button></div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Full Name *</label><input required autoFocus value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} className="w-full border border-slate-400 rounded-xl p-2.5 font-black text-slate-950 focus:border-blue-600 outline-none shadow-sm" /></div>
              <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Email</label><input type="email" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} className="w-full border border-slate-400 rounded-xl p-2.5 font-black text-slate-950 focus:border-blue-600 outline-none shadow-sm" /></div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-lg transition-all mt-2">Create Staff Member</button>
            </form>
          </div>
        </div>
      )}

      {/* MERGE MODAL */}
      {mergeModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden border border-slate-300">
            <div className="p-5 border-b bg-orange-50 flex justify-between items-center text-orange-900"><h3 className="font-black text-xl">🔗 Merge Duplicates</h3><button onClick={() => setMergeModalOpen(false)} className="text-2xl font-black hover:text-red-600 transition-colors">&times;</button></div>
            <form onSubmit={handleMergeSubmit} className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-red-300">
                <label className="block text-xs font-black text-red-600 uppercase mb-2">1. Ghost Account (DELETED)</label>
                <select required value={mergeSourceId} onChange={(e) => setMergeSourceId(e.target.value)} className="w-full border border-slate-400 p-2.5 rounded-lg font-black text-slate-950 focus:border-red-600 outline-none">
                  <option value="">- Select Ghost User -</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} (ID:{u.id})</option>)}
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-300">
                <label className="block text-xs font-black text-blue-700 uppercase mb-2">2. Primary Account (KEPT)</label>
                <select required value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className="w-full border border-slate-400 p-2.5 rounded-lg font-black text-slate-950 focus:border-blue-600 outline-none">
                  <option value="">- Select Primary User -</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} (ID:{u.id})</option>)}
                </select>
              </div>
              <button type="submit" disabled={isMerging} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-lg uppercase transition-all">Confirm & Merge</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}