import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { localBrowserConfig as browserConfig } from "./src/auth/local-config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  browserConfig(env);
  for (const [name, value] of Object.entries(env)) {
    if (/SECRET|PASSWORD|TOKEN|SERVICE_ROLE/i.test(name) || /sb_secret_|sbp_/.test(value)) {
      throw new Error("Privileged credentials must not enter VITE configuration.");
    }
    let credentialUrl = false;
    try {
      const parsed = new URL(value);
      credentialUrl = Boolean(parsed.username || parsed.password) ||
        parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";
    } catch { /* Non-URL public configuration is allowed. */ }
    if (credentialUrl) throw new Error("Credential-bearing URLs must not enter VITE configuration.");
    let role: unknown;
    try {
      role = JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString("utf8")).role;
    } catch { /* Non-JWT public configuration is allowed. */ }
    if (role && role !== "anon") throw new Error("Nonpublic JWT in VITE configuration.");
  }
  return { plugins: [react()], server: { port: 5174, strictPort: true } };
});
