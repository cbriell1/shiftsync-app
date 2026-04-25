// filepath: lib/ui-utils.tsx
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export const notify = {
  success: (msg: string) => toast.success(msg, { 
    style: { fontWeight: '900', borderRadius: '12px', color: '#0f172a' },
    iconTheme: { primary: '#16a34a', secondary: '#fff' }
  }),
  error: (msg: string) => toast.error(msg, { 
    style: { fontWeight: '900', borderRadius: '12px', color: '#0f172a' },
  }),
  info: (msg: string) => toast(msg, { 
    style: { fontWeight: '900', borderRadius: '12px', color: '#0f172a' },
  }),
};

// A promise-based replacement for the native window.confirm()
export const customConfirm = (message: string, confirmText = "Confirm", isDanger = true): Promise<boolean> => {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className={`${t.visible ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95 fade-out'} max-w-sm w-full bg-white shadow-2xl rounded-2xl border-2 border-slate-200 pointer-events-auto flex flex-col p-5`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">Are you sure?</h3>
              <p className="text-sm font-bold text-slate-500 mt-1 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-5 w-full">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid="confirm-button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl font-black text-white shadow-md transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, 
        position: 'top-center',
      }
    );
  });
};

// NEW: Global hook for Escape Key handling on Modals/Dropdowns
export const useEscapeKey = (onEscape: () => void, isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onEscape]);
};