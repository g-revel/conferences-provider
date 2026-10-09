# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Monorepo with two independent npm projects, no shared root `package.json`:

- `backend/` — Fastify + TypeScript REST API + a manually-run data pipeline that discovers conference talks given by Shodo members (static seed list of events → find each edition's URL via web search → fetch + local-LLM extraction of speaker mentions → cross-reference with a Slack-derived speaker cache), persisted as JSON files and served over HTTP.
- `frontend/` — Vue 3 + TypeScript + Vite SPA that displays the data.

Read `backend/CLAUDE.md` and `backend/architecture.md` before working in `backend/` — they contain detailed, backend-specific conventions (ESM import rules, collect patterns, test mocking patterns, evals) that are not repeated here.

## Commands

Each project is installed and run independently from its own directory.

### Backend (`backend/`)

```bash
npm run dev        # tsx watch, dev server
npm run build      # tsc -> dist/
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run eval       # promptfoo evals (no LLM judge currently, pure JS assertions)
```

Run a single backend test file: `npx vitest run src/string.functions.test.ts`.

Data pipeline (manual, no CI automation — see `backend/CLAUDE.md` for the full design):

```bash
npm run refresh:speakers      # Slack -> data/speakers.json
npm run refresh:events:heavy  # SearXNG (self-hosted, `cd backend/searxng && docker compose up -d`) -> finds each event's current-edition URL
npm run refresh:events:light  # fetch + local Ollama extraction -> data/talks.json
```

### Frontend (`frontend/`)

```bash
npm run dev        # vite dev server
npm run build      # vue-tsc -b && vite build
npm run preview    # preview the production build
```

There is no `test` npm script yet, but Vitest + `@vue/test-utils` + happy-dom are configured (`frontend/vite.config.ts`). Run tests with `npx vitest run`, or a single file with `npx vitest run src/app/components/list-conferences/ConferenceListComponent.spec.ts`. Component specs need `// @vitest-environment happy-dom` at the top of the file; pure-logic specs (domain/) run fine in the default `node` environment.

## Architecture

### Backend

Fastify app factory split from the entrypoint: `buildApp()` in `src/app.ts` builds and configures the Fastify instance (plugins + routes) without binding a port; `src/index.ts` calls `buildApp()` then `app.listen()`. This lets tests call `buildApp()` + `app.inject()` without opening a socket. `process.env` must only be read in `src/index.ts` and `src/app.ts`.

State is persisted as JSON in `backend/data/` (`events.json`, `speakers.json`, `talks.json`), read/written via `src/data/jsonStore.ts` + `src/data/paths.ts`. Every refresh is additive (merge by identity key, never delete) — see `mergeSpeakers.ts`, `mergeSpeaks.ts`, `updateEventUrls.ts`.

Data collection lives in `src/collects/<name>/`, one folder per concern:
- `get-conferences/` — reads the static seed list of known events from `data/events.json`, no LLM.
- `get-all-speakers/` — Slack `users.list()` lookup, no LLM; pure, deterministic transform/filter pipeline afterward (this is the part that's unit-tested).
- `find-conference-editions/` — heavy run: a self-hosted SearXNG instance (Docker, `backend/searxng/`) finds each event's current-edition URL. Brave Search was used initially but dropped its free no-card tier on 2026-02-12; SearXNG keeps the "free and local" approach consistent with Ollama.
- `extract-speaks/` — light run: fetches a known event URL and uses a local Ollama model to find which known Shodo speakers are mentioned on the page (extraction from provided text, not recall — a small local model is reliable here, unlike generating the conference list from the model's own knowledge, which was tried and abandoned).
- `get-speaks/get-speaks.ts` — the original join-two-lists-in-memory approach; unimplemented and now superseded by `extract-speaks/`, kept around but dead.

`GET /api/talks` (`src/routes/talks.ts`) serves `data/talks.json` to the frontend.

See `backend/CLAUDE.md` for the full collect pattern, the Ollama/undici setup, and the Vitest mocking convention for Slack I/O.

### Frontend

Layered architecture under `src/`:
- `domain/` — pure types and pure functions (e.g. `domain/conferences/Conference.ts`, `domain/conferences/filter/FilterConferencesFunctions.ts`). No framework or I/O dependencies; this is what unit tests target directly.
- `infrastructure/` — implementations of domain-facing interfaces that do I/O. `ITalksClient` (the portal's data source) is implemented by `HttpTalksClient` (`fetch('/api/talks')`) and `FakeTalksClient` (static in-memory fixture, real data from a validated BreizhCamp extraction). `IConferencesClient`/`HttpConferencesClient`/`FakeConferencesClient` follow the same pattern but are currently unused by `App.vue` (superseded by the talks portal; no backend `/api/conferences` route exists either).
- `app/` — Vue wiring: components, composables (`UseX.ts` next to the component that uses them), and dependency injection. `app/injectionKeys.ts` declares typed `InjectionKey`s; `app/main.ts` picks the client implementation (`FakeConferencesClient` in dev via `import.meta.env.DEV`, `HttpConferencesClient` otherwise) and provides it at the app root. Components/composables `inject()` the client by key rather than importing a concrete class, so tests can inject a fake.

Component specs live alongside the component as `*.spec.ts` and use `@vue/test-utils`'s `mount`; they need `// @vitest-environment happy-dom`. Domain-logic specs live alongside the function as `*.spec.ts` too, but don't need a DOM environment.

Styling is Tailwind v4 via the `@tailwindcss/vite` plugin (configured in `vite.config.ts`), used directly as utility classes in templates — no separate Tailwind config file.

## CI

`.github/workflows/evals.yml` runs the backend promptfoo evals on every push/PR to `main`. No secrets required currently — none of the active evals use an LLM judge (⚠️ `get-all-speakers.yaml` still needs `SLACK_TOKEN` to actually pass; not configured in the workflow, pre-existing gap).
