import type {StaffPositionV1} from './business-activity';
export type BusinessActivityScopeV2='all'|'auth'|'s1'|'recovery';
export type BusinessActivitySourceV2='business'|'recovery';
export type RecoveryActivityOutcomeV2='approved'|'challenge_prepared'|'mailbox_verified'|'verification_failed'|'applying'|'completed'|'cancelled'|'expired'|'reapproved'|'credential_ready'|'credential_completed';
export type BusinessActivityCursorV2={scope:BusinessActivityScopeV2;recordedAt:string;source:BusinessActivitySourceV2;eventId:string};
export type BusinessActivityEventV2={eventId:string;source:BusinessActivitySourceV2;actorLabel:string;position:StaffPositionV1;scope:'auth'|'s1'|'recovery';action:'password_sign_in'|'auth_logout_committed'|'registration_decision'|'account_recovery';outcome:'provider_committed'|'approved'|'needs_changes'|'rejected'|RecoveryActivityOutcomeV2;performedBy:'officer'|'mailbox_flow'|'system';referenceKind:'none'|'registration'|'recovery_case';recordRef:string|null;caseId:string|null;recordedAt:string};
export type BusinessActivityPageV2={items:BusinessActivityEventV2[];nextCursor:BusinessActivityCursorV2|null;scopes:Record<'auth'|'s1'|'recovery','available'|'denied'|'not_requested'>;displayTimezone:'Asia/Manila'};
export interface BusinessActivityV2{read(scope?:BusinessActivityScopeV2,limit?:number,before?:BusinessActivityCursorV2):Promise<{kind:'ok';data:BusinessActivityPageV2}|{kind:'denied'|'invalid'|'unavailable'}>}
