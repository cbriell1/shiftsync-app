"use client";
import React, { useState, useEffect } from 'react';

export default function KioskPage() {
  const[isMounted, setIsMounted] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const[openCards, setOpenCards] = useState<any[]>([]);
  
  // Selection State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  
  // Security PIN State
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep the big clock ticking
  useEffect(() => {
    setIsMounted(true); 
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  },[]);

  useEffect(() => {
    fetch('/api/users?t=' + new Date().getTime()).then(res => res.json()).then(data => setUsers(data));
    fetch('/api/locations?t=' + new Date().getTime()).then(res => res.json()).then(data => {
      setLocations(data);
      if (data && data.length > 0) setSelectedLocationId(data[0].id);
    });
    fetchOpenCards();
  },[]);

  const fetchOpenCards = () => {
    fetch('/api/kiosk?t=' + new Date().getTime()).then(res => res.json()).then(data => setOpenCards(data));
  };

  const activeCard = selectedUserId ? openCards.find((c: any) => c.userId === parseInt(selectedUserId)) : null;

  // Keypad Handlers
  const handleNumberClick = (num: string) => {
    if (pinCode.length < 4) {
      setPinCode(prev => prev + num);
      setPinError('');
    }
  };

  const handleClear = () => {
    setPinCode('');
    setPinError('');
  };

  const handleBackspace = () => {
    setPinCode(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handleClockIn = async () => {
    if (!selectedUserId || !selectedLocationId) return alert("Select your name and location!");
    
    const res = await fetch('/api/kiosk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLOCK_IN', userId: selectedUserId, locationId: selectedLocationId, pinCode })
    });

    if (!res.ok) {
      const err = await res.json();
      setPinError(err.error || 'Invalid PIN code');
      setPinCode('');
      return;
    }

    setSelectedUserId('');
    setPinCode('');
    fetchOpenCards();
  };

  const handleClockOut = async () => {
    if (!activeCard) return;

    const res = await fetch('/api/kiosk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLOCK_OUT', timeCardId: activeCard.id, pinCode })
    });

    if (!res.ok) {
      const err = await res.json();
      setPinError(err.error || 'Invalid PIN code');
      setPinCode('');
      return;
    }

    setSelectedUserId('');
    setPinCode('');
    fetchOpenCards();
  };

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

          {/* Conditional UI: Dropdowns OR Numpad */}
          {!selectedUserId ? (
            <div className="w-full space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-black text-slate-500 uppercase tracking-wider mb-2">Location</label>
                <select value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)} className="w-full border-2 border-gray-300 rounded-xl p-4 text-xl font-bold text-slate-900 bg-slate-50 shadow-inner outline-none focus:border-green-600">
                  {locations.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-500 uppercase tracking-wider mb-2">Select Your Name</label>
                <select 
                  value={selectedUserId} 
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setPinCode('');
                    setPinError('');
                  }} 
                  className="w-full border-2 border-gray-300 rounded-xl p-4 text-xl font-bold text-slate-900 bg-slate-50 shadow-inner outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="">-- Tap to Select Employee --</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-4 duration-300">
              
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                Hello, {users.find(u => u.id === parseInt(selectedUserId))?.name}
              </h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Enter your 4-digit PIN</p>

              {/* Secure PIN Indicator Dots */}
              <div className="flex gap-4 mb-6">
                 {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-3xl font-black transition-all ${pinCode.length > i ? 'border-slate-900 bg-slate-900 text-white' : 'border-gray-300 bg-gray-50'}`}>
                       {pinCode.length > i ? '•' : ''}
                    </div>
                 ))}
               </div>

               {/* Error Message Space */}
               <div className="h-6 mb-4">
                 {pinError && <p className="text-red-500 font-bold uppercase tracking-widest text-sm animate-pulse">{pinError}</p>}
               </div>

               {/* Numpad */}
               <div className="grid grid-cols-3 gap-4 mb-8">
                  {[1,2,3,4,5,6,7,8,9].map(num => (
                     <button key={num} onClick={() => handleNumberClick(num.toString())} className="w-20 h-20 bg-slate-100 hover:bg-slate-200 rounded-full text-3xl font-black text-slate-800 transition-colors shadow-sm">{num}</button>
                  ))}
                  <button onClick={handleClear} className="w-20 h-20 bg-red-50 hover:bg-red-100 rounded-full text-lg font-black text-red-600 transition-colors shadow-sm">CLR</button>
                  <button onClick={() => handleNumberClick('0')} className="w-20 h-20 bg-slate-100 hover:bg-slate-200 rounded-full text-3xl font-black text-slate-800 transition-colors shadow-sm">0</button>
                  <button onClick={handleBackspace} className="w-20 h-20 bg-gray-200 hover:bg-gray-300 rounded-full text-xl font-black text-slate-700 transition-colors shadow-sm">⌫</button>
               </div>

               {/* Submit Action Buttons */}
               {activeCard ? (
                 <div className="w-full flex flex-col gap-3">
                   <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 text-center p-3 rounded-lg font-bold">
                     You clocked in at {new Date(activeCard.clockIn).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
                   </div>
                   <button onClick={handleClockOut} disabled={pinCode.length !== 4} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-3xl py-6 rounded-2xl shadow-lg transition transform hover:scale-[1.02]">
                     CLOCK OUT
                   </button>
                 </div>
               ) : (
                 <button onClick={handleClockIn} disabled={pinCode.length !== 4} className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-3xl py-6 rounded-2xl shadow-lg transition transform hover:scale-[1.02]">
                   CLOCK IN
                 </button>
               )}

               <button 
                 onClick={() => { setSelectedUserId(''); setPinCode(''); setPinError(''); }} 
                 className="mt-6 text-slate-400 font-bold hover:text-slate-800 transition-colors uppercase tracking-widest text-xs"
               >
                 Go Back / Change Employee
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}