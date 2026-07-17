// filepath: app/components/TasksTab.tsx
"use client";
import React, { useState } from 'react';
import { notify, customConfirm } from '@/lib/ui-utils';
import { useAppStore } from '@/lib/store';
import { ListChecks, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function TasksTab() {
  const users = useAppStore(state => state.users);
  const templates = useAppStore(state => state.templates);
  const globalTasks = useAppStore(state => state.globalTasks);
  const selectedUserId = useAppStore(state => state.selectedUserId);
  const fetchGlobalTasks = useAppStore(state => state.fetchGlobalTasks);

  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isManager = activeUser?.systemRoles?.includes('Manager') || activeUser?.systemRoles?.includes('Administrator');

  const [newTaskName, setNewTaskName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const usageCount = (taskName: string) => templates.filter(t => t.checklistTasks?.includes(taskName)).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTaskName.trim();
    if (!name) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await res.json();
      if (res.ok) {
        notify.success("Task added!");
        setNewTaskName('');
        await fetchGlobalTasks();
      } else {
        notify.error(data.error || "Failed to add task");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const startEditing = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    const res = await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name }) });
    const data = await res.json();
    if (res.ok) {
      notify.success("Task renamed!");
      cancelEditing();
      await fetchGlobalTasks();
    } else {
      notify.error(data.error || "Failed to rename task");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const count = usageCount(name);
    const msg = count > 0
      ? `Delete "${name}"? It's used in ${count} template${count === 1 ? '' : 's'} and will be removed from ${count === 1 ? 'it' : 'all of them'}.`
      : `Delete "${name}"?`;
    if (!(await customConfirm(msg, "Delete Task", true))) return;
    const res = await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) {
      notify.success("Task deleted");
      await fetchGlobalTasks();
    } else {
      const data = await res.json().catch(() => ({}));
      notify.error(data.error || "Failed to delete task");
    }
  };

  if (!isManager) return <div className="p-10 text-center"><h2 className="text-xl font-black text-slate-900 uppercase">Access Denied</h2></div>;

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-purple-600 text-white p-8 md:p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl md:text-4xl font-black uppercase italic sports-slant">Master Task Registry</h2>
          <p className="text-base md:text-lg font-bold opacity-80 italic">Global shift items required for facility closing.</p>
        </div>
        <ListChecks size={160} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
      </div>

      <div className="bg-slate-50 rounded-[40px] border-4 border-slate-200 p-6 md:p-8 shadow-inner space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTaskName}
            onChange={e => setNewTaskName(e.target.value)}
            placeholder="New task name (e.g. Wipe down counters)"
            className="flex-1 min-w-0 bg-white border-2 border-slate-300 rounded-2xl px-4 py-3 font-bold text-sm text-slate-900 outline-none focus:border-purple-500 shadow-sm"
          />
          <button type="submit" disabled={isAdding || !newTaskName.trim()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all shrink-0">
            <Plus size={16} /> Add Task
          </button>
        </form>

        <div className="space-y-2">
          {globalTasks.length === 0 ? (
            <p className="text-center font-black text-slate-400 uppercase italic tracking-widest py-16 border-4 border-dashed border-slate-200 rounded-[32px]">No tasks yet. Add your first one above.</p>
          ) : (
            globalTasks.map(task => {
              const count = usageCount(task.name);
              const isEditing = editingId === task.id;
              return (
                <div key={task.id} className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') cancelEditing(); }}
                        className="flex-1 min-w-0 bg-slate-50 border-2 border-purple-400 rounded-xl px-3 py-1.5 font-bold text-sm text-slate-900 outline-none"
                      />
                      <button onClick={() => saveEdit(task.id)} title="Save" className="text-green-600 hover:text-green-800 p-1.5"><Check size={18} /></button>
                      <button onClick={cancelEditing} title="Cancel" className="text-slate-400 hover:text-red-500 p-1.5"><X size={18} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 min-w-0 font-bold text-sm text-slate-900 truncate">{task.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">{count === 0 ? 'Unused' : `${count} template${count === 1 ? '' : 's'}`}</span>
                      <button onClick={() => startEditing(task.id, task.name)} title="Rename" className="text-slate-400 hover:text-blue-600 p-1.5 shrink-0"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(task.id, task.name)} title="Delete" className="text-slate-400 hover:text-red-600 p-1.5 shrink-0"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
