// filepath: app/components/SetupTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { CalendarDays, Video, Users, MapPin, ListChecks, Zap } from 'lucide-react';
import ScheduleBuilderTab from './ScheduleBuilderTab';
import StaffTab from './StaffTab';
import LocationsTab from './LocationsTab';
import EventsTab from './EventsTab';

export default function SetupTab({ appState }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'builder' | 'events' | 'staff' | 'locations' | 'tasks'>('builder');

  // 🧪 SUPPORT DEEP-LINKING FOR TESTING
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('sub');
    if (sub && ['builder','events','staff','locations','tasks'].includes(sub)) {
        setActiveSubTab(sub as any);
    }
  }, []);

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
        {activeSubTab === 'builder' && <div className="p-6 md:p-8"><ScheduleBuilderTab /></div>}
        {activeSubTab === 'staff' && <StaffTab appState={appState} />}
        {activeSubTab === 'locations' && <LocationsTab appState={appState} />}
        {activeSubTab === 'events' && <EventsTab />}
        
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
