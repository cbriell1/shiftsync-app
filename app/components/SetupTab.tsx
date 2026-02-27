"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function SetupTab({ appState }) {
  // State to control the sub-tabs ("templates" vs "tasks")
  const[activeTab, setActiveTab] = useState('templates');

  // Filter Dropdown States
  const[showLocFilter, setShowLocFilter] = useState(false);
  const[showDayFilter, setShowDayFilter] = useState(false);

  // Sorting State (Smart Cascading Sort)
  const[sortConfig, setSortConfig] = useState({ key: 'location', direction: 'asc' });

  // Click-outside references for the dropdowns
  const locFilterRef = useRef(null);
  const dayFilterRef = useRef(null);

  const {
    editingTplId, locations, tplLocs, toggleTplLoc,
    DAYS_OF_WEEK, tplDays, toggleTplDay, tplStart, setTplStart,
    tplEnd, setTplEnd, tplStartDate, setTplStartDate,
    tplEndDate, setTplEndDate, setEditingTplId, setTplLocs, setTplDays,
    setTplTasks, tplViewLocs, toggleTplViewLoc, tplViewDays, toggleTplViewDay,
    setTplViewLocs, setTplViewDays, // Used for clearing filters
    filteredTemplates, handleEditTemplate, handleDeleteTemplate, users,
    globalTasks, fetchGlobalTasks, tplTasks, toggleTplTask, handleSaveTemplate,
    newTaskStr, setNewTaskStr, tplUserId, setTplUserId,
    handleAddMasterTask, handleDeleteMasterTask
  } = appState;

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locFilterRef.current && !locFilterRef.current.contains(event.target)) {
        setShowLocFilter(false);
      }
      if (dayFilterRef.current && !dayFilterRef.current.contains(event.target)) {
        setShowDayFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  },[]);

  // Optimized Select All Logic
  const handleSelectAllTasks = () => {
    if (globalTasks?.length > 0 && tplTasks?.length === globalTasks?.length) {
      setTplTasks([]); // Unselect all
    } else {
      setTplTasks(globalTasks?.map((t) => t.name) ||[]); // Select all
    }
  };

  // Helper to cleanly format ISO dates for the table display
  const formatDateForTable = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to format dates for the HTML <input type="date"> which expects YYYY-MM-DD
  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
  };

  // Handle Header Click for Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply Smart Cascading Sort
  const sortedTemplates = [...(filteredTemplates || [])].sort((a, b) => {
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    
    const locA = a.location?.name || '';
    const locB = b.location?.name || '';
    const dayA = a.dayOfWeek ?? -1;
    const dayB = b.dayOfWeek ?? -1;
    const timeA = a.startTime || '';
    const timeB = b.startTime || '';

    // Primary Sort
    if (sortConfig.key === 'location' && locA !== locB) return locA.localeCompare(locB) * dir;
    if (sortConfig.key === 'dayOfWeek' && dayA !== dayB) return (dayA - dayB) * dir;
    if (sortConfig.key === 'startTime' && timeA !== timeB) return timeA.localeCompare(timeB) * dir;

    // Secondary & Tertiary Fallback Sorts (creates the "multiple" sorting effect seamlessly)
    if (sortConfig.key !== 'location' && locA !== locB) return locA.localeCompare(locB);
    if (sortConfig.key !== 'dayOfWeek' && dayA !== dayB) return dayA - dayB;
    if (sortConfig.key !== 'startTime' && timeA !== timeB) return timeA.localeCompare(timeB);

    return 0;
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-md">
      
      {/* --- SUB-TAB NAVIGATION --- */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-6 font-bold text-sm outline-none transition-colors border-b-2 ${
            activeTab === 'templates' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Shift Templates
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-2 px-6 font-bold text-sm outline-none transition-colors border-b-2 ${
            activeTab === 'tasks' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Facility Master Tasks
        </button>
      </div>

      {/* --- VIEW 1: SHIFT TEMPLATES --- */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: COMPACT FORM */}
          <div className="lg:col-span-1 bg-slate-50 p-4 rounded-xl border shadow-inner">
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              
              {/* 1. Pre-Assign Employee */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">1. Pre-Assign Employee</label>
                <select 
                  value={tplUserId || ''} 
                  onChange={(e) => setTplUserId(e.target.value)}
                  className="w-full border border-gray-400 rounded p-2 text-sm bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="" className="text-gray-500 font-normal">-- Unassigned --</option>
                  {users?.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Locations */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">2. Locations</label>
                <div className="max-h-32 overflow-y-auto bg-white p-2 border border-gray-300 rounded shadow-sm space-y-1">
                  {locations?.map(loc => (
                    <label key={loc.id} className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={tplLocs?.includes(loc.id) || false} 
                        onChange={() => toggleTplLoc(loc.id)} 
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-slate-800">{loc.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Days of Week */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">3. Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK?.map(day => (
                    <label key={day} className="flex items-center space-x-1 cursor-pointer text-sm bg-white border border-gray-300 px-2 py-1 rounded shadow-sm hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        checked={tplDays?.includes(day) || false} 
                        onChange={() => toggleTplDay(day)} 
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-slate-800">{day.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Times - items-end ensures horizontal alignment if labels ever wrap */}
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-bold text-slate-700 mb-1 leading-tight">4. Start Time</label>
                  <input 
                    type="time" 
                    value={tplStart || ''} 
                    onChange={(e) => setTplStart(e.target.value)}
                    className="w-full border border-gray-400 rounded p-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-bold text-slate-700 mb-1 leading-tight">End Time</label>
                  <input 
                    type="time" 
                    value={tplEnd || ''} 
                    onChange={(e) => setTplEnd(e.target.value)}
                    className="w-full border border-gray-400 rounded p-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 5. Effective Dates - items-end + block spans ensure perfect horizontal alignment */}
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-bold text-slate-700 mb-1 leading-tight">
                    5. Start Date 
                    <span className="block font-normal text-[11px] text-gray-500 mt-0.5">(Leave blank)</span>
                  </label>
                  <input 
                    type="date" 
                    value={tplStartDate || ''} 
                    onChange={(e) => setTplStartDate(e.target.value)}
                    className="w-full border border-gray-400 rounded p-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end h-full">
                  <label className="block text-sm font-bold text-slate-700 mb-1 leading-tight">
                    End Date 
                    <span className="block font-normal text-[11px] text-gray-500 mt-0.5">(Leave blank)</span>
                  </label>
                  <input 
                    type="date" 
                    value={tplEndDate || ''} 
                    onChange={(e) => setTplEndDate(e.target.value)}
                    className="w-full border border-gray-400 rounded p-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 6. Checklist Tasks */}
              <div className="border-t border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700">6. Checklist Tasks</label>
                  <button 
                    type="button" 
                    onClick={handleSelectAllTasks}
                    className="text-xs font-black text-blue-700 hover:underline"
                  >
                    {globalTasks?.length > 0 && tplTasks?.length === globalTasks?.length 
                      ? 'Deselect All' 
                      : 'Select All'}
                  </button>
                </div>
                
                <div className="max-h-40 overflow-y-auto bg-white p-2 rounded border border-gray-300 shadow-sm space-y-1">
                  {globalTasks?.map((task) => (
                    <label key={task.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={tplTasks?.includes(task.name) || false} 
                        onChange={() => toggleTplTask(task.name)} 
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                      />
                      <span className="text-xs font-bold text-slate-800">{task.name}</span>
                    </label>
                  ))}
                  {globalTasks?.length === 0 && (
                    <div className="text-xs text-gray-500 italic">No tasks available. Add them in the Master Tasks tab.</div>
                  )}
                </div>
              </div>
              
              <button type="submit" className="w-full bg-green-800 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow">
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
                  className="w-full bg-gray-500 text-white font-bold py-2 rounded-lg hover:bg-gray-400 transition shadow mt-2"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* COLUMN 2: TEMPLATES TABLE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm overflow-hidden h-full flex flex-col">
              <h3 className="font-bold text-slate-700 mb-4 text-lg border-b pb-2">Saved Templates</h3>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[300px] max-h-[800px] pb-32">
                <table className="w-full text-left text-sm text-slate-600 relative">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-bold sticky top-0 z-40 shadow-sm">
                    <tr>
                      
                      {/* HEADER: LOCATION (Sort & Filter) */}
                      <th className="p-3 relative select-none" ref={locFilterRef}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleSort('location')}
                            title="Sort by Location"
                          >
                            LOCATION
                            {sortConfig.key === 'location' && (
                              <span className="text-blue-600 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                          <div 
                            className={`flex items-center justify-center cursor-pointer px-1.5 py-0.5 rounded transition-colors ${tplViewLocs?.length > 0 ? 'bg-blue-200 text-blue-800' : 'hover:bg-slate-200 text-slate-400 hover:text-blue-600'}`}
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
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 font-normal normal-case text-sm text-slate-800 flex flex-col z-[100]">
                            <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                              {locations?.map(loc => (
                                <label key={loc.id} className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                  <input 
                                    type="checkbox" 
                                    checked={tplViewLocs?.includes(loc.id) || false} 
                                    onChange={() => toggleTplViewLoc(loc.id)} 
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                  />
                                  <span className="truncate font-semibold">{loc.name}</span>
                                </label>
                              ))}
                            </div>
                            {tplViewLocs?.length > 0 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTplViewLocs([]); setShowLocFilter(false); }}
                                className="text-xs font-bold text-red-600 border-t border-slate-100 pt-2 pb-1 hover:text-red-800 transition-colors"
                              >
                                Clear Selection
                              </button>
                            )}
                          </div>
                        )}
                      </th>

                      {/* HEADER: DAYS (Sort & Filter) */}
                      <th className="p-3 relative select-none" ref={dayFilterRef}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleSort('dayOfWeek')}
                            title="Sort by Day"
                          >
                            DAYS
                            {sortConfig.key === 'dayOfWeek' && (
                              <span className="text-blue-600 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                          <div 
                            className={`flex items-center justify-center cursor-pointer px-1.5 py-0.5 rounded transition-colors ${tplViewDays?.length > 0 ? 'bg-blue-200 text-blue-800' : 'hover:bg-slate-200 text-slate-400 hover:text-blue-600'}`}
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
                          <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 font-normal normal-case text-sm text-slate-800 flex flex-col z-[100]">
                            <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                              {DAYS_OF_WEEK?.map((day, idx) => (
                                <label key={day} className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                  <input 
                                    type="checkbox" 
                                    checked={tplViewDays?.includes(idx) || false} 
                                    onChange={() => toggleTplViewDay(idx)} 
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                  />
                                  <span className="font-semibold">{day.substring(0, 3)}</span>
                                </label>
                              ))}
                            </div>
                            {tplViewDays?.length > 0 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTplViewDays([]); setShowDayFilter(false); }}
                                className="text-xs font-bold text-red-600 border-t border-slate-100 pt-2 pb-1 hover:text-red-800 transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </th>

                      {/* HEADER: TIME (Sort Only) */}
                      <th className="p-3 select-none">
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors w-max"
                          onClick={() => handleSort('startTime')}
                          title="Sort by Time"
                        >
                          TIME
                          {sortConfig.key === 'startTime' && (
                            <span className="text-blue-600 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
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
                        <td colSpan="6" className="p-8 text-center text-gray-500 italic bg-slate-50/50">
                          {tplViewLocs.length > 0 || tplViewDays.length > 0 
                            ? "No templates match your active filters." 
                            : "No templates found. Create one using the form on the left."}
                        </td>
                      </tr>
                    ) : (
                      sortedTemplates?.map((tpl) => {
                        const hasDates = tpl.startDate || tpl.endDate;
                        return (
                          <tr key={tpl.id} className="border-b border-gray-200 hover:bg-slate-50 transition-colors">
                            {/* Access Prisma location relation properly */}
                            <td className="p-3 max-w-[120px] truncate" title={tpl.location?.name}>
                              {tpl.location?.name || 'Unknown Location'}
                            </td>
                            {/* Convert Prisma integer day back to text string */}
                            <td className="p-3">
                              {DAYS_OF_WEEK[tpl.dayOfWeek]?.substring(0, 3) || 'N/A'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{tpl.startTime} - {tpl.endTime}</span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {!hasDates ? (
                                <span className="font-semibold text-green-700">Always</span>
                              ) : (
                                `${formatDateForTable(tpl.startDate) || 'Always'} to ${formatDateForTable(tpl.endDate) || 'Always'}`
                              )}
                            </td>
                            {/* Count checklist tasks accurately */}
                            <td className="p-3 max-w-[100px] truncate" title={tpl.checklistTasks?.join(', ')}>
                              {tpl.checklistTasks?.length || 0} tasks
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <button 
                                type="button"
                                onClick={() => {
                                  // Map database data back to the format the editing form expects
                                  handleEditTemplate({
                                    ...tpl,
                                    dayOfWeek: DAYS_OF_WEEK[tpl.dayOfWeek], 
                                    startDate: formatDateForInput(tpl.startDate),
                                    endDate: formatDateForInput(tpl.endDate)
                                  });
                                }} 
                                className="text-blue-600 hover:text-blue-800 hover:underline mr-4 font-bold transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id)} 
                                className="text-red-600 hover:text-red-800 hover:underline font-bold transition-colors"
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
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
            <h3 className="font-black text-lg uppercase tracking-widest mb-1 text-yellow-400">
              Facility Master Tasks
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Create and manage tasks globally. Tasks added here will be available to select when creating new Shift Templates.
            </p>
            
            {/* Task Input Bar */}
            <div className="flex gap-3 mb-8">
              <input 
                value={newTaskStr || ''}
                onChange={(e) => setNewTaskStr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newTaskStr?.trim()) handleAddMasterTask();
                  }
                }}
                className="flex-grow bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-slate-500" 
                placeholder="Type a new task and press Enter..." 
              />
              <button 
                type="button"
                onClick={handleAddMasterTask} 
                disabled={!newTaskStr?.trim()}
                className="bg-yellow-500 text-slate-900 font-black px-6 py-3 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 transition"
              >
                ADD TASK
              </button>
            </div>

            {/* Task List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] pr-2">
              {globalTasks?.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors rounded-lg px-4 py-3 flex items-center justify-between gap-2 shadow-sm"
                >
                  <span className="text-sm font-bold truncate" title={task.name}>{task.name}</span>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteMasterTask && handleDeleteMasterTask(task.id)} 
                    className="text-red-400 hover:text-red-200 font-bold text-xl leading-none px-2 focus:outline-none"
                    aria-label="Delete Task"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {globalTasks?.length === 0 && (
                <div className="col-span-full text-slate-500 italic py-4 text-center">
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