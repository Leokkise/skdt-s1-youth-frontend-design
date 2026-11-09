export type StaffPositionV1 = 'chairperson' | 'treasurer' | 'secretary';
export type BusinessActivityCursorV1 = { recordedAt: string; eventId: string };
export type BusinessActivityEventV1 = {
  eventId: string; actorLabel: string; position: StaffPositionV1; scope: 'auth' | 's1';
  action: 'password_sign_in' | 'auth_logout_committed' | 'registration_decision';
  recordRef: string | null; outcome: 'provider_committed' | 'approved' | 'needs_changes' | 'rejected'; recordedAt: string;
};
export type BusinessActivityPageV1 = { items: BusinessActivityEventV1[]; nextCursor: BusinessActivityCursorV1 | null; displayTimezone: 'Asia/Manila' };
export interface BusinessActivityV1 {
  read(scope?: 'all' | 'auth' | 's1', limit?: number, before?: BusinessActivityCursorV1): Promise<{kind:'ok';data:BusinessActivityPageV1}|{kind:'denied'|'invalid'|'unavailable'}>;
}
