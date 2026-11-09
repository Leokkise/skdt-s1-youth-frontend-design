import type { browserConfig } from './browser-config';
export function localBrowserConfig(_env: Parameters<typeof browserConfig>[0]): ReturnType<typeof browserConfig> {
  return null; // Public design copy uses fictional in-memory previews only.
}
