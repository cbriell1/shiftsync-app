// filepath: app/components/HelpTab.tsx
"use client";
import React, { useState } from 'react';
import { BookOpen, Target, ArrowUpDown, Search, Paintbrush, Trash2, ShieldAlert, CheckCircle2, ChevronRight, X, Maximize2, MousePointer2, Move, Layout, ListChecks, Clock, UserPlus, Zap, Filter, Ticket, CreditCard, History, Activity } from 'lucide-react';

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
    { id: 'templates', label: 'Move 1: The Blueprint', icon: Layout, category: 'Setup' },
    { id: 'assign-popover', label: 'Move 2: Rapid Assign', icon: Search, category: 'Speed' },
    { id: 'assign-paint', label: 'Move 3: Bulk Fill', icon: Paintbrush, category: 'Speed' },
    { id: 'cleanup', label: 'Move 4: Surgical Cleanup', icon: Trash2, category: 'Control' },
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
        {/* Course Switcher */}
        <div className="flex bg-slate-200 p-1 rounded-2xl border-4 border-slate-900 shadow-xl">
           <button 
             onClick={() => { setActiveCourse('staff'); setActiveLesson('clock'); }}
             className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCourse === 'staff' ? 'bg-slate-900 text-yellow-400 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800'}`}
           >
             Staff Course
           </button>
           <button 
             onClick={() => { setActiveCourse('manager'); setActiveLesson('templates'); }}
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
          
          <div className="mt-12 p-6 bg-slate-900 rounded-[32px] border-b-8 border-yellow-400">
             <div className="flex items-center gap-3 text-yellow-400 mb-2">
                <Target size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Interactive Detail</span>
             </div>
             <p className="text-[11px] font-bold text-white opacity-80 leading-relaxed italic">"Click any training step to see high-res interface details."</p>
          </div>
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
              <p className="text-slate-400 font-bold max-w-xl mx-auto text-lg leading-relaxed italic">
                  {activeCourse === 'manager' ? 'Stop managing the roster. Start mastering the system.' : 'Speed and accuracy at the front desk are the keys to the court.'}
              </p>
           </div>
           <Layout size={400} className="absolute -bottom-20 -right-20 text-white/5 rotate-12 pointer-events-none" />
        </div>

        {/* STAFF MODULE 1: CLOCK */}
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

        {/* STAFF MODULE 2: PASSES */}
        {activeCourse === 'staff' && activeLesson === 'passes' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-pink-50 border-l-8 border-pink-600 p-8 rounded-r-[40px] mb-4">
                      <h2 className="text-3xl font-black text-slate-900 uppercase mb-2">Move 2: Guest Log</h2>
                      <p className="text-sm font-bold text-slate-500 italic">Managing renewals and logging visits.</p>
                   </div>
                   <DetailCard title="1. Search Member" text="Use the top search bar to find the guest by name or last name." icon={Search} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Quick Log" text="Hit the '+1 Pass' button. This instantly subtracts from their total and logs the timestamp." icon={History} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Full History" text="Click the member row to see a detailed audit of every visit they've had." icon={ListChecks} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/privileges.png" alt="Guest Pass UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {/* STAFF MODULE 3: GIFT CARDS */}
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
        {activeCourse === 'manager' && activeLesson === 'templates' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-blue-50 border-l-8 border-blue-600 p-8 rounded-r-[40px] mb-4">
                      <h2 className="text-3xl font-black text-slate-900 uppercase mb-2 text-blue-700">Move 1: The Blueprint</h2>
                      <p className="text-sm font-bold text-slate-500 italic">Mastering Templates & Filters.</p>
                   </div>
                   <DetailCard title="1. Templates Table" text="Navigate to 'Shift Templates' to see your master blueprints." icon={Clock} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Filter (Funnel)" text="Use the funnel icon in the header to isolate a single facility's blueprints." icon={Filter} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Deployment" text="Hit 'Generate Shifts' to push your blueprints live to the main calendar." icon={Zap} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/template-mgmt.png" alt="Master Templates UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'manager' && activeLesson === 'assign-popover' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                   <div className="bg-blue-600 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden mb-4 border-b-8 border-blue-900">
                      <h2 className="text-3xl font-black uppercase sports-slant italic mb-2">Move 2: Rapid Assign</h2>
                      <p className="text-blue-100 font-bold opacity-80 italic">Shift-First assignment logic.</p>
                      <Search size={150} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                   </div>
                   <DetailCard title="1. Click OPEN" text="Click any green 'OPEN' shift card on the Schedule Builder grid." icon={Search} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Search Popover" text="The Popover appears. Type 2-3 letters to find staff instantly." icon={Target} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Lock & Load" text="Hit ENTER. The shift is assigned and audited in under 1 second." icon={CheckCircle2} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/assign-popover.png" alt="Quick-Assign Popover UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'manager' && activeLesson === 'assign-paint' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-yellow-400 text-slate-900 p-10 rounded-[48px] shadow-2xl border-4 border-slate-900 flex items-center justify-between mb-4">
                      <div>
                         <h2 className="text-4xl font-black uppercase italic sports-slant">Move 3: Bulk Fill</h2>
                         <p className="text-slate-800 font-bold mt-1">Quick-Paint Brush in action.</p>
                      </div>
                      <Paintbrush size={48} className="animate-bounce" />
                   </div>
                   <DetailCard title="1. Select Painter" text="Click a staff member's name in the left column. Their entire row turns yellow." icon={Paintbrush} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="2. Mass Fill" text="Tap every 'OPEN' shift on the grid to instantly assign them to this player." icon={ChevronRight} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="3. Unassign Mode" text="Click the green 'Open' row header to paint assigned shifts back to OPEN." icon={Trash2} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/assign-paint.png" alt="Quick-Paint Mode UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {activeCourse === 'manager' && activeLesson === 'cleanup' && (
          <div className="animate-in slide-in-from-right-12 duration-500 space-y-12">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                <div className="space-y-4">
                   <div className="bg-red-600 text-white p-10 rounded-[48px] shadow-2xl border-b-8 border-red-900 mb-4">
                      <h2 className="text-3xl font-black uppercase sports-slant italic mb-2">Move 4: Surgical Cleanup</h2>
                      <p className="text-red-100 font-bold opacity-80">Precision and Bulk Deletion.</p>
                   </div>
                   <DetailCard title="Method A: Individual" text="Hover over any card and click the Red Trash Can icon." icon={Trash2} onClick={() => setZoomOpen(true)} />
                   <DetailCard title="Method B: Safe-Nuke" text="Click 'Clear' in the toolbar to wipe EVERYTHING visible in your filtered view." icon={ShieldAlert} onClick={() => setZoomOpen(true)} />
                </div>
                <ZoomableMain src="/Images/Training/cleanup-tools.png" alt="Cleanup Tools UI" isOpen={zoomOpen} setIsOpen={setZoomOpen} />
             </div>
          </div>
        )}

        {/* FOOTER */}
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
