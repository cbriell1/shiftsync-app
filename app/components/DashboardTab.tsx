// filepath: app/components/DashboardTab.tsx
"use client";
import React, { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDateSafe, generatePeriods } from '@/lib/common';

export default function DashboardTab({ appState }: any) {
  // Store Subscriptions
  const managerData = useAppStore(state => state.managerData);
  const locations = useAppStore(state => state.locations);
  const users = useAppStore(state => state.users);
  
  const manPeriods = useAppStore(state => state.manPeriods);
  const manLocs = useAppStore(state => state.manLocs);
  const manEmps = useAppStore(state => state.manEmps);
  const setManPeriods = useAppStore(state => state.setManPeriods);
  const setManLocs = useAppStore(state => state.setManLocs);
  const setManEmps = useAppStore(state => state.setManEmps);
  const selectedUserId = useAppStore(state => state.selectedUserId);

  // Compute Roles
  const activeUser = users.find(u => u.id.toString() === selectedUserId);
  const isAdmin = activeUser?.systemRoles?.includes('Administrator');
  const isManager = activeUser?.systemRoles?.includes('Manager') || isAdmin;
  
  const allowedLocationIds = activeUser?.locationIds?.map(id => typeof id === 'string' ? parseInt(id, 10) : id) ||[];
  const visibleLocations = isAdmin 
    ? locations 
    : locations.filter(loc => allowedLocationIds.includes(loc.id));

  // Filter Toggles
  const toggleManPeriod = (idx: number) => manPeriods.includes(idx) ? setManPeriods(manPeriods.filter(x => x !== idx)) : setManPeriods([...manPeriods, idx]);
  const toggleManLoc = (id: number) => manLocs.includes(id) ? setManLocs(manLocs.filter(x => x !== id)) : setManLocs([...manLocs, id]);
  const toggleManEmp = (id: number) => manEmps.includes(id) ? setManEmps(manEmps.filter(x => x !== id)) : setManEmps([...manEmps, id]);

  const periods = useMemo(() => generatePeriods(),[]);

  // Complex Computations (Isolated here)
  const { matrixRows, hiddenWarnings, activeManPeriods } = useMemo(() => {
    const activePeriods = manPeriods.map(idx => periods[idx]);
    const matrixMap = new Map();
    const hiddenMap = new Map();

    (Array.isArray(managerData) ? managerData :[]).forEach(card => {
      if (!visibleLocations.some(l => l.id === card.locationId)) return;
      if (manLocs.length > 0 && !manLocs.includes(card.locationId)) {
        if (!hiddenMap.has(card.user?.name)) hiddenMap.set(card.user?.name, new Set());
        hiddenMap.get(card.user?.name).add(card.location?.name); 
        return;
      }
      const key = `${card.locationId}_${card.userId}`;
      if (!matrixMap.has(key)) matrixMap.set(key, { locName: card.location?.name, empName: card.user?.name, periodTotals: new Map(), totalRowHours: 0 });
      const row = matrixMap.get(key);
      
      activePeriods.forEach(p => {
        const cDate = new Date(card.clockIn); 
        if (cDate >= new Date(p.start) && cDate <= new Date(new Date(p.end).setHours(23,59,59))) {
          row.periodTotals.set(p.label, (row.periodTotals.get(p.label) || 0) + (card.totalHours || 0));
          row.totalRowHours += (card.totalHours || 0);
        }
      });
    });

    return {
      activeManPeriods: activePeriods,
      matrixRows: Array.from(matrixMap.values()),
      hiddenWarnings: Array.from(hiddenMap.entries()).map(([k, v]) => `${k} (${Array.from(v).join(', ')})`)
    };
  }, [managerData, manPeriods, periods, visibleLocations, manLocs]);

  const suspiciousCards = useMemo(() => {
    return managerData.filter(c => c.totalHours && (c.totalHours > 10 || c.totalHours < 1));
  }, [managerData]);

  // Actions
  const handleExportCSV = () => { 
    let csv = "Pay Period,Location,Employee,Hours\n"; 
    matrixRows.forEach((row: any) => { 
      activeManPeriods.forEach((p: any) => { 
        const h = row.periodTotals.get(p.label); 
        if (h > 0) csv += `"${p.label}","${row.locName}","${row.empName}",${h.toFixed(2)}\n`; 
      }); 
    }); 
    const blob = new Blob([csv], { type: 'text/csv' }); 
    const url = URL.createObjectURL(blob); 
    const link = document.createElement("a"); 
    link.href = url; 
    link.download = "Payroll.csv"; 
    link.click(); 
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-300 shadow-md animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <h2 className="text-lg md:text-xl font-black text-slate-900 text-center md:text-left">
          {isManager ? 'Payroll Dashboard' : 'My Payroll Summary'}
        </h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          {isManager && (
            <button 
              onClick={handleExportCSV} 
              className="w-full sm:w-auto bg-green-800 hover:bg-green-900 text-white text-sm font-bold py-2.5 px-5 rounded-lg shadow-sm transition"
            >
              Export Matrix CSV
            </button>
          )}
        </div>
      </div>

      {suspiciousCards.length > 0 && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-600 p-4 md:p-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="w-full">
              <h3 className="text-sm md:text-base font-black text-red-900 mb-1">
                {isManager ? "SUSPICIOUS SHIFTS DETECTED" : "PLEASE REVIEW THESE SHIFTS"}
              </h3>
              <p className="text-xs md:text-sm text-red-800 font-bold mb-3">
                {isManager 
                  ? "The following shifts are unusually long (>10 hrs) or short (<1 hr) and require your attention:"
                  : "You have shifts that are unusually long (>10 hrs) or short (<1 hr). Please contact your manager to edit these if they are incorrect:"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {suspiciousCards.map((warn, i) => (
                  <div key={i} className="bg-white border border-red-200 p-2.5 rounded-lg shadow-sm text-xs font-bold text-slate-800 flex justify-between items-center">
                    <span className="truncate pr-2">{formatDateSafe(warn.clockIn)} | {warn.user?.name}</span>
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded shadow-inner border border-red-100 whitespace-nowrap">
                      {warn.totalHours?.toFixed(2)} hrs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isManager && hiddenWarnings.length > 0 && (
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-500 p-4 md:p-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="w-full">
              <h3 className="text-sm md:text-base font-black text-yellow-800 mb-1">Warning: Hidden Floating Hours!</h3>
              <p className="text-xs md:text-sm text-yellow-700 font-bold mb-3">
                The following employees worked at locations you currently have unchecked. Their Dashboard Totals below do <span className="underline font-black">NOT</span> include these hours:
              </p>
              <ul className="list-disc pl-5 text-sm font-black text-yellow-900 space-y-1">
                {hiddenWarnings.map((warn: string, i: number) => <li key={i}>{warn}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-lg font-black text-slate-900 mb-3">Matrix Filters</h3>
      <div className={`grid grid-cols-1 ${isManager ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 md:gap-6 mb-8 bg-slate-50 p-4 rounded-xl border border-gray-200 shadow-inner`}>
        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-800 mb-2">Pay Periods</label>
          <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
            {periods.map((p, i) => (
              <label key={i} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                <input type="checkbox" checked={manPeriods.includes(i)} onChange={() => toggleManPeriod(i)} className="w-5 h-5 md:w-4 md:h-4 text-orange-500 rounded border-gray-400 cursor-pointer" />
                <span className="text-xs md:text-sm font-bold text-slate-900">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-800 mb-2">Locations</label>
          <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
            {locations.map(loc => (
              <label key={loc.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                <input type="checkbox" checked={manLocs.includes(loc.id)} onChange={() => toggleManLoc(loc.id)} className="w-5 h-5 md:w-4 md:h-4 text-orange-500 rounded border-gray-400 cursor-pointer" />
                <span className="text-xs md:text-sm font-bold text-slate-900">
                  {loc.name} {loc.isActive === false && <span className="text-red-500 text-[10px] uppercase">(Archived)</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        {isManager && (
          <div>
            <label className="block text-xs md:text-sm font-bold text-slate-800 mb-2">Employees</label>
            <div className="border border-gray-400 rounded-lg p-2 md:p-3 h-32 md:h-40 overflow-y-auto bg-white flex flex-col gap-2 shadow-sm">
              {users.map(u => (
                <label key={u.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input type="checkbox" checked={manEmps.includes(u.id)} onChange={() => toggleManEmp(u.id)} className="w-5 h-5 md:w-4 md:h-4 text-orange-500 rounded border-gray-400 cursor-pointer" />
                  <span className="text-xs md:text-sm font-bold text-slate-900">
                    <span className={u.isActive === false ? "line-through text-slate-400" : ""}>{u.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <h3 className="text-lg font-black text-slate-900 mb-3">Hours Matrix</h3>
      <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm mb-10">
        <table className="w-full text-left text-sm" style={{ minWidth: '700px' }}>
          <thead className="bg-slate-100 border-b border-gray-300 text-slate-800">
            <tr>
              <th className="p-3 font-black text-slate-900 border-r border-gray-300">Location</th>
              <th className="p-3 font-black text-slate-900 border-r border-gray-300">Employee</th>
              {activeManPeriods.map((p: any) => <th key={p.label} className="p-3 font-black text-slate-900 border-r border-gray-300 text-center">{p.label}</th>)}
              <th className="p-3 font-black text-blue-900 bg-blue-100 text-center border-l border-blue-300">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.length === 0 ? (
              <tr><td colSpan={10} className="p-6 text-center font-bold text-slate-500 italic bg-white">No data match.</td></tr>
            ) : (
              matrixRows.map((row, idx) => {
                const locObj = locations.find(l => l.name === row.locName);
                const isArchivedLoc = locObj && locObj.isActive === false;

                const empObj = users.find(u => u.name === row.empName);
                const isArchivedEmp = empObj && empObj.isActive === false;

                return (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-slate-50 transition whitespace-nowrap">
                    <td className="p-3 font-bold text-gray-700 border-r border-gray-200">
                      {row.locName} {isArchivedLoc && <span className="text-[10px] text-red-500 uppercase tracking-widest block">Archived</span>}
                    </td>
                    <td className="p-3 font-black text-slate-900 border-r border-gray-200">
                      {row.empName} {isArchivedEmp && <span className="text-[10px] text-red-500 uppercase tracking-widest block">Archived Staff</span>}
                    </td>
                    {activeManPeriods.map((p: any) => {
                      const val = row.periodTotals.get(p.label);
                      return (
                        <td key={p.label} className={`p-3 font-bold text-center border-r border-gray-200 ${val > 0 ? 'text-green-800 bg-green-50' : 'text-gray-400'}`}>
                          {val > 0 ? val.toFixed(2) + 'h' : '-'}
                        </td>
                      );
                    })}
                    <td className="p-3 font-black text-blue-900 bg-blue-50 text-center border-l-2 border-blue-200">{row.totalRowHours.toFixed(2)}h</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}