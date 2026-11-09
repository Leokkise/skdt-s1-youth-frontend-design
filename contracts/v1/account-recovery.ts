// Local fictional prototype only; worker URL must be loopback port5189.
export type RecoveryMethodV1='government_photo_id'|'school_photo_id_and_barangay_identity';
export type RecoveryStatusV1='approved'|'awaiting_mailbox'|'verified'|'applying'|'completed'|'cancelled'|'expired';
export type RecoveryCaseV1={caseId:string;responseId:string;status:RecoveryStatusV1;method:RecoveryMethodV1;officeReference:string;policyVersion:'local-s1-033-in-person-v1';oldEmailMasked:string;newEmailMasked:string;actorLabel:string;position:'chairperson'|'secretary'|'treasurer';createdAt:string;expiresAt:string;completedAt:string|null;credentialCompleted:boolean};
export type RecoveryEventV1={eventId:string;actorLabel:string;position:RecoveryCaseV1['position'];outcome:'approved'|'challenge_prepared'|'mailbox_verified'|'verification_failed'|'applying'|'completed'|'cancelled'|'expired'|'reapproved'|'credential_ready'|'credential_completed';oldEmail:string;newEmail:string;recordedAt:string};
export type RecoverySubjectV1={accountId:string;responseId:string;youthId:string;firstName:string;surname:string;birthdate:string};
export type RecoveryResultV1<T>={kind:'ok';data:T}|{kind:'completed';caseId:string}|{kind:'pending';caseId?:string}|{kind:'denied'|'invalid'|'conflict'|'rateLimited'|'unavailable'};
export type AccountRecoveryV1={
 subject(responseId:string):Promise<RecoveryResultV1<RecoverySubjectV1>>;
 list(limit?:number,before?:{createdAt:string;caseId:string}):Promise<RecoveryResultV1<{items:RecoveryCaseV1[];nextCursor:{createdAt:string;caseId:string}|null}>>;
 detail(caseId:string):Promise<RecoveryResultV1<{case:RecoveryCaseV1;events:RecoveryEventV1[]}>>;
 create(responseId:string,newEmail:string,method:RecoveryMethodV1,officeReference:string,requestId:string):Promise<RecoveryResultV1<RecoveryCaseV1>>;
 command(caseId:string,action:'resend'|'cancel'|'reconcile'|'credential'):Promise<RecoveryResultV1<RecoveryCaseV1>>;
 reapprove(caseId:string,method:RecoveryMethodV1,officeReference:string):Promise<RecoveryResultV1<RecoveryCaseV1>>;
};
export type RecoveryMailboxV1={
 verify(caseId:string,code:string):Promise<RecoveryResultV1<never>>;
 password(caseId:string,code:string,password:string,confirmation:string):Promise<RecoveryResultV1<null>>;
};
