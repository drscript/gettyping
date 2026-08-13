# GetTyping — Learn finger assignment

Status: ready-for-agent

Synthesized from the wayfinder map at [map.md](./map.md) and its four resolved decision tickets in [issues/](./issues/). Every decision below has a ticket holding its full reasoning and its rejected alternatives; this document is the implementable summary, not the argument. Domain vocabulary is defined in [CONTEXT.md](../../CONTEXT.md) and is used strictly throughout — **Track, Stage, Exercise, Attempt, Score, Player, Finger stretch**.

The Stage 1 intro is a **UI beat** on the Stage 1 route. It is not an Exercise, not an Attempt, and not a Finger stretch. **Do not add a glossary noun** for it. A one-line clarification may be added under Stage in CONTEXT.md if a reader keeps misnaming it; it is not required to ship.

Architectural decisions already recorded as ADRs are unchanged. This map does not reopen nickname-only identity, per-Exercise Leaderboards, or adaptive generation.

## Problem Statement

A beginner on Learn is shown which **key** to press next. They are not shown which **finger** belongs on that key, and Stage 1 never tells them that F and J have tactile bumps and are where the index fingers rest. The on-screen keyboard is already the teaching surface; it currently only carries the next-key Sunshine highlight.

## Solution

On the Learn Track, every cap of the existing on-screen keyboard carries a persistent finger badge (hand-side chevron + 1–4 pips, hue on the mark). Caps stay white. The next key still takes Sunshine, a Sunshine Deep edge, and rises — that remains the primary teaching signal. Speed Test & Practice uses the same component with the badges off.

Stage 1 opens, once per Player, with a short “find the bumps, rest here” beat **before** the gated Exercise Attempt. Acknowledging it writes `stage_one_intro_seen_at` on `players` and then the Attempt is served as today. Transfer codes already copy that Player row, so the beat does not reset on another device.

## User Stories

1. As a beginner on Learn, I want each on-screen key to show which finger rests there by shape as well as colour, so that I can match a finger to a key without looking down and without relying on hue.
2. As a beginner, I want the next key to still be the bright raised Sunshine cap, so that finger marks never compete with “press this now”.
3. As a colourblind Player, I want left/right and which finger to remain distinct when hue is removed, so that the zones work the way correct/incorrect already do.
4. As a Player on Speed Test & Practice, I want the same keyboard without finger-zone decoration, so that the cooler Track is not dressed as a beginner lesson.
5. As a first-time Learn Player opening Stage 1, I want to be shown the bumps under F and J and told to rest my index fingers there before I am asked to type, so that I am not thrown into the gate without a home position.
6. As that Player, I want no way to skip that beat the first time, so that “I’ll skip it” is not the path of least resistance.
7. As a Player who has already seen that beat, I want Stage 1 to go straight to typing, including on replay and on a transferred device, so that the lesson is not a nag.
8. As a Player who transfers to another device, I want that “already seen” fact to come with me, so that a transfer code does not sit me through the bumps again.
9. As a Player, I want the intro to write no Score and to consume no Attempt, so that a teaching beat cannot appear on a Leaderboard or in history.
10. As a Player, I want no new sound and no spoken prompt, so that mute stays lossless and the intro is entirely on screen.

## Implementation Decisions

### Finger map

Applied to caps in `keyboardCapRows` only. Dual-value caps take the physical key’s finger. Caps Lock is out of scope. Hyphen is not on this keyboard; if a cap is added later it is right pinky. The single `shift` cap is left pinky.

| Finger | Caps |
|---|---|
| Left pinky | `1 !`, `q`, `a`, `z`, `shift` |
| Left ring | `2`, `w`, `s`, `x` |
| Left middle | `3`, `e`, `d`, `c` |
| Left index | `4`, `5`, `r`, `t`, `f`, `g`, `v`, `b` |
| Thumbs | `space` |
| Right index | `6`, `7`, `y`, `u`, `h`, `j`, `n`, `m` |
| Right middle | `8`, `i`, `k`, `,` |
| Right ring | `9`, `o`, `l`, `.` |
| Right pinky | `0`, `p`, `; :`, `'`, `/ ?` |

Store this next to the cap table (`keyboard-caps.ts`), not as a parallel layout. The live keyboard and any Learn showcase read the same map.

### Visual encoding

Locked by [prototypes/keyboard-finger-zones.html](./prototypes/keyboard-finger-zones.html). Match that file.

- **Badge on the cap, not a fill of the cap.** White key, Key Rest edge.
- Chevron = hand (left points left, right points right).
- Pips = finger from the outside: pinky 1, ring 2, middle 3, index 4.
- Thumb: mint bar, no chevron, no pips.
- Badge hue: Sky Blue / Lesson Blue / Playground Indigo / Active Indigo for pinky → index; mint for the thumb bar. Same finger, same hue on both hands. Night Indigo outline always. White pips/chevron on the darker fills.
- F and J: extra ink bump ridge on the lower edge of the cap.
- **Next key:** Sunshine fill, Sunshine Deep edge, rise, Night Indigo ink. Badge stays. Do not use Sunshine Wash as a finger signal.
- Learn flex on; Speed flex off. One component.
- Keyboard stays visible. No gamification chrome.

`OnScreenKeyboard` today takes a single `nextKey`. Intro highlights **F and J together**. Extend the prop so the component can highlight one cap (Attempt) or both home caps (intro) without a second keyboard.

### Stage 1 intro beat

On `/learn/stages/1` only. Current `$effect` always `GET`s an Attempt token. Change that path:

1. `GET /api/attempts/learn/1`.
2. If the body is `{ stageOneIntro: true }`, render the intro card + keyboard (F and J highlighted, index badges on). Do not mount `TypingAttempt`. Mute / grown-ups remain (layout). No skip control. Sunshine button: “I found the bumps”.
3. Button `POST`s `{ stageOneIntroSeen: true }` to the same resource, then `GET`s again and proceeds as today.
4. If the GET already contains a `token`, skip the beat (returning Player, replay, transferred Player whose column is set).

Copy, child-facing:

- Headline: Find the bumps
- Find the little bumps under F and J.
- Rest your index fingers there.
- Those two keys are home.

No Score. No `attempt_tokens` row while the intro is showing. No new sound.

### Schema

```sql
ALTER TABLE players ADD COLUMN stage_one_intro_seen_at INTEGER NULL;
```

Drizzle column on `players`: `stageOneIntroSeenAt` integer, nullable. Set once; later POSTs leave the original timestamp. Transfer codes already point at `players.id`; no change to `transfer_codes`.

### HTTP — existing Learn Attempt seam only

Do not add a second application seam. Do not add `/api/intro`. Visual encoding is **not** asserted over HTTP; it is the prototype (same as colorblind feedback and next-key highlight).

`GET /api/attempts/learn/:stageId`

- Stage 1, `stage_one_intro_seen_at` IS NULL: `200 { "stageOneIntro": true }`. No `token`. No insert into `attempt_tokens`.
- Otherwise: today’s `{ token, exercise, stage }` payload.

`POST /api/attempts/learn/:stageId`

- Body `{ "stageOneIntroSeen": true }` and `stageId === 1`: set the column if null, `204`. No Score, no token consume, no token create.
- Same body on any other Stage: `404`.
- Body `{ token, events }`: today’s submit path, unchanged.

Stages 2–21, Speed Test, Practice, Finger stretch: no intro branch.

Existing Stage 1 acceptance tests that `GET` a token on the first request **will fail on this change** and must go through the acknowledge POST first (or the unseen-intro assertions belong in the new tests, and the old helpers acknowledge before starting). That is required, not incidental.

### Accessibility labeling

Keep `role="img"`. Extend `aria-label`:

- Attempt: `On-screen keyboard. Next key: f, left index.`
- Intro: `On-screen keyboard. Home keys: F, left index and J, right index.`
- Speed: next key only, no finger clause.

Highlighted cap’s sr-only hint includes the finger. Do not label every cap. Do not claim screen-reader support. Finger words: left/right + pinky|ring|middle|index, and thumbs.

## Testing Decisions

**One seam: HTTP against the running SvelteKit server, backed by a real migrated SQLite database per test.** Same posture as the rest of the suite. No second runner. No component tests for badges.

Cover:

- A brand-new Learn Player `GET /api/attempts/learn/1` receives `{ stageOneIntro: true }`, no `token`, and `attempt_tokens` is empty for that Player.
- That GET does not write a `scores` row.
- `POST` `{ stageOneIntroSeen: true }` to Stage 1 returns 204, sets `players.stage_one_intro_seen_at`, writes no Score and no token.
- A second such POST is 204 and does not change the timestamp.
- After acknowledge, `GET /api/attempts/learn/1` returns today’s token payload and inserts one `attempt_tokens` row.
- `GET /api/attempts/learn/2` (once unlocked) never returns `stageOneIntro` and still mints a token.
- `POST` `{ stageOneIntroSeen: true }` to Stage 2 is 404 and writes nothing.
- Speed Test / Practice / Finger stretch GET/POST bodies are unchanged.
- Transfer: Player A acknowledges on device 1; redeem that Player onto device 2; `GET /api/attempts/learn/1` returns a token, not the intro.
- A second Player on the same device who has not acknowledged still receives the intro (column is per Player, not a device cookie).

**Not covered by this seam, and accepted:** badge shape, pip counts, hue, Sunshine interaction, intro card layout, bump ridge. Specified by [prototypes/keyboard-finger-zones.html](./prototypes/keyboard-finger-zones.html). A table-driven **unit** test of the finger-to-cap map (data only, no render) is allowed so the QWERTY assignment cannot drift; it is not a visual test.

Existing `tests/acceptance/learn-stage.test.ts` helpers that assume a token on first GET must be updated in the same work that changes GET.

## Out of Scope

- Caps Lock.
- Fading or hiding the keyboard.
- Finger badges on Speed Test & Practice.
- Spoken audio, new intro sounds.
- Cookie-only persistence.
- Adding a hyphen cap or a right shift cap.
- Rainbow keycaps, finger-name text on caps, gamification chrome.
- Full screen-reader support.
- A new glossary term for the intro.
- A second HTTP resource or a second test seam.

## Further Notes

The load-bearing UI rule is the same as DESIGN.md’s next-key rule: **Sunshine means “this cap now”**. Finger identity is a mark that survives that fill. If an implementation tints the whole key by finger, it has lost.

The load-bearing data rule is: **intro acknowledgement is a Player column, and it gates token minting on Stage 1**. If GET still mints a token during the intro, the beat is a skin on an Attempt and the TTL / “not an Attempt” decisions are already broken.

CONTEXT.md: no new term. If a sentence is added, put it under Stage: *Stage 1’s first visit may show a short home-row intro beat before the Exercise Attempt; that beat is not an Exercise and not an Attempt.*
