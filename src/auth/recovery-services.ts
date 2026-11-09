import { client } from './AuthProvider';
import { accountRecoveryV1, recoveryMailboxV1 } from './account-recovery';
import { recoverySearchV1 } from './recovery-search';
export const recoverySearchService = client ? recoverySearchV1(client) : null;
export const recoveryService = client ? accountRecoveryV1(client) : null;
export const mailboxService = recoveryMailboxV1();
export const recoveryMessage = (kind: string) => ({denied:'Recovery is unavailable or your recovery permission has changed.', invalid:'Check the supplied details and try again.', conflict:'This case changed or the email is already in use. Reload the case before continuing.', rateLimited:'Too many requests. Wait before trying again.', unavailable:'The result could not be confirmed. Refresh the case or retry the same request.', pending:'The operation is pending. Refresh the case to confirm its current status.'}[kind] || 'The operation could not be confirmed. Refresh the case.');
