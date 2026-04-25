// filepath: app/components/SetupTab.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Location, GlobalTask, ShiftTemplate } from '@/lib/types';
import { notify, customConfirm } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { Settings, Users, MapPin, Plus, Trash2, Edit2, CalendarDays, Clock, ListChecks, CheckCircle2, ChevronDown, ChevronUp, Map, ShieldAlert, Save, Video, Zap } from 'lucide-react';
import ScheduleBuilderTab from './ScheduleBuilderTab';
import StaffTab from './StaffTab';
import LocationsTab from './LocationsTab';
import EventsTab from './EventsTab';

export default function SetupTab({ appState }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'builder' | 'templates' | 'tasks' | 'staff' | 'locations' | 'events'>('builder');

  // 🧪 SUPPORT DEEP-LINKING FOR TESTING
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('sub');
    if (sub && ['builder','templates','tasks','staff','locations','events'].includes(sub)) {
        setActiveSubTab(sub as any);
    }
  }, []);

  const locations = useAppStore(state => state.locations);
  const templates = useAppStore(state => state.templates);
  const globalTasks = useAppStore(state => state.globalTasks);
  const users = useAppStore(state => state.users);
  
  const saveTemplates = useAppStore(state => state.saveTemplates);
  const deleteTemplate = useAppStore(state => state.deleteTemplate);
  const generateSchedule = useAppStore(state => state.generateSchedule);
  
  const fetchTemplates = useAppStore(state => state.fetchTemplates);
  const fetchGlobalTasks = useAppStore(state => state.fetchGlobalTasks);
  const calLocFilter = useAppStore(state => state.calLocFilter);

  // Template Form State
  const [editingTplId, setEditingTplId] = useState<number | null>(null);
  const [tplForm, setTplForm] = useState({
    locationIds: [] as string[],
    daysOfWeek: [] as string[],
    startTime: '08:00',
    endTime: '16:00',
    startDate: '',
    endDate: '',
    checklistTasks: [] as string[],
    userId: ''
  });

  // Generator State
  const [genStart, setGenStart] = useState('');
  const [genEnd, setGenEnd] = useState('');

  // Filtering / Sorting
  const [tplViewDays, setTplViewDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [tplLocFilter, setTplLocFilter] = useState('');

  const toggleTplViewDay = (idx: number) => tplViewDays.includes(idx) ? setTplViewDays(tplViewDays.filter(x => x !== idx)) : setTplViewDays([...tplViewDays, idx]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...tplForm,
      id: editingTplId,
      locationIds: tplForm.locationIds.map(Number),
      daysOfWeek: tplForm.daysOfWeek.map(Number),
      userId: tplForm.userId ? Number(tplForm.userId) : null
    };
    await saveTemplates(payload);
    setEditingTplId(null);
    setTplForm({ locationIds:[], daysOfWeek:[], startTime: '08:00', endTime: '16:00', startDate: '', endDate: '', checklistTasks:[], userId: '' });
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!(await customConfirm("Delete this master template blueprint?", "Delete Template", true))) return;
    await deleteTemplate(id);
  };

  const handleEditTemplate = (t: ShiftTemplate) => {
    setEditingTplId(t.id);
    setTplForm({
      locationIds: [t.locationId.toString()],
      daysOfWeek: [t.dayOfWeek.toString()],
      startTime: t.startTime,
      endTime: t.endTime,
      startDate: t.startDate || '',
      endDate: t.endDate || '',
      checklistTasks: t.checklistTasks || [],
      userId: t.userId?.toString() || ''
    });
  };

  const handleGenerateSchedule = async () => {
    if (!genStart || !genEnd) return notify.error("Select dates!");
    const msg = `This will deploy your master patterns to the live calendar from ${genStart} to ${genEnd}. Proceed?`;
    if (!(await customConfirm(msg, "Generate Live Schedule", true))) return;
    await generateSchedule(genStart, genEnd, calLocFilter ? parseInt(calLocFilter) : null);
  };

  const filteredTemplates = templates.filter(t => {
    if (!tplViewDays.includes(t.dayOfWeek)) return false;
    if (tplLocFilter && t.locationId.toString() !== tplLocFilter) return false;
    return true;
  }).sort((a,b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase sports-slant">Facility Control Center</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Master BLUEPRINTS, STAFF, and LIVE DEPLOYMENT.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-2xl border-4 border-slate-900 shadow-lg">
          {[
            { id: 'builder', label: 'Builder', icon: CalendarDays },
            { id: 'templates', label: 'Templates', icon: Clock },
            { id: 'events', label: 'Events', icon: Video },
            { id: 'staff', label: 'Staff', icon: Users },
            { id: 'locations', label: 'Locs', icon: MapPin },
            { id: 'tasks', label: 'Tasks', icon: ListChecks }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === tab.id ? 'bg-slate-900 text-yellow-400 shadow-xl scale-105' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-2xl overflow-hidden min-h-[60vh]">
        {activeSubTab === 'builder' && <div className="p-6 md:p-8"><ScheduleBuilderTab appState={appState} /></div>}
        {activeSubTab === 'staff' && <StaffTab appState={appState} />}
        {activeSubTab === 'locations' && <LocationsTab appState={appState} />}
        {activeSubTab === 'events' && <EventsTab />}
        
        {activeSubTab === 'templates' && (
          <div className="p-6 md:p-10 space-y-10">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              
              {/* Template Creator */}
              <div className="space-y-6">
                <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                   <h3 className="text-xl font-black uppercase italic sports-slant mb-1">Blueprint Creator</h3>
                   <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Define recurring patterns.</p>
                   <Clock size={100} className="absolute -bottom-5 -right-5 text-white/10 rotate-12" />
                </div>
                
                <form onSubmit={handleSaveTemplate} className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 space-y-4 shadow-inner">
                  {!editingTplId && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Facility Selection</label>
                      <div className="grid grid-cols-2 gap-2">
                        {locations.map(loc => (
                          <button 
                            key={loc.id} type="button"
                            onClick={() => tplForm.locationIds.includes(loc.id.toString()) ? setTplForm({...tplForm, locationIds: tplForm.locationIds.filter(x => x !== loc.id.toString())}) : setTplForm({...tplForm, locationIds: [...tplForm.locationIds, loc.id.toString()]})}
                            className={`p-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${tplForm.locationIds.includes(loc.id.toString()) ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'}`}
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!editingTplId && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Days of Week</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['S','M','T','W','T','F','S'].map((day, idx) => (
                          <button 
                            key={idx} type="button"
                            onClick={() => tplForm.daysOfWeek.includes(idx.toString()) ? setTplForm({...tplForm, daysOfWeek: tplForm.daysOfWeek.filter(x => x !== idx.toString())}) : setTplForm({...tplForm, daysOfWeek: [...tplForm.daysOfWeek, idx.toString()]})}
                            className={`w-8 h-8 rounded-lg text-xs font-black transition-all border-2 ${tplForm.daysOfWeek.includes(idx.toString()) ? 'bg-slate-900 text-yellow-400 border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Start Time</label>
                      <input type="time" value={tplForm.startTime} onChange={e => setTplForm({...tplForm, startTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl p-2 font-black text-sm outline-none focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">End Time</label>
                      <input type="time" value={tplForm.endTime} onChange={e => setTplForm({...tplForm, endTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl p-2 font-black text-sm outline-none focus:border-blue-600" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Pre-Assign Employee (Optional)</label>
                    <select value={tplForm.userId} onChange={e => setTplForm({...tplForm, userId: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl p-2 font-black text-sm outline-none focus:border-blue-600 cursor-pointer">
                      <option value="">-- No Assignment --</option>
                      {users.filter(u => u.isActive !== false).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                    <Save size={18} className="text-yellow-400" />
                    {editingTplId ? 'Update Blueprint' : 'Save Master Template'}
                  </button>
                  {editingTplId && <button onClick={() => {setEditingTplId(null); setTplForm({ locationIds:[], daysOfWeek:[], startTime: '08:00', endTime: '16:00', startDate: '', endDate: '', checklistTasks:[], userId: '' });}} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Cancel Edit</button>}
                </form>

                {/* Generator Section */}
                <div className="bg-yellow-400 p-8 rounded-[40px] border-4 border-slate-900 shadow-xl space-y-6 relative overflow-hidden">
                   <Zap size={120} className="absolute -top-5 -right-5 text-slate-900/5 rotate-12 pointer-events-none" />
                   <div>
                     <h3 className="text-xl font-black uppercase italic sports-slant text-slate-900">Live Deployment</h3>
                     <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Push blueprints to the live grid.</p>
                   </div>
                   <div className="space-y-4 relative z-10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-700 block mb-1 ml-1">Start Date</label>
                          <input type="date" value={genStart} onChange={e => setGenStart(e.target.value)} className="w-full bg-white/50 border-2 border-slate-900/10 rounded-xl p-2 font-black text-xs outline-none focus:bg-white" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-700 block mb-1 ml-1">End Date</label>
                          <input type="date" value={genEnd} onChange={e => setGenEnd(e.target.value)} className="w-full bg-white/50 border-2 border-slate-900/10 rounded-xl p-2 font-black text-xs outline-none focus:bg-white" />
                        </div>
                      </div>
                      <button onClick={handleGenerateSchedule} className="w-full bg-slate-900 text-yellow-400 font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                        <CalendarDays size={18} /> Deploy Live Schedule
                      </button>
                   </div>
                </div>
              </div>

              {/* Template List */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border-2 border-slate-200">
                      {['S','M','T','W','T','F','S'].map((day, idx) => (
                        <button key={idx} onClick={() => toggleTplViewDay(idx)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${tplViewDays.includes(idx) ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}>{day}</button>
                      ))}
                    </div>
                    <select value={tplLocFilter} onChange={e => setTplLocFilter(e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 font-black text-[10px] uppercase outline-none cursor-pointer focus:border-blue-600">
                      <option value="">All Courts</option>
                      {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </select>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{filteredTemplates.length} Active Blueprints</p>
                </div>

                <div className="bg-slate-50 border-2 border-slate-200 rounded-[32px] overflow-hidden shadow-inner">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] italic">Day</th>
                        <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] italic">Facility</th>
                        <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] italic">Time Slot</th>
                        <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] italic">Pre-Assign</th>
                        <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] italic text-right">Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {filteredTemplates.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-black uppercase text-xs italic tracking-widest">No templates match filters.</td></tr>
                      ) : (
                        filteredTemplates.map(t => (
                          <tr key={t.id} className="hover:bg-white transition-colors group">
                            <td className="px-6 py-4 font-black text-blue-600 text-xs italic">
                               {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][t.dayOfWeek]}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">{t.location?.name}</td>
                            <td className="px-6 py-4">
                               <span className="bg-slate-100 px-3 py-1 rounded-full font-black text-slate-900 text-[10px] border border-slate-200">{t.startTime} - {t.endTime}</span>
                            </td>
                            <td className="px-6 py-4">
                               {t.user ? (
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="font-bold text-slate-900 text-xs">{t.user.name}</span>
                                 </div>
                               ) : (
                                 <span className="text-slate-400 font-bold italic text-[10px]">Vacant Slot</span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditTemplate(t)} className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"><Edit2 size={14} /></button>
                                  <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={14} /></button>
                               </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeSubTab === 'tasks' && (
          <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-purple-600 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-between">
               <div className="relative z-10 space-y-4">
                 <h2 className="text-4xl font-black uppercase italic sports-slant">Master Task Registry</h2>
                 <p className="text-lg font-bold opacity-80 italic">Global shift items required for facility closing.</p>
               </div>
               <ListChecks size={200} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
            </div>
            
            <div className="bg-slate-50 rounded-[48px] border-4 border-slate-200 p-10 shadow-inner">
              <p className="text-center font-black text-slate-400 uppercase italic tracking-widest py-20 border-4 border-dashed border-slate-200 rounded-[32px]">Task Management UI Coming in Phase 2</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
