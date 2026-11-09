import type {RecoveryResultV1} from './account-recovery';
// Candidate: submitted/account-linked youth only, never a platform directory.
export type RecoverySearchModeV1='name'|'registration';
export type RecoveryReviewStatusV1='pending_review'|'needs_changes'|'approved'|'rejected';
export type RecoverySearchItemV1={responseId:string;displayName:string|null;registrationReference:string|null;reviewStatus:RecoveryReviewStatusV1;activeCaseId:string|null};
export type RecoverySearchCursorV1={mode:RecoverySearchModeV1;query:string;afterResponseId:string};
export type RecoverySelectedV1={subject:{accountId:string;responseId:string;youthId:string;firstName:string|null;surname:string|null;birthdate:string|null};registrationReference:string|null;reviewStatus:RecoveryReviewStatusV1;activeCaseId:string|null};
export type RecoverySearchV1={
 search(mode:RecoverySearchModeV1,query:string,cursor?:RecoverySearchCursorV1):Promise<RecoveryResultV1<{items:RecoverySearchItemV1[];nextCursor:RecoverySearchCursorV1|null}>>;
 selected(responseId:string):Promise<RecoveryResultV1<RecoverySelectedV1>>;
};
