<!-- Copilot instructions for contributors and AI coding agents -->

# JSON Crack — Copilot instructions (concise)

Be productive quickly: this repo is a Next.js (14.x) TypeScript web app that visualizes JSON as interactive graphs.

Key facts (quick):
- Framework: Next.js pages-based routing (see `src/pages/*`).
- Styles: `styled-components` + Mantine; theme toggles via `ThemeProvider` and `NEXT_PUBLIC_*` env flags.
- State: small, local stores use `zustand` (look in `src/store/*` and feature stores under `src/features/*/stores`).
- Graph UI: uses `reaflow` (see `src/features/editor/views/GraphView`) and heavy client-only libs (Monaco editor, drag/drop, image export).
- Data tools: conversion and type generation live in `src/lib/utils/` (e.g. `generateType.ts`, `jsonAdapter.ts`). Many heavy libs are dynamically imported at runtime.

Important developer commands (use pnpm; Node >= 18):
- Install: `pnpm install`
- Dev server (Next): `pnpm dev` (default http://localhost:3000)
- Build: `pnpm build` (runs `next build`; `postbuild` runs sitemap generation)
- Start (production): `pnpm start`
- Lint/typecheck: `pnpm lint` (runs `tsc`, `eslint src`, and `prettier --check src`)
- Fix style/lint: `pnpm lint:fix`
- Docker: `docker compose build` + `docker compose up` (README notes local port 8888 for compose)

Patterns & conventions (concrete):
- Client-only UI components are dynamically imported with `next/dynamic({ ssr: false })` (see `src/pages/editor.tsx` for examples: `TextEditor`, `LiveEditor`, and modal controllers).
- Cross-store updates: stores call each other directly via their getters (example: `useJson` calls `useGraph.getState().setGraph(json)` in `src/store/useJson.ts`). Follow this established pattern for inter-store side effects.
- Code generation/conversion: prefer using `lib/utils/*` helpers. `generateType.ts` converts inputs to JSON using `jsonAdapter` and then dynamically imports `json2go.js` or `json_typegen_wasm` — follow this pattern when adding new converters or languages.
- Theme & env flags: runtime features are toggled with `NEXT_PUBLIC_DISABLE_EXTERNAL_MODE` and `NEXT_PUBLIC_NODE_LIMIT` (see `src/pages/editor.tsx` and README). Use `process.env.NEXT_PUBLIC_*` checks for feature toggles.

Where to look for examples:
- Page layout and app wiring: `src/pages/_app.tsx`, `src/pages/editor.tsx`.
- State/store patterns: `src/store/*` and `src/features/*/stores/*` (for graph-specific stores see `src/features/editor/views/GraphView/stores`).
- Utilities & codegen: `src/lib/utils/generateType.ts`, `src/lib/utils/jsonAdapter.ts`, `src/lib/utils/json2go.js`.
- UI building blocks: `src/features/editor/*` (Toolbar, BottomBar, LiveEditor, TextEditor) demonstrate composition and dynamic imports.

Implementation guidance (do this, not that):
- DO use dynamic imports for large or browser-only libs (Monaco, gofmt, wasm) to keep server builds fast.
- DO follow existing zustand patterns and name hooks `useX` with default exports.
- DO run `pnpm lint` locally before pushing; the lint step includes `tsc` which catches many issues.
- DO update `next-sitemap.config.js` and `public/` assets if you add new public pages or site metadata.
- DON'T add long-running or network-heavy tasks to server-side rendering; heavy processing should be done client-side or via explicit serverless endpoints.

Edge examples to copy quickly:
- Set JSON and update the graph in the same action:
  - `useJson.getState().setJson(jsonStr)` which calls `useGraph.getState().setGraph(jsonStr)` internally (see `src/store/useJson.ts`).
- Create a client-only modal:
  - `const Modal = dynamic(() => import('../features/modals/MyModal'), { ssr: false });`

If unsure where to change something: trace the feature in `src/features/*` then inspect related store(s) in `src/store/*` or the feature's `stores` folder.

Files referenced above provide canonical examples; prefer copying patterns from them.

If any of this is unclear or you want more examples (tests, CI, or more detailed architecture flow), tell me which area to expand and I will update this file.
