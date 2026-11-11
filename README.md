# SK-DigiTalipapa frontend design handoff

Standalone React / TypeScript / Vite design workspace with fictional data. Prepared from the current local S1 frontend on 2026-11-09, including uncommitted UI edits. The current design was synchronized from S1 frontend commit b5037b5. This repository uses its own fictional preview routes.

## Run locally

Install Node.js 22.12+ and run these commands in this folder.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Browse the youth preview at /youth/dashboard and the fictional staff registry at /admin/youth/demo. Profiling and registry interactions use memory and reset on reload. Submit a fictional example profile to populate the youth profile view.

## Design scope

Edit components in src/ and assets in public/. Existing branding and visual assets are included. Source interfaces used by these components remain under contracts/. This copy has fresh Git history and excludes original internal documents, environment files, backend SQL, local captures, dependencies and generated output.

Backend configuration always returns null in this copy. No database, Docker, organization membership or credentials are required. Authentication, email delivery, saved accounts and privileged actions do not operate. Sign-in and signup show their disconnected presentation. Staff activity and recovery routes show explicit placeholders. The original components remain in src/auth/ for reference and further isolated mock design work.

This public design copy opens fictional staff previews directly. These preview changes belong only to this standalone copy. When transferring designs back, port visual changes and preserve the original application's server authorization and protected routing.

## Check changes

```sh
npm run verify
```

The retained original tests include backend adapter and original source expectations. Some source assertions intentionally differ in this standalone preview copy.
