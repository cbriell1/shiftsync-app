// filepath: app/components/LocationsTab.tsx
"use client";
import React, { useState } from 'react';
import { AppState, Location } from '../lib/types';

export default function LocationsTab({ appState }: { appState: AppState }) {
  const { locations, handleCreateLocation, handleUpdateLocation, isManager, isAdmin } = appState;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocId, setEditingLocId] = useState<number | null>(null);

  const[newLoc, setNewLoc] = useState({ name: '', address: '', email: '', phoneNumber: '' });
  const [editLoc, setEditLoc] = useState({ name: '', address: '', email: '', phoneNumber: '' });

  if (!isAdmin && !isManager) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Access Denied</h2>
        <p className="text-slate-600 font-bold mt-2">Only Administrators and Managers can manage locations.</p>
      </div>
    );
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoc.name.trim()) return;
    
    await handleCreateLocation(newLoc);
    setIsAddModalOpen(false);
    setNewLoc({ name: '', address: '', email: '', phoneNumber: '' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocId || !editLoc.name.trim()) return;

    await handleUpdateLocation(editingLocId, editLoc);
    setEditingLocId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Facility Directory</h2>
          <p className="text-slate-600 font-bold text-xs uppercase tracking-widest mt-0.5">Manage PnP Locations & Contact Info</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black transition-all shadow-md text-sm"
        >
          <span>➕</span> Add New Location
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-800 whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest font-black sticky top-0 z-10 shadow-sm border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-1/4">Location Name</th>
                <th className="px-6 py-3 w-1/4">Address</th>
                <th className="px-6 py-3 w-1/4">Phone Number</th>
                <th className="px-6 py-3 w-1/4">Email</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((loc: Location) => (
                <tr key={loc.id} className="hover:bg-slate-50 transition-colors group">
                  {editingLocId === loc.id ? (
                    <td colSpan={5} className="p-0">
                      <form onSubmit={handleEditSubmit} className="flex flex-wrap md:flex-nowrap items-center w-full bg-blue-50/50 p-2 gap-2">
                        <input 
                          autoFocus
                          required
                          value={editLoc.name}
                          onChange={(e) => setEditLoc({...editLoc, name: e.target.value})}
                          placeholder="Location Name"
                          className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[150px]"
                        />
                        <input 
                          value={editLoc.address}
                          onChange={(e) => setEditLoc({...editLoc, address: e.target.value})}
                          placeholder="Address"
                          className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[150px]"
                        />
                        <input 
                          value={editLoc.phoneNumber}
                          onChange={(e) => setEditLoc({...editLoc, phoneNumber: e.target.value})}
                          placeholder="Phone"
                          className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                        />
                        <input 
                          type="email"
                          value={editLoc.email}
                          onChange={(e) => setEditLoc({...editLoc, email: e.target.value})}
                          placeholder="Email"
                          className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[150px]"
                        />
                        <div className="flex gap-2 px-4">
                          <button type="submit" className="text-green-700 hover:text-green-900 font-black text-[10px] uppercase tracking-wider transition-colors">Save</button>
                          <button type="button" onClick={() => setEditingLocId(null)} className="text-slate-500 hover:text-slate-700 font-black text-[10px] uppercase tracking-wider transition-colors">Cancel</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-black text-slate-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {loc.name}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{loc.address || <span className="text-slate-300 italic">None</span>}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{loc.phoneNumber || <span className="text-slate-300 italic">None</span>}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{loc.email || <span className="text-slate-300 italic">None</span>}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => {
                            setEditingLocId(loc.id);
                            setEditLoc({ 
                              name: loc.name, 
                              address: loc.address || '', 
                              email: loc.email || '', 
                              phoneNumber: loc.phoneNumber || '' 
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-wider transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500 font-bold italic bg-slate-50">
                    No locations exist. Add one using the button above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD NEW LOCATION MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-xl text-slate-900">Add New Location</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 text-2xl font-black leading-none transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Facility Name *</label>
                <input 
                  required
                  autoFocus
                  value={newLoc.name}
                  onChange={(e) => setNewLoc({...newLoc, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  placeholder="e.g. PnP Cary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Address</label>
                <input 
                  value={newLoc.address}
                  onChange={(e) => setNewLoc({...newLoc, address: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  placeholder="123 Main St..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={newLoc.phoneNumber}
                    onChange={(e) => setNewLoc({...newLoc, phoneNumber: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Email</label>
                  <input 
                    type="email" 
                    value={newLoc.email}
                    onChange={(e) => setNewLoc({...newLoc, email: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button type="submit" className="w-full bg-slate-900 text-white font-black text-base py-3 rounded-xl hover:bg-black transition-colors shadow-md">
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}