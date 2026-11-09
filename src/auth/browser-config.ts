// Shared by Vite and browser initialization; credentials are public client inputs.
export const hostedDevelopmentUrl = "https://gytudbelakduheltzyqd.supabase.co";
const hostedProjectRef = "gytudbelakduheltzyqd";
type BrowserEnv = {
  VITE_SUPABASE_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};
export function browserConfig(env: BrowserEnv) {
  const mode = env.VITE_SUPABASE_MODE?.trim() || "local";
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (mode !== "local" && mode !== "hosted-development") {
    throw new Error("VITE_SUPABASE_MODE must be local or hosted-development.");
  }
  if (url) {
    let safe = false;
    try {
      const parsed = new URL(url);
      safe = mode === "hosted-development"
        ? url === hostedDevelopmentUrl
        : parsed.protocol === "http:" &&
          (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
          parsed.port !== "" && !parsed.username && !parsed.password &&
          parsed.pathname === "/" && !parsed.search && !parsed.hash;
    } catch { /* Fail closed. */ }
    if (!safe) throw new Error(mode === "local"
      ? "VITE_SUPABASE_URL must point to the local loopback API."
      : "Hosted development requires the approved project URL exactly.");
  }
  if (anonKey) {
    let safe = /^sb_publishable_[A-Za-z0-9_-]+$/.test(anonKey);
    if (!safe) {
      try {
        const parts = anonKey.split(".");
        const payload = parts[1].replaceAll("-", "+").replaceAll("_", "/");
        const claims = JSON.parse(atob(payload));
        safe = parts.length === 3 && claims.role === "anon" &&
          (mode === "local" || claims.ref === hostedProjectRef);
      } catch { safe = false; }
    }
    if (!safe) throw new Error("VITE_SUPABASE_ANON_KEY must be a public anon/publishable key for the selected project.");
  }
  if (!url || !anonKey) {
    if (mode === "hosted-development") throw new Error("Hosted development requires both Supabase browser inputs.");
    return null; // Preserve the existing local setup/unavailable state.
  }
  return { mode, url, anonKey };
}
