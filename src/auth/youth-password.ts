import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PasswordResultV1, YouthPasswordV1 } from "../../contracts/v1/password";

// Recovery never overwrites the normal app session or detects tokens in a URL.
export function youthPasswordV1(client: SupabaseClient, url: string, publicKey: string): YouthPasswordV1 {
  const recovery = createClient(url, publicKey, { auth: {
    persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
  } });
  let busy = false;
  async function run(work: () => Promise<PasswordResultV1>): Promise<PasswordResultV1> {
    if (busy) return { kind: "rejected" };
    busy = true;
    try { return await work(); } catch { return { kind: "unavailable" }; } finally { busy = false; }
  }
  function result(error: { status?: number; code?: string } | null, success: "ok" | "checkEmail" = "ok"): PasswordResultV1 {
    if (!error) return { kind: success };
    if (error.status === 429) return { kind: "rateLimited" };
    if (error.code === "weak_password" || error.code === "same_password") return { kind: "invalidPassword" };
    return { kind: [400, 401, 403, 422].includes(error.status ?? 0) ? "rejected" : "unavailable" };
  }
  const validPassword = (password: string, confirmation: string) => password === confirmation && password.length >= 8 && password.length <= 72;
  async function signOutAfterUpdate(target: SupabaseClient, scope: "local" | "global"): Promise<boolean> {
    try { return !(await target.auth.signOut({ scope })).error; } catch { return false; }
  }
  return {
    change: (currentPassword, password, confirmation) => run(async () => {
      if (!currentPassword || !validPassword(password, confirmation)) return { kind: "invalidPassword" };
      const current = await client.auth.getUser();
      if (current.error || !current.data.user?.email) return { kind: "rejected" };
      // A fresh provider password login supplies reauthentication even when the
      // provider does not enforce the optional current_password update field.
      const fresh = createClient(url, publicKey, { auth: {
        persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
      } });
      const login = await fresh.auth.signInWithPassword({ email: current.data.user.email, password: currentPassword });
      if (login.error) return result(login.error);
      if (login.data.user.id !== current.data.user.id) {
        await fresh.auth.signOut({ scope: "local" });
        return { kind: "rejected" };
      }
      // Discard the password-check session, then update through the browser's
      // existing session so the provider preserves that session after the change.
      if (!await signOutAfterUpdate(fresh, "local")) return { kind: "unavailable" };
      const checked = await client.auth.getUser();
      if (checked.error || checked.data.user?.id !== current.data.user.id) return { kind: "rejected" };
      return result((await client.auth.updateUser({ password })).error);
    }),
    requestRecovery: email => run(async () => result((await recovery.auth.resetPasswordForEmail(email)).error, "checkEmail")),
    confirmRecovery: (email, token) => run(async () => {
      await recovery.auth.signOut({ scope: "local" });
      return result((await recovery.auth.verifyOtp({ email, token, type: "recovery" })).error);
    }),
    finishRecovery: (password, confirmation) => run(async () => {
      if (!validPassword(password, confirmation)) return { kind: "invalidPassword" };
      const recovered = await recovery.auth.getUser();
      if (recovered.error || !recovered.data.user) return { kind: "rejected" };
      // Provider validates the bearer session; a cached UI flag grants nothing.
      const updated = await recovery.auth.updateUser({ password });
      if (updated.error) return result(updated.error);
      const signedOut = await signOutAfterUpdate(recovery, "global");
      let normal;
      try { normal = await client.auth.getSession(); } catch { return { kind: "signOutRequired" }; }
      if (normal.error) return { kind: "signOutRequired" };
      // Clear only the recovered account's stale cache after success, never another user.
      const cleared = normal.data.session?.user.id === recovered.data.user.id
        ? await signOutAfterUpdate(client, "local") : true;
      return signedOut && cleared ? { kind: "ok" } : { kind: "signOutRequired" };
    }),
    cancelRecovery: () => run(async () => result((await recovery.auth.signOut({ scope: "local" })).error)),
  };
}
