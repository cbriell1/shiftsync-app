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

  const statusGroups: Feedback['status'][] =['OPEN', 'IN PROGRESS', 'COMPLETED'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 relative">
      
      {/* --- HEADER AREA --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-purple-700 p-2.5 rounded-2xl shadow-lg shadow-purple-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Developer Backlog</h2>
            <p className="text-slate-700 font-bold text-xs md:text-sm uppercase tracking-widest">System Improvements & Bug Tracking</p>
          </div>
        </div>
        
        {/* CREATE FEEDBACK BUTTON */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-6 py-3.5 rounded-xl font-black transition-all shadow-lg"
        >
          <span>➕</span> Submit Feedback
        </button>
      </div>

      {/* --- KANBAN COLUMNS --- */}
      {statusGroups.map(statusGroup => {
        const filteredFeedbacks = feedbacks.filter(f => f.status === statusGroup);
        
        return (
          <div key={statusGroup} className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            
            {/* Group Header */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${
                  statusGroup === 'OPEN' ? 'bg-amber-500' : 
                  statusGroup === 'IN PROGRESS' ? 'bg-blue-600' : 'bg-green-600'
                }`} />
                {statusGroup}
              </h3>
              <span className="bg-slate-200 px-4 py-1.5 rounded-full text-sm font-black text-slate-800 shadow-inner">
                {filteredFeedbacks.length}
              </span>
            </div>

            {/* Grid of Tickets */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFeedbacks.map(fb => {
                const isEditing = editingId === fb.id;
                const user = users.find((u: User) => u.id === fb.userId);
                const createdDate = new Date(fb.createdAt).toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric' 
                });

                return (
                  <div key={fb.id} className="flex flex-col bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 transition-all hover:bg-white hover:shadow-lg">
                    
                    <div className="flex justify-between items-start mb-5">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${
                        fb.type === 'BUG' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {fb.type}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-300 shadow-sm">
                        {createdDate}
                      </span>
                    </div>

                    <div className="flex-grow">
                      <p className="text-slate-900 font-bold text-lg leading-snug mb-4">
                        "{fb.description}"
                      </p>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-slate-800 font-black uppercase border border-slate-400">
                          {user?.name?.charAt(0) || '?'}
                        </div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight">
                          {user?.name || 'Unknown Staff'}
                        </p>
                      </div>
                    </div>

                    {/* Developer Response Section */}
                    {!isEditing && (statusGroup === 'IN PROGRESS' || statusGroup === 'COMPLETED') && (
                      <div className="mb-6 bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-inner overflow-hidden">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-slate-600">
                            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223z" clipRule="evenodd" />
                          </svg>
                          Developer Note
                        </p>
                        <p className="text-sm font-bold text-slate-900 leading-relaxed">
                          {fb.devNotes ? fb.devNotes : <span className="text-slate-600 italic font-medium">No notes provided yet.</span>}
                        </p>
                      </div>
                    )}

                    {/* Edit Controls (Manager/Admin Only conceptually) */}
                    <div className="pt-5 border-t-2 border-slate-200">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Update Status</label>
                            <select 
                              value={editStatus} 
                              onChange={(e) => setEditStatus(e.target.value as Feedback['status'])}
                              className="w-full border-2 border-slate-300 rounded-xl p-2.5 text-sm font-black text-slate-900 focus:border-slate-900 outline-none bg-white shadow-sm cursor-pointer"
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Developer Notes</label>
                            <textarea 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Describe the fix or timeline..."
                              className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:border-slate-900 outline-none bg-white shadow-sm"
                              rows={4}
                            />
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSave(fb.id)}
                              disabled={isSaving}
                              className="flex-[2] bg-slate-900 text-white font-black py-3 rounded-xl text-sm hover:bg-black transition disabled:opacity-50 shadow-md"
                            >
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="flex-1 bg-white border-2 border-slate-300 text-slate-700 font-black py-3 rounded-xl text-sm hover:bg-slate-100 transition shadow-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditing(fb)}
                          className="w-full py-3 bg-white border-2 border-slate-300 rounded-xl text-[11px] font-black text-slate-800 hover:border-slate-900 hover:text-slate-900 transition-all uppercase tracking-widest shadow-sm"
                        >
                          Manage Ticket
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}

              {filteredFeedbacks.length === 0 && (
                <div className="col-span-full py-16 text-center border-4 border-dashed border-slate-200 rounded-[2.5rem]">
                  <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">No Tickets Found</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* --- CREATE FEEDBACK MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-300">
            
            <div className="p-6 md:p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="font-black text-slate-900 text-2xl">Submit Feedback</h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-600 hover:text-red-600 text-2xl font-black transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 md:p-8 space-y-6">
              
              <div className="flex p-1.5 bg-slate-200 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setNewType('BUG')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-black rounded-lg transition-all ${newType === 'BUG' ? 'bg-white shadow-md text-red-800' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  <span className="text-lg leading-none">🐞</span> Report a Bug
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('SUGGESTION')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-black rounded-lg transition-all ${newType === 'SUGGESTION' ? 'bg-white shadow-md text-blue-800' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  <span className="text-lg leading-none">💡</span> Suggestion
                </button>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase mb-2 ml-1">Description</label>
                <textarea
                  required
                  autoFocus
                  minLength={5}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={newType === 'BUG' ? "Describe the issue you encountered in detail..." : "Describe your idea for improving the app..."}
                  className="w-full border-2 border-slate-300 rounded-xl p-4 text-sm font-bold text-slate-900 focus:border-purple-600 focus:ring-0 outline-none shadow-sm min-h-[140px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || newDesc.length < 5}
                className="w-full bg-purple-700 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-purple-900/20 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'} <span className="text-xl leading-none">→</span>
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}