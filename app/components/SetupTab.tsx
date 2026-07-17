// filepath: app/components/SetupTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { CalendarDays, Video, Users, MapPin, ListChecks, Zap } from 'lucide-react';
import ScheduleBuilderTab from './ScheduleBuilderTab';
import StaffTab from './StaffTab';
import LocationsTab from './LocationsTab';
import EventsTab from './EventsTab';
import TasksTab from './TasksTab';

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
    <div className="space-y-6 w-full max-w-full overflow-hidden min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase sports-slant">Facility Control Center</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Master BLUEPRINTS, STAFF, and LIVE DEPLOYMENT.</p>
        </div>
        
        <div className="flex overflow-x-auto w-full flex-nowrap no-scrollbar bg-slate-200 p-1 rounded-2xl border-4 border-slate-900 shadow-lg">
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
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${activeSubTab === tab.id ? 'bg-slate-900 text-yellow-400 shadow-xl scale-105' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-2xl overflow-hidden min-h-[60vh] min-w-0 w-full max-w-full">
        {activeSubTab === 'builder' && <div className="p-4 md:p-8 w-full max-w-full overflow-hidden min-w-0"><ScheduleBuilderTab /></div>}
        {activeSubTab === 'staff' && <StaffTab appState={appState} />}
        {activeSubTab === 'locations' && <LocationsTab appState={appState} />}
        {activeSubTab === 'events' && <EventsTab />}
        
        {activeSubTab === 'tasks' && <TasksTab />}
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
