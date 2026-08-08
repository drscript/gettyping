# Design the SQLite schema

Type: grilling
Blocked by: 02, 04, 05, 07, 08
Status: resolved

## Question

Pull together the outcomes of the tech-stack, curriculum-outline, weak-key-generation, nickname-uniqueness, and scoring-formula tickets into a concrete SQLite schema: tables, keys, and indexes supporting Players/Nicknames, Stages, Exercises, Attempts/Scores, per-Exercise Leaderboards (top 10), and Weak-key Profiles. This is the last piece the build-ready spec needs before it's genuinely implementation-ready.

## Answer

Two structural decisions preceded the table design:

1. **Generated Practice Exercises are ephemeral/private, not persisted as Exercise rows.** They don't get real multi-Player Leaderboards — this is a deliberate carve-out from [0002-per-exercise-leaderboards.md](../../../docs/adr/0002-per-exercise-leaderboards.md) for this one Exercise type, rather than persisting every generated text as a reusable row.
2. **Attempts on generated Exercises still produce a persisted `scores` row**, via a nullable `exercise_id` (null = ephemeral/generated), so a Player retains personal practice history even without a shared Leaderboard.
3. **Leaderboards are computed on read** (a window-function query), not materialized into a separate table — appropriate at this project's scale (single-VM SQLite, per [01-research-sqlite-hosting.md](./01-research-sqlite-hosting.md)).
4. **The Weak-key Profile aggregates from every Attempt on both Tracks**, not just Speed Test & Practice — so a Player transitioning out of Learn arrives with an already-seeded profile.
5. **Stages and Exercises are real DB tables, seeded via migration** (idiomatic given Drizzle's migration tooling from [02-tech-stack.md](./02-tech-stack.md)), not static app config.

### Schema

**`players`**
- `id` TEXT (UUID) PK
- `nickname` TEXT NOT NULL
- `created_at` INTEGER NOT NULL

**`stages`** (21 seeded rows, per [04-curriculum-outline.md](./04-curriculum-outline.md))
- `id` INTEGER PK (1–21, doubles as sequence order)
- `name` TEXT NOT NULL
- `keys_taught` TEXT NOT NULL (JSON array, e.g. `["f","j"]`)

**`exercises`** (22 seeded rows: 21 Learn + 1 Speed Test; generated Practice Exercises get no row)
- `id` INTEGER PK
- `track` TEXT NOT NULL CHECK (`'learn'` or `'speed_test'`)
- `stage_id` INTEGER NULL, FK → `stages.id`, UNIQUE where not null (NOT NULL iff track=`'learn'`)
- `content` TEXT NULL (lesson/prompt text — populated later; content-authoring is out of scope for this spec)

**`scores`** (merges Attempt + Score — always created together, 1:1, since raw keystrokes aren't persisted per [08-scoring-formulas.md](./08-scoring-formulas.md))
- `id` INTEGER PK
- `player_id` TEXT NOT NULL, FK → `players.id`
- `exercise_id` INTEGER NULL, FK → `exercises.id` (NULL = ephemeral generated Practice attempt)
- `nickname` TEXT NOT NULL (snapshotted at Attempt time, per [07-nickname-uniqueness.md](./07-nickname-uniqueness.md))
- `net_wpm` REAL NOT NULL, `gross_wpm` REAL NOT NULL, `accuracy` REAL NOT NULL, `elapsed_ms` INTEGER NOT NULL, `char_count` INTEGER NOT NULL, `error_count` INTEGER NOT NULL
- `created_at` INTEGER NOT NULL
- Index `(exercise_id, player_id, net_wpm)` — supports the Leaderboard query
- Index `(player_id, created_at)` — supports personal history, including null-exercise Practice rows

**`weak_key_stats`**
- `player_id` TEXT NOT NULL, FK → `players.id`
- `key` TEXT NOT NULL (key label, e.g. `'a'`, `'shift'`, `'comma'`)
- `attempts` INTEGER NOT NULL DEFAULT 0, `errors` INTEGER NOT NULL DEFAULT 0, `total_latency_ms` INTEGER NOT NULL DEFAULT 0
- PK `(player_id, key)`

**Leaderboard** — no table; computed on read:
```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY net_wpm DESC) AS rk
  FROM scores WHERE exercise_id = ?
)
SELECT * FROM ranked WHERE rk = 1 ORDER BY net_wpm DESC LIMIT 10;
```

The Learn Track's 90%-accuracy gate is an application-level constant checked against `scores.accuracy` — not a stored column, since it's flat/unvarying across all 21 Stages.

This resolution surfaced one sharpened follow-up, graduated into [10-score-integrity.md](./10-score-integrity.md): the schema fixes *what* a Score records, but not *where* it's computed or whether submitted values are trusted — that's Leaderboard-integrity territory, previously too fuzzy to ticket.

## Addendum (from [10-score-integrity.md](./10-score-integrity.md))

Resolving the score-integrity ticket amended this schema. Server-side Score computation requires a start handshake, and two-tier failure handling requires a Leaderboard-eligibility flag:

**New table `attempt_tokens`** — an ephemeral server-side handshake record, written when an Exercise is served and deleted on submit. Deliberately *not* named `attempts`: `CONTEXT.md` reserves **Attempt** for a *completed* run producing a Score, so a row created at start time isn't one. The Attempt/Score merge in `scores` above is unchanged.
- `id` TEXT (UUID) PK
- `player_id` TEXT NOT NULL, FK → `players.id`
- `exercise_id` INTEGER NULL, FK → `exercises.id`
- `generated_content` TEXT NULL (the ephemeral Practice text; populated iff `exercise_id` IS NULL)
- `served_at` INTEGER NOT NULL
- Index `(player_id, served_at)` — supports the per-Player outstanding-token cap and the TTL sweep

**New column on `scores`**
- `leaderboard_eligible` INTEGER NOT NULL DEFAULT 1 — set to `0` when an Attempt fails a plausibility check (WPM ceiling, wall clock). The Score still counts for personal history and the Learn 90% gate. Also the manual moderation lever.

**Leaderboard query** gains the eligibility filter:
```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY net_wpm DESC) AS rk
  FROM scores WHERE exercise_id = ? AND leaderboard_eligible = 1
)
SELECT * FROM ranked WHERE rk = 1 ORDER BY net_wpm DESC LIMIT 10;
```
