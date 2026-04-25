// filepath: app/components/EventsTab.tsx
"use client";
import React, { useState } from 'react';
import { Event, Location } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { notify } from '@/lib/ui-utils';
import { Trash2, Edit2, Calendar, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function EventsTab() {
  const events = useAppStore(state => state.events);
  const locations = useAppStore(state => state.locations);
  const fetchEvents = useAppStore(state => state.fetchEvents);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'TOURNAMENT',
    locationId: '',
    impact: 'NORMAL'
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      type: 'TOURNAMENT',
      locationId: '',
      impact: 'NORMAL'
    });
  };

  const handleEdit = (e: Event) => {
    setEditingId(e.id);
    setForm({
      title: e.title,
      description: e.description || '',
      startDate: new Date(e.startDate).toISOString().split('T')[0],
      endDate: new Date(e.endDate).toISOString().split('T')[0],
      type: e.type || 'TOURNAMENT',
      locationId: e.locationId?.toString() || '',
      impact: e.impact
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const payload = { 
      ...form, 
      id: editingId,
      locationId: form.locationId ? parseInt(form.locationId) : null 
    };

    try {
      const res = await fetch('/api/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        notify.success(editingId ? "Event Updated" : "Event Created");
        resetForm();
        await fetchEvents();
      } else {
        const data = await res.json();
        notify.error(data.error || "Operation failed");
      }
    } catch (err) {
      notify.error("Network error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event? This may affect shift generation logic.")) return;
    try {
      const res = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        notify.success("Event Deleted");
        await fetchEvents();
      }
    } catch (err) {
      notify.error("Delete failed");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      
      {/* Form Section */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 md:p-8 rounded-[40px] border-4 border-slate-900 shadow-xl sticky top-4">
          <h3 className="text-2xl font-black text-slate-900 uppercase sports-slant italic mb-8 border-b-4 border-slate-100 pb-2 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" />
            {editingId ? 'Edit Event' : 'Schedule Event'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Event Title</label>
              <input 
                data-testid="event-title-input"
                required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. Regional Tournament"
                className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-lg text-slate-900 focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Start Date</label>
                <input 
                  type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                  className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-3 font-semibold text-xs text-slate-900 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">End Date</label>
                <input 
                  type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
                  className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-3 font-semibold text-xs text-slate-900 focus:border-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Location Impact</label>
              <select 
                value={form.locationId} onChange={e => setForm({...form, locationId: e.target.value})}
                className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-slate-900 focus:border-blue-600 outline-none appearance-none cursor-pointer"
              >
                <option value="">All Locations (Global)</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>

            <div className="bg-slate-900 p-6 rounded-[32px] space-y-4">
               <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em] text-center">Scheduling Logic</label>
                  <div className="flex bg-slate-800 p-1.5 rounded-2xl gap-2">
                    <button 
                      type="button" onClick={() => setForm({...form, impact: 'NORMAL'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.impact === 'NORMAL' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Normal
                    </button>
                    <button 
                      type="button" onClick={() => setForm({...form, impact: 'SKIP_GENERATION'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.impact === 'SKIP_GENERATION' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Skip Template
                    </button>
                  </div>
               </div>
               {form.impact === 'SKIP_GENERATION' && (
                 <p className="text-[10px] text-red-400 font-bold leading-tight text-center px-2">
                    ⚠️ Auto-generator will IGNORE templates for this period.
                 </p>
               )}
            </div>

            <div className="flex gap-4 pt-4">
              {editingId && <button type="button" onClick={resetForm} className="flex-1 btn-sport bg-slate-100 text-slate-500 border-b-4 border-slate-200">Discard</button>}
              <button 
                data-testid="create-event-btn"
                type="submit" 
                className="flex-[2] btn-sport bg-blue-600 text-white border-b-8 border-blue-900 text-lg"
              >
                {editingId ? 'Update' : 'Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[48px] border-4 border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-50 p-8 border-b-4 border-slate-200 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 uppercase sports-slant tracking-tighter italic">Event Registry</h3>
            <span className="bg-slate-900 text-white px-5 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">{events.length} Active</span>
          </div>

          <div className="divide-y-4 divide-slate-100">
            {events.length === 0 ? (
              <div className="p-20 text-center text-slate-400">
                <Calendar size={64} className="mx-auto mb-6 opacity-20" />
                <p className="font-black uppercase tracking-widest text-lg sports-slant">No events scheduled</p>
              </div>
            ) : (
              events.map((e: Event) => (
                <div key={e.id} className="p-8 hover:bg-slate-50/80 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                         <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{e.title}</h4>
                         <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border-2 ${e.impact === 'SKIP_GENERATION' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                           {e.impact === 'SKIP_GENERATION' ? 'Blackout Period' : 'Tournament/Event'}
                         </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-6 text-slate-500">
                        <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tight">
                          <Calendar size={18} className="text-slate-400" />
                          {new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          Location: <span className="text-slate-900">{e.location?.name || 'GLOBAL (ALL)'}</span>
                        </div>
                      </div>

                      {e.impact === 'SKIP_GENERATION' && (
                        <div className="flex items-center gap-2 mt-4 text-red-600 bg-red-50/50 px-3 py-1.5 rounded-2xl border border-red-100 w-fit">
                           <ShieldAlert size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Standard Schedule Overridden</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                      <button onClick={() => handleEdit(e)} className="p-3 hover:bg-blue-50 rounded-2xl text-blue-600 transition-all border-2 border-transparent hover:border-blue-100 shadow-sm bg-white"><Edit2 size={20} /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-3 hover:bg-red-50 rounded-2xl text-red-600 transition-all border-2 border-transparent hover:border-red-100 shadow-sm bg-white"><Trash2 size={20} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pro Tip */}
        <div className="bg-brand-yellow/10 border-4 border-brand-yellow/30 p-8 rounded-[40px] flex items-start gap-6">
           <div className="w-12 h-12 bg-brand-yellow rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-slate-900/10">
              <AlertTriangle className="text-slate-900" size={24} />
           </div>
           <div>
              <p className="font-black text-slate-900 uppercase text-sm mb-1 tracking-widest">Manager Strategy</p>
              <p className="text-base font-bold text-slate-700 leading-relaxed">
                Use **"Skip Template"** for major holidays or facility closures. This prevents the auto-generator from creating shifts that you'll have to delete manually later.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
