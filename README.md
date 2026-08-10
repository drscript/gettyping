# GetTyping

A web-based, SQLite-backed typing tutor. It teaches beginners — including young children — to type stage by stage, and helps people who already type improve their speed through diagnostic testing and targeted practice.

## The two Tracks

- **Learn** — a gated, 21-Stage curriculum (home row → top row → bottom row → shift/punctuation → numbers). Each Stage teaches one to three new keys and gates on 90% accuracy, never speed. Cleared Stages stay open for replay.
- **Speed Test & Practice** — an ungated diagnostic Speed Test followed by Practice Exercises generated on the fly, targeting whichever keys a Player's Weak-key Profile shows as weakest.

Every Exercise has its own per-Exercise Leaderboard (there's no single global ranking — see [ADR 0002](docs/adr/0002-per-exercise-leaderboards.md)). There are no accounts: a Player is just a chosen Nickname held in a long-lived cookie, no password or email required (see [ADR 0001](docs/adr/0001-nickname-only-identity.md)).

`CONTEXT.md` at the repo root defines the full domain vocabulary (Track, Stage, Exercise, Attempt, Score, Player, Nickname, Leaderboard, Weak-key Profile) — read it before working on anything that touches these concepts.

## Screenshots

| | |
| --- | --- |
| ![Track choice landing screen](docs/screenshots/landing.png) | ![Picking a curated Nickname](docs/screenshots/nickname.png) |
| First visit — choose a Track by intent, not age | Learn's Nickname step: tap a curated card, nothing to type |
| ![Home screen with the 21-Stage path](docs/screenshots/home-stages.png) | ![Learn Stage typing surface](docs/screenshots/learn-stage.png) |
| Returning Player's home screen and Stage path | Mid-Stage: per-character feedback and the on-screen keyboard |
| ![Speed Test typing surface](docs/screenshots/speed-test.png) | |
| Speed Test — the same mechanics, a tighter type scale | |

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) on `adapter-node`
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team/), WAL mode
- [Vitest](https://vitest.dev/) for tests, run against a real HTTP server and a freshly migrated database — no unit tests reach past HTTP into internal functions
- Deploys as a single [Fly.io](https://fly.io/) VM with a persistent volume, streamed to object storage by [Litestream](https://litestream.io/) (see [ADR 0004](docs/adr/0004-single-vm-sqlite-litestream-deploy.md))

## Getting started

Requires Node 22+.

```bash
npm install
DATABASE_PATH=./gettyping-dev.sqlite npm run migrate
DATABASE_PATH=./gettyping-dev.sqlite npm run dev
```

`DATABASE_PATH` names the SQLite file and is required — there's no default. `npm run migrate` creates the schema and seeds the 21 Stages and 22 Exercises (content included) before the first `npm run dev`.

## Scripts

| Command                  | What it does                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| `npm run dev`              | Start the Vite dev server                                            |
| `npm run build`             | Production build (adapter-node)                                      |
| `npm run check`             | `svelte-kit sync` + `svelte-check`                                    |
| `npm run migrate`           | Run Drizzle migrations against `DATABASE_PATH`, seeding curriculum data |
| `npm test`                  | Build, then run the full Vitest suite                                 |
| `npm run test:acceptance`   | Build, then run only `tests/acceptance` (HTTP-level acceptance tests) |
| `npm run test:deploy`       | Run `tests/deploy` (the standalone migration script)                  |

## Deploying

Single Fly.io VM, a persistent volume for the SQLite file, Litestream streaming that file to object storage. Full walkthrough — provisioning, secrets, and how to prove a backup actually restores — is in [docs/deploy.md](docs/deploy.md).

## Project docs

- [`CONTEXT.md`](CONTEXT.md) — domain glossary, read before naming any domain concept
- [`docs/adr/`](docs/adr/) — architectural decision records
- [`docs/agents/`](docs/agents/) — conventions for agent-driven work in this repo (issue tracker, triage labels, domain-doc consumption rules)
- [`.scratch/gettyping-spec/`](.scratch/gettyping-spec/) — the build-ready spec and its ticket history (tickets 01–37); superseded going forward by GitHub Issues, see `docs/agents/issue-tracker.md`
