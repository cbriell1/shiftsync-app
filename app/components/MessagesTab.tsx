// filepath: app/components/MessagesTab.tsx
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Message } from '../lib/types';
import { notify } from '@/lib/ui-utils';

export default function MessagesTab({ appState }: { appState: AppState }) {
  const {
    messages, announcements, isManager, isAdmin, users, locations,
    handleSendMessage, handleCreateAnnouncement, handleDeleteAnnouncement,
    selectedUserId
  } = appState;

  const [subTab, setSubTab] = useState<'ANNOUNCEMENTS' | 'CHAT'>('ANNOUNCEMENTS');

  // --- MOBILE RESPONSIVE STATE ---
  const[showMobileThreadList, setShowMobileThreadList] = useState(true);

  // --- ANNOUNCEMENT STATE ---
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const[aTitle, setATitle] = useState('');
  const [aContent, setAContent] = useState('');
  const[aTargetType, setATargetType] = useState<'ALL' | 'LOCATIONS'>('ALL');
  const [aSelectedLocs, setASelectedLocs] = useState<number[]>([]);
  const[isSubmitting, setIsSubmitting] = useState(false);

  // --- CHAT STATE ---
  const [chatInput, setChatInput] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string>('global');
  const[showNewChatSelector, setShowNewChatSelector] = useState(false);
  const [cTargetType, setCTargetType] = useState<'USERS' | 'LOCATIONS'>('USERS');
  const [cSelectedUsers, setCSelectedUsers] = useState<number[]>([]);
  const [cSelectedLocs, setCSelectedLocs] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- UNREAD TRACKING STATE ---
  const [readStates, setReadStates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedUserId) {
      const stored = localStorage.getItem('threadReadStates_' + selectedUserId);
      if (stored) {
        try { setReadStates(JSON.parse(stored)); } catch (e) { setReadStates({}); }
      } else { setReadStates({}); }
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (activeThreadId && activeThreadId !== 'NEW' && typeof window !== 'undefined' && selectedUserId) {
      setReadStates(prev => {
        const now = new Date().toISOString();
        const next = { ...prev, [activeThreadId]: now };
        localStorage.setItem('threadReadStates_' + selectedUserId, JSON.stringify(next));
        return next;
      });
    }
  },[activeThreadId, messages, selectedUserId]);

  // --- THREAD GROUPING LOGIC ---
  const threads = useMemo(() => {
    const threadMap = new Map();

    threadMap.set('global', {
      id: 'global', type: 'GLOBAL', title: '🌐 Company Wide',
      messages:[], updatedAt: new Date(0).toISOString(),
      targetUserIds:[], targetLocationIds: [], isGlobal: true, participants:[]
    });

    messages.forEach(msg => {
      let tId = ''; let tType = ''; let title = ''; let participants: number[] =[];

      if (msg.isGlobal) {
        tId = 'global';
      } else if (msg.targetLocationIds && msg.targetLocationIds.length > 0) {
        const sortedLocs = [...msg.targetLocationIds].sort();
        tId = 'loc_' + sortedLocs.join('_');
        tType = 'LOCATION';
        const locNames = sortedLocs.map(id => locations.find(l => l.id === id)?.name).filter(Boolean);
        title = `📍 ${locNames.join(', ')}`;
      } else {
        participants = Array.from(new Set([msg.senderId, ...(msg.targetUserIds || [])])).sort();
        tId = 'user_' + participants.join('_');
        tType = participants.length > 2 ? 'GROUP' : 'DIRECT';

        const others = participants.filter(id => id.toString() !== selectedUserId);
        const otherNames = others.map(id => users.find(u => u.id === id)?.name?.split(' ')[0]).filter(Boolean);
        
        if (others.length === 0) title = '📝 Personal Notes';
        else if (others.length === 1) title = `👤 ${otherNames[0]}`;
        else title = `👥 ${otherNames.join(', ')}`;
      }

      if (!threadMap.has(tId)) {
        threadMap.set(tId, {
          id: tId, type: tType, title, messages:[], updatedAt: msg.createdAt,
          targetUserIds: msg.targetUserIds ||[], targetLocationIds: msg.targetLocationIds ||[],
          isGlobal: msg.isGlobal, participants
        });
      }

      const t = threadMap.get(tId);
      t.messages.push(msg);
      if (new Date(msg.createdAt) > new Date(t.updatedAt)) t.updatedAt = msg.createdAt;
    });

    return Array.from(threadMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },[messages, selectedUserId, locations, users]);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const activeMessages = activeThread?.messages ||[];

  useEffect(() => {
    if (subTab === 'CHAT' && !showMobileThreadList) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  },[subTab, activeMessages.length, activeThreadId, showMobileThreadList]);

  // --- ACTIONS ---
  const onPostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aTitle.trim() || !aContent.trim() || isSubmitting) return;

    const isGlobal = aTargetType === 'ALL';
    if (!isGlobal && aSelectedLocs.length === 0) {
      notify.error("Please select at least one location or set to Everyone.");
      return;
    }

    setIsSubmitting(true);
    await handleCreateAnnouncement(aTitle.trim(), aContent.trim(), isGlobal, aSelectedLocs);
    setATitle(''); setAContent(''); setASelectedLocs([]); setATargetType('ALL'); setShowAnnounceForm(false); setIsSubmitting(false);
  };

  const onSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSubmitting) return;

    setIsSubmitting(true);

    if (activeThreadId === 'NEW') {
      const isGlobal = false; 
      const tUsers = cTargetType === 'USERS' ? cSelectedUsers :[];
      const tLocs = cTargetType === 'LOCATIONS' ? cSelectedLocs :[];

      if (tUsers.length === 0 && tLocs.length === 0) {
        notify.error("Select at least one recipient!");
        setIsSubmitting(false);
        return;
      }

      await handleSendMessage(chatInput.trim(), isGlobal, tUsers, tLocs);
      
      if (cTargetType === 'LOCATIONS') {
        setActiveThreadId('loc_' + [...tLocs].sort().join('_'));
      } else {
        const participants = Array.from(new Set([parseInt(selectedUserId), ...tUsers])).sort();
        setActiveThreadId('user_' + participants.join('_'));
      }
      
      setShowNewChatSelector(false); setCSelectedUsers([]); setCSelectedLocs([]);
    } else {
      let tUsers = activeThread.targetUserIds;
      if (activeThread.type === 'DIRECT' || activeThread.type === 'GROUP') {
        tUsers = activeThread.participants.filter((id: number) => id.toString() !== selectedUserId);
      }
      await handleSendMessage(chatInput.trim(), activeThread.isGlobal, tUsers, activeThread.targetLocationIds);
    }

    setChatInput('');
    setIsSubmitting(false);
  };

  const startNewChat = () => {
    setActiveThreadId('NEW');
    setShowNewChatSelector(true);
    setCSelectedUsers([]);
    setCSelectedLocs([]);
    setShowMobileThreadList(false);
  };

  return (
    <div className="bg-white p-2 md:p-6 rounded-2xl border border-gray-300 shadow-md h-[85vh] md:h-[80vh] flex flex-col animate-in fade-in duration-300">
      
      {/* --- Top Sub-Tabs --- */}
      <div className="flex border-b border-gray-200 mb-4 gap-1 md:gap-2 px-2 md:px-0 pt-2 md:pt-0 overflow-x-auto">
        <button
          onClick={() => setSubTab('ANNOUNCEMENTS')}
          className={`py-2 px-4 md:px-6 font-black text-xs md:text-sm outline-none transition-colors border-b-2 whitespace-nowrap ${
            subTab === 'ANNOUNCEMENTS' ? 'border-blue-600 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          📢 Message Board
        </button>
        <button
          onClick={() => { setSubTab('CHAT'); setShowMobileThreadList(true); }}
          className={`py-2 px-4 md:px-6 font-black text-xs md:text-sm outline-none transition-colors border-b-2 whitespace-nowrap ${
            subTab === 'CHAT' ? 'border-blue-600 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          💬 Team Chat
        </button>
      </div>

      {/* --- ANNOUNCEMENTS VIEW --- */}
      {subTab === 'ANNOUNCEMENTS' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 rounded-xl">
          
          {(isManager || isAdmin) && (
            <div className="mb-4">
              {!showAnnounceForm ? (
                <button onClick={() => setShowAnnounceForm(true)} className="w-full md:w-auto bg-slate-900 text-white font-black px-5 py-3 rounded-xl text-sm shadow-md hover:bg-black transition-colors mx-2 md:mx-0">
                  + Post New Announcement
                </button>
              ) : (
                <form onSubmit={onPostAnnouncement} className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm animate-in fade-in zoom-in-95 duration-200 m-2 md:m-0">
                  <h3 className="text-sm font-black text-slate-800 mb-3">Create Announcement</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b border-slate-100 pb-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Send To:</label>
                      <select value={aTargetType} onChange={(e) => setATargetType(e.target.value as any)} className="w-full border-2 border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500">
                        <option value="ALL">Everyone (All Locations)</option>
                        <option value="LOCATIONS">Specific Locations</option>
                      </select>
                    </div>
                    {aTargetType === 'LOCATIONS' && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Select Locations:</label>
                        <div className="flex flex-wrap gap-2">
                          {locations.map(l => (
                            <label key={l.id} className={`px-2 py-1 border-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${aSelectedLocs.includes(l.id) ? 'bg-blue-100 border-blue-500 text-blue-900' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                              <input type="checkbox" className="hidden" checked={aSelectedLocs.includes(l.id)} onChange={(e) => {
                                if (e.target.checked) setASelectedLocs([...aSelectedLocs, l.id]); else setASelectedLocs(aSelectedLocs.filter(id => id !== l.id));
                              }} />
                              {l.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <input value={aTitle} onChange={e => setATitle(e.target.value)} required placeholder="Title / Subject" className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner" />
                  </div>
                  <div className="mb-3">
                    <textarea value={aContent} onChange={e => setAContent(e.target.value)} required placeholder="Write your announcement details here..." rows={4} className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 shadow-inner resize-none"></textarea>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={isSubmitting} className="flex-1 md:flex-none bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black py-2.5 px-6 rounded-lg text-sm shadow transition-colors">
                      {isSubmitting ? 'Posting...' : 'Post'}
                    </button>
                    <button type="button" onClick={() => setShowAnnounceForm(false)} className="flex-1 md:flex-none bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg text-sm transition-colors">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 px-2 md:pr-2 pb-6">
            {announcements.length === 0 ? (
              <div className="text-center p-12 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold italic shadow-sm">
                No announcements posted yet.
              </div>
            ) : (
              announcements.map(a => {
                let badgeText = "🌐 GLOBAL";
                if (!a.isGlobal && a.targetLocationIds && a.targetLocationIds.length > 0) {
                  const names = a.targetLocationIds.map(id => locations.find(l => l.id === id)?.name).filter(Boolean);
                  badgeText = `📍 ${names.join(', ')}`;
                }

                return (
                  <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow relative">
                    {(isManager || isAdmin) && (
                      <button onClick={() => handleDeleteAnnouncement(a.id)} className="absolute top-3 right-3 md:top-4 md:right-4 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 w-8 h-8 rounded-full flex items-center justify-center font-black transition-colors" title="Delete">✕</button>
                    )}
                    <h3 className="text-lg md:text-xl font-black text-slate-900 mb-1 pr-8 md:pr-10 leading-tight">{a.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4 mt-2">
                      <p className="text-[9px] md:text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-widest">
                        {a.author?.name} • {new Date(a.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <span className="text-[8px] md:text-[9px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded uppercase tracking-widest">
                        {badgeText}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- STREAMLINED CHAT VIEW (Google Messages Style) --- */}
      {subTab === 'CHAT' && (
        <div className="flex-1 flex overflow-hidden bg-white rounded-2xl border border-slate-300 shadow-inner relative">
          
          <div className={`${showMobileThreadList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/3 md:min-w-[260px] md:max-w-[320px] border-r border-slate-200 bg-slate-50/50 z-20`}>
            <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm">
              <h3 className="font-black text-slate-900 text-sm md:text-base">Inbox</h3>
              <button onClick={startNewChat} className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md hover:bg-blue-700 transition" title="New Message">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {threads.map(t => {
                const unreadCount = t.messages.filter((m: Message) => {
                  if (m.senderId.toString() === selectedUserId) return false;
                  const lastRead = readStates[t.id] || '1970-01-01T00:00:00.000Z';
                  return new Date(m.createdAt).getTime() > new Date(lastRead).getTime();
                }).length;

                return (
                  <div 
                    key={t.id} 
                    onClick={() => { 
                      setActiveThreadId(t.id); 
                      setShowNewChatSelector(false); 
                      setShowMobileThreadList(false); 
                    }}
                    className={`p-3 md:p-4 rounded-xl cursor-pointer transition-colors border flex flex-col gap-1 ${
                      activeThreadId === t.id 
                        ? 'bg-blue-100 border-blue-300 shadow-sm' 
                        : unreadCount > 0
                          ? 'bg-white border-blue-200 shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className={`text-sm md:text-xs font-black truncate pr-2 ${activeThreadId === t.id ? 'text-blue-900' : (unreadCount > 0 ? 'text-slate-900' : 'text-slate-800')}`}>
                        {t.title}
                      </div>
                      {unreadCount > 0 && activeThreadId !== t.id && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {t.messages.length > 0 && (
                      <div className={`text-xs md:text-[10px] truncate ${activeThreadId === t.id ? 'text-blue-700 font-bold' : (unreadCount > 0 ? 'text-slate-900 font-black' : 'text-slate-500 font-medium')}`}>
                        {t.messages[t.messages.length - 1].senderId.toString() === selectedUserId ? 'You: ' : ''}
                        {t.messages[t.messages.length - 1].content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${!showMobileThreadList ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-white relative`}>
            
            <div className="p-3 md:p-4 border-b border-slate-200 bg-white/90 backdrop-blur shadow-sm z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden p-2 -ml-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                  onClick={() => setShowMobileThreadList(true)}
                  title="Back to Inbox"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="font-black text-slate-900 text-sm md:text-base truncate">
                  {activeThreadId === 'NEW' ? 'Start New Conversation' : activeThread?.title}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {activeThreadId === 'NEW' ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold italic text-sm text-center px-4">
                  Select recipients below and send your first message.
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold italic text-sm">
                  No messages in this conversation yet.
                </div>
              ) : (
                activeMessages.map((msg: Message) => {
                  const isMe = msg.senderId.toString() === selectedUserId;
                  const senderName = msg.sender?.name?.split(' ')[0] || 'Unknown';
                  const isManagerLevel = msg.sender?.systemRoles?.includes('Administrator') || msg.sender?.systemRoles?.includes('Manager');

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <div className="flex items-center gap-1.5 ml-2 mb-1">
                          <span className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">{senderName}</span>
                          {isManagerLevel && <span className="text-[8px] bg-yellow-400 text-yellow-900 font-black px-1.5 rounded-sm">ADMIN</span>}
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] md:max-w-[75%] px-4 py-2.5 shadow-sm text-[13px] md:text-sm font-medium whitespace-pre-wrap leading-relaxed ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                          : 'bg-slate-200 border border-slate-300 text-slate-900 rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className={`text-[9px] font-bold text-slate-400 mt-1 ${isMe ? 'mr-2' : 'ml-2'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} className="h-2" />
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              
              {activeThreadId === 'NEW' && showNewChatSelector && (
                <div className="mb-3 p-3 bg-slate-100 rounded-xl border border-slate-300 animate-in slide-in-from-bottom-2">
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setCTargetType('USERS')} className={`flex-1 py-2 text-xs font-black rounded ${cTargetType === 'USERS' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>Specific Staff</button>
                    {(isManager || isAdmin) && (
                      <button type="button" onClick={() => setCTargetType('LOCATIONS')} className={`flex-1 py-2 text-xs font-black rounded ${cTargetType === 'LOCATIONS' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>Specific Locations</button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border-t border-slate-200 pt-2">
                    {cTargetType === 'USERS' && users.filter(u => u.id.toString() !== selectedUserId).map(u => (
                      <label key={u.id} className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-colors border ${cSelectedUsers.includes(u.id) ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                        <input type="checkbox" className="hidden" checked={cSelectedUsers.includes(u.id)} onChange={(e) => {
                          if (e.target.checked) setCSelectedUsers([...cSelectedUsers, u.id]); else setCSelectedUsers(cSelectedUsers.filter(id => id !== u.id));
                        }} />
                        {u.name}
                      </label>
                    ))}
                    {cTargetType === 'LOCATIONS' && locations.map(l => (
                      <label key={l.id} className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-colors border ${cSelectedLocs.includes(l.id) ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                        <input type="checkbox" className="hidden" checked={cSelectedLocs.includes(l.id)} onChange={(e) => {
                          if (e.target.checked) setCSelectedLocs([...cSelectedLocs, l.id]); else setCSelectedLocs(cSelectedLocs.filter(id => id !== l.id));
                        }} />
                        {l.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={onSendChat} className="flex items-end gap-2">
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendChat();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-slate-100 border-2 border-transparent focus:bg-white focus:border-blue-400 rounded-3xl px-4 py-3 text-sm font-extrabold text-slate-900 outline-none transition-colors resize-none overflow-y-auto placeholder:text-slate-400 placeholder:font-bold"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white h-11 w-11 rounded-full flex items-center justify-center transition-colors shadow-md flex-shrink-0"
                  title="Send"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}