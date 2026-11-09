// Registration capabilities are volatile secrets, never Auth sessions or domain authority.
export type RegistrationFailureV2={kind:'invalidEmail'|'invalidCode'|'invalidPassword'|'setupRejected'|'conflict'|'rateLimited'|'needsSupport'|'unavailable'};
export type RegistrationAttemptV2={kind:'checkEmail';attemptId:string;attemptToken:string};
export type RegistrationProofV2={kind:'passwordRequired';setupToken:string;expiresAt:string};
export interface RegistrationV2{
 request(email:string):Promise<RegistrationAttemptV2|RegistrationFailureV2>;
 verify(attemptId:string,attemptToken:string,code:string):Promise<RegistrationProofV2|{kind:'existingAccount'}|RegistrationFailureV2>;
 complete(attemptId:string,setupToken:string,password:string,confirmation:string,requestId:string):Promise<{kind:'complete'|'existingAccount'}|RegistrationFailureV2>;
}
