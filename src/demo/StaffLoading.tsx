export function LoadingSpinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

export function SkeletonText({ children = 'Not provided' }: { children?: ReactNode }) {
  return <span className="staff-skeleton-copy" aria-hidden="true">{children}</span>;
}

const tableLayouts = {
  registry: { className: 'registry-table', headers: ['Youth profile / Registration No.', 'Review status', 'Action'], rows: 10 },
  search: { className: 'recovery-search-table', headers: ['Youth account', 'Registration No.', 'Profile status', 'Action'], rows: 5 },
  activity: { className: 'staff-activity-table', headers: ['Staff responsible', 'Activity', 'Registration No.', 'Date and time (PH)'], rows: 10 },
  combinedActivity: { className: 'staff-activity-table', headers: ['Staff responsible', 'Activity', 'Reference', 'Date and time (PH)'], rows: 10 },
  recoveryActivity: { className: 'staff-activity-table', headers: ['Staff responsible', 'Activity', 'Case reference', 'Date and time (PH)'], rows: 10 },
  authActivity: { className: 'staff-activity-table', headers: ['Staff responsible', 'Activity', 'Date and time (PH)'], rows: 10 },
  cases: { className: 'recovery-case-list', headers: ['Case reference', 'Status', 'Email change', 'Created (PH)', 'Action'], rows: 5 },
  attention: { className: '', headers: ['Profile', 'Status / source', 'Action'], rows: 5 },
} as const;

export function TableSkeleton({ label, variant, rows, approved = false }: { label: string; variant: keyof typeof tableLayouts; rows?: number; approved?: boolean }) {
  const layout = tableLayouts[variant];
  const activity = ['activity', 'authActivity', 'combinedActivity', 'recoveryActivity'].includes(variant);
  return <div role="status" aria-label={label} className={`report-table-wrap staff-table-pending ${variant === 'cases' ? 'recovery-cases-table' : ''}`}>
    <span className="sr-only">{label}</span>
      <table className={`report-table ${layout.className}`} data-activity-scope={variant === 'authActivity' ? 'auth' : undefined} data-approved={variant === 'registry' ? approved : undefined} aria-hidden="true">
        {variant === 'registry' && <colgroup>{approved && <col className="registry-select-column" />}<col className="registry-profile-column" /><col className="registry-status-column" /><col className="registry-action-column" /></colgroup>}
        <thead><tr>{variant === 'registry' && approved && <th className="registry-select-heading" scope="col"><input type="checkbox" disabled aria-label="Select all matching approved youth" /></th>}{layout.headers.map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead>
        <tbody>{Array.from({length:rows ?? layout.rows}, (_, row) => <tr key={row}>{variant === 'registry' && approved && <td className="registry-row-select"><input type="checkbox" disabled aria-label="Select youth profile" /></td>}{layout.headers.map((title, column) => {
          const content = variant === 'registry' ? column === 0 ? <><strong className="registry-profile-name"><SkeletonText>Youth profile name</SkeletonText></strong><small className="kk-number"><span>Registration No.</span> <strong><SkeletonText>0000</SkeletonText></strong></small><small><SkeletonText>Core Youth · College Undergraduate</SkeletonText></small>{approved && <small>Reporting date: <SkeletonText>2026-10-01</SkeletonText></small>}</> : column === 1 ? <span className="status-pill registry-status"><YouthIcon name="clock" /><SkeletonText>{approved ? 'Approved' : 'For review'}</SkeletonText></span> : <button className="button registry-review-button" disabled><YouthIcon name="edit" /><SkeletonText>Review profile</SkeletonText></button>
            : variant === 'attention' && column === 1 ? <><SkeletonText>Pending review</SkeletonText><small><SkeletonText>Submitted online</SkeletonText></small></> : activity && column === 0 ? <><SkeletonText>Staff account</SkeletonText><small><SkeletonText>Chairperson</SkeletonText></small></>
            : (variant === 'recoveryActivity' || variant === 'combinedActivity') && column === 1 ? <><SkeletonText>Email address updated</SkeletonText><small><SkeletonText>Completed by staff</SkeletonText></small></>
            : column === layout.headers.length - 1 && !activity ? variant === 'attention' ? <SkeletonText>Open</SkeletonText> : <button className="secondary-button" disabled><SkeletonText>{variant === 'search' ? 'View profile' : 'View case'}</SkeletonText></button>
            : <SkeletonText>{column === 0 ? variant === 'cases' ? 'REC-2026-001' : 'Youth account name' : column === 1 ? 'Pending review' : variant === 'cases' && column === 2 ? 'x***@example.invalid → x***@example.invalid' : title.includes('Date') || title.includes('Created') ? 'Oct 28, 2026, 10:50 AM' : '0000'}</SkeletonText>;
          const className = variant === 'registry' ? ['','registry-row-status','registry-row-action'][column] : variant === 'cases' && column === 2 ? 'recovery-email-change' : undefined;
          return column === 0 ? <th scope="row" key={title}>{content}</th> : <td key={title} className={className}>{content}</td>;
        })}</tr>)}</tbody>
      </table>
  </div>;
}
import type { ReactNode } from 'react';
import YouthIcon from './YouthIcon';

