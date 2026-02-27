"use client";
import React from 'react';

export default function StaffTab({ appState }: { appState: any }) {
  const { 
    users, 
    locations, 
    handleUpdateUser, 
    handleRoleToggle, 
    AVAILABLE_ROLES, 
    isAdmin 
  } = appState;

  // Function to handle toggling a location for a user
  const toggleLocation = async (user, locationId) => {
    // 1. Ensure locationIds is an array (fallback to empty)
    // 2. Convert all IDs to numbers for consistent comparison
    const currentLocs = Array.isArray(user.locationIds) 
      ? user.locationIds.map(id => parseInt(id, 10)) 
      : [];
    
    const targetId = parseInt(locationId, 10);
    let newLocs;

    if (currentLocs.includes(targetId)) {
      // Remove the location
      newLocs = currentLocs.filter(id => id !== targetId);
    } else {
      // Add the location
      newLocs = [...currentLocs, targetId];
    }

    // Update the user in the global state and database
    // We send 'locationIds' as the key to match standard Prisma/API naming
    await handleUpdateUser(user.id, { locationIds: newLocs });
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Access Denied</h2>
        <p className="text-slate-500 font-bold mt-2">Only Administrators can manage staff assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Staff Management</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Roles & Location Permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {users.sort((a, b) => a.name.localeCompare(b.name)).map(user => {
          const userLocs = Array.isArray(user.locationIds) 
            ? user.locationIds.map(id => parseInt(id, 10)) 
            : [];

          return (
            <div key={user.id} className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* User Info Section */}
                <div className="lg:w-1/4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{user.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employee ID: {user.id}</p>
                    </div>
                  </div>
                </div>

                {/* System Roles Section */}
                <div className="lg:w-1/3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">System Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_ROLES.map(role => {
                      const hasRole = user.systemRoles?.includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleToggle(user.id, role)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                            hasRole 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assigned Locations Section */}
                <div className="lg:w-2/5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Workable Locations</h4>
                  <div className="flex flex-wrap gap-2">
                    {locations.map(loc => {
                      const isAssigned = userLocs.includes(parseInt(loc.id, 10));
                      return (
                        <button
                          key={loc.id}
                          onClick={() => toggleLocation(user, loc.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                            isAssigned 
                              ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${isAssigned ? 'bg-blue-600' : 'bg-slate-200'}`} />
                          {loc.name}
                          {isAssigned && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {userLocs.length === 0 && (
                    <p className="text-[10px] font-bold text-red-400 mt-2 uppercase italic">No locations assigned - this user cannot see any shifts on the calendar.</p>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}