// filepath: app/components/TimeClockTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { notify } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { formatTimeSafe } from '@/lib/common';

export default function TimeClockTab({ appState }: any) {
  // 1. Pull data from the global store
  const selectedUserId = useAppStore(state => state.selectedUserId);
  const locations = useAppStore(state => state.locations);
  const timeCards = useAppStore(state => state.timeCards);
  const shifts = useAppStore(state => state.shifts);
  const users = useAppStore(state => state.users);
  const fetchTimeCards = useAppStore(state => state.fetchTimeCards);
  
  // 2. Local State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLocId, setSelectedLocId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 3. Derived Data (Only calculated for this specific user)
  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUser?.systemRoles?.includes('Administrator');
  const allowedLocationIds = activeUser?.locationIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id) ||[];
  
  const visibleLocations = isAdmin 
    ? locations.filter(l => l.isActive !== false)
    : locations.filter(loc => allowedLocationIds.includes(loc.id) && loc.isActive !== false);

  const activeUserTimeCards = timeCards.filter(c => c.userId.toString() === selectedUserId);
  const activeCard = activeUserTimeCards.find(c => !c.clockOut);

  // Keep the clock ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  },[]);

  // SMART DEFAULT: Pre-select location based on today's shift
  useEffect(() => {
    if (!selectedLocId && visibleLocations.length > 0) {
      const today = new Date();
      const myShiftsToday = shifts.filter(s => {
        if (s.userId?.toString() !== selectedUserId) return false;
        const sd = new Date(s.startTime);
        return sd.getDate() === today.getDate() && sd.getMonth() === today.getMonth() && sd.getFullYear() === today.getFullYear();
      });

      myShiftsToday.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      if (myShiftsToday.length > 0) {
        const shiftLocId = myShiftsToday[0].locationId.toString();
        if (visibleLocations.some(l => l.id.toString() === shiftLocId)) {
          setSelectedLocId(shiftLocId);
          return;
        }
      }
      setSelectedLocId(visibleLocations[0].id.toString());
    }
  }, [visibleLocations, selectedLocId, shifts, selectedUserId]);

  const handleClockIn = async () => {
    if (!selectedLocId) return notify.error("Please select a location");
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOCK_IN', userId: parseInt(selectedUserId), locationId: parseInt(selectedLocId) })
      });
      
      if (res.ok) {
        notify.success("Clocked In Successfully!");
        await fetchTimeCards(selectedUserId); // Refresh data globally
      } else {
        const data = await res.json();
        notify.error(data.error || "Failed to clock in");
      }
    } catch (error) {
      notify.error("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeCard) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOCK_OUT', timeCardId: activeCard.id })
      });
      
      if (res.ok) {
        notify.success("Clocked Out Successfully!");
        await fetchTimeCards(selectedUserId); // Refresh data globally
      } else {
        const data = await res.json();
        notify.error(data.error || "Failed to clock out");
      }
    } catch (error) {
      notify.error("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-700">
      <div className={`p-8 md:p-12 rounded-[40px] shadow-2xl border-4 w-full max-w-lg text-center relative overflow-hidden transition-all duration-500 ${activeCard ? 'bg-slate-950 border-green-500/50 shadow-green-500/10' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
        
        {/* Status Lamp */}
        <div className={`absolute top-0 left-0 right-0 h-4 transition-colors duration-500 ${activeCard ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]' : 'bg-slate-200'}`} />

        <h2 className={`text-sm font-black tracking-[0.2em] uppercase mb-8 sports-slant ${activeCard ? 'text-green-500/80' : 'text-slate-400'}`}>
          {activeCard ? '• System Active •' : 'System Standby'}
        </h2>

        <div className={`mb-10 py-8 rounded-[32px] border-2 transition-all duration-500 ${activeCard ? 'bg-slate-900 border-slate-800 shadow-inner' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
          <p className={`text-xs font-black uppercase tracking-widest mb-2 ${activeCard ? 'text-slate-500' : 'text-slate-400'}`}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric'})}
          </p>
          <div className={`text-6xl md:text-7xl font-black tracking-tighter tabular-nums ${activeCard ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-slate-900'}`}>
            {currentTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', second: '2-digit'})}
          </div>
        </div>

        {activeCard ? (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="bg-green-500/10 border-2 border-green-500/20 py-4 px-6 rounded-2xl inline-block mx-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-1">Active Session</p>
              <p className="text-xl font-black text-white sports-slant">
                Since {formatTimeSafe(activeCard.clockIn)}
              </p>
              <p className="text-[11px] font-bold text-green-400/80 mt-1 uppercase tracking-wider">
                @ {locations.find(l => l.id === activeCard.locationId)?.name}
              </p>
            </div>
            
            <button 
              onClick={handleClockOut} 
              disabled={isProcessing}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white font-black text-3xl py-8 rounded-[24px] shadow-[0_15px_30px_rgba(220,38,38,0.3)] transition-all border-b-8 border-red-800 uppercase sports-slant tracking-tight"
            >
              {isProcessing ? 'Saving...' : 'End Shift'}
            </button>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Session automatically logged to your timesheet</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="text-left">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3 ml-2 sports-slant">Station Select</label>
              <select 
                value={selectedLocId} 
                onChange={(e) => setSelectedLocId(e.target.value)} 
                className="w-full border-2 border-slate-200 rounded-2xl p-5 text-xl font-black text-slate-900 focus:border-blue-600 focus:ring-0 outline-none shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%23475569%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_20px_center] bg-no-repeat pr-12 transition-all hover:border-slate-300"
              >
                {visibleLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleClockIn} 
              disabled={isProcessing || !selectedLocId}
              className="w-full bg-slate-900 hover:bg-black active:scale-95 disabled:opacity-50 text-white font-black text-3xl py-8 rounded-[24px] shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all border-b-8 border-slate-800 uppercase sports-slant tracking-tight"
            >
              {isProcessing ? 'Wait...' : 'Start Shift'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}