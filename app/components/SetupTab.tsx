"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Location, GlobalTask } from '../lib/types';

export default function SetupTab({ appState }: { appState: AppState }) {
  const [activeTab, setActiveTab] = useState('templates');
  const[showLocFilter, setShowLocFilter] = useState(false);
  const [showDayFilter, setShowDayFilter] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({ key: 'location', direction: 'asc' });

  const locFilterRef = useRef<HTMLTableHeaderCellElement>(null);
  const dayFilterRef = useRef<HTMLTableHeaderCellElement>(null);

  const {
    editingTplId, locations, tplLocs, toggleTplLoc, DAYS_OF_WEEK, tplDays, toggleTplDay, 
    tplStart, setTplStart, tplEnd, setTplEnd, tplStartDate, setTplStartDate,
    tplEndDate, setTplEndDate, setEditingTplId, setTplLocs, setTplDays,
    setTplTasks, tplViewLocs, toggleTplViewLoc, tplViewDays, toggleTplViewDay,
    setTplViewLocs, setTplViewDays, filteredTemplates, handleEditTemplate, 
    handleDeleteTemplate, users, globalTasks, tplTasks, toggleTplTask, 
    handleSaveTemplate, newTaskStr, setNewTaskStr, tplUserId, setTplUserId,
    handleAddMasterTask, handleDeleteMasterTask
  } = appState;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locFilterRef.current && !locFilterRef.current.contains(event.target as Node)) {
        setShowLocFilter(false);
      }
      if (dayFilterRef.current && !dayFilterRef.current.contains(event.target as Node)) {
        setShowDayFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  },[]);

  const handleSelectAllTasks = () => {
    if (globalTasks.length > 0 && tplTasks.length === globalTasks.length) {
      setTplTasks([]);
    } else {
      setTplTasks(globalTasks.map((t: GlobalTask) => t.name));
    }
  };

  const formatDateForTable = (isoString?: string | null) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedTemplates = [...(filteredTemplates || [])].sort((a, b) => {
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    const locA = a.location?.name || '';
    const locB = b.location?.name || '';
    const dayA = a.dayOfWeek ?? -1;
    const dayB = b.dayOfWeek ?? -1;
    const timeA = a.startTime || '';
    const timeB = b.startTime || '';

    if (sortConfig.key === 'location' && locA !== locB) return locA.localeCompare(locB) * dir;
    if (sortConfig.key === 'dayOfWeek' && dayA !== dayB) return (dayA - dayB) * dir;
    if (sortConfig.key === 'startTime' && timeA !== timeB) return timeA.localeCompare(timeB) * dir;

    if (sortConfig.key !== 'location' && locA !== locB) return locA.localeCompare(locB);
    if (sortConfig.key !== 'dayOfWeek' && dayA !== dayB) return dayA - dayB;
    if (sortConfig.key !== 'startTime' && timeA !== timeB) return timeA.localeCompare(timeB);

    return 0;
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-md">
      
      {/* Sub-Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-6 font-black text-sm outline-none transition-colors border-b-2 ${
            activeTab === 'templates' 
              ? 'border-blue-600 text-blue-800' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-400'
          }`}
        >
          Shift Templates
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-2 px-6 font-black text-sm outline-none transition-colors border-b-2 ${
            activeTab === 'tasks' 
              ? 'border-blue-600 text-blue-800' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-400'
          }`}
        >
          Facility Master Tasks
        </button>
      </div>

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: FORM */}
          <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-300 shadow-inner">
            <form onSubmit={handleSaveTemplate} className="space-y-5">
              
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">1. Pre-Assign Employee</label>
                <select 
                  value={tplUserId || ''} 
                  onChange={(e) => setTplUserId(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm bg-white text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                >
                  <option value="" className="text-slate-600 font-bold">-- Unassigned --</option>
                  {users?.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">2. Locations</label>
                <div className="max-h-32 overflow-y-auto bg-white p-2 border-2 border-slate-300 rounded-lg shadow-sm space-y-1">
                  {locations?.map((loc: Location) => (
                    <label key={loc.id} className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-slate-50 p-1.5 rounded">
                      <input 
                        type="checkbox" 
                        checked={tplLocs?.includes(loc.id) || false} 
                        onChange={() => toggleTplLoc(loc.id)} 
                        className="w-4 h-4 text-blue-600 rounded border-slate-400"
                      />
                      <span className="text-slate-900 font-bold">{loc.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">3. Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK?.map((day, idx) => (
                    <label key={day} className="flex items-center space-x-1 cursor-pointer text-sm bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        checked={tplDays?.includes(idx) || false} 
                        onChange={() => toggleTplDay(idx)} 
                        className="w-4 h-4 text-blue-600 rounded border-slate-400"
                      />
                      <span className="text-slate-900 font-bold">{day.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">4. Start Time</label>
                  <input 
                    type="time" 
                    value={tplStart || ''} 
                    onChange={(e) => setTplStart(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">End Time</label>
                  <input 
                    type="time" 
                    value={tplEnd || ''} 
                    onChange={(e) => setTplEnd(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">
                    5. Start Date 
                    <span className="block font-bold text-[11px] text-slate-600 mt-0.5">(Leave blank)</span>
                  </label>
                  <input 
                    type="date" 
                    value={tplStartDate || ''} 
                    onChange={(e) => setTplStartDate(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-black text-slate-900 mb-1.5 leading-tight">
                    End Date 
                    <span className="block font-bold text-[11px] text-slate-600 mt-0.5">(Leave blank)</span>
                  </label>
                  <input 
                    type="date" 
                    value={tplEndDate || ''} 
                    onChange={(e) => setTplEndDate(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-black text-slate-900">6. Checklist Tasks</label>
                  <button 
                    type="button" 
                    onClick={handleSelectAllTasks}
                    className="text-xs font-black text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {globalTasks?.length > 0 && tplTasks?.length === globalTasks?.length 
                      ? 'Deselect All' 
                      : 'Select All'}
                  </button>
                </div>
                
                <div className="max-h-40 overflow-y-auto bg-white p-2 rounded-lg border-2 border-slate-300 shadow-sm space-y-1">
                  {globalTasks?.map((task: GlobalTask) => (
                    <label key={task.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded">
                      <input 
                        type="checkbox" 
                        checked={tplTasks?.includes(task.name) || false} 
                        onChange={() => toggleTplTask(task.name)} 
                        className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-blue-500" 
                      />
                      <span className="text-xs font-bold text-slate-900">{task.name}</span>
                    </label>
                  ))}
                  {globalTasks?.length === 0 && (
                    <div className="text-xs text-slate-600 italic font-bold p-2">No tasks available. Add them in the Master Tasks tab.</div>
                  )}
                </div>
              </div>
              
              <button type="submit" className="w-full bg-green-800 text-white font-black py-3.5 rounded-lg hover:bg-green-900 transition shadow-lg mt-2">
                {editingTplId ? 'Update Template' : 'Save Templates'}
              </button>

              {editingTplId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingTplId(null);
                    setTplLocs([]);
                    setTplDays([]);
                    setTplTasks([]);
                    setTplStart('');
                    setTplEnd('');
                    setTplUserId('');
                    setTplStartDate('');
                    setTplEndDate('');
                  }}
                  className="w-full bg-slate-700 text-white font-black py-2.5 rounded-lg hover:bg-slate-800 transition shadow mt-2"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* COLUMN 2: TEMPLATES TABLE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm overflow-hidden h-full flex flex-col">
              <h3 className="font-black text-slate-900 mb-4 text-xl border-b-2 border-slate-100 pb-2">Saved Templates</h3>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[300px] max-h-[800px] pb-32">
                <table className="w-full text-left text-sm text-slate-800 relative">
                  <thead className="bg-slate-200 text-slate-900 text-xs uppercase font-black sticky top-0 z-40 shadow-sm">
                    <tr>
                      
                      <th className="p-3 relative select-none" ref={locFilterRef}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex items-center gap-1 cursor-pointer hover:text-blue-800 transition-colors"
                            onClick={() => handleSort('location')}
                            title="Sort by Location"
                          >
                            LOCATION
                            {sortConfig.key === 'location' && (
                              <span className="text-blue-700 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                          <div 
                            className={`flex items-center justify-center cursor-pointer px-1.5 py-0.5 rounded transition-colors ${tplViewLocs?.length > 0 ? 'bg-blue-300 text-blue-900' : 'hover:bg-slate-300 text-slate-600 hover:text-blue-800'}`}
                            onClick={() => setShowLocFilter(!showLocFilter)}
                            title="Filter Locations"
                          >
                            {tplViewLocs?.length > 0 ? (
                              <span className="text-[10px] font-black">{tplViewLocs.length}</span>
                            ) : (
                              <span className="text-[10px]">⧨</span>
                            )}
                          </div>
                        </div>
                        
                        {showLocFilter && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white border-2 border-slate-300 rounded-lg shadow-2xl p-2 font-normal normal-case text-sm text-slate-900 flex flex-col z-[100]">
                            <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                              {locations?.map((loc: Location) => (
                                <label key={loc.id} className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                                  <input 
                                    type="checkbox" 
                                    checked={tplViewLocs?.includes(loc.id) || false} 
                                    onChange={() => toggleTplViewLoc(loc.id)} 
                                    className="w-4 h-4 text-blue-600 rounded border-slate-400"
                                  />
                                  <span className="truncate font-bold">{loc.name}</span>
                                </label>
                              ))}
                            </div>
                            {tplViewLocs?.length > 0 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTplViewLocs([]); setShowLocFilter(false); }}
                                className="text-xs font-black text-red-700 border-t border-slate-200 pt-2 pb-1 hover:text-red-900 transition-colors"
                              >
                                Clear Selection
                              </button>
                            )}
                          </div>
                        )}
                      </th>

                      <th className="p-3 relative select-none" ref={dayFilterRef}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex items-center gap-1 cursor-pointer hover:text-blue-800 transition-colors"
                            onClick={() => handleSort('dayOfWeek')}
                            title="Sort by Day"
                          >
                            DAYS
                            {sortConfig.key === 'dayOfWeek' && (
                              <span className="text-blue-700 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                          <div 
                            className={`flex items-center justify-center cursor-pointer px-1.5 py-0.5 rounded transition-colors ${tplViewDays?.length > 0 ? 'bg-blue-300 text-blue-900' : 'hover:bg-slate-300 text-slate-600 hover:text-blue-800'}`}
                            onClick={() => setShowDayFilter(!showDayFilter)}
                            title="Filter Days"
                          >
                            {tplViewDays?.length > 0 ? (
                              <span className="text-[10px] font-black">{tplViewDays.length}</span>
                            ) : (
                              <span className="text-[10px]">⧨</span>
                            )}
                          </div>
                        </div>

                        {showDayFilter && (
                          <div className="absolute top-full left-0 mt-1 w-32 bg-white border-2 border-slate-300 rounded-lg shadow-2xl p-2 font-normal normal-case text-sm text-slate-900 flex flex-col z-[100]">
                            <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                              {DAYS_OF_WEEK?.map((day, idx) => (
                                <label key={day} className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                                  <input 
                                    type="checkbox" 
                                    checked={tplViewDays?.includes(idx) || false} 
                                    onChange={() => toggleTplViewDay(idx)} 
                                    className="w-4 h-4 text-blue-600 rounded border-slate-400"
                                  />
                                  <span className="font-bold">{day.substring(0, 3)}</span>
                                </label>
                              ))}
                            </div>
                            {tplViewDays?.length > 0 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTplViewDays([]); setShowDayFilter(false); }}
                                className="text-xs font-black text-red-700 border-t border-slate-200 pt-2 pb-1 hover:text-red-900 transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </th>

                      <th className="p-3 select-none">
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:text-blue-800 transition-colors w-max"
                          onClick={() => handleSort('startTime')}
                        >
                          TIME
                          {sortConfig.key === 'startTime' && (
                            <span className="text-blue-700 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>

                      <th className="p-3">Dates</th>
                      <th className="p-3">Tasks</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTemplates?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-600 font-bold italic bg-slate-50/80">
                          {tplViewLocs.length > 0 || tplViewDays.length > 0 
                            ? "No templates match your active filters." 
                            : "No templates found. Create one using the form on the left."}
                        </td>
                      </tr>
                    ) : (
                      sortedTemplates?.map((tpl) => {
                        const hasDates = tpl.startDate || tpl.endDate;
                        return (
                          <tr key={tpl.id} className="border-b border-slate-200 hover:bg-slate-100 transition-colors">
                            <td className="p-3 font-bold max-w-[120px] truncate" title={tpl.location?.name}>
                              {tpl.location?.name || 'Unknown Location'}
                            </td>
                            <td className="p-3 font-bold">
                              {DAYS_OF_WEEK[tpl.dayOfWeek]?.substring(0, 3) || 'N/A'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-black text-slate-900">{tpl.startTime} - {tpl.endTime}</span>
                            </td>
                            <td className="p-3 font-bold whitespace-nowrap">
                              {!hasDates ? (
                                <span className="text-green-800">Always</span>
                              ) : (
                                <span className="text-slate-800">{formatDateForTable(tpl.startDate) || 'Always'} to {formatDateForTable(tpl.endDate) || 'Always'}</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-slate-700 max-w-[100px] truncate" title={tpl.checklistTasks?.join(', ')}>
                              {tpl.checklistTasks?.length || 0} tasks
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <button 
                                type="button"
                                onClick={() => {
                                  handleEditTemplate({
                                    ...tpl,
                                    dayOfWeek: tpl.dayOfWeek,
                                    startDate: tpl.startDate ? tpl.startDate.split('T')[0] : '',
                                    endDate: tpl.endDate ? tpl.endDate.split('T')[0] : ''
                                  });
                                }} 
                                className="text-blue-700 hover:text-blue-900 hover:underline mr-4 font-black transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id)} 
                                className="text-red-700 hover:text-red-900 hover:underline font-black transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW 2: FACILITY MASTER TASKS --- */}
      {activeTab === 'tasks' && (
        <div className="max-w-4xl mx-auto space-y-6 mt-4">
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-800">
            <h3 className="font-black text-xl uppercase tracking-widest mb-1 text-yellow-400">
              Facility Master Tasks
            </h3>
            <p className="text-sm text-slate-300 mb-8 font-bold leading-relaxed">
              Create and manage tasks globally. Tasks added here will be available to select when creating new Shift Templates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <input 
                value={newTaskStr || ''}
                onChange={(e) => setNewTaskStr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newTaskStr?.trim() && handleAddMasterTask) handleAddMasterTask();
                  }
                }}
                className="flex-grow bg-slate-800 border-2 border-slate-700 rounded-xl px-5 py-3.5 text-base font-bold text-white focus:outline-none focus:border-yellow-500 placeholder-slate-400 transition-colors" 
                placeholder="Type a new task and press Enter..." 
              />
              <button 
                type="button"
                onClick={() => handleAddMasterTask && handleAddMasterTask()} 
                disabled={!newTaskStr?.trim()}
                className="bg-yellow-500 text-slate-900 font-black px-8 py-3.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 transition shadow-lg"
              >
                ADD TASK
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] pr-2">
              {globalTasks?.map((task: GlobalTask) => (
                <div 
                  key={task.id} 
                  className="bg-slate-800 border-2 border-slate-700 hover:border-slate-500 transition-colors rounded-xl px-5 py-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <span className="text-sm font-bold text-slate-100 truncate" title={task.name}>{task.name}</span>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteMasterTask && handleDeleteMasterTask(task.id)} 
                    className="text-red-400 hover:text-red-300 font-black text-2xl leading-none px-2 focus:outline-none transition-colors"
                    title="Delete Task"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {globalTasks?.length === 0 && (
                <div className="col-span-full text-slate-400 font-bold italic py-8 text-center bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                  No master tasks created yet.
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}