import { useEffect, useRef } from 'react';

// Poll checked services only while visible; never interrupt editing or an open dialog.
export default function useAutoRefresh(refresh: () => void | Promise<void>, enabled = true) {
  const latest = useRef(refresh); latest.current = refresh;
  const lastStarted = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    let running = false;
    const update = async () => {
      if (running || document.visibilityState !== 'visible' || document.querySelector('dialog[open]') || document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) return;
      // Returning to a tab can emit both visibilitychange and focus.
      const now = Date.now();
      if (now - lastStarted.current < 1000) return;
      lastStarted.current = now;
      running = true;
      try { await latest.current(); } catch { /* Service controllers own error presentation. */ }
      finally { running = false; }
    };
    const timer = window.setInterval(() => { void update(); }, 10000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [enabled]);
}
