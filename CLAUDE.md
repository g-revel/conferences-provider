# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Monorepo with two independent npm projects, no shared root `package.json`:

- `backend/` — Fastify + TypeScript REST API that collects conference/speaker data (a static known list, plus Slack lookups — no LLM is currently used).
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
npm run eval       # promptfoo evals (needs MISTRAL_API_KEY in .env)
```

Run a single backend test file: `npx vitest run src/string.functions.test.ts`.

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

Data collection lives in `src/collects/<name>/`, one folder per concern:
- `get-conferences/` — static, hardcoded list of known conferences (internal knowledge, not something to infer via an LLM).
- `get-all-speakers/` — Slack `users.list()` lookup, no LLM; pure, deterministic transform/filter pipeline afterward (this is the part that's unit-tested).
- `get-speaks/` — intended to join conferences + speakers into `Speak[]`; currently unimplemented (`throw new Error("not implemented")`).

See `backend/CLAUDE.md` for the full collect pattern and the Vitest mocking convention for Slack I/O.

### Frontend

Layered architecture under `src/`:
- `domain/` — pure types and pure functions (e.g. `domain/conferences/Conference.ts`, `domain/conferences/filter/FilterConferencesFunctions.ts`). No framework or I/O dependencies; this is what unit tests target directly.
- `infrastructure/` — implementations of domain-facing interfaces that do I/O. `IConferencesClient` is implemented by both `HttpConferencesClient` (real `fetch('/api/conferences')`) and `FakeConferencesClient` (static in-memory list).
- `app/` — Vue wiring: components, composables (`UseX.ts` next to the component that uses them), and dependency injection. `app/injectionKeys.ts` declares typed `InjectionKey`s; `app/main.ts` picks the client implementation (`FakeConferencesClient` in dev via `import.meta.env.DEV`, `HttpConferencesClient` otherwise) and provides it at the app root. Components/composables `inject()` the client by key rather than importing a concrete class, so tests can inject a fake.

Component specs live alongside the component as `*.spec.ts` and use `@vue/test-utils`'s `mount`; they need `// @vitest-environment happy-dom`. Domain-logic specs live alongside the function as `*.spec.ts` too, but don't need a DOM environment.

Styling is Tailwind v4 via the `@tailwindcss/vite` plugin (configured in `vite.config.ts`), used directly as utility classes in templates — no separate Tailwind config file.

## CI

`.github/workflows/evals.yml` runs the backend promptfoo evals on every push/PR to `main`. It requires the `MISTRAL_API_KEY` secret to be set in the GitHub repo settings.
