# Kill-My-Startup — Handoff Notes

Live Link: https://www.whoiskillingmystartup.com/

This document summarizes what’s implemented so far, how to run it, and where to continue. It’s tailored for agents picking up the work mid‑stream.

## Stack
- Next.js App Router (Next 15) — `kill-my-startup/package.json:1`
- React 19 — `kill-my-startup/package.json:1`
- Tailwind CSS v4 (via `@tailwindcss/postcss`) — `kill-my-startup/package.json:1`, `kill-my-startup/src/app/globals.css:1`
- TypeScript — `kill-my-startup/tsconfig.json:1`

## New Dependencies
- three — shader animation background (`ShaderAnimation`)
- framer-motion — sidebar/intake animations
- lucide-react — dashboard icons
Installed with pnpm and recorded in `kill-my-startup/package.json:1`.

## Key Routes
- Landing page: `kill-my-startup/src/app/page.tsx:1`
  - Fullscreen Three.js shader animation background
  - Centered hero title and subheading
  - Primary CTA “Get Started →” linking to `/dashboard`
- Dashboard: `kill-my-startup/src/app/dashboard/layout.tsx:1`, `kill-my-startup/src/app/dashboard/page.tsx:1`
  - White‑on‑black theme, sidebar layout, grid analytics templates (KPIs, charts, two‑up panels)
- Intake: `kill-my-startup/src/app/intake/page.tsx:1`
  - One‑question‑at‑a‑time form with progress bar, Enter‑to‑advance, Finish → `/dashboard`

## Components & Hooks
- Shader animation: `kill-my-startup/src/components/ShaderAnimation.tsx:1`
  - Minimal full‑screen vertex/fragment shader rendered via Three.js
  - Resizes with container; cleans up on unmount
- Header: `kill-my-startup/src/components/Header.tsx:1`
  - Fixed top nav, minimal white text over hero using mix‑blend for contrast
- Reveal (on‑scroll): `kill-my-startup/src/components/Reveal.tsx:1`
  - Uses IntersectionObserver hook to fade/slide in sections
- useInView: `kill-my-startup/src/hooks/useInView.ts:1`
  - Thin wrapper around IntersectionObserver
- Dashboard Sidebar: `kill-my-startup/src/components/dashboard/Sidebar.tsx:1`
  - Provider + Desktop/Mobile variants, hover‑expand on desktop, slide‑in on mobile
- Utility: `kill-my-startup/src/lib/utils.ts:1` with `cn()`
- Note: `kill-my-startup/src/components/RainbowButton.tsx:1` exists but is not used (kept for potential future use; safe to remove).

## Styling
- Global tokens (Perplexity‑inspired, black/white with blue accent) in `kill-my-startup/src/app/globals.css:1`
  - `--brand-accent: #2395e7`, `--brand-muted: #737373`
  - Body uses white background in light scheme and near‑black in dark; dashboard pages explicitly use black backgrounds
- Landing sections use white background; dashboard/intake use white‑on‑black cards (`bg-white/5`, `border-white/10`).

## Notable Behavior
- Hero CTA now links directly to `/dashboard` for quick access (auth TBD).
- Intake form Finish button routes to `/dashboard`.
- Shader animation runs in a client component; landing page is client‑side to overlay text above the canvas.

## How to Run
- From `kill-my-startup`:
  - Dev: `pnpm dev`
  - Build: `pnpm build`
  - Start: `pnpm start`
- Visit:
  - `http://localhost:3000/` — Landing
  - `http://localhost:3000/dashboard` — Dashboard
  - `http://localhost:3000/intake` — Intake flow

## Project Layout (selected)
- `kill-my-startup/src/app/page.tsx:1` — Landing (hero + sections)
- `kill-my-startup/src/components/ShaderAnimation.tsx:1` — Shader background
- `kill-my-startup/src/components/Header.tsx:1` — Top nav
- `kill-my-startup/src/components/Reveal.tsx:1` — Scroll reveal
- `kill-my-startup/src/hooks/useInView.ts:1` — Intersection observer hook
- `kill-my-startup/src/app/dashboard/layout.tsx:1` — Dashboard layout + sidebar
- `kill-my-startup/src/app/dashboard/page.tsx:1` — Dashboard analytics templates
- `kill-my-startup/src/components/dashboard/Sidebar.tsx:1` — Sidebar components
- `kill-my-startup/src/app/intake/page.tsx:1` — Intake flow
- `kill-my-startup/src/app/globals.css:1` — Global tokens/styles

## Follow‑ups / TODOs
- Auth
  - Gate `/dashboard`; keep landing CTA behavior after auth.
- Content polish
  - Consider grammar update to “Who’s killing your startup?” if desired.
  - Replace placeholder copy in sections and intake questions.
- Branding
  - If using Perplexity brand strictly, finalize fonts and logo usage; current approach uses color tokens only.
  - Remove `brand_page.html` and `brand_styles.css` at repo root if not needed.
- Dashboard data
  - Replace placeholder squares with real charts (e.g., Chart.js, Recharts) and API wiring.
- Accessibility
  - Verify color contrast, focus states, and keyboard navigation in sidebar and intake.
- Cleanup
  - Remove `RainbowButton.tsx` if unused going forward.

## Known Good States
- Build fixes applied (e.g., hero CTA arrow uses `→` to avoid JSX parse error).
- `three`, `framer-motion`, and `lucide-react` are installed and imported where needed.

## Handoff Notes
- All pages/components referenced above are client components where necessary.
- The landing hero overlay allows clicking the CTA while keeping the rest pointer‑events off.
- Tailwind is available via PostCSS; arbitrary utility classes are used throughout.

If you need anything else (tests, CI, or deployment scripts), add tasks here and proceed.
