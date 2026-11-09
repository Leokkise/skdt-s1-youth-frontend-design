export type YouthIconName = 'profile' | 'qr' | 'gift' | 'check' | 'clock' | 'edit' | 'account' | 'lock' | 'camera' | 'arrow' | 'chevron' | 'plus' | 'close' | 'report' | 'dashboard' | 'logout' | 'expand' | 'download' | 'idea' | 'notice';

export default function YouthIcon({ name }: { name: YouthIconName }) {
  const paths = {
    notice: <><path d="m10.3 4-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v5m0 3h.01" /></>,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6" />,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />,
    idea: <><path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    chevron: <path d="m8 5 7 7-7 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    report: <><path d="M4 20h16M7 16v-5m5 5V4m5 12V8" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    logout: <><path d="M10 3H4v18h6M9 12h12m-5-5 5 5-5 5" /></>,
    profile: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="9" r="2.5" /><path d="M8 17c0-4 8-4 8 0" /></>,
    qr: <><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM21 12v3M12 3v3M12 12h3M3 12h3M12 18v3" /></>,
    gift: <><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14" /><path d="M12 7H8a2.5 2.5 0 1 1 2.5-2.5L12 7Zm0 0h4a2.5 2.5 0 1 0-2.5-2.5L12 7Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    edit: <><path d="m14 4 6 6M4 20l5-1L21 7l-4-4L5 15l-1 5ZM13 20h8" /></>,
    account: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M19 6v6m-3-3h6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v14H3z" /><circle cx="12" cy="13" r="4" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
