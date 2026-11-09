import { type ReactNode } from 'react';








export default function AdminLayout({ title, children, wide = false, loading = false, showHeading = true }: { title: string; description: string; children: ReactNode; wide?: boolean; loading?: boolean; showHeading?: boolean }) {



  return <main id="main-content" className={`container demo-main simple-admin${wide ? ' analytics-wide' : ''}`} data-staff-loading={loading || undefined} aria-busy={loading}>



    {showHeading && <header className="demo-heading"><h1>{title}</h1></header>}

    {children}

  </main>;

}
