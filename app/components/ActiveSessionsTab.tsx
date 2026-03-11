// filepath: app/components/ActiveSessionsTab.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { notify, customConfirm } from '@/lib/ui-utils';

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/sessions?t=' + new Date().getTime());
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

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
        fetchSessions();
      }
    } catch (err) {
      notify.error("Failed to revoke session.");
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-slate-400 uppercase tracking-widest">Scanning Connections...</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-blue-900 font-black text-sm uppercase tracking-tight">Active Database Connections</h3>
          <p className="text-blue-700 text-xs font-bold">Manage live device sessions. Revoking a session forces an immediate logout.</p>
        </div>
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-black text-xs shadow-sm">
          {sessions.length} Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessions.map((s) => (
          <div key={s.sessionToken} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between group hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-black">
                {s.user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 truncate" title={s.user.name}>{s.user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Expires: {new Date(s.expires).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => revokeSession(s.sessionToken, s.user.name)}
              className="opacity-0 group-hover:opacity-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all border border-red-100"
              title="Force Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5A.75.75 0 0 1 10 2ZM5.404 4.343a.75.75 0 0 1 0 1.06 6.5 6.5 0 1 0 9.192 0 .75.75 0 1 1 1.06-1.06 8 8 0 1 1-11.313 0 .75.75 0 0 1 1.061 0Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}