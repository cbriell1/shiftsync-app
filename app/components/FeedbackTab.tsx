"use client";
import React, { useState } from 'react';

export default function FeedbackTab({ appState }: { appState: any }) {
  const { feedbacks, fetchFeedbacks, users } = appState;

  // State for handling inline editing
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (fb) => {
    setEditingId(fb.id);
    setEditStatus(fb.status || 'OPEN');
    // Check various naming conventions for notes
    setEditNotes(fb.devNotes || fb.developerNotes || fb.notes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStatus('');
    setEditNotes('');
  };

  const handleSave = async (id) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: editStatus,
          developerNotes: editNotes 
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

  const statusGroups = ['OPEN', 'IN PROGRESS', 'COMPLETED'];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-purple-600 p-2.5 rounded-2xl shadow-lg shadow-purple-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Developer Backlog</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">System Improvements & Bug Tracking</p>
        </div>
      </div>

      {statusGroups.map(statusGroup => {
        const filteredFeedbacks = feedbacks.filter(f => (f.status || 'OPEN') === statusGroup);
        
        return (
          <div key={statusGroup} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            {/* Group Header */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${
                  statusGroup === 'OPEN' ? 'bg-amber-400' : 
                  statusGroup === 'IN PROGRESS' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                {statusGroup}
              </h3>
              <span className="bg-slate-100 px-4 py-1.5 rounded-full text-sm font-black text-slate-600">
                {filteredFeedbacks.length}
              </span>
            </div>

            {/* Grid of Tickets */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFeedbacks.map(fb => {
                const isEditing = editingId === fb.id;
                const user = users.find(u => u.id === fb.userId);
                const createdDate = new Date(fb.createdAt).toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric' 
                });

                // Display logic for notes
                const displayNote = fb.devNotes || fb.developerNotes || fb.notes;

                return (
                  <div key={fb.id} className="group flex flex-col bg-slate-50 border border-slate-200 rounded-3xl p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                    
                    <div className="flex justify-between items-start mb-5">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${
                        fb.type === 'BUG' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {fb.type}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">{createdDate}</span>
                    </div>

                    <div className="flex-grow">
                      <p className="text-slate-800 font-bold text-lg leading-snug mb-3">
                        "{fb.description}"
                      </p>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-white font-black uppercase">
                          {user?.name?.charAt(0) || '?'}
                        </div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                          {user?.name || 'Unknown Staff'}
                        </p>
                      </div>
                    </div>

                    {/* Developer Response Section */}
                    {!isEditing && (statusGroup === 'IN PROGRESS' || statusGroup === 'COMPLETED') && (
                      <div className="mb-6 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-inner overflow-hidden">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          {/* Fixed Icon: Forced small size */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-slate-400">
                            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223z" clipRule="evenodd" />
                          </svg>
                          Developer Note
                        </p>
                        <p className="text-sm font-bold text-slate-900 leading-relaxed">
                          {displayNote ? displayNote : <span className="text-slate-400 italic font-medium">No notes provided yet.</span>}
                        </p>
                      </div>
                    )}

                    <div className="pt-5 border-t border-slate-200">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Update Status</label>
                            <select 
                              value={editStatus} 
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-black text-slate-900 focus:border-slate-900 outline-none bg-white"
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Developer Notes</label>
                            <textarea 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Describe the fix or timeline..."
                              className="w-full border-2 border-slate-900 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-100 outline-none bg-white"
                              rows={4}
                            />
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSave(fb.id)}
                              disabled={isSaving}
                              className="flex-[2] bg-slate-900 text-white font-black py-3 rounded-xl text-sm hover:bg-black transition disabled:opacity-50"
                            >
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="flex-1 bg-white border border-slate-300 text-slate-500 font-black py-3 rounded-xl text-sm hover:bg-slate-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditing(fb)}
                          className="w-full py-3 bg-white border border-slate-300 rounded-xl text-[11px] font-black text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all uppercase tracking-widest"
                        >
                          Manage Ticket
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}

              {filteredFeedbacks.length === 0 && (
                <div className="col-span-full py-16 text-center border-4 border-dashed border-slate-100 rounded-[2.5rem]">
                  <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-sm">Empty Column</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}