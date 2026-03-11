// filepath: app/components/StaffTab.tsx
"use client";
import React, { useState } from 'react';
import { AppState, User } from '../lib/types';
import { notify, customConfirm } from '@/lib/ui-utils';

export default function StaffTab({ appState }: { appState: AppState }) {
  const { 
    users, 
    locations, 
    handleUpdateUser, 
    handleRoleToggle, 
    handleAddUser,
    handleMergeUsers,
    AVAILABLE_ROLES, 
    isAdmin,
    isManager 
  } = appState;

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    pinCode: '',
    courtReserveId: '',
    phoneNumber: '',
    email: ''
  });

  // Merge Tool State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // Filter & Grouping State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [groupBy, setGroupBy] = useState<'NONE' | 'LOCATION' | 'ROLE'>('NONE');

  const toggleLocation = async (user: User, locationId: number) => {
    const currentLocs = user.locationIds ? [...user.locationIds] : [];
    let newLocs: number[];

    if (currentLocs.includes(locationId)) {
      newLocs = currentLocs.filter(id => id !== locationId);
    } else {
      newLocs = [...currentLocs, locationId];
    }
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
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      notify.error("Please select two different users to merge.");
      return;
    }
    
    const sourceUser = users.find(u => u.id.toString() === mergeSourceId);
    const targetUser = users.find(u => u.id.toString() === mergeTargetId);
    
    if(!(await customConfirm(`WARNING: You are about to move all of ${sourceUser?.name}'s shifts, timecards, and passkeys into ${targetUser?.name}'s account.\n\nThe ${sourceUser?.name} account will be PERMANENTLY DELETED.\n\nAre you absolutely sure?`, "Merge Users", true))) return;
    
    setIsMerging(true);
    await handleMergeUsers(parseInt(mergeSourceId), parseInt(mergeTargetId));
    setIsMerging(false);
    setMergeModalOpen(false);
    setMergeSourceId('');
    setMergeTargetId('');
  };

  if (!isAdmin && !isManager) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Access Denied</h2>
        <p className="text-slate-600 font-bold mt-2">Only Administrators and Managers can manage staff assignments.</p>
      </div>
    );
  }

  // --- FILTERING LOGIC ---
  const processedUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLoc = filterLocation === 'ALL' || u.locationIds?.includes(parseInt(filterLocation));
    const matchesRole = filterRole === 'ALL' || u.systemRoles?.includes(filterRole);
    const matchesActive = showArchived ? true : u.isActive !== false;
    
    return matchesSearch && matchesLoc && matchesRole && matchesActive;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // --- RENDER HELPERS ---
  const renderUserRow = (user: User) => {
    const userLocs = user.locationIds ||[];
    const isInactive = user.isActive === false;
    const isManagement = user.systemRoles?.includes('Administrator') || user.systemRoles?.includes('Manager');

    return (
      <div key={user.id} className={`bg-white border border-slate-200 rounded-xl p-3 flex flex-col xl:flex-row gap-3 items-start xl:items-center shadow-sm hover:shadow transition-all group relative ${isInactive ? 'opacity-60 bg-slate-50 grayscale' : ''}`}>
        
        {/* Profile & PIN */}
        <div className="flex w-full xl:w-[18%] items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-black text-lg shadow-inner ${isInactive ? 'bg-slate-400' : 'bg-slate-900'}`}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-slate-900 leading-tight truncate flex items-center gap-2" title={user.name}>
              <span className={isInactive ? 'line-through text-slate-500' : ''}>{user.name}</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID:{user.id}</span>
              <input 
                type="text" maxLength={4} defaultValue={user.pinCode || ''} 
                onBlur={(e) => handleUpdateUser(user.id, { pinCode: e.target.value })}
                disabled={isInactive}
                className="w-12 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-center focus:bg-white focus:border-blue-500 outline-none"
                placeholder="PIN"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="w-full xl:w-[22%] flex flex-col gap-1.5 border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
          <input 
            type="email" defaultValue={user.email || ''} 
            onBlur={(e) => handleUpdateUser(user.id, { email: e.target.value })}
            disabled={isInactive}
            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold focus:bg-white focus:border-blue-500 outline-none"
            placeholder="Email Address"
          />
          <input 
            type="tel" defaultValue={user.phoneNumber || ''} 
            onBlur={(e) => handleUpdateUser(user.id, { phoneNumber: e.target.value })}
            disabled={isInactive}
            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold focus:bg-white focus:border-blue-500 outline-none"
            placeholder="Phone Number"
          />
        </div>

        {/* Roles */}
        <div className="w-full xl:w-[20%] border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
          <div className="text-[8px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">System Roles</div>
          <div className="flex flex-wrap gap-1">
            {AVAILABLE_ROLES.map(role => {
              const hasRole = user.systemRoles?.includes(role);
              const isRoleDisabled = (!isAdmin && role === 'Administrator') || isInactive;
              return (
                <button
                  key={role}
                  onClick={() => !isRoleDisabled && handleRoleToggle(user.id, role)}
                  disabled={isRoleDisabled}
                  className={`px-2 py-0.5 rounded text-[9px] font-black transition-all border ${
                    hasRole ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-800'
                  } ${isRoleDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* NEW: Notification Settings (Receiver Preference) */}
        <div className="w-full xl:w-[15%] border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
          <div className="text-[8px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Notifications</div>
          {isManagement ? (
            <button
              onClick={() => handleUpdateUser(user.id, { receiveReportEmails: !user.receiveReportEmails })}
              disabled={isInactive}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded border transition-all ${
                user.receiveReportEmails !== false 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="text-[9px] font-black uppercase">Reports via Email</span>
              <span className="text-[10px]">{user.receiveReportEmails !== false ? 'ON' : 'OFF'}</span>
            </button>
          ) : (
            <div className="text-[9px] font-bold text-slate-300 italic px-1">Not applicable to staff</div>
          )}
        </div>

        {/* Locations */}
        <div className="w-full xl:w-[25%] border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
          <div className="text-[8px] font-black text-slate-400 mb-1.5 uppercase tracking-widest flex justify-between">
            <span>Workable Locations</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {locations.map(loc => {
              const isAssigned = userLocs.includes(loc.id);
              if (!isAssigned && loc.isActive === false) return null;
              return (
                <button
                  key={loc.id}
                  onClick={() => !isInactive && toggleLocation(user, loc.id)}
                  disabled={isInactive}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black transition-all border ${
                    isAssigned ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-800'
                  } ${loc.isActive === false ? 'opacity-60' : ''}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isAssigned ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Archive/Restore Action */}
        <button 
          onClick={async () => {
            const newStatus = isInactive ? true : false;
            if (!newStatus && !(await customConfirm(`Archive ${user.name}?`, "Archive", true))) return;
            await handleUpdateUser(user.id, { isActive: newStatus });
            notify.success(newStatus ? "Staff restored!" : "Staff archived.");
          }}
          className={`absolute top-2 right-2 text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm border transition-opacity ${
            isInactive ? 'opacity-100 bg-green-100 text-green-800' : 'opacity-0 group-hover:opacity-100 bg-red-50 text-red-700'
          }`}
        >
          {isInactive ? 'Restore' : 'Archive'}
        </button>

      </div>
    );
  };

  const renderGroupedList = () => {
    if (processedUsers.length === 0) return <div className="py-12 text-center bg-white border border-dashed rounded-2xl font-bold italic text-slate-500">No staff match filters.</div>;
    if (groupBy === 'NONE') return <div className="flex flex-col gap-2">{processedUsers.map(renderUserRow)}</div>;

    if (groupBy === 'LOCATION') {
      return (
        <div className="space-y-6">
          {locations.map(loc => {
            const groupUsers = processedUsers.filter(u => u.locationIds?.includes(loc.id));
            if (groupUsers.length === 0) return null;
            return (
              <div key={loc.id} className="space-y-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>{loc.name}
                </h3>
                {groupUsers.map(renderUserRow)}
              </div>
            );
          })}
        </div>
      );
    }

    if (groupBy === 'ROLE') {
      return (
        <div className="space-y-6">
          {AVAILABLE_ROLES.map(role => {
            const groupUsers = processedUsers.filter(u => u.systemRoles?.includes(role));
            if (groupUsers.length === 0) return null;
            return (
              <div key={role} className="space-y-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>{role}
                </h3>
                {groupUsers.map(renderUserRow)}
              </div>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Staff Management</h2>
          <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">Directory & Notification Preferences</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => setMergeModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-black shadow-md text-sm">🔗 Merge Duplicates</button>
          )}
          <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black shadow-md text-sm">➕ Add Staff</button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-xs font-bold bg-slate-50 focus:bg-white outline-none" />
        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="border rounded-lg py-2 px-3 text-xs font-bold bg-slate-50">
          <option value="ALL">All Locations</option>
          {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
        </select>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="border rounded-lg py-2 px-3 text-xs font-bold bg-slate-50">
          <option value="ALL">All Roles</option>
          {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="border border-blue-200 rounded-lg py-2 px-3 text-xs font-black text-blue-900 bg-blue-50 outline-none">
          <option value="NONE">No Grouping</option>
          <option value="LOCATION">Group by Location</option>
          <option value="ROLE">Group by Role</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-2 rounded-lg">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
          <span className="text-[10px] font-black uppercase text-slate-600">Show Archived</span>
        </label>
      </div>

      <div className="pt-2">{renderGroupedList()}</div>

      {/* --- ADD MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-900">Add New Staff</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 text-2xl font-black">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">Full Name *</label>
                <input required autoFocus value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} className="w-full border rounded-xl p-2.5 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">PIN</label>
                  <input maxLength={4} value={newStaff.pinCode} onChange={(e) => setNewStaff({...newStaff, pinCode: e.target.value})} className="w-full border rounded-xl p-2.5 font-black text-center" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">CR ID</label>
                  <input value={newStaff.courtReserveId} onChange={(e) => setNewStaff({...newStaff, courtReserveId: e.target.value})} className="w-full border rounded-xl p-2.5 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">Email</label>
                <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} className="w-full border rounded-xl p-2.5 font-bold" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-3 rounded-xl mt-2">Create Staff Member</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MERGE MODAL --- */}
      {mergeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-5 border-b bg-orange-50 flex justify-between items-center text-orange-900">
              <h3 className="font-black text-xl">🔗 Merge Duplicates</h3>
              <button onClick={() => setMergeModalOpen(false)} className="text-2xl font-black">&times;</button>
            </div>
            <form onSubmit={handleMergeSubmit} className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-red-300">
                <label className="block text-xs font-black text-red-600 uppercase mb-2">1. Ghost Account (DELETED)</label>
                <select required value={mergeSourceId} onChange={(e) => setMergeSourceId(e.target.value)} className="w-full border p-2.5 rounded-lg font-bold">
                  <option value="">- Select -</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} (ID:{u.id})</option>)}
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-300">
                <label className="block text-xs font-black text-blue-700 uppercase mb-2">2. Primary Account (KEPT)</label>
                <select required value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className="w-full border p-2.5 rounded-lg font-bold">
                  <option value="">- Select -</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} (ID:{u.id})</option>)}
                </select>
              </div>
              <button type="submit" disabled={isMerging} className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-md uppercase">{isMerging ? 'Merging...' : 'Confirm & Merge'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}