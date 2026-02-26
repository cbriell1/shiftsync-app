"use client";
import React, { useState, useEffect } from 'react';

export default function KioskPage() {
  // NEW: Hydration fix state
  const { 0: isMounted, 1: setIsMounted } = useState(false);
  
  const { 0: users, 1: setUsers } = useState(new Array());
  const { 0: locations, 1: setLocations } = useState(new Array());
  const { 0: openCards, 1: setOpenCards } = useState(new Array());
  const { 0: selectedUserId, 1: setSelectedUserId } = useState('');
  const { 0: selectedLocationId, 1: setSelectedLocationId } = useState('');
  const { 0: currentTime, 1: setCurrentTime } = useState(new Date());

  // Keep the big clock ticking
  useEffect(() => {
    setIsMounted(true); // NEW: Tells the app it is safe to render the clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, new Array());

  useEffect(() => {
    fetch('/api/users?t=' + new Date().getTime()).then(res => res.json()).then(data => setUsers(data));
    fetch('/api/locations?t=' + new Date().getTime()).then(res => res.json()).then(data => {
      setLocations(data);
      if (data && data.length > 0) setSelectedLocationId(data.at(0).id);
    });
    fetchOpenCards();
  }, new Array());

  const fetchOpenCards = () => {
    fetch('/api/kiosk?t=' + new Date().getTime()).then(res => res.json()).then(data => setOpenCards(data));
  };

  // Check if the selected user is currently clocked in!
  const activeCard = selectedUserId ? openCards.find(c => c.userId === parseInt(selectedUserId)) : null;

  const handleClockIn = async () => {
    if (!selectedUserId || !selectedLocationId) return alert("Select your name and location!");
    await fetch('/api/kiosk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLOCK_IN', userId: selectedUserId, locationId: selectedLocationId })
    });
    setSelectedUserId(''); // Reset for the next person
    fetchOpenCards();
  };

  const handleClockOut = async () => {
    if (!activeCard) return;
    await fetch('/api/kiosk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLOCK_OUT', timeCardId: activeCard.id })
    });
    setSelectedUserId(''); // Reset for the next person
    fetchOpenCards();
  };

  // NEW: Wait for browser to mount before rendering the live clock to prevent crashes
  if (!isMounted) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold text-2xl">Loading Kiosk...</div>;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border-b-8 border-green-800">
        
        {/* Branding Header */}
        <div className="bg-slate-100 p-8 flex flex-col items-center border-b border-gray-200">
          <img src="/logo.png" alt="Pickles & Play Logo" className="h-24 w-auto object-contain mb-4 drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-4xl font-black tracking-widest text-slate-900 uppercase italic">
            <span className="text-yellow-500">Pickles</span> & Play
          </h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-2">Employee Time Clock</p>
        </div>

        <div className="p-10 flex flex-col items-center">
          
          {/* Big Digital Clock */}
          <div className="text-center mb-10">
            <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric'})}</p>
            <div className="text-7xl font-black text-slate-900 tracking-tighter mt-2 drop-shadow-sm">
              {currentTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', second: '2-digit'})}
            </div>
          </div>

          <div className="w-full space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-500 uppercase tracking-wider mb-2">Location</label>
              <select value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)} className="w-full border-2 border-gray-300 rounded-xl p-4 text-xl font-bold text-slate-900 bg-slate-50 shadow-inner outline-none focus:border-green-600">
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-500 uppercase tracking-wider mb-2">Select Your Name</label>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full border-2 border-gray-300 rounded-xl p-4 text-xl font-bold text-slate-900 bg-slate-50 shadow-inner outline-none focus:border-blue-600">
                <option value="">-- Tap to Select Employee --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            
            {/* Dynamic Buttons */}
            <div className="pt-6">
              {!selectedUserId ? (
                <button disabled className="w-full bg-gray-200 text-gray-400 font-black text-2xl py-6 rounded-2xl cursor-not-allowed">
                  Select Name to Continue
                </button>
              ) : activeCard ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 text-center p-3 rounded-lg font-bold">
                    You have been clocked in since {new Date(activeCard.clockIn).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
                  </div>
                  <button onClick={handleClockOut} className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-3xl py-6 rounded-2xl shadow-lg transition transform hover:scale-[1.02]">
                    CLOCK OUT
                  </button>
                </div>
              ) : (
                <button onClick={handleClockIn} className="w-full bg-green-700 hover:bg-green-800 text-white font-black text-3xl py-6 rounded-2xl shadow-lg transition transform hover:scale-[1.02]">
                  CLOCK IN
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}