# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

"Simulasi Listrik Rumah" is an Indonesian home-electricity simulator (UI copy is in Bahasa Indonesia). Routes: `/` (landing + FAQ), `/simulator` (the app), and a `*` catch-all that throws a 404 into the root `ErrorBoundary`. Simulation logic lives in `app/lib/sim/` (pure TS), UI in `app/components/sim/` and `app/components/art/`. Production domain: https://listrik.selo.my.id, deployed on Cloudflare Pages from `git@github.com:dreamid27/simulator-listrik.git` (production branch `master`).

## Commands

Package manager is **bun** (`bun.lock`); there is no `package-lock.json`.

- `bun install` — install deps
- `bun run dev` — dev server (Vite + React Router, with HMR)
- `bun run build` — static build into `build/client` (runs `scripts/postbuild.ts` afterwards)
- `bun run preview` — serve `build/client` locally
- `bun run icons` — regenerate PNG/ICO icons and `og-image.png` from the logo
- `bun run typecheck` — runs `react-router typegen` and then `tsc`. Run this after adding or renaming routes so the `./+types/<route>` imports resolve.
- `bun run format` — Prettier with the Tailwind class-sorting plugin

There is no test runner and no linter configured.

## Architecture

- **Framework:** React Router v7 in framework mode, **static**: `ssr: false` with `prerender` in `react-router.config.ts`. New public routes must be added to `prerender` and `public/sitemap.xml`. Code runs at build time for prerendering, so guard `window`/`localStorage` access (effects only).
- **Postbuild:** `scripts/postbuild.ts` flattens `x/index.html` → `x.html`, turns the SPA fallback into `404.html`, injects a per-page CSP `<meta>` with SHA-256 hashes of inline scripts (so no inline scripts may be added outside React Router), and generates `llms.txt`/`llms-full.txt` from `app/lib/site.ts` and `app/lib/sim/`.
- **SEO:** use `pageMeta()` and `jsonLd()` from `app/lib/site.ts` in each route's `meta`. `FAQ` there feeds both the landing page and FAQPage JSON-LD.
- **Routes** are declared explicitly in `app/routes.ts` (not file-based); route modules live in `app/routes/`. `app/root.tsx` holds the HTML `Layout`, the root `ErrorBoundary`, and the global CSS import.
- **Route types:** Route modules import generated types from `./+types/<name>` (e.g. `Route.ErrorBoundaryProps`). These are generated into `.react-router/types/` by typegen.
- **Path alias:** `~/*` → `app/*` (use `~/components/ui/...`, not `@/...`).
- **UI components:** shadcn/ui with the `base-nova` style, built on **Base UI (`@base-ui/react`)**, not Radix. Primitive APIs (e.g. `render` prop instead of `asChild`) follow Base UI. Components live in `app/components/ui/`; add more with `bunx shadcn@latest add <name>`. Treat these as generated code.
- **Class merging:** `cn` comes from the `cn` npm package (`app/lib/utils.ts` re-exports it), not the usual clsx + tailwind-merge helper.
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`, with no `tailwind.config`. Theme tokens (oklch CSS variables, light and `.dark`) are in `app/app.css`. Fonts are Inter and Noto Serif, loaded through `@fontsource-variable`.
- **Charts:** `recharts` is installed, and `app/components/ui/chart.tsx` wraps it. This is likely relevant for plotting simulation output.

## Conventions

Prettier config: no semicolons, double quotes, trailing commas `es5`, 80 columns. Tailwind classes are auto-sorted, including inside `cn()` and `cva()`.

## Deployment

- **Cloudflare Pages:** build `bun run build`, output `build/client`. Headers/caching in `public/_headers`.
- **Self-host:** `Dockerfile` builds with bun and serves via nginx using `nginx/default.conf`; keep its headers in sync with `public/_headers`.

## Accessibility

Text colors must meet WCAG AA. Use `text-safe-ink` / `text-warn-ink` (not `text-safe` / `text-warn`) for text; the plain tokens are for fills. Icon-only buttons need `aria-label`.
