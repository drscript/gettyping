# 18 — Walking skeleton and the HTTP test seam

Type: task
Blocked by: none — can start immediately
Status: done

## What to build

A running SvelteKit application backed by a real SQLite database created by migration, plus the test seam every later ticket asserts through. Nothing Player-facing yet: the deliverable is that a request can reach a route, the route can read seeded data out of the database, and a test can prove it by starting the real server against a freshly migrated database of its own.

The stack is settled — SvelteKit on `adapter-node`, better-sqlite3 through Drizzle ORM with Drizzle migrations, WAL mode, a single deployable Node server.

The migration creates the whole schema in one go — Players, Stages, Exercises, Scores, Weak-key Profile storage, Stage unlocks, and the ephemeral Attempt-token handshake table — and seeds the 21 Stages with the keys each teaches and the 22 Exercises (21 Learn, one Speed Test). Exercise content is deliberately left unpopulated; each later ticket authors the text it needs.

Two things exist mainly because the tests need them, and the spec requires both regardless: the seven tunable values are named config with defaults, injectable per test rather than hardcoded constants, and generation randomness comes from a seeded source so it is deterministic under test.

The testing posture starts here and holds for every later ticket: a good test sends an HTTP request to the running server and checks the response and the resulting database state. It never reaches into a scoring function, asserts on an intermediate value, or names a private helper.

## Acceptance criteria

- [x] The app builds and serves on `adapter-node`.
- [x] Running migrations against an empty file produces all seven tables, with WAL enabled.
- [x] The 21 Stages are seeded with their names and the keys each teaches, in curriculum order, with the id doubling as sequence order.
- [x] The 22 Exercises are seeded — 21 Learn Exercises each tied to one Stage, plus the Speed Test — with content left unpopulated.
- [x] An HTTP request returns the seeded Stages, and a test asserts it by starting the real server against its own freshly migrated database.
- [x] Each of the seven tunables — targeting aggressiveness, weak-key decay factor, Speed Test floor, consecutive-failure count, Leaderboard display threshold, Net WPM ceiling, latency clamp — reads from named config with a default, and a test can override any of them without touching application code.
- [x] Generation randomness comes from a seeded source: the same seed produces the same output.
- [x] No test reaches past HTTP into an internal function.
