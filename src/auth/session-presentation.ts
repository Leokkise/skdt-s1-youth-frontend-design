import type { SessionAccessV1 } from '../../contracts/v1/auth';

export type SessionPresentation = { state: SessionAccessV1; checking: boolean };
// Retain layout during revalidation only; the consumer blocks controls while checking.
export function sessionPresentation(previous: SessionPresentation, next: SessionAccessV1): SessionPresentation {
  return next.kind === 'loading' && previous.state.kind === 'signedIn'
    ? { state: previous.state, checking: true }
    : { state: next, checking: next.kind === 'loading' };
}
