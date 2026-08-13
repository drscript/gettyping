# GetTyping — Practice from Learn

Status: ready-for-agent

Synthesized from the wayfinder map at [map.md](./map.md) and its four resolved decision tickets in [issues/](./issues/). Domain vocabulary is defined in [CONTEXT.md](../../CONTEXT.md) and used strictly — **Track, Stage, Exercise, Speed Test, Attempt, Score, Player, Weak-key Profile, Corpus**. Practice is generated Exercises on the Speed Test & Practice Track.

No new ADR. This amends the sequencing in [14-practice-loop.md](../gettyping-spec/issues/14-practice-loop.md) ("Speed Test is a one-time prerequisite") and one sentence of the Speed Test glossary entry. Architecture is unchanged: [0003](../../docs/adr/0003-adaptive-exercise-generation.md) still generates Practice from the Weak-key Profile; Sentence-mode Corpus still constrains *what* can be generated via `cumulativeKeySet`; [0002](../../docs/adr/0002-per-exercise-leaderboards.md) still forbids a Leaderboard on generated text.

## Problem Statement

Practice currently requires a completed Speed Test. `GET /api/attempts/practice` 403s unless the Player has a Score on exercise id 22, and the client assigns `/speed-test`. A mid-curriculum Learn Player already has a Weak-key Profile (Learn Attempts fold into it) and a cumulative key set (cleared + current `keysTaught`). They are told, on Learn complete, that the Speed Test "builds the Weak-key Profile that Practice draws from," which is false for them, and they have no home path to `/practice`.

The Speed Test must remain the diagnostic for people who skipped Learn. Nickname-only Players with zero Attempts still have nothing to target.

## Solution

Practice eligibility becomes: **at least one Learn Score, or at least one Speed Test Score**. Cold start still 403s to the Speed Test.

Home Continue stays "next Stage, else Speed Test." Practice is a **secondary** home action once eligible, labelled **Practise weak keys**. Learn complete still leads with the Speed Test and no longer claims Practice depends on it. The Speed Test result still leads with **Practise your weak keys**.

Generation, modes, session summary, Profile arithmetic, and "no Leaderboard on generated Exercises" do not change. `cumulativeKeySet` does not change: Learn-started → taught keys; else alphabet. Practice stays on the Speed Test & Practice Track even when entered from Learn.

## User Stories

1. As a Learn Player who has finished at least one Stage Attempt, I want to practise my weak keys without taking the Speed Test, so that I work on letters I have actually been taught.
2. As a Nickname-only Player who has not typed yet, I want Practice to send me to the Speed Test rather than generate empty targeting, so that the first diagnostic is honest.
3. As a Player who skipped Learn and took the Speed Test, I want Practice to work exactly as it does today, so that the diagnostic door is not broken.
4. As a Player who has both Learn Scores and a Speed Test Score, I want both doors to keep working.
5. As a returning Learn Player, I want Continue to still be my next Stage (or the Speed Test once I have graduated), so that Practice does not steal the Learn path.
6. As an eligible Player, I want a home link to Practice that does not sit in the Stage list, so that Practice is not presented as a Stage.
7. As a Learn graduate, I want the completion screen to point me at the Speed Test as the main next thing, without being told Practice cannot start until I take it.
8. As a Learn-only Player finishing a Practice session, I want a Speed Test offer that does not say "retake," so that the app does not pretend I have already taken it.
9. As a Learn-only Player at Stage 3, I want generated Practice to use only the keys taught so far, so that I am not asked for letters the curriculum has not introduced.
10. As a Speed-Test-only Player, I want generated Practice to still draw from the alphabet, so that skipping Learn does not shrink my pool.
11. As a Player in Practice, I want the Speed Test & Practice visual language and no Leaderboard on generated text, so that arriving from Learn does not turn Practice into a Learn Stage.

## Implementation Decisions

### Eligibility

`GET /api/attempts/practice` allows the request when the active Player has a Score joined to an Exercise with `track = 'learn'` **or** `track = 'speed_test'`. Prefer that join over hardcoding exercise id 22.

Counts:

- Sub-gate Learn Scores (accuracy below 90%).
- `leaderboard_eligible = 0` Scores.

Does not count:

- Nickname only, zero Scores.
- Finger stretch (no Score row).
- Adult override with no Score.
- Practice Scores (`exercise_id` null) — unreachable as an unlock, and not a door.

On failure: **403**. Client keeps `window.location.assign('/speed-test')`. The 403 body may mention the Speed Test; only ineligible Players hit it.

No schema change. No new table, flag, or cookie bit. Derived from `scores`, same posture as Stage progression.

### Key set and generation (do not touch)

`cumulativeKeySet` stays. Learn-started (any Learn Score) → union of `keysTaught` on cleared and current Stages. Else → lowercase alphabet.

Do not change `generatePracticeContent`, Corpus filtering, bigram adjacency, targeting aggressiveness, weakness formula, decay, or latency clamp. Do not add a mode. Do not add a Leaderboard to generated Exercises. Do not create Exercise rows for Practice.

A Learn-only Player at Stage 3 therefore cannot be served letters outside `{f, j, g, h, d, k}`. A Speed-Test-only Player still gets the alphabet. Dual-track: Learn started, so the taught-key set wins even if they also have a Speed Test Score — already true on main.

### Navigation

`src/routes/+page.server.ts` Continue href is unchanged:

- `?track=speed-test-practice` → `/speed-test`
- else current Stage → `/learn/stages/{id}`
- else → `/speed-test`

Load an `eligibleForPractice` (name is local; not a glossary term) boolean from the same Score rule as the API. Returning home's secondary `<nav>` gains, only when true:

```html
<a href="/practice">Practise weak keys</a>
```

alongside "Your history" and "Not you?". Not in the Stage list. Hidden when ineligible, not disabled.

Learn complete (`/learn/complete` and the Stage-21 result card): dominant CTA remains `/speed-test`. No Practice CTA. Replace the lead sentence that claims the Speed Test builds the Profile Practice draws from with:

> The Speed Test measures your speed on one shared text and is the flagship Leaderboard.

Speed Test result: keep `<a href="/practice">Practise your weak keys →</a>`.

Practice session summary: change **Retake the Speed Test** to **Take the Speed Test**. Same href. No branch on whether a Speed Test Score exists.

`/practice` keeps `TrackFrame` `track="speed-test-practice"`.

History: no change.

First-run Track doors: no change.

### CONTEXT.md correction (not a new term)

Speed Test entry today says it is "used to seed their Weak-key Profile before any targeted practice is generated." Amend to: the diagnostic Exercise on the Speed Test & Practice Track that measures current WPM and accuracy. It is the door into Practice for a Player who skipped Learn. Learn Scores also unlock Practice, because Learn Attempts already fold into the same Weak-key Profile.

Do not add glossary terms. Do not add an ADR.

### Code that must change vs must not

Must change:

- `src/routes/api/attempts/practice/+server.ts` — eligibility check.
- `src/routes/+page.server.ts` — expose eligibility for the secondary link.
- `src/routes/+page.svelte` — secondary Practice link.
- `src/routes/learn/complete/+page.svelte` — lead copy.
- `src/routes/practice/+page.svelte` — session-summary Speed Test phrase (403 branch stays).
- `CONTEXT.md` — Speed Test sentence.
- `tests/acceptance/practice.test.ts` and home/Learn-complete coverage as in [Testing Decisions](#testing-decisions).

Must not change (unless a listed criterion forces a one-line copy fix):

- `src/lib/server/cumulative-key-set.ts`
- `src/lib/server/practice-generation.ts`
- `src/lib/server/weak-key-profile.ts`
- Practice modes, handshake, POST submit path
- Speed Test serve/submit, immutability, Leaderboard
- Learn gate, Stage list, Continue href logic
- History sections
- `TrackFrame` on `/practice`

Existing Practice acceptance tests all call `completeSpeedTest` before `GET /api/attempts/practice`. They must keep passing. Add Learn-only cases; do not convert every fixture to Learn-only.

## Testing Decisions

**One seam: HTTP against the running SvelteKit server, backed by a real migrated SQLite database per test.** Same seam as [18](../gettyping-spec/issues/18-walking-skeleton-and-test-seam.md) and `tests/acceptance/practice.test.ts`. Seed Players and Scores the way those tests already do (Nickname POST + SQL insert, or a completed Attempt). Assert status, body, HTML hrefs, and resulting `scores` / handshake rows. Do not import `cumulativeKeySet` or an eligibility helper from a new acceptance test.

The repo already has unit tests for `cumulativeKeySet`. This change does not add more of those. The proof that Learn-only Practice is key-set-constrained is an HTTP assertion on `GET /api/attempts/practice`.

Client-only states the seam cannot see (Practice session summary after `onMount`) are accepted as source-level criteria on `src/routes/practice/+page.svelte`, the same way the original spec left visual rules off the seam. Home and Learn complete are SSR and **are** on the seam.

What to cover:

- **Eligibility 200** — Player with only a Learn Score (including sub-gate Stage 1, including `leaderboard_eligible = 0`) gets 200 and a handshake with generated content. Player with only a Speed Test Score still gets 200. Player with both still gets 200.
- **Eligibility 403** — Nickname-only, zero Scores, gets 403. Adult override on Stage 1 with no Score still 403.
- **Key set** — Learn-only, Stages 1–2 cleared, Stage 3 current, Sentence mode: served content uses only taught letters (and spaces). No Speed Test Score in that fixture. Speed-Test-only Sentence mode still matches the full-alphabet fallback already asserted.
- **Home** — Learn Player with a Score: HTML contains `href="/practice"` and **Practise weak keys**, and Continue still points at the current Stage, not `/practice`. Nickname-only returning home: no `href="/practice"`. Graduate: Continue still `href="/speed-test"`, and Practice link is present.
- **Learn complete** — HTML still has the Speed Test as the primary action; it must not claim Practice draws from the Speed Test or that the Speed Test must be taken before Practice.
- **Track** — `GET /practice` HTML still has `data-track="speed-test-practice"`. Home Practice link is not inside the Stage list (`stage-grid`).

## Out of Scope

- A third Track, or Practice Exercises as Learn content.
- Auto-routing Continue or Learn complete into `/practice`.
- Changing generation, modes, Profile arithmetic, Corpus, or `cumulativeKeySet`.
- A Leaderboard on generated Exercises.
- A new history section.
- Gating, freezing, or editing the Speed Test text.
- New glossary terms. New ADRs.
- Playwright / driving the client 403 redirect. The seam asserts the API 403; the existing `assign('/speed-test')` branch stays.

## Further Notes

**14's prerequisite is sequencing, and sequencing is what changed.** Everything 14 said about the loop, the summary, decay, retakes, and the flagship Speed Test board still holds.

**The Track is the activity.** Arriving from Learn does not make Practice a Learn feature. Copy that implies otherwise is a bug in this spec, not a taste call.

**`cumulativeKeySet` is the Learn-only safety net.** If a future change serves the alphabet to a Player who has started Learn, that is a regression of [03](issues/03-key-set-and-targeting.md), not an eligibility bug.

Implementation tickets, vertical, `ready-for-agent`, criteria that fail on current main: [10](issues/10-practice-eligibility-from-learn-scores.md), [11](issues/11-home-secondary-practice-action.md), [12](issues/12-learn-player-copy.md).
