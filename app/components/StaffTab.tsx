// filepath: app/components/StaffTab.tsx
"use client";
import React, { useState } from 'react';
import { AppState, User, Location } from '../lib/types';

export default function StaffTab({ appState }: { appState: AppState }) {
  const { 
    users, 
    locations, 
    handleUpdateUser, 
    handleRoleToggle, 
    handleAddUser,
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
    emailAddress: ''
  });

  // Filter & Grouping State
  const[searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const[groupBy, setGroupBy] = useState<'NONE' | 'LOCATION' | 'ROLE'>('NONE');

  // Function to handle toggling a location array for a user
  const toggleLocation = async (user: User, locationId: number) => {
    const currentLocs = user.locationIds ? [...user.locationIds] :[];
    let newLocs: number[];

    if (currentLocs.includes(locationId)) {
      newLocs = currentLocs.filter(id => id !== locationId);
    } else {
      newLocs =[...currentLocs, locationId];
    }

    await handleUpdateUser(user.id, { locationIds: newLocs });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddUser(newStaff);
    setIsAddModalOpen(false);
    setNewStaff({ name: '', pinCode: '', courtReserveId: '', phoneNumber: '', emailAddress: '' });
  };

  // Block completely if not Manager or Admin
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
                          (u.emailAddress && u.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLoc = filterLocation === 'ALL' || u.locationIds?.includes(parseInt(filterLocation));
    const matchesRole = filterRole === 'ALL' || u.systemRoles?.includes(filterRole);
    
    return matchesSearch && matchesLoc && matchesRole;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // --- RENDER HELPERS ---
  const renderUserRow = (user: User) => {
    const userLocs = user.locationIds ||[];

    return (
      <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col xl:flex-row gap-3 items-start xl:items-center shadow-sm hover:shadow transition-all group">
        
        {/* Profile & PIN (Compact) */}
        <div className="flex w-full xl:w-[20%] items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-black text-lg shadow-inner">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-slate-900 leading-tight truncate" title={user.name}>{user.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-widest">
                ID:{user.id}
              </span>
              <input 
                type="text" 
                maxLength={4}
                defaultValue={user.pinCode || ''} 
                onBlur={(e) => handleUpdateUser(user.id, { pinCode: e.target.value })}
                className="w-12 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-900 text-center focus:bg-white focus:border-blue-500 outline-none transition-colors placeholder:font-normal placeholder:text-slate-300"
                placeholder="PIN"
                title="Kiosk PIN"
              />
            </div>
          </div>
        </div>

        {/* Contact Info (Compact) */}
        <div className="w-full xl:w-[25%] flex flex-col gap-1.5 border-t xl:border-t-0 xl:border-l border-slate-100 pt-2 xl:pt-0 xl:pl-4">
          <input 
            type="email" 
            defaultValue={user.emailAddress || ''} 
            onBlur={(e) => handleUpdateUser(user.id, { emailAddress: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
            placeholder="Email Address"
          />
          <div className="flex gap-1.5">
            <input 
              type="tel" 
              defaultValue={user.phoneNumber || ''} 
              onBlur={(e) => handleUpdateUser(user.id, { phoneNumber: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
              placeholder="Phone"
            />
            <input 
              type="text" 
              defaultValue={user.courtReserveId || ''} 
              onBlur={(e) => handleUpdateUser(user.id, { courtReserveId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
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
              const isRoleDisabled = !isAdmin && role === 'Administrator';
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
            {userLocs.length === 0 && <span className="text-red-500">Unassigned!</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {locations.map(loc => {
              const isAssigned = userLocs.includes(loc.id);
              return (
                <button
                  key={loc.id}
                  onClick={() => toggleLocation(user, loc.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black transition-all border ${
                    isAssigned 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isAssigned ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

  const renderGroupedList = () => {
    if (processedUsers.length === 0) {
      return (
        <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
          <p className="text-slate-500 font-bold italic">No staff members match your filters.</p>
        </div>
      );
    }

    if (groupBy === 'NONE') {
      return <div className="flex flex-col gap-2">{processedUsers.map(renderUserRow)}</div>;
    }

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
                  {loc.name} 
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-2">{groupUsers.length}</span>
                </h3>
                {groupUsers.map(renderUserRow)}
              </div>
            );
          })}
          {/* Unassigned Users */}
          {(() => {
            const unassigned = processedUsers.filter(u => !u.locationIds || u.locationIds.length === 0);
            if (unassigned.length === 0) return null;
            return (
              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-black text-red-800 uppercase tracking-widest border-b border-red-200 pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
                  No Location Assigned
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">{unassigned.length}</span>
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
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 block"></span>
                  {role}
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-2">{groupUsers.length}</span>
                </h3>
                {groupUsers.map(renderUserRow)}
              </div>
            );
          })}
          {/* Unassigned Roles */}
          {(() => {
            const unassigned = processedUsers.filter(u => !u.systemRoles || u.systemRoles.length === 0);
            if (unassigned.length === 0) return null;
            return (
              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest border-b border-orange-200 pb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block"></span>
                  No Role Assigned
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2">{unassigned.length}</span>
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
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black transition-all shadow-md text-sm"
        >
          <span>➕</span> Add New Staff
        </button>
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
          {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
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
                  value={newStaff.emailAddress}
                  onChange={(e) => setNewStaff({...newStaff, emailAddress: e.target.value})}
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
    </div>
  );
}