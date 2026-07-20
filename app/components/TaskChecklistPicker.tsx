// filepath: app/components/TaskChecklistPicker.tsx
"use client";
import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { notify } from '@/lib/ui-utils';
import { TASK_CATEGORIES, getTaskCategoryColor } from '@/lib/common';
import { Search, Plus, CheckCircle2, ChevronDown } from 'lucide-react';

export default function TaskChecklistPicker({ selected, onChange, variant = 'light' }: { selected: string[]; onChange: (next: string[]) => void; variant?: 'light' | 'dark' }) {
  const globalTasks = useAppStore(state => state.globalTasks);
  const fetchGlobalTasks = useAppStore(state => state.fetchGlobalTasks);
  const [query, setQuery] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('General');
  const [isAdding, setIsAdding] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isDark = variant === 'dark';

  const toggle = (name: string) => onChange(selected.includes(name) ? selected.filter(t => t !== name) : [...selected, name]);
  const toggleCollapsed = (category: string) => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }));

  const allSelected = globalTasks.length > 0 && selected.length === globalTasks.length;
  const toggleAll = () => onChange(allSelected ? [] : globalTasks.map(t => t.name));

  const filtered = globalTasks.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  const hasQuery = query.trim().length > 0;

  const groups = TASK_CATEGORIES.map(category => {
    const tasks = filtered
      .filter(t => (t.category || 'General') === category)
      .sort((a, b) => {
        const aSel = selected.includes(a.name), bSel = selected.includes(b.name);
        if (aSel === bSel) return a.name.localeCompare(b.name);
        return aSel ? -1 : 1;
      });
    return { category, tasks };
  }).filter(g => g.tasks.length > 0);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTaskName.trim();
    if (!name) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, category: newTaskCategory }) });
      const data = await res.json();
      if (res.ok) {
        await fetchGlobalTasks();
        onChange([...selected, name]);
        setNewTaskName('');
        notify.success("Task added!");
      } else {
        notify.error(data.error || "Failed to add task");
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2 border-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <Search size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className={`flex-1 min-w-0 bg-transparent outline-none text-xs font-bold ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
          />
        </div>
        {globalTasks.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-wider shrink-0 transition-all ${isDark ? 'bg-slate-800 border border-slate-700 text-brand-yellow hover:bg-slate-700' : 'bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200'}`}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
        {groups.map(({ category, tasks }) => {
          const color = getTaskCategoryColor(category);
          const isCollapsed = !hasQuery && collapsed[category];
          const allInGroupSelected = tasks.every(t => selected.includes(t.name));
          const toggleGroupAll = () => {
            const names = tasks.map(t => t.name);
            onChange(allInGroupSelected ? selected.filter(s => !names.includes(s)) : Array.from(new Set([...selected, ...names])));
          };
          return (
            <div key={category} className={`rounded-xl border-2 overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className={`flex items-center justify-between px-3 py-2 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <button type="button" onClick={() => toggleCollapsed(category)} className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{category}</span>
                  <span className={`text-[9px] font-bold shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({tasks.length})</span>
                  <ChevronDown size={13} className={`shrink-0 transition-transform ${isDark ? 'text-slate-500' : 'text-slate-400'} ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={toggleGroupAll}
                  className={`text-[8px] font-black uppercase tracking-wider shrink-0 ml-2 ${isDark ? 'text-brand-yellow hover:text-yellow-300' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  {allInGroupSelected ? 'Clear' : 'Select All'}
                </button>
              </div>
              {!isCollapsed && (
                <div className="p-2 space-y-1.5">
                  {tasks.map(t => {
                    const isSel = selected.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggle(t.name)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${isSel
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : (isDark ? 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300')}`}
                      >
                        <span className="text-[10px] font-bold uppercase truncate">{t.name}</span>
                        {isSel && <CheckCircle2 size={14} className="shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && globalTasks.length > 0 && (
          <p className={`text-center text-[10px] font-bold uppercase py-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No tasks match "{query}"</p>
        )}
        {globalTasks.length === 0 && (
          <p className={`text-center text-[10px] font-bold uppercase py-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No tasks yet &mdash; add one below.</p>
        )}
      </div>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTaskName}
          onChange={e => setNewTaskName(e.target.value)}
          placeholder="+ Add new task..."
          className={`flex-1 min-w-0 rounded-xl px-3 py-2 text-xs font-bold outline-none border-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'}`}
        />
        <select
          value={newTaskCategory}
          onChange={e => setNewTaskCategory(e.target.value)}
          className={`shrink-0 rounded-xl px-2 py-2 text-[9px] font-black uppercase tracking-wider outline-none border-2 cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
        >
          {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          type="submit"
          disabled={isAdding || !newTaskName.trim()}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider disabled:opacity-40 transition-all ${isDark ? 'bg-brand-yellow text-slate-900 hover:bg-yellow-400' : 'bg-slate-900 text-white hover:bg-black'}`}
        >
          <Plus size={12} /> Add
        </button>
      </form>
    </div>
  );
}
