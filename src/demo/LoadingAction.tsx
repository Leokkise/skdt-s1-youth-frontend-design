import type { ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from './StaffLoading';

// Keep the action label's footprint and accessible name while its operation runs.
export default function LoadingAction({ busy = false, iconOnly = false, children, className = 'button', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; iconOnly?: boolean }) {
  if (iconOnly) return <button title={typeof children === 'string' ? children : undefined} {...props} className={`${className} refresh-icon-button`} disabled={disabled || busy} aria-busy={busy}>
    <span className="sr-only">{children}</span><svg className={busy ? 'is-refreshing' : undefined} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 7a7 7 0 0 1 11.6-1L20 12M4 12l2.3 6A7 7 0 0 0 18 17" /></svg>
  </button>;
  return <button {...props} className={`${className} loading-action`} disabled={disabled || busy} aria-busy={busy}>
    <span className="loading-action-label">{children}</span>{busy && <LoadingSpinner />}
  </button>;
}
