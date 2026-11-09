import { useEffect, useId, useRef, type ReactNode } from 'react';
import YouthIcon from './YouthIcon';

export default function AnalyticsDialog({ title, onClose, children, compact = false }: { title: string; onClose: () => void; children: ReactNode; compact?: boolean }) {
  const element = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = element.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={element} className={`analytics-modal${compact ? ' analytics-modal-export' : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="analytics-modal-heading"><h2 id={titleId}>{title}</h2><button autoFocus type="button" className="secondary-button" onClick={onClose}><YouthIcon name="close" />Close</button></header>
    <div className="analytics-modal-body">{children}</div>
  </dialog>;
}
