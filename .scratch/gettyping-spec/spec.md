# GetTyping — build-ready spec

Status: ready-for-agent

Synthesized from the wayfinder map at [map.md](./map.md) and its seventeen resolved decision tickets in [issues/](./issues/). Every decision below has a ticket holding its full reasoning and its rejected alternatives; this document is the implementable summary, not the argument. Domain vocabulary is defined in [CONTEXT.md](../../CONTEXT.md) and is used strictly throughout — **Track, Stage, Exercise, Speed Test, Attempt, Score, Player, Nickname, Leaderboard, Weak-key Profile**.

Architectural decisions already recorded as ADRs: [0001 nickname-only identity](../../docs/adr/0001-nickname-only-identity.md), [0002 per-exercise leaderboards](../../docs/adr/0002-per-exercise-leaderboards.md), [0003 adaptive exercise generation](../../docs/adr/0003-adaptive-exercise-generation.md).

## Problem Statement

Two people want to type better and neither is served well by what exists.

The first is a beginner — often a child of five or six, sometimes an adult who never learned. They cannot yet touch-type, and in many cases cannot yet reliably read or type their own name. Typing tutors aimed at them tend to be either toys that entertain without teaching a finger system, or courseware that assumes a reader who can already navigate a menu, follow written instructions, and self-assess. A beginner needs a single ordered path with a clear standard for moving on, and needs the app to never present them with a task before it has taught them how to do it — including the very first screen.

The second already types, at some speed, and wants to be faster. Their problem is that generic typing practice spends most of its time on keys they are already good at. They do not know which keys are actually slowing them down, and even if they suspected, they have no way to practise those specifically. Generic drills feel like effort without direction, so they stop.

Both are further blocked by the friction of getting started. Sign-up walls, email verification and password resets are disproportionate for something a person wants to try for ninety seconds — and for a five-year-old they are an absolute barrier. But removing accounts usually removes progress tracking and any competitive hook along with them, which is why most account-free typing sites are single-session toys.

## Solution

GetTyping is a web-based typing tutor with two Tracks over one shared foundation, and no accounts at all.

**Learn** is a gated, stage-by-stage curriculum: 21 Stages, each teaching one to three new keys in a fixed order, each with a single Exercise that must be typed at 90% accuracy to open the next Stage. Speed is measured and shown but never gates. Content is cumulative — each Stage's text draws on every key taught so far, weighted toward the new ones — so earlier keys keep being recycled rather than taught once and abandoned.

**Speed Test & Practice** begins with one diagnostic Exercise, the Speed Test, which measures the Player's speed and accuracy and seeds a per-key profile of where they are slow and where they make mistakes. From then on, Practice Exercises are generated on demand from that profile, targeting the Player's own weakest keys. The profile keeps updating as they type, and it decays, so it tracks who they are now rather than who they were in week one.

Identity is a Nickname and nothing else. A Player is created by choosing a name — tapped from a curated list of icon cards on Learn, typed freely on Speed Test — and persists in a long-lived cookie on that browser. There is no password, no email, and no recovery. Because the cookie holds a list of Players rather than one, siblings sharing a tablet stay separate.

The competitive hook is per-Exercise Leaderboards: each of the 21 Learn Exercises and the Speed Test has its own top-ten board of best Scores by Net WPM. There is no global board and no live racing. Generated Practice Exercises deliberately have no board, because ranking Players who each typed different text measures nothing.

## User Stories

### First run and identity

1. As a first-time visitor, I want to choose between learning to type and getting faster before anything else is asked of me, so that the rest of the app can adapt to which of those I am doing.
2. As a first-time visitor, I want those two choices described by what I want to achieve rather than by my age or my self-assessed skill, so that I am not pushed toward the wrong Track by a "for kids" label.
3. As an adult beginner, I want the Learn door to be about starting from the beginning rather than about being a child, so that I do not feel excluded from the Track that actually suits me.
4. As a five-year-old, I want to pick my Nickname by tapping a picture instead of typing it, so that the app is not asking me to type before it has taught me how.
5. As a five-year-old, I want the names I can pick from to be pictures with words, so that I can choose one without being able to read fluently.
6. As a child who does not like any of the offered names, I want a way to see a different set, so that I am not forced to accept a name I dislike.
7. As a Player on the Speed Test Track, I want to type my own Nickname freely, so that I choose my own identity on a board I am about to compete on.
8. As a child on the Learn Track, I want the option to type my own name if I would rather, so that the tap-to-pick default is not a cage.
9. As a Player typing my own Nickname, I want to be told inline, where it is actionable, that this name will be public, so that I do not put my real name on a Leaderboard.
10. As a Player whose typed Nickname is rejected, I want to be quietly offered other names rather than told what was wrong with mine, so that I am redirected rather than shamed.
11. As a Player, I want my Nickname checked only when I submit it, not as I type, so that a slow typist is not accused mid-word by an innocent prefix.
12. As a returning Player, I want to land on a light home screen that greets me by name and offers one obvious way to carry on, so that resuming takes one tap and I can still reach everything else.
13. As a returning Player, I want my progress visible at a glance on that home screen, so that I can see how far I have come without navigating anywhere.
14. As a parent whose two children share one tablet, I want a way to switch which Player is active, so that their progress and their practice profiles do not blend into one incoherent Player.
15. As a Player, I want to change my Nickname later, so that a name I picked at five is not permanent.
16. As a Player who changed my Nickname, I want my old Scores to keep the name they were set under, so that a Leaderboard is a record of what happened rather than a rewrite.

### Learn Track

17. As a beginner, I want a single ordered sequence of Stages with no branching, so that there is never a decision about what to do next.
18. As a beginner, I want each Stage to teach only one to three new keys, so that I am never asked to absorb a whole row at once.
19. As a beginner, I want the Stages ordered home row, then top row, then bottom row, then shift, then punctuation, then numbers, so that I build from the keys my fingers rest on outward.
20. As a beginner, I want each Stage's text to reuse keys from earlier Stages as well as the new ones, so that what I learned in Stage 2 is still being practised at Stage 12.
21. As a beginner, I want to see which key to press next highlighted on an on-screen keyboard, so that I can learn finger position without looking down.
22. As a beginner, I want each character I type marked correct or incorrect as I go, so that I know immediately when I have gone wrong.
23. As a colourblind Player, I want correct and incorrect marked by shape and symbol as well as colour, so that the feedback works for me at all.
24. As a beginner, I want to clear a Stage by being accurate rather than fast, so that I am not punished for the slowness that is the entire point of being a beginner.
25. As a beginner, I want the accuracy standard to be the same for every Stage, so that "cleared Stage 6" means the same thing as "cleared Stage 16".
26. As a beginner, I want my speed shown even though it does not gate, so that I can watch it improve without it being a threat.
27. As a Player who has just cleared a Stage, I want the next Stage to open immediately, so that the reward for clearing is momentum.

### Missing the gate

28. As a Player who finished a Stage below the accuracy standard, I want a distinct screen that leads with how close I got and what I need, so that I know exactly where I stand.
29. As a Player who missed the gate, I want no Leaderboard shown on that screen, so that a bad Attempt does not end with my rank beneath ten strangers.
30. As a Player who missed the gate, I want a dominant "try again" as the obvious next action, so that the path forward is unambiguous.
31. As a Player retrying a Stage, I want exactly the same text again, so that I am practising the thing I just failed rather than starting over on something new.
32. As a Player retrying repeatedly, I want no escalating hints or sounds, so that the app does not get louder about my failure the more I struggle.
33. As a Player who missed the gate, I want my Score still recorded, so that the Attempt counts toward my history even though it did not clear.
34. As a parent of a child stuck on one Stage, I want a way to let them move past it that only I can reach, so that the app's answer to a stuck child is not an infinite loop.
35. As a parent using that override, I want the standard itself left alone, so that clearing a Stage keeps meaning the same thing for every child.
36. As a child, I want never to be shown a skip button, so that I am not offered an escape from effort I will take every time.
37. As a parent, I want the override to work even on the final Stage, so that a child stuck at the very end is not the one person the escape hatch cannot help.

### Replaying and finishing Learn

38. As a Player, I want to see all 21 Stages on my home screen with their state — cleared, next, or not yet open — so that the whole path is visible rather than one step at a time.
39. As a Player, I want to see locked Stages rather than have them hidden, so that I can see there is more ahead.
40. As a young Player, I want the Stage list readable as icons and colours rather than a table of numbers, so that I can use it before I can read well.
41. As a Player, I want to replay any Stage I have already cleared, so that I can improve a Score I set on my first clumsy attempt.
42. As a Player replaying a cleared Stage, I want the ordinary result screen even if I do worse than before, so that revisiting is not punished with a failure screen for a Stage I already passed.
43. As a Player who replayed a cleared Stage badly, I want my earlier best to still hold my place on the board, so that nothing appears to have gone backwards.
44. As a Player, I want every Attempt recorded, including worse ones, so that my history is what happened rather than a highlight reel.
45. As a Player who clears the final Stage, I want a distinct completion moment rather than another ordinary Stage clear, so that finishing the whole curriculum is marked.
46. As a Player who has finished Learn, I want to be pointed at the Speed Test as the obvious next thing, so that I am not left on a screen whose main action has nothing left to do.
47. As a Player who has finished Learn, I want my home screen to lead with the Speed Test while keeping my Stages available to replay, so that the app moves on with me.

### Speed Test and Practice

48. As someone who already types, I want to take one diagnostic test before practising, so that the practice I get is based on my actual weaknesses rather than guesswork.
49. As someone taking the Speed Test, I want it framed as a measurement rather than a test I can fail, so that there is nothing to be gated by.
50. As someone who has taken the Speed Test, I want the result screen to lead with an invitation to practise my weak keys, so that the diagnostic connects directly to the thing it exists to feed.
51. As someone whose Speed Test result was very low, I want to be offered the Learn Track as an alternative, so that a mis-picked door is recoverable.
52. As someone practising, I want each Exercise generated from the keys I am actually worst at, so that I am not spending my time on keys I already have.
53. As someone practising, I want the generated text to be readable words most of the time, so that practice is not uniformly miserable.
54. As someone practising, I want a compact result between Exercises with an obvious "next", so that I can keep going without ceremony.
55. As someone practising, I want ending the session to be my choice rather than a fixed count, so that I can do three Exercises or forty.
56. As someone finishing a practice session, I want a summary showing how my weak keys moved, so that I can see the targeting actually working rather than taking it on faith.
57. As someone who has genuinely fixed a weak key, I want to stop being served practice on it, so that the app tracks who I am now rather than who I was months ago.
58. As someone practising, I want no Leaderboard on generated Exercises, so that I am not being ranked against Players who typed something else entirely.
59. As someone who has improved, I want to retake the Speed Test as an ordinary Attempt, so that I can re-measure without a special ceremony or a reset.

### Leaderboards

60. As a Player, I want each Exercise to have its own Leaderboard, so that a rank means something specific rather than being a single global number.
61. As a Player, I want the Leaderboard hidden while I am typing, so that it is not competing for my attention during the Attempt.
62. As a Player, I want the Leaderboard revealed when I finish, so that it lands as a reward rather than a distraction.
63. As a Learn Player, I want the board shown only when I have actually cleared the Stage, so that I am never shown my rank in the middle of failing.
64. As a Player, I want the board to appear the same way every time I load it, so that ranks do not visibly reshuffle when nobody has typed anything.
65. As a Player outside the top ten, I want my own row shown below the ten with my true rank, so that the board tells me where I actually stand.
66. As a beginner ranked far down, I want to be told when I have beaten my own previous best, so that there is progress to feel even at rank 47.
67. As a Player whose Score was judged implausible, I want to see it listed but marked as not ranked, so that I am not left hunting for a Score that is simply nowhere.
68. As a Player whose Score was marked not ranked, I want no explanation of what tripped, so that a false positive is not an accusation.
69. As a Player on an Exercise almost nobody has attempted, I want no board at all rather than a board of two names, so that the app is not manufacturing a competition that does not exist.
70. As a Player on an Exercise with no board yet, I want my own stats still shown, so that suppressing the ranking does not cost me the completion moment.
71. As a Player of the Speed Test, I want its text never to change, so that the board I am on is comparing like with like.

### Personal history

72. As a Player, I want a place to see my own past Scores, so that I can tell whether I am better than I was a month ago.
73. As a Speed Test Player, I want my results over time shown as a trend, so that improvement across sessions is visible rather than only within one.
74. As a Player, I want my best on each cleared Stage listed, so that I can see which ones are worth going back to beat.
75. As a Player, I want my practice shown as a total plus the keys I am currently working on, rather than a list of individual generated Exercises, so that I am not shown numbers that cannot be compared to each other.
76. As a Player with an implausible Score in my history, I want it listed but kept off the trend line, so that one bad reading does not distort the shape of my progress.
77. As a Player, I want to reach my history from the home screen without going through anything labelled for adults, so that my own Scores are treated as mine.

### Sound

78. As a Player, I want a quiet sound when I mistype, so that I get feedback even while my eyes are on my hands.
79. As a Player, I want no sound on correct keys, so that ordinary typing is silent.
80. As a Player making many mistakes in a row, I want the sound never to escalate, so that a bad run does not turn into scolding.
81. As a Player improving, I want the app to get quieter as my accuracy rises, so that the sound fades as I need it less.
82. As a Player, I want a short sound when I clear something, so that wins are marked.
83. As a Player who missed a gate, I want no sound at all, so that the loudest moments are not reserved for whoever is struggling most.
84. As a parent, I want to mute the app in one tap from any screen including mid-Exercise, so that silencing it never costs my child a Stage in progress.
85. As a Player, I want muting to lose me no information, so that the sound is always redundant with what is on screen.
86. As a household, I want the mute setting to belong to this device rather than to one Player, so that switching Player does not un-mute the room.

### Grown-ups

87. As a parent, I want a permanent, findable page explaining how the app works, so that I can read it when I actually have questions rather than before anything has happened.
88. As a parent, I want to be told plainly that progress lives in this browser and cannot be recovered, so that I am not surprised when clearing cookies loses it.
89. As a parent, I want that page styled so my child skates past it, so that adult content stays adult without needing a password.
90. As a parent, I want no interstitial wall of text before my child can start, so that the app is usable by the child who actually opened the tab.

### Integrity

91. As a Player, I want Scores computed by the server from what I actually typed, so that the boards are not trivially forgeable from a browser console.
92. As a Player, I want an honest Attempt that hits a suspended laptop or a throttled tab to still count for my Stage progression, so that a technical hiccup does not cost me the Stage.
93. As a fast typist, I want never to be publicly accused of cheating, so that a false positive costs me a rank rather than my standing.
94. As a Player, I want a long pause mid-Attempt not to permanently mark the next key as my weakest, so that being called away to dinner does not corrupt my practice for weeks.

## Implementation Decisions

### Stack and hosting

- **SvelteKit** with `adapter-node`, **Svelte** components. Single deployable Node server; server-side rendering used where it matters (a Leaderboard read can render with the Player's own row already highlighted).
- **SQLite** via **better-sqlite3**, accessed through **Drizzle ORM**, with Drizzle migrations. WAL mode.
- **Fly.io**, single VM with a persistent volume, **Litestream** streaming the database to object storage for backup and disaster recovery. Turso is the documented upgrade path if write volume or multi-region need ever justifies it; it is explicitly not needed at launch.
- Single-writer SQLite is appropriate at this scale. Nothing in this spec requires horizontal scale, and the read-heavy Leaderboard workload is served from the same file.

### Data model

Five tables plus one ephemeral handshake table. Full column detail lives in [09-db-schema.md](./issues/09-db-schema.md); the shape and the load-bearing choices are:

- **`players`** — opaque UUID primary key, current `nickname`, `created_at`. No credentials of any kind.
- **`stages`** — 21 seeded rows, id doubling as sequence order, plus the keys taught at that Stage.
- **`exercises`** — 22 seeded rows: the 21 Learn Exercises (one per Stage) and the Speed Test. A `track` discriminator and the Exercise `content`. **Generated Practice Exercises get no row at all** — they are ephemeral.
- **`scores`** — one row per completed Attempt; Attempt and Score are deliberately merged, since raw keystrokes are never persisted and the two are always created together. Holds `net_wpm`, `gross_wpm`, `accuracy`, `elapsed_ms`, `char_count`, `error_count`, `created_at`, the **Nickname snapshotted at Attempt time**, a **nullable `exercise_id`** (null means a generated Practice Attempt), and `leaderboard_eligible`.
- **`weak_key_stats`** — the Weak-key Profile: per `(player_id, key)`, an attempt count, an error count, and cumulative latency.
- **`stage_unlocks`** — `(player_id, stage_id, granted_at)`. Written only by the adult override; empty for every Player who never gets stuck.
- **`attempt_tokens`** — ephemeral, written when an Exercise is served and deleted on submit. Holds the generated Practice text and the server-observed serve time. Deliberately **not** named `attempts`: CONTEXT.md reserves *Attempt* for a completed run producing a Score.

**Stage progression is derived, not stored.** Stage *n* is resolved when the Player holds a Score on its Exercise at ≥90% accuracy **or** a `stage_unlocks` row for it; Stage *n+1* is available when Stage *n* is resolved. This reading is what makes the override work on Stage 21 — a row on Stage 21 completes the Track, with no need to reference a Stage 22 that does not exist.

**Leaderboards are computed on read.** No materialized table. The query dedupes to each Player's best and orders deterministically:

```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY player_id ORDER BY net_wpm DESC, id ASC
  ) AS rk
  FROM scores
  WHERE exercise_id = ? AND leaderboard_eligible = 1
    AND accuracy >= 0.90   -- Learn Exercises only; the Speed Test has no gate
)
SELECT * FROM ranked WHERE rk = 1 ORDER BY net_wpm DESC, id ASC LIMIT 10;
```

The `id ASC` tie-break appears in **both** clauses and is not optional: without it two Players on identical Net WPM order nondeterministically and the board visibly reshuffles between reads. Because `id` is monotonic, it also means the earlier Score wins a tie, and a renamed Player's row cannot flicker between snapshotted Nicknames.

Two further reads the board needs, neither falling out of the query above: **the Player's own rank** among eligible bests, for the appended row; and **a count of distinct ranked Players** on the Exercise, for the suppression check.

### Scoring

Computed server-side, identically for both Tracks:

- **Gross WPM** = (characters typed ÷ 5) ÷ minutes elapsed.
- **Net WPM** = Gross WPM − (uncorrected errors ÷ minutes elapsed). **Net WPM is what is displayed and what ranks.** Gross is stored as a secondary stat and never ranks.
- **Accuracy** = correct keystrokes ÷ total keystrokes typed, where *total* includes characters later backspaced over. A mistake counts even if fixed.
- The Learn gate reads the accuracy half of this same formula against a flat 0.90 and ignores WPM entirely. There is no second calculation anywhere.

### Attempt lifecycle and integrity

The posture is **casual-tamper resistance**, stated explicitly so the Leaderboard is never mistaken for a trustworthy record. With no accounts there is nothing to attribute a Score to. What is defended is the fifteen-second attack — open devtools, POST an arbitrary Net WPM, land at #1. What is accepted as out of reach is a scripted client emitting human-plausible timings.

1. **Serve.** The client requests an Exercise. The server writes an `attempt_tokens` row recording the Player, the Exercise (or the generated text), and the serve time.
2. **Type.** The client renders and tracks locally, computing a live WPM for display only — **advisory, never authoritative**.
3. **Submit.** The client POSTs the **raw per-keystroke event stream** (expected char, received char, timestamp offset) plus the token. Client-supplied aggregates are rejected as a design: a server applying the formula to attacker-chosen counters has the ceremony of server-side computation with none of the protection. Payload is ~24KB worst case, sent once.
4. **Derive.** The server computes every aggregate and the Weak-key deltas from the stream, then **discards the events**. No raw keystroke log is persisted.
5. **Validate**, in two tiers:
   - **Structural failures reject outright**, nothing persisted: missing, expired, consumed or foreign token; malformed stream (non-monotonic or out-of-span timestamps, event count over the DoS ceiling); prompt not completed to the end of the served text.
   - **Plausibility failures persist with `leaderboard_eligible = 0`**: over the Net WPM ceiling, or inconsistent with the server-observed wall clock. The Score still counts for personal history **and for the Learn 90% gate**. The driver is asymmetric harm — a child who finishes at 94% and hits a suspended lid must not lose the Stage, with no account and no support inbox to appeal to. The response is a plain 200 with no signal about which check tripped.
6. **Fold into the Profile.** Every accepted stream updates `weak_key_stats`, flagged or not — the Profile is private and self-harming only, so there is no adversary. Each keystroke's latency is **clamped to a tunable ceiling (~3000ms)** before accumulating, because a raw wall-clock gap cannot distinguish "hesitates on `p`" from "was called to dinner", and one 30-second pause would otherwise crown the next key permanently weakest.

`attempt_tokens` lives in SQLite rather than process memory: on a single VM, a deploy would otherwise void every in-flight Attempt, landing on a five-year-old mid-Stage. A TTL sweep clears tokens older than ~30 minutes, which is needed for abandoned Attempts regardless of abuse.

### Practice Exercise generation

**Generation is server-side.** Client-side generation would leave the server unable to check a single character of a Practice Attempt, letting client-trust on one Track decide the whole system's posture — and it would mean shipping a Player's whole Profile to the browser. Keeping it server-side also keeps the algorithm and its tuning knobs retunable without a client release.

The weakness score and Profile shape came out of a terminal prototype ([05](./issues/05-prototype-weak-key-generation.md)) and are stated here because prose is less precise than the arithmetic:

```
weakness(key) = errorRate × 0.7 + latencyFactor × 0.3      // only once the key has 3+ (weighted) samples

// per (Player, key), decayed on every write:
{ attempts, errors, totalLatencyMs }
next = previous × DECAY_FACTOR + newSample
```

- **Error rate dominates**; latency is the secondary signal that surfaces hesitation on keys the Player is not outright getting wrong.
- **The 3-sample floor** stops one early fumble owning the Profile. Because counters decay it is a weighted threshold, not an integer count.
- **Two generation modes**, both valid, chosen by context: **word-bank** (real short words weighted toward the Player's weak keys — readable, the natural default) and **bigram** (nonsense syllables built straight from the weakest keys — much denser targeting, unreadable, for a more intense moment).
- **Targeting aggressiveness** is a 0–1 knob blending uniform-random selection against always-favour-the-weakest.
- **Decay on write** is what makes the Profile track recent performance. Without it, lifetime totals make the Profile *less* responsive precisely as a Player improves, and someone who has fixed a key keeps being served it.

### Track flows

**Learn.** Home screen → Stage list or continue CTA → typing → reveal. Clearing resolves the Stage and opens the next. Missing the gate goes to a distinct failure state with no Leaderboard and a dominant retry that replays **identical text**. This encodes a rule that holds system-wide:

> **Fixed content ⟺ has a Leaderboard. Generated content ⟺ has none.**

Re-drawing a Stage's text per Attempt would rank Players who each typed different strings, gutting the per-Exercise model. After a configured number of consecutive failures, the failure screen surfaces a quiet, adult-voiced line pointing at the grown-ups route, where an adult can resolve the Stage. There is never a child-facing skip and the 90% bar never moves.

**Learn completion.** Clearing Stage 21 goes to a distinct completion screen whose dominant CTA is the Speed Test. Afterwards the home screen needs no new rule — its CTA is already "next unlocked Stage, *or* the Speed Test", and a graduate simply has no first branch left. Stages remain replayable from the Stage list.

**Speed Test & Practice.** The Speed Test is a **one-time prerequisite** for Practice — sequencing, not a gate; there is no score to beat and nothing to fail, so the Track remains ungated. Its result screen carries a dominant "practise your weak keys" CTA with the conditional sub-floor "start from the beginning instead?" as the subordinate. Practice is **Player-paced**: compact stats between Exercises, "next" dominant and "finish" subordinate, ending in a **session summary showing the Weak-key Profile moving** — the only surface that ever shows a Player the adaptive targeting working. A session is a **client-side grouping, not a modelled entity**: snapshot the top weak keys when practice begins, diff against the current Profile at finish. No table.

**Cold start is bounded, not eliminated.** One Speed Test will not clear the 3-sample floor for rare keys — `q`, `z`, `x`, `j` may get zero samples. Generation must treat partially-unknown keys as the normal post-Test state, not an edge case.

### Leaderboard display

- **Revealed on the Stage being cleared** — by this Attempt or any earlier one — not merely on finishing. A sub-gate replay of an already-cleared Stage therefore gets the ordinary result screen; its Score simply cannot rank, under the query's accuracy predicate.
- **The board row is always the Player's best, never their latest.** The personal-best marker fires only when this Attempt became that best.
- **Outside the top ten**, the Player's own row is appended below the ten, visually separated, showing their true rank.
- **An ineligible Score** appears on that row **marked not ranked, with no explanation**, mirroring the profanity redirect: state the outcome, never name the detection. If a Player's own best is ineligible they have no ranked best, so the row carries the Score rather than a rank.
- **Below a threshold of distinct ranked Players the board is suppressed entirely**, and the reveal shows the personal panel alone — same component, rendered without the ten rows. Stats always survive suppression. At launch every board is empty, so this is the normal condition for a while, not an edge case.
- **The Learn accuracy predicate is a query predicate, never `leaderboard_eligible = 0`.** That column means "implausible, possibly tampered" and doubles as the manual moderation lever; overloading it to also mean "typed sloppily but honestly" would poison the one column an operator reaches for.

### Personal history

A history screen, reached as a **plainly-styled route off the home screen's secondary row** — not adult-gated, because a Player's own Scores are not an adult's business. Sectioned by what each Track can honestly say:

- **Speed Test** — a Net WPM trend over time. This is the app's only apples-to-apples series, and only because the Speed Test's content is immutable. Every retake is listed; **ineligible Scores are listed and marked but never plotted** — marked where they are a row, absent where they would be a claim about direction.
- **Learn** — best Score per cleared Stage, in the same vocabulary as the Stage list.
- **Practice** — an aggregate (Attempts, time typing) plus the current Weak-key Profile. **Never individual generated Attempts**: each targeted different keys, so listing them renders noise as data.

This requires **no schema change**. It gives a reader to two pieces the schema already carried speculatively — the `(player_id, created_at)` index and the nullable `exercise_id`.

### Identity and the cookie

- A long-lived cookie holds `{ active, players[] }` — a list of opaque Player UUIDs plus which is active — so siblings on one device do not blend Weak-key Profiles. The device-scoped **mute preference** rides in the same cookie: mute is a property of the room, not the person.
- Nicknames are **non-unique**, with no disambiguation on Leaderboards and **no recovery path**. Two Players may share a name; the app does not care.
- Nicknames are **editable**, but each Score snapshots the Nickname at Attempt time.
- Profanity filtering runs **only on free text**. Nicknames picked from the curated card list are safe by construction, so the filter never runs on the Learn Track's default path.

### Visual and UX principles

- **One visual language flexed per Track, not two modes.** One component system — the same feedback pills, the same on-screen keyboard, the same Leaderboard treatment. Only type scale and font family flex: bigger and rounder for Learn, tighter and more compact for Speed Test & Practice.
- **The on-screen keyboard is on both Tracks** and highlights the next expected key.
- **Feedback never relies on colour alone.** Correct characters get a filled pill plus a check glyph; incorrect get a *dashed* outline plus a cross. Shape and glyph each carry the signal independently of hue. This is the baseline-accessibility line: colourblind-safe feedback and legible sizing, not full assistive-tech support.
- **The Stage list's three states** (cleared / current / locked) carry shape and glyph as well as hue, and must read as icons and colour rather than a table.
- **The home screen is the app's one surface for everything that is not typing** — the continue CTA, the Stage list, the other Track, the Player switch, the history route, the grown-ups route. Routes hang off it; it is not replaced by them.

### Audio

- **Error-only keystroke ticks** — soft, short, fixed volume regardless of consecutive errors, and **self-attenuating as accuracy improves**. Plus rare event sounds on clearing.
- **No failure sound.** It would fire loudest and most often for the Player having the worst time, inverting the self-attenuation exactly.
- **No music, no spoken prompts, no per-Track flex.**
- **Hard invariant: every sound is strictly redundant with the visual channel.** Muting is therefore lossless and browser autoplay blocking is a non-event. Audio is reinforcement for a *sighted* Player whose eyes are on their hands — explicitly not assistive tech.
- Defaults on. A single toggle is reachable on every screen **including mid-Attempt**, so silencing never costs a Stage in progress.

### Tunable configuration

Five values are **named config with sensible defaults, never hardcoded constants**. Their structure is specified; their values await live data, and none blocks a build:

| Constant | What it controls |
|---|---|
| Targeting aggressiveness | 0–1 blend from uniform-random to always-favour-the-weakest |
| Weak-key decay factor | How fast old samples lose weight |
| Speed Test floor | Below which the result screen offers the Learn Track |
| Consecutive-failure count | Before the failure screen surfaces the adult-override line |
| Leaderboard display threshold | Distinct ranked Players before a board appears at all |

Two more are tunable for the same reason: the **Net WPM ceiling** (default 250 — the sustained human record is ~212 and the primary audience is five-year-olds, so it never touches a real Player) and the **latency clamp** (~3000ms).

## Testing Decisions

**A good test here asserts external behaviour and nothing else.** It sends a request and checks the response and the resulting database state. It never reaches into a scoring function, asserts on an intermediate value, or names a private helper — so the whole scoring, generation and validation internals stay free to be restructured without touching a test.

**One seam: HTTP against the running SvelteKit server, backed by a real migrated SQLite database per test.** There is no application code yet, so this is the pattern rather than a fit to existing prior art. It was chosen because nearly every decision in this spec is observable there: POST a crafted keystroke stream and assert the derived Score, the gate outcome, the eligibility flag, the Weak-key Profile delta, which Stage is now available, and what the board returns. It tests the real contract rather than the spelling of a formula.

Two things the seam needs, both of which the spec already requires to exist:

- **A seeded RNG**, so generation is deterministic under test.
- **Per-test config injection** for the seven tunable values above. Since none of them may be hardcoded, this costs nothing extra.

What to cover, by area:

- **Scoring** — Net vs Gross WPM; accuracy counting corrected (backspaced) errors; identical formulas on both Tracks. Table-driven over crafted streams.
- **Integrity** — structural failures reject and persist nothing (missing, expired, consumed, foreign token; non-monotonic timestamps; incomplete prompt). Plausibility failures return 200, persist with `leaderboard_eligible = 0`, and **still satisfy the Learn gate**. The response body must reveal nothing about which check tripped.
- **The Learn gate** — 90% clears and opens the next Stage; 89% does not; the flat threshold holds at Stage 1 and Stage 21; a retry serves byte-identical text.
- **The override** — a `stage_unlocks` row resolves a Stage without a qualifying Score, opens the next, works on Stage 21, and never alters the accuracy standard.
- **Leaderboards** — tie-break determinism is the sharp one: identical Net WPM must return in identical order across repeated reads, with the earlier Score first. Plus the appended out-of-top-ten row and its true rank; personal-best marking only when this Attempt became the best; ineligible Scores marked and unranked; suppression below the threshold, and stats surviving it; the Learn accuracy predicate keeping a fast sub-gate Score off the board.
- **Replay** — a sub-gate replay of a cleared Stage returns the ordinary result rather than the failure state, does not re-lock, does not displace the earlier best, and still writes a Score.
- **Weak-key Profile** — every accepted stream folds in, including flagged ones; latency clamping caps a 30-second gap; decay makes recent samples dominate, demonstrated by a key that stops being targeted after sustained clean typing.
- **Generation** — output draws only from keys taught so far where that constraint applies, targets the Profile's weakest keys under a seeded RNG, and copes with keys that have zero samples (the normal post-Speed-Test state).
- **Identity** — a cookie carrying two Players keeps their Profiles and progression separate; a Nickname change leaves existing Scores' snapshots untouched; profanity rejection fires on submitted free text and never on curated picks.

**Not covered by this seam, and accepted:** the visual rules from the design decisions — the never-colour-alone feedback, the next-key highlight, the reveal's timing, the Stage list's three states. These are verified against the resolved-design reference render in [prototypes/resolved-design/](./prototypes/resolved-design/), which walks all nineteen specified states including the ones unreachable by playing forward. Component tests were considered and declined as the most brittle tests in the set for the least return.

## Out of Scope

Content-authoring, deferred to implementation time rather than spec decisions:

- Stage-by-stage lesson text — the curriculum *outline* (Stage count, keys, order, thresholds) is specified; the actual words and sentences per Stage are not.
- The word-bank and bigram vocabulary backing generation. The *approach* is specified; the literal lists are not.
- The curated word list and icons backing Nickname candidates. The *mechanism* — a curated list that makes picked Nicknames safe by construction — is specified.
- The audio assets themselves. Their *constraints* — soft, short, non-escalating, strictly redundant with the visual channel — are specified.

Ruled out of the product:

- **Accounts, passwords, email, and any recovery path.** There is deliberately no way to recover progress from a cleared cookie.
- **Multi-Player profile management beyond a "Not you?" switch** — no removal, no avatars, no picker on every load.
- **Background music and spoken prompts or voice narration.**
- **Native mobile apps.** This is a web build; app-store packaging is not.
- **Real-time multiplayer typing races.** Leaderboards give the competitive hook without live-race infrastructure.
- **Monetization and ads.**
- **Non-English content, non-QWERTY layouts, and UI localization.**
- **Screen-reader and full assistive-tech support.** Baseline visual accessibility only.
- **Admin or moderation tooling.** The `leaderboard_eligible` column is the lever and manual SQL against the VM's SQLite file is the intended, sufficient interface. An admin surface would introduce the only credential in an app that has refused authentication everywhere else, for the rarest event in the spec.
- **Behavioural anti-cheat** — keystroke-rhythm fingerprinting, timing-distribution analysis. Ruled out by the casual-tamper posture; disproportionate for a solo project and carrying real false-positive risk against genuinely fast typists.
- **Deployment and CI pipeline specifics** — build/test/deploy workflow, Litestream restore drills. The platform choice is settled; the operational pipeline is implementation-time work.

## Further Notes

**The single most load-bearing rule in the spec** is *fixed content ⟺ has a Leaderboard, generated content ⟺ none*. It explains why Learn retries replay identical text, why Practice has no board, why the Speed Test's text is immutable once live, and why a new Speed Test text must be a new Exercise row rather than an edit. Anything that breaks it silently breaks the competitive model.

**Two schema pieces are deliberately re-read rather than re-shaped.** `stage_unlocks` means "*Stage n counts as resolved*", not "Stage n+1 is available" — availability is derived identically from a row or a qualifying Score, which is what makes the override work on the final Stage. And `leaderboard_eligible` means "implausible, possibly tampered" and only that; the Learn accuracy requirement is a query predicate, deliberately not that column.

**The Speed Test board is the app's de facto flagship.** ADR 0002 refused a global Leaderboard in favour of per-Exercise ones, but one shared text taken by every Player of that Track, ranked by Net WPM, is functionally the closest thing to a global board this app will have. Named here so a future reader does not "add the missing global leaderboard" and re-litigate 0002.

**At launch, every board is suppressed.** Twenty-one Learn boards plus the Speed Test all start empty, so the suppressed state is what most Players see for a while. It should be built as the normal path, not an edge case, and the personal panel it falls back to must be good enough to carry the completion moment alone.

**The reference render** at [prototypes/resolved-design/](./prototypes/resolved-design/) is the visual companion to this document — the specified app across eight screens and nineteen addressable states, opened directly in a browser with no build step. Where this spec describes a screen in prose, that render shows it. The earlier three-variant exploration in [prototypes/06-visual-design/](./prototypes/06-visual-design/) is preserved only as the record of how the visual decision was made; two of its variants lost.

**Five values await playtest data** and are listed in the configuration table above. None blocks implementation. The risk to watch is that they get quietly hardcoded during the build — at which point tuning them later means a code change and a deploy rather than a config edit, and the map's whole reason for leaving them open is lost.
