// filepath: app/components/HelpTab.tsx
"use client";
import React, { useState } from 'react';
import { BookOpen, Target, Search, Trash2, ShieldAlert, CheckCircle2, X, Maximize2, MousePointer2, Move, Layout, ListChecks, Clock, Zap, Filter, Ticket, CreditCard, History, Activity, ChevronDown } from 'lucide-react';

// ==================================================================
// PRECISION DETAIL CARD
// ==================================================================
function DetailCard({ title, text, icon: Icon, onClick }: { title: string, text: string, icon?: any, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-slate-50 border-2 border-slate-200 p-6 rounded-[32px] flex items-start gap-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md group active:scale-[0.98]"
    >
      <div className="w-10 h-10 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-400">
        {Icon ? <Icon size={18} /> : <Target size={18} />}
      </div>
      <div className="min-w-0">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-2">
           {title}
           <span className="text-[8px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Click to Zoom</span>
        </h4>
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{text}</p>
      </div>
    </button>
  );
}

// ==================================================================
// FULL SCREEN LIGHTBOX
// ==================================================================
function ZoomableMain({ src, alt, isOpen, setIsOpen }: { src: string, alt: string, isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  return (
    <>
      <div className="relative group cursor-zoom-in rounded-[40px] border-4 border-slate-900 overflow-hidden shadow-2xl bg-white" onClick={() => setIsOpen(true)}>
        <img src={src} alt={alt} className="w-full h-auto block transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
           <div className="bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
              <Maximize2 size={16} /> Click to Fullscreen
           </div>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/98 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300" onClick={() => setIsOpen(false)}>
          <button className="absolute top-8 right-8 bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:bg-yellow-400 transition-colors z-[1001]"><X size={32} /></button>
          <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-3xl border-8 border-white/10 shadow-2xl" />
        </div>
      )}
    </>
  );
}

export default function HelpTab() {
  const [activeCourse, setActiveCourse] = useState<'manager' | 'staff'>('staff');
  const [activeLesson, setActiveLesson] = useState('clock');
  const [zoomOpen, setZoomOpen] = useState(false);

  const managerLessons = [
    { id: 'mastery', label: 'Move 1: Master Authority', icon: Layout, category: 'Setup' },
    { id: 'builder', label: 'Move 2: Slide-Out Builder', icon: MousePointer2, category: 'Speed' },
    { id: 'planner', label: 'Move 3: Daily Planner', icon: Activity, category: 'Precision' },
    { id: 'cleanup', label: 'Move 4: Roster Cleanup', icon: Trash2, category: 'Control' },
  ];

  const staffLessons = [
    { id: 'clock', label: 'Move 1: Stadium Clock', icon: Clock, category: 'Attendance' },
    { id: 'passes', label: 'Move 2: Guest Log', icon: Ticket, category: 'Privileges' },
    { id: 'giftcards', label: 'Move 3: Ticket Grid', icon: CreditCard, category: 'Gift Cards' },
  ];

  const currentLessons = activeCourse === 'manager' ? managerLessons : staffLessons;

  return (
    <div data-testid="help-tab-root" className="flex flex-col lg:flex-row gap-12 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Sidebar Navigation */}
      <div className="lg:w-80 shrink-0 space-y-6">
        <div className="flex bg-slate-200 p-1 rounded-2xl border-4 border-slate-900 shadow-xl">
           <button 
             onClick={() => { setActiveCourse('staff'); setActiveLesson('clock'); }}
             className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCourse === 'staff' ? 'bg-slate-900 text-yellow-400 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800'}`}
           >
             Staff Course
           </button>
           <button 
             onClick={() => { setActiveCourse('manager'); setActiveLesson('mastery'); }}
             className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCourse === 'manager' ? 'bg-slate-900 text-blue-400 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800'}`}
           >
             Manager Pro
           </button>
        </div>

        <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-2xl p-6 sticky top-4">
          <div className="flex items-center gap-4 mb-8 px-2 pb-4 border-b-4 border-slate-50">
             <div className={`p-2 rounded-xl shadow-lg ${activeCourse === 'manager' ? 'bg-slate-900 text-blue-400' : 'bg-slate-900 text-yellow-400'}`}><BookOpen size={20} /></div>
             <div>
                <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest opacity-40">Active Playbook</h3>
                <p className="font-black text-slate-900 uppercase text-sm italic sports-slant leading-none">
                    {activeCourse === 'manager' ? 'Manager Command Center' : 'Digital Gatekeeper'}
                </p>
             </div>
          </div>
          
          <nav className="space-y-8">
             {Array.from(new Set(currentLessons.map(l => l.category))).map(cat => (
                <div key={cat}>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-4">{cat}</p>
                   <div className="space-y-2">
                      {currentLessons.filter(i => i.category === cat).map(item => (
                        <button 
                          key={item.id} 
                          onClick={() => setActiveLesson(item.id)}
                          className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] font-black text-xs transition-all text-left group ${activeLesson === item.id ? (activeCourse === 'manager' ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-slate-900 text-white shadow-slate-900/30') : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} shadow-xl`}
                        >
                          <item.icon size={18} className={`${activeLesson === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} /> {item.label}
                        </button>
                      ))}
                   </div>
                </div>
             ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-12 min-w-0">
        
        {/* HEADER HERO */}
        <div className={`rounded-[48px] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl border-b-[12px] ${activeCourse === 'manager' ? 'bg-slate-900 border-blue-600' : 'bg-slate-900 border-yellow-400'}`}>
           <div className="relative z-10">
              <div className="inline-block bg-yellow-400 text-slate-900 px-6 py-1.5 rounded-full font-black text-xs uppercase tracking-[0.3em] mb-8 shadow-xl">
                  {activeCourse === 'manager' ? 'Level: Pro Manager' : 'Level: Staff Member'}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white sports-slant italic uppercase tracking-tighter mb-6 leading-none">
                  {activeCourse === 'manager' ? 'The ' : 'Staff '}
                  <span className={`${activeCourse === 'manager' ? 'text-blue-400' : 'text-yellow-400'} underline decoration-8 decoration-current/30 underline-offset-8`}>
                      {activeCourse === 'manager' ? '4 Power Moves' : 'Playbook'}
                  </span>
              </h1>
           </div>
           <Layout size={400} className="absolute -bottom-20 -right-20 text-white/5 rotate-12 pointer-events-none" />
        </div>

        {/* STAFF MODULES */}
        {activeCourse === 'staff' && activeLesson === 'clock' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-green-50 border-l-8 border-green-600 p-8 rounded-r-[40px] mb-4">
                      <h2 className="text-3xl font-black text-slate-900 uppercase mb-2">Move 1: Stadium Clock</h2>
                      <p className="text-sm font-bold text-slate-500 italic">Master the punch-in routine.</p>
                   </div>
                   <DetailCard title="1. Locate your Slot" text="Find your name on the 'Stadium Scoreboard' at the top of the Time Clock tab." icon={Search} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. The Punch" text="Click 'Clock In'. The scoreboard will instantly turn blue, confirming you are active." icon={Zap} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Live Totals" text="Watch your hours accumulate in real-time right on your scoreboard tile." icon={Activity} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/time-clock.png" alt="Time Clock UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'staff' && activeLesson === 'passes' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-pink-50 border-l-8 border-pink-600 p-8 rounded-r-[40px] mb-4">
                      <h2 className="text-3xl font-black text-slate-900 uppercase mb-2">Move 2: Guest Log</h2>
                      <p className="text-sm font-bold text-slate-500 italic">Managing renewals and logging visits.</p>
                   </div>
                   <DetailCard title="1. Search Member" text="Search by name or family to verify guest status." icon={Search} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Quick Log" text="Hit the '+1 Pass' button. This instantly subtracts from their total and logs the timestamp." icon={History} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Family Pool" text="Platinum members share a family pool for snacks and drinks. Check the 'Family Balance' before serving." icon={ListChecks} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/privileges.png" alt="Guest Pass UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'staff' && activeLesson === 'giftcards' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-blue-50 border-l-8 border-blue-600 p-8 rounded-r-[40px] mb-4">
                      <h2 className="text-3xl font-black text-slate-900 uppercase mb-2">Move 3: Ticket Grid</h2>
                      <p className="text-sm font-bold text-slate-500 italic">Processing redemptions at high speed.</p>
                   </div>
                   <DetailCard title="1. Code Entry" text="Type the card code or scan the ticket directly into the search bar." icon={Ticket} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Verify Balance" text="The 'Ticket-Grid' instantly filters. Check the 'Remaining Balance' field before redeeming." icon={Activity} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Execute" text="Click 'Redeem' to apply the balance. The card will update live across the system." icon={CheckCircle2} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/gift-cards.png" alt="Gift Card UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {/* MANAGER MODULES */}
        {activeCourse === 'manager' && activeLesson === 'mastery' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-blue-50 border-l-8 border-blue-600 p-8 rounded-r-[40px] mb-4">
                      <h2 className="text-3xl font-black text-slate-900 uppercase mb-2 text-blue-700">Move 1: Master Authority</h2>
                      <p className="text-sm font-bold text-slate-500 italic">Unified Command & Control.</p>
                   </div>
                   <DetailCard title="1. Consolidated Grid" text="Manage Live Reality and Master Patterns on a single grid. Use the grey capsule toggles to switch views." icon={Layout} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Synced Filters" text="Multi-select facilities (BC, GN, CH, WF) to audit sid-by-side court coverage." icon={Filter} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. The Zap Action" text="Deploy your gold-standard patterns to the live grid instantly with the Yellow Zap button." icon={Zap} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/v11-pro-mastery.png" alt="Unified Navigation UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'manager' && activeLesson === 'builder' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                   <div className="bg-blue-600 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden mb-4 border-b-8 border-blue-900">
                      <h2 className="text-3xl font-black uppercase sports-slant italic mb-2">Move 2: Slide-Out Builder</h2>
                      <p className="text-blue-100 font-bold opacity-80 italic">Zero-Friction data entry.</p>
                      <MousePointer2 size={150} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                   </div>
                   <DetailCard title="1. Easy Entry Clicks" text="Click any blank day-box or hour-slot to instantly launch the pre-filled sidebar." icon={MousePointer2} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Deep Customization" text="Adjust times, staff, and collapsible facility tasks in one high-energy block." icon={Activity} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Commital" text="Launch shifts or save patterns instantly. The system handles all conflict checks automatically." icon={CheckCircle2} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/v11-pro-builder.png" alt="Slide-out Builder UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'manager' && activeLesson === 'planner' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-yellow-400 text-slate-900 p-10 rounded-[48px] shadow-2xl border-4 border-slate-900 flex items-center justify-between mb-4">
                      <div>
                         <h2 className="text-4xl font-black uppercase italic sports-slant">Move 3: Daily Planner</h2>
                         <p className="text-slate-800 font-bold mt-1">Hourly precision and overlaps.</p>
                      </div>
                      <Activity size={48} className="animate-pulse" />
                   </div>
                   <DetailCard title="1. Smart Lane Logic" text="Overlapping court shifts automatically side-step each other in proportional columns." icon={Move} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Pro Interaction" text="Use inline dropdowns (Purple/Green) to re-assign staff without leaving the grid." icon={ChevronDown} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. High-Vis Borders" text="10px Slate borders ensure every shift block is perfectly distinct and easy to scan." icon={ShieldAlert} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/v11-pro-planner.png" alt="Daily Planner Grid UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'manager' && activeLesson === 'cleanup' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-red-600 text-white p-10 rounded-[48px] shadow-2xl border-b-8 border-red-900 mb-4">
                      <h2 className="text-3xl font-black uppercase sports-slant italic mb-2">Move 4: Roster Cleanup</h2>
                      <p className="text-red-100 font-bold opacity-80">Precision grid-side deletion.</p>
                   </div>
                   <DetailCard title="1. Individual Removal" text="Click the Red Trash Can icon on any card to permanently remove it from the roster." icon={Trash2} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Multiple Select" text="Hit 'Select Shifts' to enter batch mode. Click multiple cards to highlight them in blue, then hit 'Delete Selected' to prune in bulk." icon={ListChecks} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Safety Shield" text="Every bulk action requires a secondary confirmation, ensuring your live roster remains accurate and safe." icon={ShieldAlert} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/v11-pro-cleanup.png" alt="Grid Deletion UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        <footer className="mt-20 pt-20 border-t-8 border-slate-100 flex flex-col items-center text-center">
           <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 border-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform ${activeCourse === 'manager' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
              <CheckCircle2 size={48} className={activeCourse === 'manager' ? 'text-blue-600' : 'text-green-600'} />
           </div>
           <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Playbook Mastery</h4>
           <p className="text-slate-500 font-bold max-w-lg mt-2 italic leading-relaxed">System certified. High-speed facility operations are now standard.</p>
        </footer>
      </div>
    </div>
  );
}
