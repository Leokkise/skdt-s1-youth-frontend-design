import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useYouthAuth } from './AuthProvider';
import StaffRecovery from './StaffRecovery';

export default function RecoveryRoute() {
  const { state, signingOut } = useYouthAuth();
  const visible = useLocation().pathname === '/admin/youth/recovery';
  const allowed = !signingOut && state.kind === 'signedIn' && state.access.accountStatus === 'active' && state.access.capabilities.includes('account.recovery_manage');
  if (!allowed || state.kind !== 'signedIn') return visible ? <StaffRecovery /> : null;
  return <RecoverySession key={state.authUserId} visible={visible} />;
}

function RecoverySession({ visible }: { visible: boolean }) {
  const { refresh } = useYouthAuth();
  const [visited, setVisited] = useState(visible);
  const wasVisible = useRef(visible);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { if (visible) setVisited(true); }, [visible]);
  useEffect(() => {
    if (visible && visited && !wasVisible.current) void refresh();
    wasVisible.current = visible;
  }, [visible, visited, refresh]);
  useEffect(() => {
    if (!visible) root.current?.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
  }, [visible]);
  if (!visited && !visible) return null;
  // Keep the in-memory workflow, including uncertain request IDs, within this checked account.
  return <div ref={root} hidden={!visible} style={visible ? undefined : { display: 'none' }} inert={!visible || undefined}>
    <StaffRecovery visible={visible} />
  </div>;
}
