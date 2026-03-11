// filepath: app/components/TimeClockTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { AppState } from '../lib/types';
import { notify } from '@/lib/ui-utils';

export default function TimeClockTab({ appState }: { appState: AppState }) {
  const { 
    activeUserTimeCards, 
    visibleLocations, 
    selectedUserId, 
    fetchTimeCards, 
    formatTimeSafe, 
    locations,
    shifts // <-- Pulled in shifts to check today's schedule
  } = appState;
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const[selectedLocId, setSelectedLocId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep the clock ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  },[]);

  // SMART DEFAULT: Pre-select location based on today's shift, or fallback to first available
  useEffect(() => {
    if (!selectedLocId && visibleLocations.length > 0) {
      const today = new Date();
      
      // Find all shifts for this user that happen today
      const myShiftsToday = shifts.filter(s => {
        if (s.userId !== parseInt(selectedUserId)) return false;
        
        const sd = new Date(s.startTime);
        return sd.getDate() === today.getDate() &&
               sd.getMonth() === today.getMonth() &&
               sd.getFullYear() === today.getFullYear();
      });

      // Sort them by time so we get the earliest shift first
      myShiftsToday.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // If they have a shift today, default to that location
      if (myShiftsToday.length > 0) {
        const shiftLocId = myShiftsToday[0].locationId.toString();
        
        // Safety check to ensure they actually have access to see this location
        if (visibleLocations.some(l => l.id.toString() === shiftLocId)) {
          setSelectedLocId(shiftLocId);
          return;
        }
      }
      
      // Fallback: If no shifts today, just pick the first available location
      setSelectedLocId(visibleLocations[0].id.toString());
    }
  }, [visibleLocations, selectedLocId, shifts, selectedUserId]);

  // Find if there is an active timecard for the user (clockOut is null)
  const activeCard = activeUserTimeCards.find(c => !c.clockOut);

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
        fetchTimeCards(); // Refresh data globally
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
        fetchTimeCards(); // Refresh data globally
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl border border-slate-200 w-full max-w-lg text-center relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className={`absolute top-0 left-0 right-0 h-3 ${activeCard ? 'bg-red-500' : 'bg-green-600'}`} />

        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-6">
          My Time Clock
        </h2>

        {/* Live Digital Clock */}
        <div className="mb-10 bg-slate-50 py-6 rounded-2xl border border-slate-200 shadow-inner">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric'})}
          </p>
          <div className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
            {currentTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', second: '2-digit'})}
          </div>
        </div>

        {activeCard ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl">
              <p className="text-xs font-black uppercase tracking-widest text-red-700 mb-1">Status</p>
              <p className="text-lg font-bold">
                Clocked in at <span className="font-black">{formatTimeSafe(activeCard.clockIn)}</span>
              </p>
              <p className="text-xs font-bold text-red-700 mt-1">
                @ {locations.find(l => l.id === activeCard.locationId)?.name}
              </p>
            </div>
            
            <button 
              onClick={handleClockOut} 
              disabled={isProcessing}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-2xl py-6 rounded-2xl shadow-xl shadow-red-600/20 transition-all transform hover:scale-[1.02]"
            >
              {isProcessing ? 'Processing...' : 'CLOCK OUT'}
            </button>
            <p className="text-xs text-slate-400 font-bold mt-4">Don't forget to fill out your shift report in the "My Time" tab!</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Facility</label>
              <select 
                value={selectedLocId} 
                onChange={(e) => setSelectedLocId(e.target.value)} 
                className="w-full border-2 border-slate-300 rounded-xl p-4 text-lg font-bold text-slate-900 focus:border-green-600 focus:ring-0 outline-none shadow-sm cursor-pointer"
              >
                {visibleLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleClockIn} 
              disabled={isProcessing || !selectedLocId}
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-black text-2xl py-6 rounded-2xl shadow-xl shadow-green-700/20 transition-all transform hover:scale-[1.02]"
            >
              {isProcessing ? 'Processing...' : 'CLOCK IN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}