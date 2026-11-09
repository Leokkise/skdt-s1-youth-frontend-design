import type { RecoveryCaseV1, RecoveryEventV1 } from '../../contracts/v1/account-recovery';

export const recoveryEventLabels: Record<RecoveryEventV1['outcome'], string> = {
  approved: 'Account recovery approved',
  reapproved: 'Account recovery approved again',
  challenge_prepared: 'Email verification code created',
  mailbox_verified: 'New email verified',
  verification_failed: 'Email verification unsuccessful',
  applying: 'Email address update started',
  completed: 'Email address updated',
  cancelled: 'Account recovery cancelled',
  expired: 'Account recovery expired',
  credential_ready: 'Password setup code created',
  credential_completed: 'New password set',
};

export const recoveryEventTones = {
  approved: 'success', reapproved: 'success', challenge_prepared: 'waiting',
  mailbox_verified: 'success', verification_failed: 'failure', applying: 'info',
  completed: 'success', cancelled: 'closed', expired: 'closed',
  credential_ready: 'waiting', credential_completed: 'success',
} satisfies Record<RecoveryEventV1['outcome'], string>;

export const recoveryStatusTones = {
  approved: 'success', awaiting_mailbox: 'waiting', verified: 'success',
  applying: 'info', completed: 'success', cancelled: 'closed', expired: 'closed',
} satisfies Record<RecoveryCaseV1['status'], string>;

// Retired password-setup steps remain in the provider audit, outside email-recovery views.
export const isRetiredPasswordSetup = (outcome: string) => outcome === 'credential_ready' || outcome === 'credential_completed';
