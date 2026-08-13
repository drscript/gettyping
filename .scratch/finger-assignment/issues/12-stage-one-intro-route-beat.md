# 12 — Stage 1 intro beat on the Stage route

Type: task
Blocked by: 10, 11
Status: ready-for-agent

## What to build

The first time a Player opens Stage 1, they see the “find the bumps” beat **before** `TypingAttempt` mounts. Later visits skip it.

`src/routes/learn/stages/[stageId]/+page.svelte` currently `$effect`s straight into `GET /api/attempts/learn/:id` and treats a 200 as an Attempt. Use ticket 10’s contract:

- Stage 1 + `{ stageOneIntro: true }` → intro card + Learn keyboard with **F and J** highlighted (ticket 11’s multi-highlight). Do not call the Attempt UI. Do not display a Skip control.
- Copy, child-facing: headline **Find the bumps**; *Find the little bumps under F and J.* / *Rest your index fingers there.* / *Those two keys are home.* Sunshine button **I found the bumps** (Night Indigo text).
- Button POSTs `{ stageOneIntroSeen: true }`, then loads the Attempt as today.
- If GET already has a `token`, skip the beat (replay, returning Player, transferred Player).
- Keyboard stays visible. Layout mute and grown-ups stay. No new sound, no spoken prompt, no Score, no loading spinner that implies an Attempt is being prepared while the intro is on screen — the intro **is** the first Stage 1 surface.
- Stages 2–21 unchanged. Finger stretch, gate-failure, replay-after-seen unchanged.

Match the prototype’s “Stage 1 intro” scene. HTTP coverage of persistence lives in 10; this ticket’s HTTP-facing check is that a first-time Stage 1 session does not mint a token until the button is pressed (already asserted in 10). Do not add a second seam.

Optional one-liner under Stage in CONTEXT.md: the intro is a UI beat, not an Exercise or Attempt. No new glossary noun.

## Acceptance criteria

These fail on current main: Stage 1 always fetches an Attempt token in `$effect` and the first surface is `TypingAttempt` (or “Getting your Stage ready…”). There is no intro copy.

- [ ] A Player with `stage_one_intro_seen_at` null who opens Stage 1 sees the intro card and the keyboard with F and J on the next-key treatment plus index badges, and does **not** see the Exercise prompt or a live Attempt.
- [ ] There is no Skip control on that surface.
- [ ] The only forward control is “I found the bumps”. After it, the gated Exercise Attempt loads (token exists only then).
- [ ] Copy matches the spec’s three lines and headline.
- [ ] A Player who has already acknowledged, including after transfer and including a Stage 1 replay, never sees the intro.
- [ ] The intro writes no Score and is not labelled as an Exercise, Attempt, or Finger stretch in the UI.
- [ ] No new audio plays. Existing mute remains reachable.
- [ ] The keyboard is visible during the intro (not faded, not hidden).
- [ ] Stages 2–21 still open directly on the Attempt path.
- [ ] Visual result matches the prototype’s “Stage 1 intro” scene.
