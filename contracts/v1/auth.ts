// Shared Auth v1 delivery contract. Auth UUID is never a youth UUID.
export type AccessV1 = {
  accountStatus: "active" | "suspended" | null;
  roles: string[];
  capabilities: string[];
};
export type AuthResultV1 =
  | { kind: "checkEmail" }
  | { kind: "ok" }
  | { kind: "invalidSignup" | "invalidCredentials" | "confirmationRejected" | "rateLimited" | "unavailable" };
export type SessionAccessV1 =
  | { kind: "loading" | "signedOut" | "unavailable" | "error" }
  | { kind: "signedIn"; authUserId: string; access: AccessV1 };
export interface YouthAuthV1 {
  signUp(email: string, password: string): Promise<AuthResultV1>;
  confirm(email: string, code: string): Promise<AuthResultV1>;
  resend(email: string): Promise<AuthResultV1>;
  signIn(email: string, password: string): Promise<AuthResultV1>;
  signOut(): Promise<AuthResultV1>;
  readSessionAccess(): Promise<SessionAccessV1>;
  observeSessionAccess(onChange: (state: SessionAccessV1) => void): {
    refresh(): Promise<void>;
    dispose(): void;
  };
}
