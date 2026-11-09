import useYouthProfileSummary from '../auth/useYouthProfileSummary';
import { client, useYouthAuth } from '../auth/AuthProvider';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { usePractice } from '../demo/PracticeStore';

import UserMenu from '../demo/UserMenu';

import { FAQ } from '../demo/AccountSupport';
const landingSteps = [
  ['Create Account', 'Register and sign in.'],
  ['Submit Profile', 'Fill in the 5 sections and click submit.'],
  ['Wait for Review', 'Track your approval status on your dashboard.'],
  ['Join Events', 'Browse and join SK community events.'],
];
import YouthIcon from '../demo/YouthIcon';
import CivicPaperCorners from './CivicPaperCorners';




const seal = '/images/sk-talipapa-logo.png';

// Barangay reference from the official QC directory, not a claimed SK office pin.

const barangayCenter = '14.687658,121.025464';

const mapLink = `https://www.google.com/maps/search/?api=1&query=${barangayCenter}`;

const officeAddress = '506 Quirino Hwy, Novaliches, Quezon City, 1116 Metro Manila';

const barangayFacebook = 'https://www.facebook.com/profile.php?id=61573062877104';



type IconName = 'arrow' | 'down' | 'profile' | 'report' | 'calendar' | 'pin' | 'facebook' | 'menu' | 'close' | 'people' | 'youth' | 'graduate' | 'work' | 'phone' | 'mail';



export function CivicIcon({ name }: { name: IconName }) {

  const paths: Record<IconName, React.ReactNode> = {
    phone: <path d="M7 3H4a1 1 0 0 0-1 1c0 9 8 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a15 15 0 0 1-7-7l2-2-2-5Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    people: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3" /></>,
    youth: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2M10 8h.01M14 8h.01" /></>,
    graduate: <><path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v7c4 3 8 3 12 0v-7m4-2v8" /></>,
    work: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0m-9 1v4" /></>,

    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,

    down: <path d="M12 4v16m-6-6 6 6 6-6" />,

    profile: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="9" r="2.5" /><path d="M8 17c0-4 8-4 8 0" /></>,

    report: <><path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 17v-3m4 3v-6m4 6v-4" /></>,

    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m3 0h2m3 0h1m-11 3h2m3 0h2" /></>,

    pin: <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,

    facebook: <path d="M14 21v-8h3l.5-4H14V7c0-1 .5-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8" />,

    menu: <path d="M4 6h16M4 12h16M4 18h16" />,

    close: <path d="m6 6 12 12M6 18 18 6" />,

  };

  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;

}



const navigation = [

  ['Services', '/youth#services'],

  ['Demographics', '/youth#demographics'], ['Help / FAQ', '/youth#faq'],

  ['Contact', '/youth#contact'],

];



// Destination presentation only; the account route still checks actual access and profile state.
function useSubmittedYouthDestination() {
  const { state } = useYouthAuth();
  const summary = useYouthProfileSummary();
  const practice = usePractice();
  if (summary) return summary.submitted;
  if (state.kind === 'loading' || state.kind === 'signedIn') return true;
  return practice.signedIn && practice.responses.some(item => item.key === practice.profileKey);
}


function HeaderChevron() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m2.5 5.5 5.5 5 5.5-5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}


export function CivicHeader() {
  const { state: youthState } = useYouthAuth();


  const practice = usePractice();
  const { pathname, hash } = useLocation();
  const hasSubmittedYouthProfile = useSubmittedYouthDestination();



  const isStaff = pathname === '/admin/youth' || pathname.startsWith('/admin/youth/');

  const isLanding = pathname === '/youth' || pathname === '/youth/';
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);


  const [open, setOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const homeToggle = useRef<HTMLButtonElement>(null);
  const homeMenu = useRef<HTMLDivElement>(null);
  const homeCloseTimer = useRef<number | null>(null);

  const cancelHomeClose = () => {
    if (homeCloseTimer.current !== null) window.clearTimeout(homeCloseTimer.current);
    homeCloseTimer.current = null;
  };
  const closeHomeMenu = () => { cancelHomeClose(); setHomeOpen(false); };
  const returnHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setOpen(false);
    closeHomeMenu();
    if (isLanding) window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const [activeSection, setActiveSection] = useState('home');

  const toggle = useRef<HTMLButtonElement>(null);

  const root = useRef<HTMLElement>(null);



  useEffect(() => {

    const update = () => {
      setScrolled(window.scrollY > 24);
      if (!isLanding) return;

      const threshold = (root.current?.getBoundingClientRect().height || 96) + 80;

      let active = 'home';

      for (const id of ['services', 'demographics', 'faq', 'contact']) {

        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= threshold) active = id;

      }

      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) active = 'contact';

      setActiveSection(active);

    };

    update();

    window.addEventListener('scroll', update, { passive: true });

    window.addEventListener('resize', update);

    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };

  }, [pathname]);

  useEffect(() => { setOpen(false); closeHomeMenu(); }, [pathname, hash]);
  useEffect(() => () => cancelHomeClose(), []);

  useEffect(() => {
    const resize = () => { closeHomeMenu(); if (window.innerWidth > 1290) setOpen(false); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!homeOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeHomeMenu(); homeToggle.current?.focus(); }
    };
    const outside = (event: PointerEvent | FocusEvent) => {
      if (!homeMenu.current?.contains(event.target as Node)) closeHomeMenu();
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [homeOpen]);

  useEffect(() => {

    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {

      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }

    };

    const outside = (event: PointerEvent) => {

      if (!root.current?.contains(event.target as Node)) setOpen(false);

    };

    document.addEventListener('keydown', closeOnEscape);

    document.addEventListener('pointerdown', outside);

    return () => {

      document.removeEventListener('keydown', closeOnEscape);

      document.removeEventListener('pointerdown', outside);

    };

  }, [open]);



  return <header ref={root} className={`site-header civic-header ${isLanding ? 'over-hero' : ''} ${!isLanding || scrolled || open ? 'is-solid' : ''}`}>

    <div className="container civic-header-content">

      <div className="civic-header-identity"><Link className="civic-brand" to="/youth" aria-label="SK-DigiTalipapa home" onClick={returnHome}>

        <img src={seal} width="56" height="56" alt="" />

        <span><strong>SK-DigiTalipapa</strong><small>Barangay Talipapa</small></span>

      </Link></div>

      <nav className={`civic-nav ${open ? 'is-open' : ''}`} id="primary-navigation" aria-label={isStaff ? 'Staff navigation' : 'Primary navigation'}>

        {isStaff ? <Link to="/admin/youth/dashboard">Youth Staff Workspace</Link> : <>
          <div ref={homeMenu} className="civic-home-menu" onFocusCapture={cancelHomeClose} onPointerEnter={event => { if (!open && event.pointerType === 'mouse') { cancelHomeClose(); setHomeOpen(true); } }} onPointerLeave={event => { if (!open && event.pointerType === 'mouse' && !homeMenu.current?.contains(document.activeElement)) { cancelHomeClose(); homeCloseTimer.current = window.setTimeout(() => { setHomeOpen(false); homeCloseTimer.current = null; }, 240); } }}>
            <div className="civic-home-controls">
              <Link to="/youth" aria-current={isLanding && activeSection === 'home' ? 'location' : undefined} onClick={returnHome}>Home</Link>
              <button ref={homeToggle} type="button" className="civic-home-toggle" aria-label="Home sections" aria-expanded={homeOpen} aria-controls="home-sections" onClick={() => { cancelHomeClose(); setHomeOpen(value => !value); }}><HeaderChevron /></button>
            </div>
            <div id="home-sections" className="civic-home-dropdown" hidden={!homeOpen}>
              {navigation.map(([label, url]) => <Link key={label} to={url} aria-current={isLanding && activeSection === url.split('#')[1] ? 'location' : undefined} onClick={() => { setOpen(false); setHomeOpen(false); }}>{label}</Link>)}
            </div>
          </div>
          <Link className="civic-youth-nav" to={hasSubmittedYouthProfile ? '/youth/dashboard' : '/youth/profiling'} aria-current={pathname === (hasSubmittedYouthProfile ? '/youth/dashboard' : '/youth/profiling') ? 'page' : undefined} onClick={() => { setOpen(false); setHomeOpen(false); }}>{hasSubmittedYouthProfile ? 'Youth dashboard' : 'Youth Profiling'}</Link>
          <span className="civic-nav-unavailable" aria-disabled="true" title="Available when the project service is connected">Transparency &amp; Reports<HeaderChevron /></span>
          <span className="civic-nav-unavailable" aria-disabled="true" title="Available when the event service is connected">Events &amp; Programs<HeaderChevron /></span>
        </>}

      </nav>

      <div className="civic-header-actions">

        {isStaff ? practice.adminSignedIn && <Link className="civic-login" to="/admin/youth/login" onClick={practice.adminSignOut}>Staff sign out</Link> : youthState.kind === "signedIn" || practice.signedIn ? <UserMenu /> : youthState.kind === 'loading' ? <button className="user-menu-trigger" disabled aria-label="Restoring account"><span className="user-avatar" aria-hidden="true"><span className="account-name-placeholder avatar" /></span><span className="account-name-placeholder" aria-hidden="true" /><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="2" /></svg></button> : <Link className="civic-login" to="/youth/demo/sign-in"><span>Login / Sign up</span><CivicIcon name="arrow" /></Link>}

        <button ref={toggle} className="civic-menu-toggle" type="button" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(value => !value)}><CivicIcon name={open ? 'close' : 'menu'} /></button>

      </div>

    </div>

  </header>;

}



// React Router hash navigation also needs to work when arriving from another screen.

export function CivicScroll() {

  const { pathname, hash } = useLocation();

  const previousPath = useRef<string | null>(null);
  useLayoutEffect(() => {
    const samePage = previousPath.current === pathname;
    previousPath.current = pathname;
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: samePage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;

}



type Demographics = { asOf: string; total: number; childYouth: number; coreYouth: number; youngAdult: number };
const sampleDemographics: Demographics = { asOf: '', total: 474, childYouth: 76, coreYouth: 251, youngAdult: 147 };

function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(value);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) { setCount(value); return; }
    let frame = 0;
    let start: number | undefined;
    setCount(0);
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min((now - start) / 1400, 1);
      setCount(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    const finish = () => { if (motion.matches) { window.cancelAnimationFrame(frame); setCount(value); } };
    frame = window.requestAnimationFrame(tick);
    motion.addEventListener('change', finish);
    return () => { window.cancelAnimationFrame(frame); motion.removeEventListener('change', finish); };
  }, [value]);
  return <span aria-hidden="true">{count.toLocaleString('en-PH')}</span>;
}

function CommunityDemographics() {
  const [stats, setStats] = useState<Demographics | null>(client ? null : sampleDemographics);
  useEffect(() => {
    const api = client;
    if (!api) return;
    let active = true;
    const refresh = async () => {
      const { data, error } = await api.rpc('youth_public_demographics_v1');
      if (active) setStats(error ? null : data);
    };
    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return <section className="civic-demographics civic-paper" id="demographics" aria-label={client ? 'Youth demographics' : 'Youth demographics · Sample data'}>
    <div className="container">
      {!stats && <p role="status">Public statistics are currently unavailable.</p>}
      {stats && <dl className="civic-statistics">
        <div><CivicIcon name="people" /><dt title="Ages 15–30">Approved youth profiles</dt><dd aria-label={String(stats.total)}><CountUp value={stats.total} /></dd></div>
        <div><CivicIcon name="youth" /><dt title="Ages 15–17">Child Youth</dt><dd aria-label={String(stats.childYouth)}><CountUp value={stats.childYouth} /></dd></div>
        <div><CivicIcon name="graduate" /><dt title="Ages 18–24">Core Youth</dt><dd aria-label={String(stats.coreYouth)}><CountUp value={stats.coreYouth} /></dd></div>
        <div><CivicIcon name="work" /><dt title="Ages 25–30">Young Adult</dt><dd aria-label={String(stats.youngAdult)}><CountUp value={stats.youngAdult} /></dd></div>
      </dl>}
    </div>
  </section>;
}


export default function CivicLanding() {

  const { state: accountState, checking } = useYouthAuth();
  const signedIn = accountState.kind === 'signedIn';
  const resolvingAccount = checking || accountState.kind === 'loading';
  const hasSubmittedProfile = useSubmittedYouthDestination();
  const profilingTarget = hasSubmittedProfile ? '/youth/dashboard' : '/youth/profiling';

  const [service, setService] = useState<'transparency' | 'events' | null>(null);
  useEffect(() => {
    if (signedIn && service) document.getElementById('service-information')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }, [signedIn, service]);

  return <main id="main-content" className="landing-page civic-landing">

    <section className="civic-hero" aria-labelledby="page-title">

      <img className="civic-hero-image" src="/images/talipapa-community-collage.webp" alt="" fetchPriority="high" width="1672" height="941" />

      <div className="container civic-hero-content">

        <h1 id="page-title">Kabataang Talipapa.<br /><span>Kasama sa pag-unlad.</span></h1>

        <p>The Sangguniang Kabataan of Barangay Talipapa,<br className="desktop-break" /> District 6, Quezon City.</p>



        <div className="civic-hero-actions"><Link className="button civic-primary" to={profilingTarget}>{hasSubmittedProfile ? 'Go to youth dashboard' : 'Start youth profiling'}<CivicIcon name="arrow" /></Link><Link className="civic-hero-secondary" to="/youth#services">Explore our services</Link></div>


      </div>


    </section>
    <CommunityDemographics />
    <section className="civic-services civic-paper civic-paper-framed" id="services" aria-labelledby="services-title">
      <CivicPaperCorners />
      <div className="container">

      <div className="civic-section-heading"><h2 id="services-title">Youth Services</h2><p>Profiling, SK projects, and community programs.</p></div>

      <div className="civic-service-grid">

        {([
          { id: 'profiling', title: 'Youth Profiling', description: 'Your profile. Your interests. A voice in youth programs.', icon: 'profile' },
          { id: 'transparency', title: 'Transparency & Projects', description: 'Follow SK budgets, project updates, and public reports.', icon: 'report' },
          { id: 'events', title: 'Events & Programs', description: 'Sports, workshops, and activities for Kabataang Talipapa.', icon: 'calendar' },
        ] as const).map(card => {
          const action = resolvingAccount ? 'Checking account…' : !signedIn ? 'Sign in to explore' : card.id === 'profiling' ? hasSubmittedProfile ? 'Open your dashboard' : 'Complete your profile' : 'See what’s coming';
          const titleId = `service-${card.id}-title`, actionId = `service-${card.id}-action`;
          return <article className="civic-service-card" key={card.id}>
            <div className={`civic-service-art art-${card.id}`} aria-hidden="true" />
            <div className="civic-service-copy">
              <h3 id={titleId}>{card.title}</h3>
              <p>{card.description}</p>
              <span className="civic-service-action" id={actionId}>{action}<CivicIcon name="arrow" /></span>
            </div>
            {resolvingAccount ? <button className="civic-service-hit" type="button" disabled aria-labelledby={`${titleId} ${actionId}`} />
              : !signedIn || card.id === 'profiling' ? <Link className="civic-service-hit" to={signedIn ? profilingTarget : '/youth/demo/sign-in'} aria-labelledby={`${titleId} ${actionId}`} />
              : <button className="civic-service-hit" type="button" aria-labelledby={`${titleId} ${actionId}`} aria-expanded={service === card.id} aria-controls="service-information" onClick={() => { const selected = card.id as 'transparency' | 'events'; setService(value => value === selected ? null : selected); }} />}
          </article>;
        })}

      </div>

      <div id="service-information" className={`civic-service-information ${signedIn && service ? 'is-visible' : ''}`} role="status">{signedIn && service && <><strong>{service === 'transparency' ? 'Transparency & Projects' : 'Events & Programs'} · Coming soon</strong><p>{service === 'transparency' ? 'A place for SK budgets, public reports, and community project updates.' : 'A place for youth sports, workshops, health drives, and community activities.'} This service is not connected here yet.</p></>}</div>

      </div>
    </section>



    <section className="civic-how-it-works civic-paper" id="how-it-works" aria-labelledby="how-it-works-title">
      <div className="container"><div className="civic-section-heading"><div><h2 id="how-it-works-title">How it works</h2><p>New here? Start with an account, then share your youth profile.</p></div><Link className="button how-start-cta" to={profilingTarget}>{hasSubmittedProfile ? 'Go to youth dashboard' : 'Start youth profiling'}<CivicIcon name="arrow" /></Link></div>
        <ol role="list">{landingSteps.map(([title, description], index) => <li key={title}><span className="how-step-marker" aria-hidden="true">{index === 3 ? <CivicIcon name="calendar" /> : <YouthIcon name={(['account', 'edit', 'clock'] as const)[index]} />}<small>{index + 1}</small></span><div className="how-step-copy"><h3>{title}</h3><p>{description}</p></div></li>)}</ol>

      </div>
    </section>



    <section className="civic-faq civic-paper" id="faq" aria-labelledby="faq-title">
      <div className="container civic-faq-layout">

      <div className="civic-faq-intro"><div><h2 id="faq-title">How can we help?</h2><p>Get answers to common questions about youth profiling, submitting your information, and following your staff review status. Learn how to update your profile and manage your account.</p></div><Link className="button how-start-cta" to="/youth#contact">Contact barangay staff<CivicIcon name="arrow" /></Link></div>

      <div className="civic-faq-questions"><FAQ limit={6} /></div>
      </div>
    </section>



    <section className="civic-contact civic-paper" id="contact" aria-labelledby="contact-title">

      <div className="container civic-contact-layout">

        <div className="civic-contact-info">
          <h2 id="contact-title">Visit Us at</h2><p>Find us in District 6, Quezon City.</p>
          <div className="civic-location"><CivicIcon name="pin" /><div><h3>Barangay address</h3><p>506 Quirino Hwy, Novaliches,<br />Quezon City, 1116 Metro Manila</p></div></div>

          <div className="civic-location"><CivicIcon name="phone" /><div><h3>Contact number</h3><p>0917 000 0000</p></div></div>

          <div className="civic-location"><CivicIcon name="mail" /><div><h3>Email address</h3><p>hello@talipapa.example</p></div></div>
        </div>

        <figure className="civic-map"><a className="civic-map-link" href={mapLink} target="_blank" rel="noreferrer">Open in Google Maps<CivicIcon name="arrow" /></a><iframe title="Google map of the Barangay Talipapa area in Quezon City" src={`https://www.google.com/maps?q=${barangayCenter}&z=16&output=embed`} loading="lazy" referrerPolicy="no-referrer" allowFullScreen /></figure>

      </div>

    </section>

  </main>;

}



export function CivicFooter() {

  return <footer className="site-footer civic-footer">

    <div className="container civic-footer-grid">

      <div className="civic-footer-about"><Link className="civic-brand" to="/youth"><img src={seal} alt="SK Barangay Talipapa seal" width="64" height="64" loading="lazy" /><span><strong>Sangguniang Kabataan</strong><small>Barangay Talipapa · District 6, Quezon City</small></span></Link><p>Youth participation. Community progress.</p><span className="civic-footer-product">SK-DigiTalipapa</span></div>



      <div className="civic-footer-contact"><h2>Contact us</h2><p>{officeAddress}</p><div className="civic-contact-sample"><p>hello@talipapa.example<br />Phone: (02) 0000 0000<br />Monday–Friday, 8 AM–5 PM</p></div><Link className="civic-footer-contact-link" to="/youth#contact">Location &amp; directions<CivicIcon name="arrow" /></Link></div>
      <div className="civic-footer-social"><h2>Social links</h2><div className="civic-social-pending"><a href={barangayFacebook} target="_blank" rel="noreferrer"><CivicIcon name="facebook" />SK Talipapa Facebook<CivicIcon name="arrow" /></a></div></div>

    </div>

    <div className="container civic-footer-bottom"><p>© {new Date().getFullYear()} SK-DigiTalipapa · Sangguniang Kabataan of Barangay Talipapa</p><nav className="civic-footer-legal" aria-label="Policies"><Link to="/youth/terms">Terms of Service</Link><Link to="/youth/privacy">Privacy Policy</Link><Link to="/youth/accessibility">Accessibility</Link></nav></div>

  </footer>;

}
