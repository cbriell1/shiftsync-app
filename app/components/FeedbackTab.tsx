// filepath: app/components/FeedbackTab.tsx
"use client";
import React, { useState } from 'react';
import { AppState, Feedback, User } from '../lib/types';

export default function FeedbackTab({ appState }: { appState: AppState }) {
  const { feedbacks, fetchFeedbacks, users, handleSubmitFeedback, selectedUserId } = appState;

  // State for handling inline editing (Manager Side)
  const[editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<Feedback['status']>('OPEN');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // State for handling NEW feedback creation (Staff Side)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newType, setNewType] = useState<'BUG' | 'SUGGESTION'>('BUG');
  const [newDesc, setNewDesc] = useState('');
  const[isSubmitting, setIsSubmitting] = useState(false);

  // --- SUBMIT NEW FEEDBACK ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      return alert("Please select your active Employee Name at the top of the screen first.");
    }
    if (newDesc.length < 5) {
      return alert("Description must be at least 5 characters long.");
    }

    setIsSubmitting(true);
    const res = await handleSubmitFeedback({
      userId: selectedUserId,
      type: newType,
      description: newDesc
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsCreateOpen(false);
      setNewDesc('');
      setNewType('BUG');
    } else {
      alert("Failed to submit ticket. Please try again.");
    }
  };

  // --- MANAGE EXISTING FEEDBACK ---
  const startEditing = (fb: Feedback) => {
    setEditingId(fb.id);
    setEditStatus(fb.status || 'OPEN');
    setEditNotes(fb.devNotes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStatus('OPEN');
    setEditNotes('');
  };

  const handleSave = async (id: number) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          devNotes: editNotes 
        })
      });

      if (!response.ok) throw new Error("Failed to save");

      await fetchFeedbacks(); 
      setEditingId(null);
      setEditNotes('');
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusGroups: Feedback['status'][] = ['OPEN', 'IN PROGRESS', 'COMPLETED'];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* --- HEADER AREA --- */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-purple-700 p-1.5 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight tracking-tight">Developer Backlog</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">System Improvements & Bugs</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg font-black transition-colors shadow-sm text-xs"
        >
          <span>➕</span> Submit Feedback
        </button>
      </div>

      {/* --- TRUE KANBAN BOARD (SIDE-BY-SIDE COLUMNS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {statusGroups.map(statusGroup => {
          const filteredFeedbacks = feedbacks.filter(f => f.status === statusGroup);
          
          return (
            <div key={statusGroup} className="bg-slate-100/80 border border-slate-200 rounded-xl p-2.5 flex flex-col gap-2.5 max-h-[75vh] overflow-y-auto shadow-inner">
              
              {/* Column Header */}
              <div className="flex justify-between items-center px-1 pt-1 pb-1.5 border-b border-slate-200 sticky top-0 bg-slate-100/90 backdrop-blur z-10">
                <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    statusGroup === 'OPEN' ? 'bg-amber-500' : 
                    statusGroup === 'IN PROGRESS' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  {statusGroup}
                </h3>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black border border-slate-300">
                  {filteredFeedbacks.length}
                </span>
              </div>

              {/* Cards */}
              {filteredFeedbacks.map(fb => {
                const isEditing = editingId === fb.id;
                const user = users.find((u: User) => u.id === fb.userId);
                const createdDate = new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

                return (
                  <div key={fb.id} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm hover:shadow transition-shadow flex flex-col gap-2 group">
                    
                    {/* Top Row: Type & Meta */}
                    <div className="flex justify-between items-start">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        fb.type === 'BUG' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {fb.type}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {user?.name?.split(' ')[0] || 'Unknown'} • {createdDate}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs font-medium text-slate-800 leading-snug">
                      {fb.description}
                    </p>

                    {/* Read-Only Dev Note */}
                    {!isEditing && fb.devNotes && (
                      <div className="bg-slate-50 border-l-2 border-slate-300 px-2 py-1.5 rounded-r">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Dev Note:</p>
                        <p className="text-[10px] text-slate-700 font-medium leading-tight">{fb.devNotes}</p>
                      </div>
                    )}

                    {/* Inline Edit Controls */}
                    {isEditing ? (
                      <div className="mt-1 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                        <select 
                          value={editStatus} 
                          onChange={(e) => setEditStatus(e.target.value as Feedback['status'])}
                          className="w-full border border-slate-300 rounded p-1 text-[10px] font-bold text-slate-900 bg-slate-50 outline-none"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <textarea 
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Dev notes..."
                          className="w-full border border-slate-300 rounded p-1.5 text-[10px] font-medium text-slate-900 bg-slate-50 outline-none resize-none"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <button onClick={() => handleSave(fb.id)} disabled={isSaving} className="flex-1 bg-slate-800 text-white font-bold py-1 rounded text-[10px] hover:bg-slate-900 transition-colors">
                            {isSaving ? '...' : 'Save'}
                          </button>
                          <button onClick={cancelEditing} className="flex-1 bg-slate-200 text-slate-700 font-bold py-1 rounded text-[10px] hover:bg-slate-300 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startEditing(fb)}
                        className="text-[9px] font-black text-slate-300 hover:text-slate-600 text-left mt-1 w-max transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Manage Ticket
                      </button>
                    )}
                  </div>
                );
              })}

              {filteredFeedbacks.length === 0 && (
                <div className="py-6 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50/50">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Empty</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- COMPACT CREATE MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-300">
            
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">New Feedback</h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-red-500 text-lg font-black transition-colors leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewType('BUG')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black rounded-md transition-all ${newType === 'BUG' ? 'bg-white shadow text-red-700 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  🐞 Report Bug
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('SUGGESTION')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black rounded-md transition-all ${newType === 'SUGGESTION' ? 'bg-white shadow text-blue-700 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  💡 Suggestion
                </button>
              </div>

              <div>
                <textarea
                  required
                  autoFocus
                  minLength={5}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={newType === 'BUG' ? "Describe the issue..." : "Describe your idea..."}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:border-purple-500 focus:ring-1 outline-none shadow-inner min-h-[80px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || newDesc.length < 5}
                className="w-full bg-purple-700 text-white py-2 rounded-lg font-black text-xs shadow-sm hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}