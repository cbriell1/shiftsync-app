// filepath: app/components/ActiveSessionsTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { notify, customConfirm } from '@/lib/ui-utils';
import { ShieldAlert, Users, Search, History, Trash2, XCircle, AlertCircle, Terminal, Activity } from 'lucide-react';
import { AuditLog, ErrorLog } from '@/lib/types';

interface SessionInfo {
  sessionToken: string;
  userId: number;
  expires: string;
  user: {
    id: number;
    name: string;
    email: string;
  }
}

export default function ActiveSessionsTab() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [view, setView] = useState<'sessions' | 'audit' | 'errors'>('audit');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const timestamp = new Date().getTime();
      const [sessRes, auditRes, errorRes] = await Promise.all([
        fetch(`/api/admin/sessions?t=${timestamp}`),
        fetch(`/api/audit?t=${timestamp}`),
        fetch(`/api/audit?type=errors&t=${timestamp}`)
      ]);

      const [sessData, auditData, errorData] = await Promise.all([
        sessRes.json(),
        auditRes.json(),
        errorRes.json()
      ]);

      if (Array.isArray(sessData)) setSessions(sessData);
      if (Array.isArray(auditData)) setAuditLogs(auditData);
      if (Array.isArray(errorData)) setErrorLogs(errorData);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  },[]);

  const revokeSession = async (token: string, name: string) => {
    if (!(await customConfirm(`This will immediately boot ${name} to the login screen. Continue?`, "Force Logout", true))) return;

    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token })
      });

      if (res.ok) {
        notify.success(`Session for ${name} revoked.`);
        fetchData();
      }
    } catch (err) {
      notify.error("Failed to revoke session.");
    }
  };

  const filteredAudit = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-10 text-center font-black animate-pulse text-slate-400">ACCESSING ENCRYPTED LOGS...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden border-b-8 border-blue-600">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <div className="inline-block bg-blue-600 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest mb-3 shadow-lg">Administrator Only</div>
               <h2 className="text-4xl font-black italic sports-slant uppercase tracking-tighter">System Audit & Control</h2>
               <p className="text-slate-400 font-bold text-sm mt-1">Real-time oversight of all facility transactions and sessions.</p>
            </div>
            
            <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
               <button onClick={() => setView('audit')} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'audit' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-300 hover:text-white'}`}><History size={14} /> Action Log</button>
               <button onClick={() => setView('errors')} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'errors' ? 'bg-red-600 text-white shadow-xl' : 'text-slate-300 hover:text-white'}`}><ShieldAlert size={14} /> Error Vault</button>
               <button onClick={() => setView('sessions')} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'sessions' ? 'bg-green-600 text-white shadow-xl' : 'text-slate-300 hover:text-white'}`}><Activity size={14} /> Live Status</button>
            </div>
         </div>
         <Terminal size={300} className="absolute -bottom-20 -right-20 text-white/5 rotate-12 pointer-events-none" />
      </div>

      {/* Search Bar */}
      {view !== 'sessions' && (
        <div className="relative group">
           <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
           <input 
             type="text" 
             placeholder="Search transactions, users, or errors..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full bg-white border-4 border-slate-900 rounded-[32px] pl-14 pr-8 py-5 font-black text-slate-900 shadow-xl outline-none focus:ring-4 ring-blue-500/20 transition-all placeholder:text-slate-300 italic"
           />
        </div>
      )}

      {/* VIEW: AUDIT LOG */}
      {view === 'audit' && (
        <div className="bg-white border-4 border-slate-900 rounded-[40px] shadow-2xl overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                 <tr>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500">Timestamp</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500">Operator</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500">Action</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500">Details</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredAudit.length === 0 ? (
                   <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase italic">No transaction records found.</td></tr>
                 ) : (
                   filteredAudit.map((log) => (
                     <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5 text-[10px] font-black text-slate-400 tabular-nums">
                           {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs italic">
                                 {log.user?.name.charAt(0)}
                              </div>
                              <span className="font-black text-slate-900 text-xs uppercase">{log.user?.name || 'SYSTEM'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm border ${log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">"{log.details}"</p>
                        </td>
                     </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      )}

      {/* VIEW: ERROR LOG */}
      {view === 'errors' && (
        <div className="space-y-4">
           {errorLogs.length === 0 ? (
              <div className="bg-green-50 border-4 border-dashed border-green-200 p-20 rounded-[40px] text-center">
                 <p className="font-black text-green-600 uppercase tracking-widest italic">All Systems Clear - No Errors Detected</p>
              </div>
           ) : (
              errorLogs.map((err) => (
                <div key={err.id} className="bg-white border-4 border-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden group hover:border-red-600 transition-colors">
                   <div className="flex items-start justify-between gap-6 relative z-10">
                      <div className="space-y-2 flex-1">
                         <div className="flex items-center gap-3">
                            <span className="bg-red-600 text-white px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg italic">{err.severity}</span>
                            <span className="text-[10px] font-black text-slate-400 tabular-nums">{new Date(err.createdAt).toLocaleString()}</span>
                         </div>
                         <h4 className="font-black text-slate-900 text-sm">{err.message}</h4>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Terminal size={12} /> {err.path}</p>
                      </div>
                      <AlertCircle size={40} className="text-red-100 group-hover:text-red-500 transition-colors" />
                   </div>
                   {err.stack && (
                     <div className="mt-4 p-4 bg-slate-900 rounded-2xl overflow-x-auto">
                        <pre className="text-[9px] font-mono text-red-400 opacity-80">{err.stack.split('\n').slice(0, 3).join('\n')}</pre>
                     </div>
                   )}
                </div>
              ))
           )}
        </div>
      )}

      {/* VIEW: LIVE SESSIONS */}
      {view === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {sessions.map((s) => (
              <div key={s.sessionToken} className="bg-white border-4 border-slate-900 p-6 rounded-[32px] shadow-xl flex items-center justify-between group hover:ring-8 ring-green-500/10 transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-yellow-400 rounded-2xl flex items-center justify-center font-black text-xl italic shadow-lg">
                       {s.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                       <p className="text-sm font-black text-slate-900 truncate uppercase">{s.user.name}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Connection</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => revokeSession(s.sessionToken, s.user.name)}
                   className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-3 rounded-xl transition-all border-2 border-red-100 shadow-sm"
                   title="Force Revoke Access"
                 >
                    <XCircle size={20} />
                 </button>
              </div>
           ))}
        </div>
      )}

    </div>
  );
}
