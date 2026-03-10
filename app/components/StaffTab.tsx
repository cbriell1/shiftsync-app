"use client";
import React, { useState } from 'react';
import { AppState, User } from '../lib/types';

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
  const[isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  const[filterLocation, setFilterLocation] = useState<string>('ALL');
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
      alert("Please select two different users to merge.");
      return;
    }
    
    const sourceUser = users.find(u => u.id.toString() === mergeSourceId);
    const targetUser = users.find(u => u.id.toString() === mergeTargetId);
    
    if(!confirm(`WARNING: You are about to move all of ${sourceUser?.name}'s shifts, timecards, and passkeys into ${targetUser?.name}'s account.\n\nThe ${sourceUser?.name} account will be PERMANENTLY DELETED.\n\nAre you absolutely sure?`)) return;
    
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

    return (
      <div key={user.id} className={`bg-white border border-slate-200 rounded-xl p-3 flex flex-col xl:flex-row gap-3 items-start xl:items-center shadow-sm hover:shadow transition-all group relative ${isInactive ? 'opacity-60 bg-slate-50 grayscale' : ''}`}>
        
        {/* Profile & PIN (Compact) */}
        <div className="flex w-full xl:w-[20%] items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-black text-lg shadow-inner ${isInactive ? 'bg-slate-400' : 'bg-slate-900'}`}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-slate-900 leading-tight truncate flex items-center gap-2" title={user.name}>
              <span className={isInactive ? 'line-through text-slate-500' : ''}>{user.name}</span>
              {isInactive && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded">ARCHIVED</span>}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-widest">
                ID:{user.id}
              </span>
              <input 
                type="text" 
                maxLength={4}
                defaultValue={user.pinCode || ''} 
                onBlur={(e) => handleUpdateUser(user.id, { pinCode: e.target.value })}
                disabled={isInactive}
                className="w-12 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-900 text-center focus:bg-white focus:border-blue-500 outline-none transition-colors placeholder:font-normal placeholder:text-slate-300 disabled:opacity-50"
                placeholder="PIN"
              />
            </div>
          </div>
        </div>

        {/* Contact Info (Compact) */}
        <div className="w-full xl:w-[25%] flex flex-col gap-1.5 border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
          <input 
            type="email" 
            defaultValue={user.email || ''} 
            onBlur={(e) => handleUpdateUser(user.id, { email: e.target.value })}
            disabled={isInactive}
            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors disabled:opacity-50"
            placeholder="Email Address"
          />
          <div className="flex gap-1.5">
            <input 
              type="tel" 
              defaultValue={user.phoneNumber || ''} 
              onBlur={(e) => handleUpdateUser(user.id, { phoneNumber: e.target.value })}
              disabled={isInactive}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors disabled:opacity-50"
              placeholder="Phone"
            />
            <input 
              type="text" 
              defaultValue={user.courtReserveId || ''} 
              onBlur={(e) => handleUpdateUser(user.id, { courtReserveId: e.target.value })}
              disabled={isInactive}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors disabled:opacity-50"
              placeholder="CR ID"
            />
          </div>
        </div>

        {/* Roles (Compact Badges) */}
        <div className="w-full xl:w-[25%] border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
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
                    hasRole 
                      ? 'bg-slate-800 border-slate-800 text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800'
                  } ${isRoleDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Locations (Compact Badges) */}
        <div className="w-full xl:w-[30%] border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
          <div className="text-[8px] font-black text-slate-400 mb-1.5 uppercase tracking-widest flex justify-between">
            <span>Workable Locations</span>
            {userLocs.length === 0 && !isInactive && <span className="text-red-500">Unassigned!</span>}
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
                    isAssigned 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800'
                  } ${loc.isActive === false ? 'opacity-60' : ''} ${isInactive ? 'cursor-not-allowed' : ''}`}
                  title={loc.isActive === false ? 'This location is archived' : ''}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isAssigned ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  {loc.name} {loc.isActive === false && '[ARCHIVED]'}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Archive/Restore Action Hover Button */}
        <button 
          onClick={() => {
            const newStatus = isInactive ? true : false;
            if (!newStatus) {
              if(!confirm(`Are you sure you want to archive ${user.name}? They will be hidden from the Kiosk and schedule dropdowns, but historical records will remain.`)) return;
            }
            handleUpdateUser(user.id, { isActive: newStatus });
          }}
          className={`absolute top-2 right-2 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm border transition-opacity ${
            isInactive 
              ? 'opacity-100 bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
              : 'opacity-0 group-hover:opacity-100 bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
        >
          {isInactive ? 'Restore Account' : 'Archive Staff'}
        </button>

      </div>
    );
  };

  const renderGroupedList = () => {
    if (processedUsers.length === 0) return <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl"><p className="text-slate-500 font-bold italic">No staff members match your filters.</p></div>;
    if (groupBy === 'NONE') return <div className="flex flex-col gap-2">{processedUsers.map(renderUserRow)}</div>;

    if (groupBy === 'LOCATION') {
      return (
        <div className="space-y-6">
          {locations.map(loc => {
            const groupUsers = processedUsers.filter(u => u.locationIds?.includes(loc.id));
            if (groupUsers.length === 0) return null;
            return (
              <div key={loc.id} className="space-y-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
                  {loc.name} {loc.isActive === false && '(Archived)'}
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-2">{groupUsers.length}</span>
                </h3>
                {groupUsers.map(renderUserRow)}
              </div>
            );
          })}
          {(() => {
            const unassigned = processedUsers.filter(u => !u.locationIds || u.locationIds.length === 0);
            if (unassigned.length === 0) return null;
            return (
              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-black text-red-800 uppercase tracking-widest border-b border-red-200 pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span> No Location Assigned <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">{unassigned.length}</span>
                </h3>
                {unassigned.map(renderUserRow)}
              </div>
            );
          })()}
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
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 block"></span>{role} <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-2">{groupUsers.length}</span>
                </h3>
                {groupUsers.map(renderUserRow)}
              </div>
            );
          })}
          {(() => {
            const unassigned = processedUsers.filter(u => !u.systemRoles || u.systemRoles.length === 0);
            if (unassigned.length === 0) return null;
            return (
              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest border-b border-orange-200 pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block"></span> No Role Assigned <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2">{unassigned.length}</span>
                </h3>
                {unassigned.map(renderUserRow)}
              </div>
            );
          })()}
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Staff Management</h2>
          <p className="text-slate-600 font-bold text-xs uppercase tracking-widest mt-0.5">Directory & Permissions Setup</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setMergeModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-black transition-all shadow-md text-sm"
            >
              <span>🔗</span> Merge Duplicates
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black transition-all shadow-md text-sm"
          >
            <span>➕</span> Add New Staff
          </button>
        </div>
      </div>

      {/* Toolbar: Filters & Grouping */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row flex-wrap gap-3 items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-auto md:flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        {/* Location Filter */}
        <select 
          value={filterLocation} 
          onChange={(e) => setFilterLocation(e.target.value)}
          className="w-full md:w-auto border border-slate-300 rounded-lg py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white outline-none cursor-pointer"
        >
          <option value="ALL">All Locations</option>
          {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} {loc.isActive === false ? '(Archived)' : ''}</option>)}
        </select>

        {/* Role Filter */}
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full md:w-auto border border-slate-300 rounded-lg py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white outline-none cursor-pointer"
        >
          <option value="ALL">All Roles</option>
          {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
        </select>

        <div className="h-6 w-px bg-slate-300 hidden md:block mx-1"></div>

        {/* Grouping Toggle */}
        <select 
          value={groupBy} 
          onChange={(e) => setGroupBy(e.target.value as any)}
          className="w-full md:w-auto border border-blue-200 rounded-lg py-2 px-3 text-xs font-black text-blue-900 bg-blue-50 focus:border-blue-500 outline-none cursor-pointer"
        >
          <option value="NONE">No Grouping (Flat List)</option>
          <option value="LOCATION">Group by Location</option>
          <option value="ROLE">Group by Role</option>
        </select>

        <label className="flex items-center gap-2 ml-2 cursor-pointer bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Show Archived</span>
        </label>

      </div>

      {/* Data List View */}
      <div className="pt-2">
        {renderGroupedList()}
      </div>

      {/* --- ADD NEW STAFF MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-xl text-slate-900">Add New Staff</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 text-2xl font-black leading-none transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Full Name *</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Kiosk PIN</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    value={newStaff.pinCode}
                    onChange={(e) => setNewStaff({...newStaff, pinCode: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-black text-center tracking-widest text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">CR ID</label>
                  <input 
                    type="text" 
                    value={newStaff.courtReserveId}
                    onChange={(e) => setNewStaff({...newStaff, courtReserveId: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={newStaff.phoneNumber}
                  onChange={(e) => setNewStaff({...newStaff, phoneNumber: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  placeholder="Optional"
                />
              </div>

              <div className="pt-3">
                <button type="submit" className="w-full bg-slate-900 text-white font-black text-base py-3 rounded-xl hover:bg-black transition-colors shadow-md">
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MERGE ACCOUNTS MODAL --- */}
      {mergeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-300">
            <div className="p-5 border-b border-orange-200 bg-orange-50 flex justify-between items-center">
              <h3 className="font-black text-xl text-orange-900 flex items-center gap-2"><span>🔗</span> Merge Duplicate Users</h3>
              <button onClick={() => setMergeModalOpen(false)} className="text-orange-400 hover:text-red-600 text-2xl font-black leading-none transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleMergeSubmit} className="p-6 space-y-6">
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="block text-xs font-black text-red-600 uppercase tracking-widest mb-2">1. Ghost Account (Will be DELETED)</label>
                <p className="text-[10px] text-slate-500 mb-2 font-medium">Select the temporary or duplicate account. All of their data will be moved OUT of this account, and then this account will be erased.</p>
                <select 
                  required 
                  value={mergeSourceId} 
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  className="w-full border-2 border-red-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:border-red-500 outline-none bg-white"
                >
                  <option value="">-- Select Ghost Account --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>)}
                </select>
              </div>

              <div className="flex justify-center -my-2 z-10 relative">
                <div className="bg-slate-200 text-slate-600 font-black text-xs px-3 py-1 rounded-full border-4 border-white">MOVES INTO</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-xs font-black text-blue-700 uppercase tracking-widest mb-2">2. Primary Account (Will KEEP everything)</label>
                <p className="text-[10px] text-slate-500 mb-2 font-medium">Select the correct, permanent account. All shifts, timecards, and login passkeys from the ghost account will be safely attached to this user.</p>
                <select 
                  required 
                  value={mergeTargetId} 
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full border-2 border-blue-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">-- Select Primary Account --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>)}
                </select>
              </div>

              <button type="submit" disabled={isMerging} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-md transition-colors text-sm uppercase tracking-wider">
                {isMerging ? 'Merging Data...' : 'Confirm & Merge Users'}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}