// filepath: app/components/TimeSelect.tsx
"use client";
import React from 'react';

// Native <input type="time"> renders very differently across browsers -
// Safari and Edge on macOS in particular can reject partially-typed or
// segmented input as "invalid time" mid-entry. Three plain <select>
// dropdowns behave identically everywhere since there's nothing to type
// or parse - the value is always a valid selection.
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i); // 0-59

export default function TimeSelect({ value, onChange, variant = 'light' }: { value: string; onChange: (next: string) => void; variant?: 'light' | 'dark' }) {
  const [rawHH, rawMM] = value ? value.split(':').map(Number) : [8, 0];
  const hh = Number.isFinite(rawHH) ? rawHH : 8;
  const mm = Number.isFinite(rawMM) ? rawMM : 0;
  const isPM = hh >= 12;
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;

  const commit = (h12: number, min: number, pm: boolean) => {
    let h24 = h12 % 12;
    if (pm) h24 += 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  };

  const isDark = variant === 'dark';
  const selectClass = `bg-transparent font-black outline-none cursor-pointer shrink-0 ${isDark ? 'text-blue-400' : 'text-slate-900 text-sm'}`;

  return (
    <div className={`flex items-center gap-0.5 min-w-0 ${isDark ? '' : 'w-full bg-white border-2 border-slate-200 rounded-xl px-2 py-2.5'}`}>
      <select value={hour12} onChange={e => commit(Number(e.target.value), mm, isPM)} className={`${selectClass} w-7`}>
        {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className={`shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>:</span>
      <select value={mm} onChange={e => commit(hour12, Number(e.target.value), isPM)} className={`${selectClass} w-8`}>
        {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
      </select>
      <select value={isPM ? 'PM' : 'AM'} onChange={e => commit(hour12, mm, e.target.value === 'PM')} className={`${selectClass} w-11 ml-1`}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
