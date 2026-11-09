import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthResultV1, SessionAccessV1, YouthAuthV1 } from "../../contracts/v1/auth";

// Local synthetic slice only. S1 supplies one origin-local, guarded public client.
export function youthAuthV1(client: SupabaseClient): Omit<YouthAuthV1, "signUp" | "confirm" | "resend"> {
  async function run(work: () => PromiseLike<{ error: { status?: number; code?: string } | null }>,
    success: "ok" | "checkEmail", rejected: "invalidSignup" | "invalidCredentials" | "confirmationRejected" | "unavailable" = "unavailable"): Promise<AuthResultV1> {
    try {
      const { error } = await work();
      if (!error) return { kind: success };
      if (success === "checkEmail" && error.code === "user_already_exists") return { kind: "checkEmail" };
      if (error.status === 429) return { kind: "rateLimited" };
      if (rejected === "invalidSignup") return { kind:
        (error.status === 400 || error.status === 422) &&
        ["weak_password", "email_address_invalid", "validation_failed"].includes(error.code ?? "") ? "invalidSignup" : "unavailable" };
      return { kind: error.status === 400 || error.status === 403 || error.status === 422 ? rejected : "unavailable" };
    } catch { return { kind: "unavailable" }; }
  }
  const api: Omit<YouthAuthV1, "signUp" | "confirm" | "resend"> = {
    signIn: (email, password) => run(() => client.auth.signInWithPassword({ email, password }), "ok", "invalidCredentials"),
    signOut: () => run(() => client.auth.signOut({ scope: "local" }), "ok"),
    async readSessionAccess(): Promise<SessionAccessV1> {
      try {
        const session = await client.auth.getSession();
        if (session.error) return { kind: "error" };
        if (!session.data.session) return { kind: "signedOut" };
        const { data, error } = await client.rpc("platform_get_my_access");
        if (error || !data || ![null, "active", "suspended"].includes(data.account_status) ||
          !Array.isArray(data.roles) || !data.roles.every((x: unknown) => typeof x === "string") ||
          !Array.isArray(data.capabilities) || !data.capabilities.every((x: unknown) => typeof x === "string") ||
          (data.account_status !== "active" && (data.roles.length || data.capabilities.length))) return { kind: "error" };
        const latest = await client.auth.getSession();
        if (latest.error || latest.data.session?.access_token !== session.data.session.access_token ||
          latest.data.session?.user.id !== session.data.session.user.id) return { kind: "error" };
        return { kind: "signedIn", authUserId: session.data.session.user.id,
          access: { accountStatus: data.account_status, roles: data.roles, capabilities: data.capabilities } };
      } catch { return { kind: "error" }; }
    },
    observeSessionAccess(onChange) {
      let revision = 0, live = true;
      const refresh = async () => {
        const current = ++revision;
        if (!live) return;
        onChange({ kind: "loading" });
        const state = await api.readSessionAccess();
        if (live && current === revision) onChange(state);
      };
      const { data } = client.auth.onAuthStateChange(() => {
        ++revision;
        // Never await Auth methods inside Supabase's Auth callback lock.
        queueMicrotask(() => { if (live) void refresh(); });
      });
      void refresh();
      return { refresh, dispose() { live = false; ++revision; data.subscription.unsubscribe(); } };
    },
  };
  return api;
}
