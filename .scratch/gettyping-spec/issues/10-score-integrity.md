# Decide Score computation & Leaderboard-integrity validation

Type: grilling
Status: resolved

## Question

[08-scoring-formulas.md](./08-scoring-formulas.md) and [09-db-schema.md](./09-db-schema.md) settled what a Score records (net_wpm, gross_wpm, accuracy, elapsed_ms, char_count, error_count) and that raw keystroke events are discarded after being folded into the Weak-key Profile — but not *where* those final numbers get computed, or whether submitted values are trusted. Should the client compute the final Score client-side and POST it directly (simple, but trivially spoofable — anyone can POST an arbitrary WPM straight onto a Leaderboard), or should the client send raw per-keystroke timing/correctness events and have the server independently compute (and sanity-check the plausibility of) the Score before discarding the raw events? This determines the shape of the Attempt-submission API endpoint and what "Leaderboard integrity" concretely means for this app — the last piece of "Leaderboard rules" the destination requires.

## Answer

### 0. Posture: casual-tamper resistance, stated explicitly

With nickname-only identity ([0001](../../../docs/adr/0001-nickname-only-identity.md)) and non-unique Nicknames ([07](./07-nickname-uniqueness.md)), the Leaderboard **cannot** be trustworthy in a strong sense — there are no accounts to attribute a Score to. So the target is not "cheat-proof", it is closing the *trivially open* door:

- **Defended**: the fifteen-second attack — open devtools, POST an arbitrary `net_wpm`, land at #1.
- **Accepted as out of reach**: a scripted client emitting human-plausible keystroke timing in real time. Defending this needs behavioural/rhythm fingerprinting, which is disproportionate for a solo project and carries real false-positive risk against genuinely fast typists.

This posture is recorded so the Leaderboard is never later mistaken for a trustworthy record.

### 1. The server computes; the client sends raw events

The Attempt-submission endpoint receives the **raw per-keystroke event stream** (expected char, received char, timestamp offset). The server derives `net_wpm`, `gross_wpm`, `accuracy`, `char_count`, `error_count`, `elapsed_ms` **and** the Weak-key deltas itself, then discards the events — no raw keystroke log is persisted, exactly as [08](./08-scoring-formulas.md) specified. The client still computes WPM live for its own display, but that number is **advisory, never authoritative**.

Client-supplied *aggregates* were rejected explicitly: a server applying the WPM formula to attacker-chosen counters (`char_count: 99999, elapsed_ms: 1000`) has the ceremony of server-side computation with none of the protection. Server computation only means something if the server receives something it can cross-examine.

Payload cost is a non-issue: a worst-case 2-minute Attempt at 100 WPM is ~1,000 events (~24KB uncompressed, gzips hard), sent once at the end — not a live stream. The client already captures exactly these events to feed the Weak-key Profile; they now go over the wire before being discarded.

### 2. Practice-Exercise generation moves server-side

Generated Practice Exercises are ephemeral with no `exercises` row ([09](./09-db-schema.md)), so nothing previously said which side produced the text. **The server generates it.** Client-side generation would leave the server unable to check a single character of a Practice Attempt for correctness — client-trust on one Track would decide the whole system's posture.

Independent of cheating: `weak_key_stats` already lives in the DB, so client-side generation would mean shipping a Player's whole Profile to the browser. Server generation keeps the algorithm, the Profile, and the 0–1 aggressiveness knob from [05](./05-prototype-weak-key-generation.md) in one place, retunable without a client release.

### 3. Start handshake: `attempt_tokens`

Fetching an Exercise writes an `attempt_tokens` row; submission must carry a valid, unconsumed, unexpired token owned by that Player's cookie UUID. Consumed (deleted) on submit.

This holds the generated Practice text, and buys a check available no other way: a **server-observed wall clock**. The server knows the real interval between serving and submission, so no claimed `elapsed_ms` can be shorter than physics allows against it. Forging a high WPM now requires sitting out the full duration in real time — slow and boring, which for casual tampering is most of the battle.

**Naming**: `CONTEXT.md` defines an **Attempt** as one *completed* run producing a Score. A row created at start time is therefore not a domain Attempt, and must not be called `attempts` — that would collide with the ubiquitous language and with [09](./09-db-schema.md)'s deliberate Attempt/Score merge. It is an ephemeral handshake record; `scores` is unchanged.

**Storage**: a SQLite table, not in-process memory — on a single Fly VM a deploy or restart would otherwise silently void every in-flight Attempt, landing on a five-year-old mid-lesson.

### 4. Validation checks

Because the server *derives* every aggregate, a whole class of checks is moot (accuracy can't exceed 100%, gross can't fall below net). What remains asks whether the stream is humanly possible and actually finished:

- **Token valid** — exists, owned by this Player, unconsumed, within TTL.
- **Well-formed stream** — monotonic non-negative timestamps, all offsets within the claimed span, event count under a hard ceiling (DoS guard).
- **Fits the server wall clock** — claimed span ≤ the observed interval, and `char_count ÷ observed interval` under the human ceiling.
- **Prompt completed** — the stream reaches the end of the served text. Not only anti-cheat: [06](./06-prototype-visual-design.md) already established the Leaderboard is revealed *on completing the Exercise*, so a half-finished Leaderboard-eligible Score would contradict a settled decision.
- **Net-WPM ceiling** — tunable config, default **250**. The sustained human record is ~212 WPM and the primary audience is five-year-olds, so this never touches a real Player.

**Deliberately excluded**: per-keystroke interval floors and timing-distribution analysis — the machinery ruled out in §0, where the false positives live (fast typists, key rollover, laggy input events).

### 5. Failure handling: two tiers

- **Structural failures reject** (error response, nothing persisted): missing/expired/consumed/foreign token, malformed stream, incomplete prompt. The legitimate client never produces these.
- **Plausibility failures persist but don't rank**: over the WPM ceiling or inconsistent with the wall clock → Score written with `leaderboard_eligible = 0`. It counts for personal history **and for the Learn-track 90% gate**, but never appears on a Leaderboard.

The driver is asymmetric harm. Under blanket hard-reject, a child who finishes a Stage at 94% and hits a suspended lid or a throttled background tab loses the Score *and the Stage progression* — with no account, no support inbox, no recourse. Flagging keeps the honest case whole while the forger's number simply never ranks.

Two secondary benefits: it is **quiet** (a 200 response, no signal about which check tripped, nothing to tune against), and it is **observable** — flagged rows accumulate, so whether cheating is happening at all becomes a query rather than a guess.

### 6. Weak-key Profile: feed always, clamp latency

Every accepted stream updates `weak_key_stats`, flagged or not. The Profile is private and self-harming only — poisoning it costs the poisoner worse exercises and nobody else anything, so there is no adversary to defend against.

The real problem here is not cheating but data quality. The weakness score is `errorRate × 0.7 + latencyFactor × 0.3`, and latency is a raw wall-clock gap that cannot tell "hesitates on `p`" from "was called to dinner". One 30-second pause folds a 30,000ms sample onto the next key, permanently crowning it the weakest — and the Player is then bombarded with practice on a letter they were never bad at. With distractible five-year-olds this happens constantly, no cheating required.

**Fix**: clamp each keystroke's latency to a tunable ceiling (**~3000ms**) before accumulating. Real hesitation sits well below it; interruptions get truncated instead of dominating.

The clamp also settles the flagged case: a cheater's fake stream degrades only their own practice, while a wrongly-flagged honest Player keeps their genuine *error* data — the dominant 0.7 term — with their garbage latency clamped anyway. Excluding flagged Attempts entirely would mainly punish the honest case. Structurally-rejected submissions contribute nothing, since nothing was accepted.

### 7. Bounding `attempt_tokens`

Flooding gives **no ranking advantage** — [09](./09-db-schema.md)'s Leaderboard query already dedupes with `ROW_NUMBER() OVER (PARTITION BY player_id ...)` taking `rk = 1`, so ten thousand Attempts occupy one slot. That attack was dead before this ticket.

What remains is resource growth created by the handshake: every exercise fetch writes a row, and unlike Scores nobody has to type anything to create one. Two cheap mechanisms bound it by construction:

- **TTL sweep** — tokens older than ~30 minutes deleted; needed for abandoned Attempts regardless of abuse.
- **Per-Player outstanding cap** — a new request past the cap recycles the Player's oldest unconsumed token rather than appending.

**No IP throttling**: the cookie UUID is trivially cleared so it doesn't hold against a determined attacker, and Fly's proxy makes correct client-IP handling its own headache — disproportionate, and it risks throttling a shared connection like a classroom.

### 8. Moderation: manual SQL, documented

Every check above runs at submit time; none catches a Score that passes them all and is still obviously fake. `leaderboard_eligible` is the lever — setting it to `0` unranks a Score while preserving it — and the interface is `sqlite3` and one `UPDATE` against the file on the VM.

An admin surface is **out of scope**: it would introduce the only credential in an app that has refused authentication everywhere else, as the largest new machinery in the spec for its rarest event. Recorded here explicitly so an implementer reads the absence as deliberate rather than forgotten.

### Config knobs introduced

Joining the generation-aggressiveness value from [05](./05-prototype-weak-key-generation.md), all shipping as adjustable config rather than hardcoded constants: **net-WPM ceiling** (~250), **latency clamp** (~3000ms), **token TTL** (~30 min), **outstanding-token cap**, **event-count ceiling**.

### Addendum to the resolved DB-schema ticket

This decision changes [09-db-schema.md](./09-db-schema.md), which is already resolved; the amendment is recorded there as well as here:

- New **`attempt_tokens`** table — `id` TEXT PK, `player_id` TEXT NOT NULL FK → `players.id`, `exercise_id` INTEGER NULL FK → `exercises.id`, `generated_content` TEXT NULL (populated iff `exercise_id` is NULL), `served_at` INTEGER NOT NULL. Index on `(player_id, served_at)` for the outstanding cap and TTL sweep.
- New column **`scores.leaderboard_eligible`** INTEGER NOT NULL DEFAULT 1.
- The Leaderboard query gains `AND leaderboard_eligible = 1` in its `WHERE` clause.

### Follow-ups graduated from fog

Resolving this made two previously-vague fog patches statable; both are now tickets: [11-first-run-onboarding.md](./11-first-run-onboarding.md) and [12-audio-design.md](./12-audio-design.md). The remaining fog patch (word-bank vs. bigram context selection and the production-tuned aggressiveness default) stays fog — [05](./05-prototype-weak-key-generation.md) was right that it needs live playtest data.
