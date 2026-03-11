// filepath: app/components/LocationsTab.tsx
"use client";
import React, { useState } from 'react';
import { AppState, Location } from '../lib/types';
import { notify, customConfirm } from '@/lib/ui-utils';

export default function LocationsTab({ appState }: { appState: AppState }) {
  const { locations, handleCreateLocation, handleUpdateLocation, isManager, isAdmin } = appState;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const[editingLocId, setEditingLocId] = useState<number | null>(null);

  const [newLoc, setNewLoc] = useState({ name: '', address: '', email: '', phoneNumber: '', sendReportEmails: true });
  const[editLoc, setEditLoc] = useState({ name: '', address: '', email: '', phoneNumber: '', isActive: true, sendReportEmails: true });

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
    
    const result = await handleCreateLocation({ ...newLoc, isActive: false });
    if (result.success) {
      notify.success("Location Created (Hidden by default)");
      setIsAddModalOpen(false);
      setNewLoc({ name: '', address: '', email: '', phoneNumber: '', sendReportEmails: true });
    } else {
      notify.error("Failed to create location.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocId || !editLoc.name.trim()) return;

    const result = await handleUpdateLocation(editingLocId, editLoc);
    if (result.success) {
      notify.success("Location updated successfully");
      setEditingLocId(null);
    } else {
      notify.error("Failed to update location.");
    }
  };

  const toggleActiveStatus = async (loc: Location) => {
    const newStatus = loc.isActive === false ? true : false;
    if (!newStatus) {
      if(!(await customConfirm(`Are you sure you want to hide ${loc.name}? It will be hidden from the Kiosk and standard staff.`, "Hide Location", true))) return;
    }
    const result = await handleUpdateLocation(loc.id, { name: loc.name, isActive: newStatus });
    if (result.success) notify.success(newStatus ? "Location Live!" : "Location Hidden.");
  };

  const toggleEmailStatus = async (loc: Location) => {
    const newStatus = !loc.sendReportEmails;
    const result = await handleUpdateLocation(loc.id, { sendReportEmails: newStatus });
    if (result.success) notify.success(newStatus ? "Email reports enabled." : "Email reports disabled.");
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
                <th className="px-6 py-3">Location Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Email Reports</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((loc: Location) => {
                const isInactive = loc.isActive === false;
                return (
                  <tr key={loc.id} className={`hover:bg-slate-50 transition-colors group ${isInactive ? 'opacity-75 bg-slate-50' : ''}`}>
                    {editingLocId === loc.id ? (
                      <td colSpan={5} className="p-0">
                        <form onSubmit={handleEditSubmit} className="flex flex-wrap items-center w-full bg-blue-50/50 p-2 gap-2">
                          <input required value={editLoc.name} onChange={(e) => setEditLoc({...editLoc, name: e.target.value})} className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-xs font-bold" placeholder="Name" />
                          <input value={editLoc.address || ''} onChange={(e) => setEditLoc({...editLoc, address: e.target.value})} className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-xs font-bold" placeholder="Address" />
                          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded cursor-pointer">
                            <input type="checkbox" checked={editLoc.sendReportEmails} onChange={(e) => setEditLoc({...editLoc, sendReportEmails: e.target.checked})} className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase text-slate-600">Email Reports</span>
                          </label>
                          <div className="flex gap-2 px-4">
                            <button type="submit" className="text-green-700 hover:text-green-900 font-black text-[10px] uppercase">Save</button>
                            <button type="button" onClick={() => setEditingLocId(null)} className="text-slate-500 hover:text-slate-700 font-black text-[10px] uppercase">Cancel</button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-black text-slate-900">{loc.name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${isInactive ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                            {isInactive ? 'Hidden' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleEmailStatus(loc)} className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest transition-colors ${loc.sendReportEmails ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {loc.sendReportEmails ? 'On' : 'Off'}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 truncate max-w-[200px]">{loc.address || '-'}</td>
                        <td className="px-6 py-4 text-center space-x-3">
                          <button onClick={() => { setEditingLocId(loc.id); setEditLoc({ name: loc.name, address: loc.address || '', email: loc.email || '', phoneNumber: loc.phoneNumber || '', isActive: loc.isActive !== false, sendReportEmails: loc.sendReportEmails !== false }); }} className="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase opacity-0 group-hover:opacity-100">Edit</button>
                          <button onClick={() => toggleActiveStatus(loc)} className={`${isInactive ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'} font-black text-[10px] uppercase opacity-0 group-hover:opacity-100`}>{isInactive ? 'Show' : 'Hide'}</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-900">Add New Facility</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 text-2xl font-black">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">Facility Name *</label>
                <input required value={newLoc.name} onChange={(e) => setNewLoc({...newLoc, name: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 font-bold shadow-sm" placeholder="e.g. PnP Garner" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">Address</label>
                <input value={newLoc.address} onChange={(e) => setNewLoc({...newLoc, address: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 font-bold shadow-sm" placeholder="123 Main St" />
              </div>
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input type="checkbox" checked={newLoc.sendReportEmails} onChange={(e) => setNewLoc({...newLoc, sendReportEmails: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                <div>
                  <span className="block text-sm font-black text-slate-900">Email Shift Reports</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Auto-notify managers on shift completion</span>
                </div>
              </label>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-3 rounded-xl mt-2 hover:bg-black transition-colors">Create Facility</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}