# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

"Simulator listrik" (electricity simulator) is at the scaffold stage: a React Router v7 + shadcn/ui template with only a placeholder `app/routes/home.tsx`. No domain logic exists yet.

## Commands

Package manager is **bun** (`bun.lock`); there is no `package-lock.json`.

- `bun install` — install deps
- `bun run dev` — dev server (Vite + React Router, with HMR)
- `bun run build` — production build into `build/client` and `build/server`
- `bun run start` — serve the production build (`react-router-serve`)
- `bun run typecheck` — runs `react-router typegen` and then `tsc`. Run this after adding or renaming routes so the `./+types/<route>` imports resolve.
- `bun run format` — Prettier with the Tailwind class-sorting plugin

There is no test runner and no linter configured.

## Architecture

- **Framework:** React Router v7 in framework mode with SSR enabled (`react-router.config.ts`). Routes are declared explicitly in `app/routes.ts` (not file-based); route modules live in `app/routes/`. `app/root.tsx` holds the HTML `Layout`, the root `ErrorBoundary`, and the global CSS import.
- **Route types:** Route modules import generated types from `./+types/<name>` (e.g. `Route.ErrorBoundaryProps`). These are generated into `.react-router/types/` by typegen.
- **Path alias:** `~/*` → `app/*`. The README's `@/components/...` example is wrong for this project; use `~/components/ui/...`.
- **UI components:** shadcn/ui with the `base-nova` style, built on **Base UI (`@base-ui/react`)**, not Radix. Primitive APIs (e.g. `render` prop instead of `asChild`) follow Base UI. Components live in `app/components/ui/`; add more with `bunx shadcn@latest add <name>`. Treat these as generated code.
- **Class merging:** `cn` comes from the `cn` npm package (`app/lib/utils.ts` re-exports it), not the usual clsx + tailwind-merge helper.
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`, with no `tailwind.config`. Theme tokens (oklch CSS variables, light and `.dark`) are in `app/app.css`. Fonts are Inter and Noto Serif, loaded through `@fontsource-variable`.
- **Charts:** `recharts` is installed, and `app/components/ui/chart.tsx` wraps it. This is likely relevant for plotting simulation output.

## Conventions

Prettier config: no semicolons, double quotes, trailing commas `es5`, 80 columns. Tailwind classes are auto-sorted, including inside `cn()` and `cva()`.

## Deployment caveat

The `Dockerfile` uses `npm ci` and copies `package-lock.json`, which doesn't exist in this repo. As written, the Docker build will fail. Either generate a lockfile or switch the Dockerfile to bun.
