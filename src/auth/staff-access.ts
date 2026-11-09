import type { SessionAccessV1 } from '../../contracts/v1/auth';

// Presentation only; review RPCs enforce capability, designation and enablement.
export function canPresentReview(state: SessionAccessV1, checking: boolean) {
  return !checking && state.kind === 'signedIn' && state.access.accountStatus === 'active' &&
    state.access.capabilities.includes('youth.registration_review');
}
