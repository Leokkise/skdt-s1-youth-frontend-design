import type { ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from './StaffLoading';

// Keep the action label's footprint and accessible name while its operation runs.
export default function LoadingAction({ busy = false, children, className = 'button', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return <button {...props} className={`${className} loading-action`} disabled={disabled || busy} aria-busy={busy}>
    <span className="loading-action-label">{children}</span>{busy && <LoadingSpinner />}
  </button>;
}
