import { useEffect, useRef, useState } from 'react';
import YouthIcon from './YouthIcon';

export default function StatusToast({ message, onClose, pending = false }: { message: string; onClose: () => void; pending?: boolean }) {
  const [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const remaining = useRef(5000);
  const paused = hovered || focused;
  useEffect(() => {
    if (paused) return;
    const started = performance.now();
    const timer = window.setTimeout(onClose, remaining.current);
    return () => { window.clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (performance.now() - started)); };
  }, [paused, onClose]);
  return <aside className={`status-toast${pending ? ' status-toast-pending' : ''}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <span className="status-toast-icon" aria-hidden="true"><YouthIcon name={pending ? 'clock' : 'check'} /></span>
    <p role="status">{message}</p>
    <button type="button" className="status-toast-close" aria-label="Dismiss notification" onClick={onClose}><YouthIcon name="close" /></button>
    <span aria-hidden="true" className="status-toast-countdown" style={{ animationPlayState: paused ? 'paused' : 'running' }} />
  </aside>;
}
