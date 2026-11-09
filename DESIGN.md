2026-11-09 Youth account pages share the crumpled paper frame, Source Sans 3 headings, graph-paper corners and torn bottom edge. The dashboard progress panel and cards carry their own navy stitching and paper surfaces, so the same design appears after sign-in and on return from My profile. The ID preview uses the quieter paper texture behind the lanyard.

2026-11-09 contact/shared-paper refinement IMPLEMENTED: compact address/directions beside wider map; stacked at <=900px, 16px address text, >=44px single external directions link and semantic map figure/caption. Existing address/coordinates and lazy Google embed retained; duplicate caption link removed. All five landing sections now reuse civic-paper for texture/tear layers with CSS variables preserving decorated Services layering and stable softened FAQ texture; no new dependencies/assets. Thirteen-width fixture checks pass for contact/FAQ/shared layers, Services/guide and public demographics; desktop/phone captures inspected. External Google iframe requests are blocked in these fixture checks, so live map availability is not verified. No shared contracts/backend writes/publication.

2026-11-09 FAQ size adjustment: reduced question and answer text from 18px to 16px at user request; answers use 1.7 line height. Dark navy text, full answer width, responsive columns and stable paper retained. Required verify and updated 13-width browser fixture checks pass with existing build warnings. No backend testing.

2026-11-09 FAQ readability follow-up: questions use 18px bold text; answers use 18px navy text with 1.75 line height and full available row width. FAQ desktop column widened; <=1000px remains stacked. Removed expanding blue open-row fill; softened paper uses fixed 960px repeating texture instead of cover, keeping texture scale/position stable as answers open. Required verify PASS with existing warnings. Updated 13-width rendered fixture checks PASS including transparent open rows, exact answer size/color, unrestricted answer width and invariant texture sizing/position; desktop/phone captures inspected. No backend/hosted testing.

2026-11-09 FAQ: eight questions cover eligibility, starting, saved drafts, review status, corrections, approval-gated ID preview, privacy and combined account recovery/changes. Removed duplicate getting-started note; browser-only photo guidance lives beside upload. Full-width FAQ reuses Services white paper texture and torn edges, with transparent accordion rows, pale-blue open state and visible keyboard focus. Desktop uses two columns; tablets/phones at <=1000px stack intro above questions.

Date label restored to white/dashed styling with a bolder date. Community banner uses slightly darker medium blue (#355f85), compact mobile type/padding and smaller decorative stamp; narrow phones hide only the stamp to preserve reading space. Other approved elements unchanged.

Services now has matching graph-paper upper-left and upper-right accents; the navy lower-left accent is removed. Both reuse one asset with CSS mirroring and retain foreground layering/tear treatment. Demographics As-of label uses a more visible pale-blue fill (#dbe8f6), navy text and defined border. Other styling/data unchanged.

Youth demographics refinement: all four statistic cards are plain white with consistent blue-gray borders and blue values; the total has no blue fill or stitching. Paper texture and torn top/bottom silhouettes belong to the section backdrop. Labels, counts, disclosure, date and responsive grid unchanged.

Youth demographics now uses the same white scrapbook paper and blue palette as preceding sections. Four responsive aggregate cards retain exact values: the total card is medium blue with inset white stitching, age-band cards are white paper with refined blue-gray borders. The heading explains that approved profiling submissions are not the total youth population; total label is Approved youth profiles (ages15–30). Date/unavailable states preserved; four columns become two on mobile. Other sections unchanged.

How it works paper now exactly shares the Services white base and paper material, with subtle64px top/bottom tear silhouettes and a4px pale backing. Stitched blue banner, steps, typography, layout and hover/reduced-motion behavior unchanged. No new assets.

How it works palette update: neutral off-white paper base (#f8f9f7), replacing the blue tint. Community banner uses medium denim-blue (#426e95), rounded16px edges and an inset2px white dashed stitch border, inspired by the reference. Banner text/label, guide content, layout and hover animation unchanged; no new assets.

How it works now closes with a non-interactive navy paper banner: “Your voice. Our community.”, supportive community copy and a small tilted Kabataang Talipapa paper label. It reuses the existing material/tear SVGs, stacks on phones and adds no redirect CTA. Existing guide/hover behavior, Services and hero unchanged.

How it works refinement corrected: original two-column intro, tilted white step markers, blue numbered badges, dashed connectors and hover-straighten animation restored, with reduced-motion support. Background reuses the existing Services paper material tinted pale blue. Original intro copy restored; step text retained apart from the previously approved non-Coming-soon events wording. Duplicate CTA remains removed. Services and hero unchanged.

How it works: quiet pale-blue background (#f0f5fb to #e6eff9), centered Source Sans heading, five connected white icon markers with navy numbered badges. Horizontal above1000px, vertical below; phone markers52px. Duplicate account/dashboard CTA removed. Last step describes intended event participation without a Coming soon badge or live events link. Services/hero unchanged.

Youth Services uses the approved white scrapbook paper, layered torn edges and reference grid-paper top-right/navy bottom-left accents. Current decorative geometry and colors are unchanged. A larger Braah One heading introduces the section, with concise Source Sans 3 supporting copy. Card borders use a more visible1px blue-gray (#829ab7), retaining existing hover/focus behavior. Only Services typography/borders are refined; hero and other UI remain unchanged. [Current framing](docs/SERVICES_FRAMING.md), [historical iterations](docs/history/SERVICES_DESIGN_ITERATIONS_2026-11-09.md).

2026-10-29 loading refinement: Skeleton fill uses --skeleton-base #e8edf0 (reference pale gray), independently of UI borders; --skeleton-highlight #f4f6f7 adds the soft highlight. Preserve semantic table columns, visible headings/controls and real component typography. Loading/refetch must not remount same-record profile history or insert an extra loading paragraph above retained results. Analytics work/education and cross-tabulation reserve three row slots in scrollable category regions at existing responsive breakpoints; Expand remains available. Dashboard preview lists reserve their three expected slots.

---
2026-10-26 dashboard-only progress follow-up: removed the progress tracker from saved youth profiling; it remains on the dashboard only. Blue background with white readable copy/markers and24px top margin. Removed About your submission from youth profiling while preserving separate staff walk-in guidance. Draft route guards and server submission/consent behavior unchanged. Verify and mocked1440/390 route/progress/submit/correction regression pass, including computed blue color/top margin and absence of tracker/notice on profiling. Desktop capture inspected; no backend/database writes.

2026-10-26 youth progress: restore the user-requested tracker before dashboard cards and on draft profiling. White surface, green completed markers/connectors, blue current marker, muted future stages; four clear Account/Youth profiling/Staff review/Review outcome labels. Desktop is horizontal; phone is vertical. aria-current identifies current step, and text carries status independently of color. Completed review outcomes mark all steps complete. Header/menu say Youth Profiling/Continue youth profiling until a saved submission is confirmed.

name: SK-DigiTalipapa Civic System
description: The implemented civic system across S1 landing, youth, account, profiling and staff pages.
colors:
  mist: "#EAF0F7"
  sky: "#7FADE0"
  blue: "#0038A7"
  navy: "#061A4D"
  white: "#FFFFFF"
  supporting-text: "#345475"
  divider: "#d4e2f0"
  hero-highlight: "#bcd8f5"
  inverse-body: "#e4eef9"
  inverse-muted: "#c6d9ef"
  footer-ground: "#041c3e"
  portal-ground: "#f5f8fc"
  field-border: "#aac1d9"
  muted-text: "#526880"
  staff-hover: "#123d70"
  field-error: "#a51f37"
typography:
  display:
    fontFamily: "'Braah One', 'Source Sans 3', sans-serif"
    fontSize: "clamp(2.8rem, 4.6vw, 4.65rem)"
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: "-.025em"
  page-heading:
    fontFamily: "'Braah One', 'Source Sans 3', sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-.025em"
  headline:
    fontFamily: "'Braah One', 'Source Sans 3', sans-serif"
    fontSize: "clamp(1.9rem, 3vw, 2.65rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-.025em"
  title:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: "1.4rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: "1rem"
    lineHeight: 1.7
  label:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: ".95rem"
    fontWeight: 600
  statistic:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: "3.4rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  note: "4px"
  action: "5px"
  disclosure: "6px"
  inset: "8px"
  card: "12px"
  statistic: "10px"
  account-trigger: "24px"
spacing:
  inline: ".7rem"
  action-gap: "1rem"
  card-gap: "1.6rem"
  card-padding: "1.7rem"
  section-gap: "2rem"
  major-gap: "5rem"
  portal-gap: "24px"
  portal-inset: "20px"
  portal-card-padding: "clamp(20px, 3vw, 32px)"
components:
  portal-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.disclosure}"
    padding: ".8rem 1.15rem"
  portal-primary-hover:
    backgroundColor: "{colors.navy}"
  portal-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.disclosure}"
    padding: ".75rem"
  portal-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.card}"
    padding: "{spacing.portal-card-padding}"
  staff-navigation:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.inverse-body}"
    rounded: "{rounded.disclosure}"
    padding: "13px 12px"
  staff-navigation-current:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
  sample-statistic:
    backgroundColor: "{colors.white}"
    textColor: "{colors.blue}"
    rounded: "{rounded.statistic}"
    padding: "24px"
  hero-primary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.action}"
    padding: "1rem 1.25rem"
  hero-primary-hover:
    backgroundColor: "{colors.mist}"
  login-solid:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.action}"
    padding: ".7rem 1rem"
  login-solid-hover:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.white}"
  section-navigation:
    typography: "{typography.label}"
    padding: ".8rem 0"
  service-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.card}"
  service-copy:
    padding: "{spacing.card-padding}"
  faq-row:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    padding: "1.2rem 0"
  service-information:
    backgroundColor: "{colors.mist}"
    rounded: "{rounded.disclosure}"
    padding: "1.1rem 1.3rem"
---

# Design System: SK-DigiTalipapa Civic System

## Overview

**Creative North Star: "Talipapa Civic Home"**

A familiar barangay website and workspace built around the supplied SK seal, traditional civic headings, clear navigation and community imagery. The retained blue, navy and white foundations carry the identity across the landing, youth, account, profiling and staff pages. Enhanced supplied community photos lead the landing; authored service illustrations identify its three subsystems.

This source-extracted record covers the human-authorized civic expansion across S1-owned pages, including the landing/header/footer, account and youth screens, profiling form, staff registry and reports. The portal stylesheet extends the original [S1-011 direction](specs/S1-011-barangay-landing.md) through shared typography, white cards, compact actions and a navy staff sidebar. It remains a local S1 system; shared integration ownership and synthetic workflow limits are unchanged.

**Key Characteristics:**

- Seal-led identity with a left brand, central section links and right account action.
- Braah One public and youth display headings with Source Sans 3 body text, labels and staff headings.
- White surfaces, thin blue-gray dividers and restrained rounding.
- A full-viewport enhanced community-photo hero and authored service art.
- Light-mist work surfaces, clear form steps and a navy staff workspace sidebar.
- Conventional disclosures, visible keyboard focus and responsive reading order.

Extraction sources are [landing CSS](src/landing/landing.css), [portal overrides](src/landing/portal.css), [landing components](src/landing/CivicLanding.tsx), [staff shell](src/demo/StaffShell.tsx) and inherited palette/focus rules in [global CSS](src/styles.css). Styles load in that order, so portal overrides are authoritative for the expanded surfaces. [LANDING_ASSETS.md](docs/LANDING_ASSETS.md) owns image provenance and public references. Engine extraction was unavailable; values were read manually. Delivery and verification evidence belong in [CURRENT_STATE.md](docs/CURRENT_STATE.md), without hosted or production acceptance.

## Colors

The primary palette combines deep civic navy and clear blue with sky, mist and white. The frontmatter owns the extracted values; additional one-off borders and compositing values remain in source.

### Primary

- **Civic Blue** (`blue`): solid-header account action, service actions, location icons and disclosure indicators.
- **Civic Navy** (`navy`): principal text, hero ground, staff sidebar and total-sample card.
- **Sky Blue** (`sky`): text selection and footer focus outlines.
- **Hero Pale Blue** (`hero-highlight`): the second hero heading line and secondary-link hover.

### Neutral

- **White** (`white`): page cards, form fields, FAQ, solid header and staff topbar; inverse hero text and the primary hero action.
- **Portal Mist** (`portal-ground`): youth/account/staff work surface and light demographics section.
- **Field Border** (`field-border`): field outlines and secondary-action strokes.
- **Muted Text** (`muted-text`): field hints, report descriptions and statistic annotations.
- **Staff Hover** (`staff-hover`): sidebar navigation hover on navy.
- **Field Error** (`field-error`): inherited form-validation feedback.
- **Mist** (`mist`): contact section, service disclosure and light-action hover.
- **Supporting Blue-Gray** (`supporting-text`): explanatory text on light sections.
- **Divider Blue-Gray** (`divider`): service-card outlines, FAQ rows and help-note boundaries.
- **Inverse Body** (`inverse-body`): supporting hero copy and default staff sidebar links.
- **Inverse Muted** (`inverse-muted`): footer links, captions and statistics annotations.
- **Footer Ground** (`footer-ground`): the darker closing band.

**The Civic Palette Rule.** Preserve the implemented blue/navy/white identity across S1-owned pages. Illustration colors do not create additional UI accent tokens.

## Typography

**Display Font:** Self-hosted Braah One with Source Sans 3 as its fallback.

**Body Font:** Self-hosted Source Sans 3, registered as “Source Sans 3,” with Segoe UI and sans-serif fallbacks.

The serif page headings give the landing and operating screens a traditional civic voice. The sans-serif supports navigation, longer descriptions, card titles and numeric summaries. Both font faces use variable weights and `font-display: swap`; the shipping WOFF2 files and OFL notices are under `public/fonts/`.

### Hierarchy

- **Display** (`display`): left-aligned hero heading, balanced wrapping and a separate pale-blue second line.
- **Headline** (`headline`): landing section headings.
- **Page Heading** (`page-heading`): youth, account, profiling, staff and completion h1 headings.
- **Title** (`title`): sans-serif service-card headings; portal card headings use weight 650.
- **Body** (`body`): service and FAQ paragraphs; introduction copy ranges from 1.05rem to 1.13rem in source.
- **Label** (`label`): section navigation. Account actions use the same size with weight 700.
- **Statistic** (`statistic`): tabular numbers; annotations remain smaller and subordinate.

Hero copy uses distinct measured widths: heading up to 950px, introduction up to 650px and description up to 480px. At 760px and below, the display becomes `clamp(2.5rem, 6.6vw, 3.6rem)`; at 520px and below it becomes `clamp(2rem, 8vw, 2.9rem)` with line height 1.27. Card titles shrink to 1.2rem at the 1000px breakpoint and return to 1.4rem in stacked mobile cards.

**The Civic Type Rule.** Use Braah One for public and youth page headings, and Source Sans 3 for staff headings, controls, card titles, navigation and working content.

## Layout

The civic container is centered, capped at 1240px, with width `min(100% - 5rem, 1240px)`. At 1200px and below its outer allowance becomes 3rem; at 520px and below it becomes `calc(100% - 2.5rem)`.

The hero fills at least the small viewport height (`100svh`, with `100vh` fallback). Live heading and actions occupy the left; artwork covers the section behind a navy overlay. Desktop hero padding is 160px above and 110px below. Section spacing is generous: services 90px/70px, demographics 72px, FAQ 95px, contact 80px. Portal pages use their own tighter operating rhythm: main content has 32px/64px vertical padding, card padding is fluid between 20px and 32px, and common gaps are 24px.

Desktop uses three service columns, four statistic columns, two-column section introductions/FAQ/contact, and a three-column footer. The youth header uses three regions, a minimum height of 96px and a centered navigation region. Profiling places a 225px step sidebar beside the form with a 24px gap; the sidebar sits below the civic header at 116px. Account cards cap at 560px. The staff workspace pairs a 252px navy sidebar with flexible content, a 72px white topbar and a body container capped at 1200px with 64px outer allowance.

- **1200px and below:** reduce container allowance, brand size and selected gaps.
- **1000px and below:** header becomes brand plus actions, minimum height 84px; a menu disclosure replaces inline navigation. Card copy reduces to 1.3rem padding.
- **760px and below:** services, introductions, FAQ and contact stack; statistics form two columns; footer has a full-width identity row above two columns. Hero image centers at 62%; hero padding becomes 135px/105px. Map height changes from 360px to 320px.
- **520px and below:** header minimum height is 80px, seal becomes 40px and hero actions stack. Header action icon hides while its text remains. Statistic labels and footer identity shrink.
- **360px and below:** seal becomes 34px, brand/action sizing tightens, account-name text hides and footer becomes one column.

Portal-specific breakpoints add: at 1100px the staff sidebar narrows to 225px, analytics and staff profiling stack, and staff container allowance becomes 40px. At 850px profiling stacks and staff navigation becomes a sticky top disclosure with a 58px topbar. At 700px fields become one column, statistics stay two columns, dashboards/task links/analytics stack, and statistic-card padding tightens. At 400px staff container allowance becomes 32px, cards use 18px padding and landing statistic numbers become 2.8rem. Report tables retain a 400px minimum width inside a horizontal-scroll wrapper.

Landing section targets reserve 110px of scroll margin. Hash navigation scrolls to the target even when arriving from another S1 screen; a route without a hash resets to the top. Preserve source reading order as grids collapse.

## Elevation & Depth

The civic system is mostly flat. White cards on mist work surfaces, navy navigation, thin dividers and imagery carry hierarchy. Hero contrast comes from layered navy gradients, not a shadow behind the heading. Primary hero action, portal actions, form/profile cards, staff metric cards and service cards have no box shadow.

### Shadow Vocabulary

- **Solid header:** `0 3px 16px #061A4D0f`, distinguishing the white navigation surface after scrolling.
- **Mobile menu:** `0 10px 18px #061A4D0f`, beneath the disclosed navigation.
- **Existing account panel:** `0 12px 32px #061A4D26`, inherited from the established presentation account menu.

The header transitions background, text color and shadow over .25s with `ease-out`. Sample counters animate once when 40% visible, over 1000ms with cubic ease-out (`1 - (1 - progress)^3`). Reduced-motion preference shows the final count immediately when visible, removes the header transition and changes document scrolling to `auto`. A screen-reader-only final value accompanies the visual counter, avoiding repeated announcements.

## Shapes

Actions use modest corners (`action`); service cards use the larger `card` radius with clipped illustration edges. Inset map and service-icon tiles use `inset`; service disclosures use `disclosure`; the sample note uses `note`. The supplied seal remains circular and retains its artwork.

Borders are generally a single thin stroke. FAQ entries are straight divided rows rather than individually rounded cards. Portal controls use six-pixel corners, metric cards use ten-pixel corners, and account-menu triggers use 24px rounding. The account panel now has a 12px radius and a thin divider border.

## Components

### Header and navigation

The S1 public header is transparent above the landing hero and becomes solid white after 24px of scrolling or when the mobile menu opens. Its desktop bar uses 16px vertical and 40px horizontal padding, with the SK-DigiTalipapa seal and name, a Manila clock where space allows, and a blue Youth Profiling or Youth dashboard action. The brand and Home link target /youth, and the Home disclosure retains Services, Demographics, Help / FAQ and Contact with scroll-based section indication. Transparency & Reports and Events & Programs are static labels. Account actions remain available and the navigation collapses at 1150px. This is S1-local presentation.

Mobile menu is an ordinary button-controlled disclosure with `aria-expanded` and `aria-controls`. Escape closes it and restores focus to the toggle; outside pointer interaction, route/hash changes and section selection close it. Its closed links leave the visual/tab flow via `display: none`. No focus trap is introduced. Staff routes show the existing staff workspace link; presentation account state controls the existing account menu or account CTA.

### Actions and links

The primary hero action is a white surface with navy text, modest corners and an inline arrow; hover uses mist. The solid-header account CTA is blue with white text and becomes navy on hover. Over the hero, its resting surface is white with navy text. Secondary hero text remains underlined; service/inline actions gain an underline on hover.

Keyboard focus uses the inherited three-pixel outline with a three-pixel offset. Header focus takes the current foreground color; footer focus uses sky. The skip link becomes visible on focus and sits above the header. Portal primary actions use blue with white text and navy hover, six-pixel corners, weight 650 and `.8rem 1.15rem` padding. Secondary actions use thin field-border strokes. Existing disabled account controls and form errors remain workflow-specific; they do not imply a backend service.

### Service cards and disclosures

The desktop service grid is capped at 1160px. Each card combines an approved scrapbook illustration, an inset line icon and a compact pale-blue copy/action region. Centered `cover` sizing in a 1.12:1 image area fills the desktop card edge to edge. At 760px and below, cards become compact horizontal rows: a 96–150px square thumbnail beside wrapping text and the action, with 12px padding and 14px between cards. Redundant thumbnail icons are hidden. The complete square illustration stays visible on phones. Hover/focus lifts the card, softly zooms the image and turns the circular arrow; reduced motion removes spatial animation.

Each card has one whole-card semantic link or button with a visible keyboard focus outline. Signed-out visitors go to the existing sign-in route; resolving sessions temporarily disable the cards. Signed-in profiling uses the existing draft/dashboard destination. Signed-in transparency and events buttons disclose an explicitly Coming soon status region and scroll it into view; these services remain unconnected. Account state changes only presentation destinations, never server authority.

### Profiling and account surfaces

White profile/account cards sit on the light-mist page ground. Fields use thin blue-gray borders, six-pixel corners and inherited Source Sans; readonly fields use portal ground. The current profiling step is blue with white text, while completed steps use mist. Notices use a three-pixel blue left rule, small corners and compact body text. Existing validation, correction and account interactions remain synthetic presentation behavior.

### Staff workspace

A full-height sticky navy sidebar shows Dashboard, KK Youth Registry, Reports & Analytics and Walk-in Registration, followed by Public website and Sign out. Current route uses a white background and navy text; hover uses the extracted darker blue. The topbar identifies Barangay Talipapa and marks the demo workspace. At 850px and below the sidebar becomes a sticky top band with a button-controlled navigation disclosure. Route changes close it; Escape closes it and returns focus to the toggle. Staff pages use white 12px cards, blue tabular metric figures and slim eight-pixel report bars. Reports retain horizontal table scrolling when needed.

### Demographics

A light-mist section pairs the Demographics heading with the snapshot date. A navy total and three white age-group cards present the returned counts in a four-column grid that becomes two columns on phones. The unavailable message appears alongside the heading when the feed is unavailable.

### FAQ

Native `details`/`summary` rows retain keyboard disclosure behavior. A plus becomes a minus when open, hover changes summary text to blue and answers flow below the question. The landing does not invent bespoke accordion keyboard controls.

### Map and contact

The framed, lazily loaded map has a descriptive title and a separate external-map link. It uses the official Quezon City directory's barangay reference (14.687658, 121.025464) at area zoom. It is not an exact SK-office marker. The current address is shown alongside the map. Keep factual address/social provenance in the canonical asset/current-state documents; visual extraction does not approve contact claims.

### Footer and imagery

The dark footer repeats seal/identity, task-oriented quick links and the configured Facebook connection, then closes with a divided copyright/staff-access row. Footer links include profiling, dashboard, profile, account help and staff sign-in. Current contact/social destinations are recorded by the canonical provenance documents.

The supplied logo is preserved. The enhanced supplied-photo hero ships as `talipapa-community-collage.webp`, replacing the earlier generated hero. Its visible caption identifies enhanced community photos; it is decorative with empty alt text. The approved service illustrations ship separately as `youth-profiling-scrapbook.png`, `transparency-projects-scrapbook.png` and `events-programs-scrapbook.png`, hidden from assistive technology because live headings provide meaning. The obsolete service strip and standalone old seal file have been removed; the favicon retains its embedded seal. Exact editing prompts and provenance belong in [LANDING_ASSETS.md](docs/LANDING_ASSETS.md).

## Do's and Don'ts

### Do:

- **Do** preserve the blue/navy/white identity and supplied SK seal across S1-owned pages.
- **Do** use the extracted civic typography for youth, account, profiling and staff pages.
- **Do** preserve native disclosures, visible keyboard focus, Escape restoration and reduced-motion behavior.
- **Do** display only approved public demographics and identify the enhanced supplied-photo hero accurately.
- **Do** keep map/contact/social facts aligned with canonical provenance documents.

### Don't:

- **Don't** apply the landing's spacious hero measurements to compact profiling, registry and report layouts.
- **Don't** describe the enhanced supplied-photo hero as the superseded fictional generated illustration.
- **Don't** invent contact/social facts or imply a map reference grants office-location certainty.
- **Don't** represent presentation account state, service disclosures or local review as delivered authentication, backend integration or production acceptance.

## S1-013 refinements

S1-015 navigation follow-up: Youth Profiling is the signed-out entry, with the existing sign-in redirect. During the fictional signed-in session it becomes Youth dashboard and targets /youth/dashboard. Its current-page underline follows that destination. The same conditional link appears in the mobile disclosure.

The [presentation clarity scope](specs/S1-013-youth-presentation-clarity.md) removes footer Quick links. [S1-014](specs/S1-014-presentation-insights.md) uses five landing stages including future events, a centered medium-blue journey (#2265a2) and visible connectors. S1-015 supersedes its blue answer surfaces with white and soft neutral dividers (#dce3ea). Progress reflects actual tab-session state; events remain future. Icons are authored SVGs with consistent 1.7px strokes.

Supporting tokens in portal.css: surface-soft #f7f9fb, border-soft #dce3ea, text-muted #526273, review-surface #fff8e9, review-ink #78551a, success-surface #edf7f2, success-ink #216047. Amber means awaiting review; coral means requested changes; green means sample approval. Text accompanies color. Form subgrid shares label/control/feedback rows; mobile stacks in source order. Picture controls stay on My profile; settings covers account/service rows. Staff dashboard emphasizes workload and contextual actions; reports use filtered denominator labels, visible empty states and contained table scrolling.

S1-014 QR-page follow-up: four centered dashboard stages ending at review; five landing guide stages including future events. QR generation uses a centered maximum-560px standalone panel at /youth/qr; its compact dashboard navigation card cannot stretch adjacent cards.

S1-016 QR sample: the panel expands to a maximum 900px with the fixed fictional profile beside the code on desktop, stacking at 760px. An 88px circular generated default avatar (72px mobile), restrained name heading and six text fields introduce the sample. Two-column fields stack on mobile. A simple divider separates the introduction from the preview/generation region. QR encodes only the displayed fictional basic-info text and disclaimer; the avatar stays in the preview. It is independent of youth answers and optional picture uploads.

S1-015 task surfaces: navy profile card with inverse copy and white action; white QR card with a blue top rule and action; mist rewards card with a dashed unavailable outline. All retain equal desktop height and stack on mobile. Analytics uses proportional age columns, substantial horizontal comparison bars, a work composition strip and a gender donut with count/percentage legends. SVG chart geometry is decorative to assistive technology; visible definition lists carry every category/value in semantic order. Registry badges pair clock/edit/check icons with amber/coral/green text; primary review actions stay at .9rem (14.4px) with 44px minimum height.

2026-10-25 staff extension: Activity Logs reuses the civic staff shell, blue/neutral palette and labeled native selects. Full history uses a semantic table with a horizontally scrollable region on phone; dashboard keeps the five newest visible entries and a View all activity logs link. Historical name/position grouping is explicitly disclosed.

Registry lists show name and permanent Registration No., review status and Review profile. Temporary row numbers and quick-summary controls are removed. Ten profiles per page; footer includes a page selector, total pages, numbered buttons with current-page indication and bounded ellipses, plus Previous/Next. Phone rows retain the stacked layout.

Client presentation copy uses professional service/account/registration labels. Demo provenance lives in docs/CLIENT_PRESENTATION.md; relevant storage, access, review and QR limitations remain visible. Display formatting never mutates stored records, status values or identifiers.

Staff-page spacing: staff main containers use the available workspace width with 40px side gutters on desktop and 20px on phones, without a content max-width. Card interiors retain padding. Staff page headers show the title without a descriptive subtitle; the youth profiling introduction remains unchanged.

Use Registration No. for the permanent youth registration identifier in labels, search and exports; use registration number in sentences. KK Youth Registry remains the workspace name.

Registry scanability: profile names use bold 1rem text, registration numbers use a distinct semibold blue value beneath a muted label. Desktop table columns reserve 40% for profile, 30% for status and 30% for action, with centered status/action and header separators. Pagination uses Page, a selector, total pages and a baseline-aligned 10 per page label. Stored profile names are not replaced.

Registry review header groups name/age/education with Registration No. and reporting date in a compact wrapping metadata row; removed duplicate body metadata and heading top margin.

Staff answer sections open by default. Toggle headers use a light blue surface and darker hover shade, distinct from white answer bodies. Initial expansion does not auto-scroll; manually reopening retains the existing scrolling behavior.

Needs changes detail: saved correction note appears near the top with its actor/time and an honest untargeted-note label. Review history opens for Needs changes and groups decision badge, note and attribution. History and Encoded by share a two-column evidence area, stacking on phone. Existing per-answer section targeting remains a backend handoff dependency.

Pending targeted-review UI: a controlled field picker groups allowed answers by section. Selecting an answer reveals its dedicated correction note and highlights the row; selected sections open. Integrate only with accepted server-supported target persistence, never silently drop selections through the legacy generic-note API.

Pending S1-031 UI: sibling row orders Name, Birthdate, read-only calculated Age, Remove; phone places Birthdate immediately left of Age. Full-profile export dialog checks all five sections initially and offers PDF section tables / Excel section worksheets. Connect only to accepted sibling persistence and approved full-export authority.

Registry success/status feedback uses a right-side toast with a three-second countdown and manual dismiss button. Hovering or keyboard focus pauses dismissal. On phone it stays within the viewport; error messages remain persistent.

Approved registry export now shows Sections to include, five preselected section cards, each with its field labels. Record scope and filters remain. Full downloads require an accepted provider loader; readiness is explicit.

2026-10-28 dashboard color refinement: blue/white remain primary. Added amber pending-review summaries/statuses, warm orange follow-up, green approvals/completed recovery, blue totals and teal analytics values. Text labels/icons remain alongside every color. Normal/hover/status foreground pairs measured at least5.54:1; desktop/phone dashboard checks and verify pass. Presentation only; permissions/data unchanged.

2026-11-02 youth dashboard refinement: carries the Digital Youth ID popup's navy, pale blue, restrained star and circular linework into the youth workspace only. Progress stays prominent; two functional action cards precede a quiet future-service strip. Single-column phone layout retains all status/action semantics. No global navigation or shared authorization change.

2026-11-02 youth progress explicitly displays review outcome with text, icon and matching established status color. Rejected uses a cross; approval uses a check; changes use edit. Pale blue star/curve backdrop adds continuity with ID without changing account or review rules.

2026-11-04 dashboard refinement: scoped to youth-workspace containing the progress journey. Existing navy/blue/white identity, stars and orbital geometry now carry broad pale-blue atmosphere, shaded card surfaces and 240–300ms ease-out hover/focus feedback. Profile/ID cards lift 4px; icon rotation and orbit movement are bounded to interaction. Rewards retain unavailable copy and ordinary pointer semantics. Reduced-motion mode has no spatial motion. Other youth screens and shared shell retain their incumbent styling.

2026-11-04 dashboard follow-up: left background constellation balances the right orbits. Progress panel has a quiet lower-left arc; hovering shifts its two decorative orbit layers in opposing directions over 450ms, with 220ms individual step-marker feedback. Reduced motion retains static geometry; no new interaction or focus stops added.

2026-11-04 profile/settings: dashboard atmospheric pseudo-elements now also serve profile surfaces and account-settings, retaining readable white content panels. Minimum viewport height keeps the blue wash present on short settings pages. Left/right stars and orbit art are static, decorative and pointer-transparent.

2026-11-04 atmosphere intensity: both blue radial washes now use approximately69% source opacity and reach58–60% of the surface, giving dashboard/profile/settings a slightly stronger shared blue backdrop. Content panels and text colors unchanged.

2026-11-04 staff Analytics overview: navy lead metric with white text, pale-blue alternating support metrics and existing SVG icons; thin section/header rules, compact row dividers, consistent blue Expand triggers and112px minimum overview detail rails. Removed the user-specified data-note row; cohort logic preserved. Expanded dialogs retain incumbent styles.


2026-11-06 staff dashboard previews: all four cards use pale-blue title bands and blue header icons. Header links have 44px targets. Card bodies size to their content, empty queues use a compact inset message, and blue analytics values align beside their labels and supporting text. Phone layouts stack the cards and let header actions wrap.

The four staff dashboard cards lift slightly on pointer hover when reduced motion is off. The registry, recovery and activity lists show up to five matching entries. Analytics displays five measures for the existing approved-profile cohort.

Staff refresh buttons center a spinner in place of the label while the request runs, preserving the label's width and accessible name. Analytics at a glance highlights the approved total on a pale-blue surface and centers blue age-group counts below their labels. The registry review header places age group and education beside the name when space permits, with registration and reporting metadata below.

Public section headings use 24px Source Sans 3 and landing hero supporting copy uses 18px on desktop. Youth page titles use Braah One up to 32px. Staff workspace titles and supporting copy use 30px and 16px Source Sans 3 respectively. Staff uses #0038A7 for primary actions, #FBD218 for attention accents, and #CE1127 for rejection accents.
