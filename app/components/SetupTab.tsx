"use client";
import React, { useState } from 'react';

export default function SetupTab({ appState }) {
  // State to control the sub-tabs ("templates" vs "tasks")
  const [activeTab, setActiveTab] = useState('templates');

  const {
    editingTplId, locations, tplLocs, toggleTplLoc,
    DAYS_OF_WEEK, tplDays, toggleTplDay, tplStart, setTplStart,
    tplEnd, setTplEnd, tplStartDate, setTplStartDate,
    tplEndDate, setTplEndDate, setEditingTplId, setTplLocs, setTplDays,
    setTplTasks, tplViewLocs, toggleTplViewLoc, tplViewDays, toggleTplViewDay,
    filteredTemplates, handleEditTemplate, handleDeleteTemplate, users,
    globalTasks, fetchGlobalTasks, tplTasks, toggleTplTask, handleSaveTemplate,
    newTaskStr, setNewTaskStr, tplUserId, setTplUserId,
    handleAddMasterTask, handleDeleteMasterTask
  } = appState;

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

              {/* 4. Times */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">4. Start Time</label>
                  <input 
                    type="time" 
                    value={tplStart || ''} 
                    onChange={(e) => setTplStart(e.target.value)}
                    className="w-full border border-gray-400 rounded p-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                  <input 
                    type="time" 
                    value={tplEnd || ''} 
                    onChange={(e) => setTplEnd(e.target.value)}
                    className="w-full border border-gray-400 rounded p-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 5. Effective Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    5. Start Date <span className="font-normal text-xs text-gray-500">(Leave blank for Always)</span>
                  </label>
                  <input 
                    type="date" 
                    value={tplStartDate || ''} 
                    onChange={(e) => setTplStartDate(e.target.value)}
                    className="w-full border border-gray-400 rounded p-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    End Date <span className="font-normal text-xs text-gray-500">(Leave blank for Always)</span>
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
            <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm overflow-hidden h-full">
              <h3 className="font-bold text-slate-700 mb-4 text-lg border-b pb-2">Saved Templates</h3>
              <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2">Location</th>
                      <th className="p-2">Days</th>
                      <th className="p-2">Time</th>
                      <th className="p-2">Dates</th>
                      <th className="p-2">Tasks</th>
                      <th className="p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500 italic">
                          No templates found. Create one using the form on the left.
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates?.map((tpl) => {
                        const hasDates = tpl.startDate || tpl.endDate;
                        return (
                          <tr key={tpl.id} className="border-b border-gray-200 hover:bg-slate-50">
                            {/* Access Prisma location relation properly */}
                            <td className="p-2 max-w-[120px] truncate" title={tpl.location?.name}>
                              {tpl.location?.name || 'Unknown Location'}
                            </td>
                            {/* Convert Prisma integer day back to text string */}
                            <td className="p-2">
                              {DAYS_OF_WEEK[tpl.dayOfWeek]?.substring(0, 3) || 'N/A'}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{tpl.startTime} - {tpl.endTime}</span>
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {!hasDates ? (
                                <span className="font-semibold text-green-700">Always</span>
                              ) : (
                                `${formatDateForTable(tpl.startDate) || 'Always'} to ${formatDateForTable(tpl.endDate) || 'Always'}`
                              )}
                            </td>
                            {/* Count checklist tasks accurately */}
                            <td className="p-2 max-w-[100px] truncate" title={tpl.checklistTasks?.join(', ')}>
                              {tpl.checklistTasks?.length || 0} tasks
                            </td>
                            <td className="p-2 text-center whitespace-nowrap">
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
                                className="text-blue-600 hover:underline mr-3 font-bold"
                              >
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id)} 
                                className="text-red-600 hover:underline font-bold"
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