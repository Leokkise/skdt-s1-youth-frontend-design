import { useEffect, useRef, useState } from 'react';
import RevisionNotice from './RevisionNotice';
import { correctionService } from './review-services';

export default function CorrectionEnrollment({ responseId, enrolled, denied }: { responseId: string; enrolled: () => void; denied: () => void }) {
  const [accepted, setAccepted] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const retry = useRef<string | null>(null), live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function enroll() {
    if (busy || !accepted || !correctionService) return;
    setBusy(true); setError(''); retry.current ||= crypto.randomUUID();
    const result = await correctionService.staffBegin(responseId, retry.current, true);
    if (!live.current) return;
    setBusy(false);
    if (result.kind !== 'unavailable') retry.current = null;
    if (result.kind === 'ok' || result.kind === 'conflict') enrolled();
    else if (result.kind === 'denied') denied();
    else setError('Correction review could not be confirmed. Retry the same request or reload the record.');
  }
  return <section className="correction-enrollment"><h3>Enable field-specific correction review</h3><p>This pending profile can use exact answer notes and repeat review rounds. Completed decisions cannot be reopened.</p>
    <RevisionNotice staff accepted={accepted} onChange={setAccepted} disabled={busy || Boolean(retry.current)} />
    {error && <p role="alert">{error}</p>}<button className="button" disabled={!accepted || busy} type="button" onClick={() => { void enroll(); }}>{busy ? 'Preparing correction review…' : 'Enable correction review'}</button>
  </section>;
}
