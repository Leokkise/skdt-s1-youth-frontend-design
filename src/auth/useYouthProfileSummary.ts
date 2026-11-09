import { useYouthAuth } from './AuthProvider';

// Display-only snapshot from the existing account loader; never grants access.
export default function useYouthProfileSummary() {
  const { state, youthScreenView, youthView } = useYouthAuth();
  if (state.kind !== 'signedIn' || state.access.accountStatus !== 'active') return null;
  const authId = state.authUserId;
  const detail = youthScreenView.current?.authId === authId ? youthScreenView.current.detail : null;
  if (detail) return {authId, submitted:true, answers:detail.answers};
  const record = youthView.current?.authId === authId ? youthView.current.record : null;
  return record ? {authId, submitted:record.kind === 'submitted', answers:record.kind === 'submitted' || record.kind === 'draft' ? record.answers : {}} : null;
}
