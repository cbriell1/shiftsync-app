// filepath: app/components/FeedbackTab.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Feedback, User } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { notify } from '@/lib/ui-utils';
import { MessageSquare, Send, Bug, Lightbulb, Clock, Filter, User as UserIcon } from 'lucide-react';

export default function FeedbackTab({ appState }: any) {
  const feedbacks = useAppStore(state => state.feedbacks);
  const fetchFeedbacks = useAppStore(state => state.fetchFeedbacks);
  const users = useAppStore(state => state.users);
  const selectedUserId = useAppStore(state => state.selectedUserId);
  const isFeedbacksLoading = useAppStore(state => state.isFeedbacksLoading);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<Feedback['status']>('OPEN');
  const[editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [commentingId, setCommentingId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newType, setNewType] = useState<'BUG' | 'SUGGESTION'>('BUG');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUG' | 'SUGGESTION'>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');

  const [highlightBaseline, setHighlightBaseline] = useState<string>('1970-01-01T00:00:00.000Z');

  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isManager = activeUser?.systemRoles?.includes('Administrator') || activeUser?.systemRoles?.includes('Manager');

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedUserId) {
      const storedFb = localStorage.getItem('lastViewedFeedback_' + selectedUserId);
      if (storedFb) setHighlightBaseline(storedFb);
    }
  }, [selectedUserId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return notify.error("Select an Employee Profile first.");
    if (newDesc.length < 5) return notify.error("Description must be at least 5 characters.");

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, type: newType, description: newDesc })
      });
      if (res.ok) {
        notify.success("Feedback Submitted!");
        setIsCreateOpen(false);
        setNewDesc('');
        setNewType('BUG');
        await fetchFeedbacks();
      }
    } catch (err) {
      notify.error("Network error.");
    } finally { setIsSubmitting(false); }
  };

  const handleSave = async (id: number) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, devNotes: editNotes, action: 'UPDATE_STATUS' })
      });
      if (!response.ok) throw new Error("Failed to save");
      notify.success("Ticket Updated!");
      await fetchFeedbacks(); 
      setEditingId(null);
    } catch (error: any) {
      notify.error(error.message || "Failed to save.");
    } finally { setIsSaving(false); }
  };

  const handleAddComment = async (id: number) => {
    if (!newComment.trim()) return;
    setIsCommenting(true);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_COMMENT', commentContent: newComment.trim(), userId: selectedUserId })
      });
      if (res.ok) {
        setNewComment('');
        setCommentingId(null);
        await fetchFeedbacks();
        notify.success("Comment Added");
      }
    } catch (e) {
      notify.error("Failed to add comment");
    } finally { setIsCommenting(false); }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(fb => {
      const matchType = typeFilter === 'ALL' || fb.type === typeFilter;
      const matchUser = userFilter === 'ALL' || fb.userId.toString() === userFilter;
      return matchType && matchUser;
    });
  }, [feedbacks, typeFilter, userFilter]);

  const uniqueAuthors = useMemo(() => {
    const ids = new Set(feedbacks.map(f => f.userId));
    return users.filter(u => ids.has(u.id));
  }, [feedbacks, users]);

  const startEditing = (fb: Feedback) => { setEditingId(fb.id); setEditStatus(fb.status || 'OPEN'); setEditNotes(fb.devNotes || ''); };
  const cancelEditing = () => { setEditingId(null); setEditStatus('OPEN'); setEditNotes(''); };

  const statusGroups: Feedback['status'][] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-purple-700 p-2.5 rounded-2xl shadow-lg border-b-4 border-purple-900">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase sports-slant italic">Feedback Hub</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-none">System Improvements & Bug Tracking</p>
          </div>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="w-full md:w-auto btn-sport bg-purple-700 text-white px-6 py-3 border-b-4 border-purple-900 text-sm">
          ➕ New Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 bg-slate-900 p-4 rounded-2xl shadow-inner">
         <div className="flex items-center gap-2">
            <Filter size={14} className="text-purple-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filters:</span>
         </div>
         
         <div className="flex bg-slate-800 p-1 rounded-xl gap-1">
            {(['ALL', 'BUG', 'SUGGESTION'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${typeFilter === t ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
            ))}
         </div>

         <div className="flex items-center gap-2 ml-auto">
            <UserIcon size={14} className="text-slate-400" />
            <select 
              value={userFilter} onChange={e => setUserFilter(e.target.value)}
              className="bg-slate-800 border-none rounded-xl px-3 py-1.5 text-[9px] font-black text-slate-200 uppercase tracking-wider outline-none focus:ring-1 ring-purple-500"
            >
              <option value="ALL">All Authors</option>
              {uniqueAuthors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {statusGroups.map(statusGroup => {
          const groupFeedbacks = filteredFeedbacks.filter(f => f.status === statusGroup);
          return (
            <div key={statusGroup} className="bg-slate-100 border-4 border-slate-200 rounded-[32px] p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto shadow-inner">
              <div className="flex justify-between items-center px-2 py-1 sticky top-0 bg-slate-100/90 backdrop-blur z-20 border-b-2 border-slate-200">
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusGroup === 'OPEN' ? 'bg-amber-500' : statusGroup === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  {statusGroup}
                </h3>
                <span className="bg-slate-900 text-white px-3 py-0.5 rounded-full text-[10px] font-black">{groupFeedbacks.length}</span>
              </div>
              
              {isFeedbacksLoading ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse" />)}
                </div>
              ) : groupFeedbacks.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] opacity-40 italic">No tickets found</p>
                </div>
              ) : (
                groupFeedbacks.map(fb => {
                  const isEditing = editingId === fb.id;
                  const isCommentingActive = commentingId === fb.id;
                  const user = users.find((u: User) => u.id === fb.userId);
                  const createdDate = new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                  const isUnread = new Date(fb.updatedAt || fb.createdAt).getTime() > new Date(highlightBaseline).getTime();
                  const shouldHighlight = isUnread && (isManager || fb.userId === parseInt(selectedUserId));

                  return (
                    <div key={fb.id} className={`bg-white border-4 rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col gap-3 group relative ${shouldHighlight ? 'border-purple-500' : 'border-slate-200'}`}>
                      {shouldHighlight && <span className="absolute -top-3 -right-2 bg-purple-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg z-10 uppercase italic">Update</span>}
                      
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border-2 uppercase tracking-widest flex items-center gap-1.5 ${fb.type === 'BUG' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {fb.type === 'BUG' ? <Bug size={12} /> : <Lightbulb size={12} />} {fb.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12} /> {user?.name?.split(' ')[0]} • {createdDate}</span>
                      </div>

                      <p className="text-[13px] font-black text-slate-900 leading-snug">{fb.description}</p>

                      {fb.devNotes && !isEditing && (
                        <div className="bg-slate-900 p-3 rounded-2xl border-l-8 border-green-500 mt-1 shadow-inner">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Developer Result:</p>
                          <p className="text-xs text-green-400 font-bold leading-tight italic">"{fb.devNotes}"</p>
                        </div>
                      )}

                      {/* Discussion Thread */}
                      {fb.comments && fb.comments.length > 0 && (
                        <div className="space-y-2 mt-1 border-t-2 border-slate-50 pt-3">
                           {(Array.isArray(fb.comments) ? fb.comments : []).map((c: any) => (
                             <div key={c.id} className="text-[11px] leading-tight flex flex-col">
                                <span className="font-black text-slate-900 uppercase tracking-tighter mb-0.5">{c.user?.name?.split(' ')[0]} says:</span>
                                <span className="text-slate-600 font-medium bg-slate-50 p-2 rounded-xl rounded-tl-none border border-slate-100">{c.content}</span>
                             </div>
                           ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-3 border-t-2 border-slate-50">
                         {isCommentingActive ? (
                           <div className="flex w-full gap-2">
                              <input 
                                value={newComment} onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment(fb.id)}
                                placeholder="Add to discussion..." autoFocus
                                className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-purple-500 outline-none"
                              />
                              <button onClick={() => handleAddComment(fb.id)} disabled={isCommenting} className="bg-purple-700 text-white p-2 rounded-xl hover:bg-purple-800 disabled:opacity-50 shadow-md"><Send size={14} /></button>
                              <button onClick={() => setCommentingId(null)} className="text-slate-400 hover:text-slate-600 px-1 font-black">×</button>
                           </div>
                         ) : (
                           <>
                             <button onClick={() => setCommentingId(fb.id)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-purple-600 transition-colors uppercase tracking-widest">
                                <MessageSquare size={14} /> {fb.comments?.length || 0} Discuss
                             </button>
                             {isManager && (
                               <button onClick={() => startEditing(fb)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-widest">
                                 Resolve
                               </button>
                             )}
                           </>
                         )}
                      </div>

                      {isEditing && (
                        <div className="mt-2 pt-4 border-t-4 border-slate-100 flex flex-col gap-3 animate-in slide-in-from-top-2">
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Feedback['status'])} className="w-full border-4 border-slate-100 rounded-2xl p-3 text-xs font-black text-slate-900 bg-slate-50 outline-none focus:border-blue-600">
                            <option value="OPEN">Open</option>
                            <option value="IN PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Explain the resolution..." className="w-full border-4 border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-900 bg-slate-50 outline-none resize-none focus:border-blue-600" rows={3} />
                          <div className="flex gap-2">
                            <button onClick={() => handleSave(fb.id)} disabled={isSaving} className="flex-1 btn-sport bg-slate-900 text-white py-2 shadow-md">Apply</button>
                            <button onClick={cancelEditing} className="flex-1 btn-sport bg-slate-100 text-slate-500 py-2 border-b-4 border-slate-200">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-8 border-slate-900">
            <div className="px-8 py-6 border-b-8 border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight sports-slant italic">Open Ticket</h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-red-500 text-2xl font-black transition-colors">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-8 space-y-6">
              <div className="flex p-1.5 bg-slate-100 rounded-3xl border-4 border-slate-200">
                <button type="button" onClick={() => setNewType('BUG')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-2xl transition-all ${newType === 'BUG' ? 'bg-white shadow-xl text-red-700 border-2 border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>🐞 BUG</button>
                <button type="button" onClick={() => setNewType('SUGGESTION')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-2xl transition-all ${newType === 'SUGGESTION' ? 'bg-white shadow-xl text-blue-700 border-2 border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>💡 IDEA</button>
              </div>
              <div>
                <textarea required autoFocus minLength={5} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Provide full details for the development team..." className="w-full border-8 border-slate-100 bg-slate-50 rounded-[32px] p-6 text-sm font-bold text-slate-900 focus:border-purple-600 outline-none shadow-inner min-h-[150px] resize-none" />
              </div>
              <button type="submit" disabled={isSubmitting || newDesc.length < 5} className="w-full btn-sport bg-purple-700 text-white py-5 text-lg shadow-2xl disabled:opacity-50 uppercase">
                {isSubmitting ? 'Transmitting...' : 'Send to Developers'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
