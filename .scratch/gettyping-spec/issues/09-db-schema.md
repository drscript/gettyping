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

## Addendum (from [13-gate-failure-flow.md](./13-gate-failure-flow.md))

Two changes from the Learn-track gate-failure decision.

**New table `stage_unlocks`** — Stage progression is otherwise *derived* (a Player has cleared Stage *n* if they hold a Score on its Exercise at ≥90% accuracy). The adult-granted override for a stuck Player cannot be derived, because the qualifying Score never happened, so it needs storage:
- `player_id` TEXT NOT NULL, FK → `players.id`
- `stage_id` INTEGER NOT NULL, FK → `stages.id`
- `granted_at` INTEGER NOT NULL
- PK `(player_id, stage_id)`

A Stage is unlocked if the previous Stage was *either* cleared on accuracy *or* has a `stage_unlocks` row. The table stays empty for every Player who never gets stuck.

**Learn Leaderboard query gains an accuracy predicate.** A sub-gate Attempt produces a valid Score, so without this a Player could top a Stage's Leaderboard having never cleared that Stage:
```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY net_wpm DESC) AS rk
  FROM scores
  WHERE exercise_id = ? AND leaderboard_eligible = 1
    AND accuracy >= 0.90   -- Learn Exercises only; the Speed Test has no gate
)
SELECT * FROM ranked WHERE rk = 1 ORDER BY net_wpm DESC LIMIT 10;
```

Deliberately a query predicate rather than `leaderboard_eligible = 0`: that column means "implausible, possibly tampered" and is the manual moderation lever, so conflating it with "typed sloppily but honestly" would poison both meanings.

Note this query still has no tie-break — [15-leaderboard-display-rules.md](./15-leaderboard-display-rules.md) is open and owns that.

## Addendum (from [14-practice-loop.md](./14-practice-loop.md))

**No schema change**, but two constraints on how existing tables are used.

**`weak_key_stats` counters are recency-weighted, not lifetime totals.** Point 4 above ("the Weak-key Profile aggregates from every Attempt on both Tracks") still holds, but the aggregation decays: existing `attempts` / `errors` / cumulative-latency are multiplied by a factor below 1 before each new sample is folded in. Same columns, different arithmetic on write — see the addendum on [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md) for why. Note the columns are no longer integer counts.

**The Speed Test Exercise row's `content` is immutable once live.** Its Leaderboard's meaning depends on every ranked Player having typed the same text; editing `content` would leave old and new Scores incomparable while still ranked together. A replacement text must be inserted as a **new `exercises` row** with its own Leaderboard, never an `UPDATE` to the seeded one. (The same reasoning applies to the 21 Learn Exercise rows, which 13 also fixed as non-regenerating.)

**A practice "session" is deliberately not modelled.** The session summary in 14 needs a before/after view of the Weak-key Profile, which tempts a `sessions` table. It doesn't need one — the client snapshots the top weak keys when practice begins and diffs against the current Profile at finish.
