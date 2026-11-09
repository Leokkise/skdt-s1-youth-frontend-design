export type PasswordResultV1 = { kind: "ok" | "checkEmail" | "invalidPassword" | "rejected" | "rateLimited" | "unavailable" | "signOutRequired" };
export interface YouthPasswordV1 {
  change(currentPassword: string, newPassword: string, confirmation: string): Promise<PasswordResultV1>;
  requestRecovery(email: string): Promise<PasswordResultV1>;
  confirmRecovery(email: string, code: string): Promise<PasswordResultV1>;
  finishRecovery(newPassword: string, confirmation: string): Promise<PasswordResultV1>;
  cancelRecovery(): Promise<PasswordResultV1>;
}
