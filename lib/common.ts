// filepath: lib/common.ts
export const DAYS_OF_WEEK =['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];
export const AVAILABLE_ROLES = ['Administrator', 'Manager', 'Front Desk', 'Trainer'];

export const formatTimeSafe = (dStr: string | null | undefined) => {
  if (!dStr) return 'Active';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return 'Active';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const formatDateSafe = (dStr: string | null | undefined) => {
  if (!dStr) return 'Unknown';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const getLocationColor = (locId: number | string | null | undefined) => {
  const colors =[
    { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900', claim: 'bg-blue-600 hover:bg-blue-700', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
    { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900', claim: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
    { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900', claim: 'bg-orange-600 hover:bg-orange-700', badge: 'bg-orange-100 text-orange-900 border-orange-300' },
    { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-900', claim: 'bg-teal-600 hover:bg-teal-700', badge: 'bg-teal-100 text-teal-900 border-teal-300' },
    { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-900', claim: 'bg-pink-600 hover:bg-pink-700', badge: 'bg-pink-100 text-pink-900 border-pink-300' }
  ];
  const id = typeof locId === 'string' ? parseInt(locId) : (locId || 0);
  if (!id) return colors[0];
  return colors[id % colors.length];
};

export const getMonday = (d: Date) => { 
  const dt = new Date(d); 
  const day = dt.getDay(); 
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(dt.setDate(diff)).toISOString().split('T')[0]; 
};

export const generatePeriods = (): { label: string; start: string; end: string }[] => {
  const p: { label: string; start: string; end: string }[] =[];
  const cur = new Date();

  let curM = cur.getMonth();
  let curY = cur.getFullYear();
  if (cur.getDate() < 28) { curM--; if(curM < 0) { curM = 11; curY--; } }
  for(let i = 0; i < 6; i++) {
    const s = new Date(curY, curM - i, 28);
    const e = new Date(curY, curM - i + 1, 27);
    p.push({ label: `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`, start: s.toISOString(), end: e.toISOString() });
  }
  return p;
};